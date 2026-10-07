/**
 * Motor Declarativo de Fluxo de Registros Obrigatórios por POP
 *
 * Arquitetura extensível para POP 01 (Qualificação de Fornecedores e Controle de Matérias-Primas)
 * e preparada para expansão aos POPs 02 a 09.
 *
 * Regras do POP 01:
 *  - Qualificação de Fornecedor (FR 16 / Anexo I) -> alimenta a Lista de Fornecedores Qualificados (FR 14 / Anexo II)
 *  - Recebimento de Matéria-Prima (FR 08 / Anexo III) -> exige Coleta de Amostra (Anexo IV)
 *  - Coleta de Amostra (Anexo IV) -> exige Relatório Laboratorial (Anexo V)
 *  - Relatório Laboratorial (Anexo V) Aprovado -> cadeia de descarte não é exigida (resolvida)
 *  - Relatório Laboratorial (Anexo V) Reprovado -> exige Destinação de Não Aprovados (FR 18 / Anexo VI)
 *                                               E Ação Corretiva (FR 01 / Anexo VII)
 *  - Destinação de Não Aprovados (FR 18 / Anexo VI) e Ação Corretiva (FR 01 / Anexo VII) encerram a cadeia
 *  - Se Ação Corretiva recomendar desqualificação -> atualiza status na Lista de Fornecedores (FR 14 / Anexo II)
 *
 * Regra de "Comprovação":
 *  - Um POP só está "Comprovado" quando toda a cadeia obrigatória aberta está resolvida (sem pendências).
 *  - Caso contrário, está "Incompleto", com a respectiva contagem de pendências.
 */

import type {
  MonitoringRecord,
  RecordChainLink,
  RecordAvisoPendencia,
  RecordOrigem,
} from '@/types/agro'
import pb from '@/lib/pocketbase/client'
import {
  salvarFornecedorNoAnexoII,
  getFornecedoresQualificados,
} from '@/services/pop01IntegrationService'

export interface StepDefinition {
  codigo: string
  nome: string
  descricao: string
  etapaNumero: number
  geraSeguintes: (
    currentRecord: Partial<MonitoringRecord>,
    dados: any,
  ) => Array<{
    codigo: string
    titulo: string
    motivo: string
    obrigatorio: boolean
    prazoHoras?: number
  }>
}

export interface PopFlowDefinition {
  popCodigo: string
  titulo: string
  descricao: string
  passos: Record<string, StepDefinition>
}

// =========================================================================
// DEFINIÇÃO DECLARATIVA DOS FLUXOS POR POP
// =========================================================================

export const POP_FLOW_DEFINITIONS: Record<string, PopFlowDefinition> = {
  // POP 01 – Qualificação de Fornecedores e Controle de Matérias-Primas
  'POP-01': {
    popCodigo: 'POP-01',
    titulo: 'Qualificação de Fornecedores e Controle de Matérias-Primas',
    descricao:
      'Cadeia de rastreabilidade obrigatória: Auto Avaliação (POP 01-AC01) → Recebimento (FR 08) → Coleta de Amostra (FR 17 / Anexo IV) → Laudo Laboratorial (FR 19 / Anexo V) → Destinação (FR 18) / Ação Corretiva (FR 01) quando reprovado.',
    passos: {
      // 0. Auto Avaliação do Fornecedor (POP 01-AC01) - PRIMEIRO ELO OBRIGATÓRIO DA CADEIA
      'POP 01-AC01': {
        codigo: 'POP 01-AC01',
        nome: 'Auto Avaliação do Fornecedor (POP 01-AC01)',
        descricao:
          'Primeiro registro obrigatório da cadeia: avaliação técnica e documental prévia do fornecedor antes do recebimento',
        etapaNumero: 0,
        geraSeguintes: (rec, dados) => {
          const isAprovado =
            rec.status === 'Conforme' ||
            dados?.avaliacao_final === 'APROVADO' ||
            dados?.status === 'Conforme'

          if (!isAprovado) {
            return [
              {
                codigo: 'ANEXO VII',
                titulo: 'Abertura de Ação Corretiva de Fornecedor (FR 01 / RNC)',
                motivo:
                  'Fornecedor reprovado na Auto Avaliação POP 01-AC01 (<70% ou não conformidade crítica)',
                obrigatorio: true,
                prazoHoras: 48,
              },
            ]
          }

          // Se aprovado, encadeia para o Recebimento de Matérias-Primas (FR 08 / Anexo III)
          return [
            {
              codigo: 'ANEXO III',
              titulo: 'Recebimento de Matérias-Primas (FR 08)',
              motivo:
                'Fornecedor qualificado na auto avaliação: liberado para emissão de recebimento de lotes',
              obrigatorio: true,
              prazoHoras: 72,
            },
          ]
        },
      },

      // 1. Qualificação (FR 16 / Anexo I)
      'ANEXO I': {
        codigo: 'ANEXO I',
        nome: 'Qualificação de Fornecedor',
        descricao: 'Homologação bienal do fornecedor segundo requisitos do MAPA',
        etapaNumero: 1,
        geraSeguintes: (rec, dados) => {
          // Qualificação alimenta a Lista de Fornecedores (Anexo II)
          return [
            {
              codigo: 'ANEXO II',
              titulo: 'Atualização da Lista de Fornecedores Qualificados',
              motivo: 'Alimentação cadastral obrigatória da Lista Homologada (FR 14)',
              obrigatorio: true,
              prazoHoras: 24,
            },
          ]
        },
      },
      'FR 16': {
        codigo: 'FR 16',
        nome: 'Formulário de Qualificação de Fornecedores',
        descricao: 'Homologação bienal do fornecedor segundo requisitos do MAPA',
        etapaNumero: 1,
        geraSeguintes: (rec, dados) => [
          {
            codigo: 'ANEXO II',
            titulo: 'Atualização da Lista de Fornecedores Qualificados',
            motivo: 'Alimentação cadastral obrigatória da Lista Homologada (FR 14)',
            obrigatorio: true,
            prazoHoras: 24,
          },
        ],
      },

      // 2. Recebimento (FR 08 / Anexo III)
      'ANEXO III': {
        codigo: 'ANEXO III',
        nome: 'Recebimento de Matérias-Primas',
        descricao: 'Inspeção na doca de descarregamento e liberação preliminar',
        etapaNumero: 2,
        geraSeguintes: (rec, dados) => {
          // Se foi reprovado de imediato no recebimento (ex.: contaminação grosseira, caminhão inadequado)
          const isReprovado =
            rec.status === 'Não Conforme' ||
            dados?.resultado === 'Reprovado' ||
            dados?.parecer_final === 'Rejeitado'

          if (isReprovado) {
            return [
              {
                codigo: 'ANEXO VI',
                titulo: 'Registro de Destinação de Produtos Não Aprovados (FR 18)',
                motivo:
                  'Produto reprovado diretamente na recepção requer descarte/devolução imediata',
                obrigatorio: true,
                prazoHoras: 24,
              },
              {
                codigo: 'ANEXO VII',
                titulo: 'Abertura de Ação Corretiva (FR 01 / RNC)',
                motivo: 'Não conformidade crítica no recebimento requer análise de causa raiz',
                obrigatorio: true,
                prazoHoras: 48,
              },
            ]
          }

          // Recebimento padrão exige Coleta de Amostra
          return [
            {
              codigo: 'ANEXO IV',
              titulo: 'Coleta de Amostra Oficial em Triplicata',
              motivo:
                'Obrigatória para liberação analítica da matéria-prima antes do uso na fábrica',
              obrigatorio: true,
              prazoHoras: 12,
            },
          ]
        },
      },
      'FR 08': {
        codigo: 'FR 08',
        nome: 'Registro de Recebimento de Mercadorias',
        descricao: 'Inspeção física e documental de matérias-primas e embalagens',
        etapaNumero: 2,
        geraSeguintes: (rec, dados) => {
          const isReprovado =
            rec.status === 'Não Conforme' ||
            dados?.resultado === 'Reprovado' ||
            dados?.parecer_final === 'Rejeitado'

          if (isReprovado) {
            return [
              {
                codigo: 'ANEXO VI',
                titulo: 'Registro de Destinação de Produtos Não Aprovados (FR 18)',
                motivo:
                  'Produto reprovado diretamente na recepção requer descarte/devolução imediata',
                obrigatorio: true,
                prazoHoras: 24,
              },
              {
                codigo: 'ANEXO VII',
                titulo: 'Abertura de Ação Corretiva (FR 01 / RNC)',
                motivo: 'Não conformidade crítica no recebimento requer análise de causa raiz',
                obrigatorio: true,
                prazoHoras: 48,
              },
            ]
          }

          return [
            {
              codigo: 'ANEXO IV',
              titulo: 'Coleta de Amostra Oficial em Triplicata',
              motivo:
                'Obrigatória para liberação analítica da matéria-prima antes do uso na fábrica',
              obrigatorio: true,
              prazoHoras: 12,
            },
          ]
        },
      },

      // 3. Coleta de Amostra (Anexo IV)
      'ANEXO IV': {
        codigo: 'ANEXO IV',
        nome: 'Coleta de Amostra em Triplicata',
        descricao: 'Amostragem representativa com contraprova e lacre numerado',
        etapaNumero: 3,
        geraSeguintes: () => [
          {
            codigo: 'ANEXO V',
            titulo: 'Relatório de Análise Laboratorial (CQ Bromatológico e Microbiológico)',
            motivo: 'Ensaio confirmatório dos limites críticos normativos do MAPA',
            obrigatorio: true,
            prazoHoras: 72,
          },
        ],
      },

      // 4. Relatório de Análise Laboratorial (Anexo V)
      'ANEXO V': {
        codigo: 'ANEXO V',
        nome: 'Relatório de Análise Laboratorial',
        descricao: 'Laudo de ensaios com comparação de limites e parecer do RT',
        etapaNumero: 4,
        geraSeguintes: (rec, dados) => {
          // Se laudo aprovado -> cadeia concluída com sucesso (sem novas pendências)
          const isReprovado =
            rec.status === 'Não Conforme' ||
            dados?.resultado_geral === 'Reprovado' ||
            dados?.status === 'Não Conforme'

          if (!isReprovado) {
            return []
          }

          // Se laudo reprovado -> gera Destinação e Ação Corretiva obrigatórias
          return [
            {
              codigo: 'ANEXO VI',
              titulo: 'Destinação de Produtos Não Aprovados (FR 18)',
              motivo: 'Laudo reprovado exige destinação final segregada e auditável',
              obrigatorio: true,
              prazoHoras: 24,
            },
            {
              codigo: 'ANEXO VII',
              titulo: 'Abertura de Ação Corretiva (FR 01 / RNC)',
              motivo:
                'Laudo laboratorial fora de padrão exige investigação de causa raiz (5 Porquês)',
              obrigatorio: true,
              prazoHoras: 48,
            },
          ]
        },
      },

      // 5. Destinação de Não Aprovados (Anexo VI / FR 18)
      'ANEXO VI': {
        codigo: 'ANEXO VI',
        nome: 'Destinação de Produtos Não Aprovados',
        descricao: 'Tratamento de descarte, devolução ou aproveitamento condicional',
        etapaNumero: 5,
        geraSeguintes: () => [], // Fim de ramo
      },
      'FR 18': {
        codigo: 'FR 18',
        nome: 'Solicitação de Descarte de Insumos',
        descricao: 'Registro auditável de descarte conforme legislação ambiental',
        etapaNumero: 5,
        geraSeguintes: () => [],
      },

      // 6. Ação Corretiva (Anexo VII / FR 01)
      'ANEXO VII': {
        codigo: 'ANEXO VII',
        nome: 'Formulário de Ação Corretiva (RNC)',
        descricao: 'Causa raiz, plano de ação e acompanhamento de eficácia',
        etapaNumero: 6,
        geraSeguintes: () => [], // Fim de ramo
      },
      'FR 01': {
        codigo: 'FR 01',
        nome: 'Registro de Não Conformidade (RNC)',
        descricao: 'Registro formal de desvio e verificação de eficácia',
        etapaNumero: 6,
        geraSeguintes: () => [],
      },
    },
  },
}

// Normaliza o código do POP para compatibilidade (ex: "POP-001" -> "POP-01")
export function normalizePopCode(codigo: string): string {
  if (!codigo) return 'POP-01'
  if (codigo === 'POP-001' || codigo === 'POP-01') return 'POP-01'
  return codigo
}

// Obtém a definição do fluxo de um POP
export function getPopFlowDefinition(codigo: string): PopFlowDefinition | null {
  const norm = normalizePopCode(codigo)
  return POP_FLOW_DEFINITIONS[norm] || null
}

// =========================================================================
// ESTRUTURA DE PENDÊNCIAS E DIAGNÓSTICO DA CADEIA
// =========================================================================

export interface PopChainStatus {
  popCodigo: string
  totalRegistros: number
  totalPendencias: number
  isComprovado: boolean
  cadeias: RecordChainItem[]
  pendenciasAbertas: PendenciaItem[]
  motivoIncompletude?: string
}

export interface RecordChainItem {
  id: string
  codigo_formulario: string
  titulo: string
  data: string
  status: 'Conforme' | 'Não Conforme'
  status_execucao: 'Pendente' | 'Em Preenchimento' | 'Preenchido' | 'Cancelado'
  status_assinatura?: string
  registro_anterior?: string
  registros_seguintes?: RecordChainLink[]
  origem_registro?: RecordOrigem
  aviso_pendencia?: RecordAvisoPendencia
  lote?: string
  responsavel?: string
  diasAberto: number
  arquivo_pdf_assinado?: string
  dados_formulario?: any
}

export interface PendenciaItem {
  id: string
  registroId: string
  codigoFormulario: string
  titulo: string
  motivo: string
  prazoEstimadoHoras?: number
  diasAberto: number
  origem: 'sistema' | 'cliente'
  avisoPersonalizado?: RecordAvisoPendencia
  registroAnterior?: string
  lote?: string
  procedureId: string
}

/**
 * Avalia a integridade da cadeia de registros de um POP e calcula:
 *  - total de registros
 *  - contagem de pendências abertas
 *  - selo "Comprovado" vs "Incompleto"
 *  - lista detalhada de elos e o que falta para comprovar a execução
 */
export interface PopChainEvaluationOptions {
  autoAvaliacoes?: Array<{
    id?: string
    numero_registro: string
    fornecedor_cnpj: string
    razao_social: string
    data_avaliacao: string
    nota_final: number
    avaliacao_final: 'APROVADO' | 'REPROVADO' | 'PENDENTE'
    status_assinatura?: string
    created?: string
    respostas?: any[]
  }>
}

export function evaluatePopChain(
  procedureId: string,
  procedureCode: string,
  records: MonitoringRecord[],
  customForms?: Array<{
    codigo: string
    titulo: string
    obrigatorio_na_cadeia?: boolean
    gera_pendencia?: boolean
  }>,
  options?: PopChainEvaluationOptions,
): PopChainStatus {
  const normCode = normalizePopCode(procedureCode)
  const flowDef = POP_FLOW_DEFINITIONS[normCode]

  // Filtra registros pertencentes a este procedimento
  const procRecords = records.filter((r) => r.procedure === procedureId || !r.procedure)

  const pendenciasAbertas: PendenciaItem[] = []
  const cadeias: RecordChainItem[] = []

  const now = new Date().getTime()

  // Se for POP-01, integra as Auto Avaliações como PRIMEIRO ELO OBRIGATÓRIO DA CADEIA
  const autoAvalList = options?.autoAvaliacoes || []
  let autoAvalHomologadaVigente = false

  if (normCode === 'POP-01') {
    for (const aa of autoAvalList) {
      const createdDate = new Date(aa.created || aa.data_avaliacao).getTime()
      const diffDays = Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)))
      const isAprovado = aa.avaliacao_final === 'APROVADO'
      const isHomologado =
        Boolean(aa.status_assinatura?.includes('Homologado')) ||
        Boolean(aa.status_assinatura?.includes('Assinado'))

      if (isAprovado && isHomologado) {
        autoAvalHomologadaVigente = true
      }

      const chainItem: RecordChainItem = {
        id: aa.id || aa.numero_registro,
        codigo_formulario: 'POP 01-AC01',
        titulo: `Auto Avaliação: ${aa.razao_social} (${aa.numero_registro}) - Nota ${aa.nota_final}%`,
        data: aa.data_avaliacao,
        status: isAprovado ? 'Conforme' : 'Não Conforme',
        status_execucao: isHomologado ? 'Preenchido' : 'Pendente',
        status_assinatura: aa.status_assinatura || 'Pendente Assinatura RT/RE',
        registro_anterior: undefined,
        registros_seguintes: isAprovado
          ? [
              {
                codigo_formulario: 'ANEXO III',
                titulo: 'Recebimento de Matérias-Primas (FR 08)',
                obrigatorio: true,
                motivo_exigencia:
                  'Fornecedor qualificado na auto avaliação: liberado para recebimento',
              },
            ]
          : [
              {
                codigo_formulario: 'ANEXO VII',
                titulo: 'Ação Corretiva de Fornecedor (FR 01 / RNC)',
                obrigatorio: true,
                motivo_exigencia: 'Fornecedor reprovado na auto avaliação requer ação corretiva',
              },
            ],
        origem_registro: 'sistema_automatico',
        lote: aa.fornecedor_cnpj,
        responsavel: aa.status_assinatura || 'Equipe da Qualidade',
        diasAberto: diffDays,
        dados_formulario: aa,
      }

      cadeias.push(chainItem)

      // Se a auto avaliação estiver pendente de homologação técnica (RT/RE + RQ)
      if (!isHomologado) {
        pendenciasAbertas.push({
          id: `pend-autoaval-${aa.id || aa.numero_registro}`,
          registroId: aa.id || aa.numero_registro,
          codigoFormulario: 'POP 01-AC01',
          titulo: `Homologação da Auto Avaliação ${aa.numero_registro} (${aa.razao_social})`,
          motivo:
            'A auto avaliação do fornecedor requer assinatura e homologação formal da autoridade técnica (RT ou RE + RQ)',
          prazoEstimadoHoras: 48,
          diasAberto: diffDays,
          origem: 'sistema',
          lote: aa.fornecedor_cnpj,
          procedureId,
        })
      }

      // Se a auto avaliação foi REPROVADA e não há Ação Corretiva vinculada
      if (!isAprovado) {
        pendenciasAbertas.push({
          id: `pend-autoaval-reprov-${aa.id || aa.numero_registro}`,
          registroId: aa.id || aa.numero_registro,
          codigoFormulario: 'ANEXO VII',
          titulo: `Ação Corretiva para ${aa.razao_social} (Reprovado na Auto Avaliação)`,
          motivo:
            'Fornecedor reprovado (< 70% ou desvio crítico). Exige abertura obrigatória de RNC/Ação Corretiva no FR 01',
          prazoEstimadoHoras: 48,
          diasAberto: diffDays,
          origem: 'sistema',
          registroAnterior: aa.numero_registro,
          lote: aa.fornecedor_cnpj,
          procedureId,
        })
      }
    }

    // Pendência automática de primeiro elo obrigatório:
    // Se o POP 01 não possui nenhuma auto avaliação homologada vigente, gera pendência crítica bloqueante
    if (!autoAvalHomologadaVigente) {
      pendenciasAbertas.unshift({
        id: `pend-autoaval-obrigatoria-${procedureId}`,
        registroId: '',
        codigoFormulario: 'POP 01-AC01',
        titulo: 'Homologação Prévia de Fornecedor Obrigatória (POP 01-AC01)',
        motivo:
          'Primeiro elo obrigatório da cadeia do Auto Controle 01 pendente: a fábrica deve possuir pelo menos uma Auto Avaliação de Fornecedor (POP 01-AC01) cadastrada e homologada vigente antes do recebimento de matérias-primas.',
        prazoEstimadoHoras: 24,
        diasAberto: 0,
        origem: 'sistema',
        procedureId,
      })
    }
  }

  // Mapeia registros existentes
  for (const r of procRecords) {
    const createdDate = new Date(r.created || r.data).getTime()
    const diffDays = Math.max(0, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)))

    const isPendingExecution =
      r.status_execucao === 'Pendente' || r.status_execucao === 'Em Preenchimento'

    const chainItem: RecordChainItem = {
      id: r.id,
      codigo_formulario: r.formulario_codigo || 'F-01',
      titulo: r.valor_medido || `${r.formulario_codigo || 'Registro'} - ${r.lote || 'Geral'}`,
      data: r.data,
      status: r.status,
      status_execucao: r.status_execucao || (isPendingExecution ? 'Pendente' : 'Preenchido'),
      status_assinatura: r.status_assinatura,
      registro_anterior: r.registro_anterior,
      registros_seguintes: r.registros_seguintes,
      origem_registro: r.origem_registro,
      aviso_pendencia: r.aviso_pendencia,
      lote: r.lote,
      responsavel: r.responsavel,
      diasAberto: diffDays,
      arquivo_pdf_assinado: r.arquivo_pdf_assinado,
      dados_formulario: r.dados_formulario,
    }

    cadeias.push(chainItem)

    // Se o próprio registro está em estado "Pendente" (ex.: criado por demanda ou encadeamento)
    if (isPendingExecution) {
      pendenciasAbertas.push({
        id: `pend-rec-${r.id}`,
        registroId: r.id,
        codigoFormulario: r.formulario_codigo || 'PENDENTE',
        titulo: r.aviso_pendencia?.titulo || chainItem.titulo,
        motivo:
          r.aviso_pendencia?.descricao ||
          'Registro obrigatório encadeado aguardando preenchimento da equipe técnica',
        diasAberto: diffDays,
        origem: r.aviso_pendencia?.criado_por || 'sistema',
        avisoPersonalizado: r.aviso_pendencia,
        registroAnterior: r.registro_anterior,
        lote: r.lote,
        procedureId,
      })
    }

    // Se o registro tem registros seguintes declarados que ainda não foram instanciados
    if (Array.isArray(r.registros_seguintes)) {
      for (const seg of r.registros_seguintes) {
        if (seg.obrigatorio && !seg.registro_id) {
          // Pendência virtual declarada pelo pai
          pendenciasAbertas.push({
            id: `pend-link-${r.id}-${seg.codigo_formulario}`,
            registroId: r.id,
            codigoFormulario: seg.codigo_formulario,
            titulo: seg.titulo,
            motivo: seg.motivo_exigencia || 'Próximo registro obrigatório da cadeia',
            prazoEstimadoHoras: 24,
            diasAberto: diffDays,
            origem: 'sistema',
            registroAnterior: r.formulario_codigo || r.id,
            lote: r.lote,
            procedureId,
          })
        }
      }
    }
  }

  // Integração dos Formulários Customizados Criados pelo Cliente na Cadeia:
  // Se existirem formulários marcados como 'obrigatorio_na_cadeia' e ainda não houver nenhum registro preenchido para ele
  if (Array.isArray(customForms)) {
    for (const cf of customForms) {
      if (cf.obrigatorio_na_cadeia) {
        const hasFilled = procRecords.some(
          (r) => r.formulario_codigo === cf.codigo && r.status_execucao === 'Preenchido',
        )
        if (!hasFilled) {
          pendenciasAbertas.push({
            id: `pend-custom-${cf.codigo}`,
            registroId: '',
            codigoFormulario: cf.codigo,
            titulo: cf.titulo,
            motivo:
              'Formulário customizado obrigatório na cadeia aguardando preenchimento do ciclo',
            prazoEstimadoHoras: 24,
            diasAberto: 0,
            origem: 'cliente',
            procedureId,
          })
        }
      }
    }
  }

  // Regra de Comprovação:
  // Para estar "Comprovado", deve haver pelo menos 1 registro oficial realizado (ou auto avaliação no POP 01)
  // E ZERO pendências abertas na cadeia.
  const totalRegistros = procRecords.length + (normCode === 'POP-01' ? autoAvalList.length : 0)
  const totalPendencias = pendenciasAbertas.length

  let isComprovado = false
  let motivoIncompletude: string | undefined

  if (totalRegistros === 0) {
    isComprovado = false
    motivoIncompletude =
      normCode === 'POP-01'
        ? 'Nenhuma Auto Avaliação (POP 01-AC01) ou registro emitido para este procedimento'
        : 'Nenhum registro emitido para este procedimento'
  } else if (normCode === 'POP-01' && !autoAvalHomologadaVigente) {
    isComprovado = false
    motivoIncompletude =
      'Cadeia incompleta: ausência de Auto Avaliação de Fornecedor (POP 01-AC01) homologada vigente'
  } else if (totalPendencias > 0) {
    isComprovado = false
    motivoIncompletude = `${totalPendencias} registro(s) pendente(s) na cadeia para comprovar execução`
  } else {
    isComprovado = true
  }

  return {
    popCodigo: normCode,
    totalRegistros,
    totalPendencias,
    isComprovado,
    cadeias,
    pendenciasAbertas,
    motivoIncompletude,
  }
}

// =========================================================================
// GERADOR AUTOMÁTICO DE REGISTROS SEGUINTES NA CADEIA (AO SALVAR)
// =========================================================================

export interface SaveRecordWithChainOptions {
  procedureId: string
  procedureCode: string
  formularioCodigo: string
  dadosFormulario: any
  lote?: string
  responsavel: string
  status: 'Conforme' | 'Não Conforme'
  data?: string
  turno?: 'Manhã' | 'Tarde' | 'Noite'
  valorMedido?: string
  observacoes?: string
  registroAnteriorIdOuCodigo?: string
  origemRegistro?: RecordOrigem
  customAvisoPendencia?: RecordAvisoPendencia
}

/**
 * Salva um registro e, com base no motor de fluxo declarativo,
 * gera automaticamente os próximos registros obrigatórios vinculados em estado "Pendente".
 */
export async function saveRecordWithChain(options: SaveRecordWithChainOptions): Promise<{
  createdRecord: MonitoringRecord
  proximosGerados: MonitoringRecord[]
}> {
  const normPop = normalizePopCode(options.procedureCode)
  const flowDef = POP_FLOW_DEFINITIONS[normPop]

  const dateIso = options.data
    ? `${options.data.split('T')[0]} 08:00:00.000Z`
    : `${new Date().toISOString().split('T')[0]} 08:00:00.000Z`

  // 1. Determina quais são os próximos registros obrigatórios exigidos
  let proximosExigidos: Array<{
    codigo: string
    titulo: string
    motivo: string
    obrigatorio: boolean
    prazoHoras?: number
  }> = []

  const stepKey = options.formularioCodigo
  if (flowDef && flowDef.passos[stepKey]) {
    const passo = flowDef.passos[stepKey]
    proximosExigidos = passo.geraSeguintes(
      {
        status: options.status,
        formulario_codigo: options.formularioCodigo,
        lote: options.lote,
      },
      options.dadosFormulario,
    )
  } else if (
    flowDef &&
    (stepKey.includes('POP 01-AC01') ||
      stepKey.includes('POP-01-AC01') ||
      stepKey.includes('PAC-01_R'))
  ) {
    const passo = flowDef.passos['POP 01-AC01']
    if (passo) {
      proximosExigidos = passo.geraSeguintes(
        {
          status: options.status,
          formulario_codigo: options.formularioCodigo,
          lote: options.lote,
        },
        options.dadosFormulario,
      )
    }
  }

  // Prepara estrutura de encadeamento inicial para o registro pai
  const chainLinks: RecordChainLink[] = proximosExigidos.map((p) => ({
    codigo_formulario: p.codigo,
    titulo: p.titulo,
    obrigatorio: p.obrigatorio,
    motivo_exigencia: p.motivo,
    criado_em: new Date().toISOString(),
  }))

  // 2. Cria o registro atual (Preenchido)
  const mainRecord = await pb.collection('records').create<MonitoringRecord>({
    procedure: options.procedureId,
    formulario_codigo: options.formularioCodigo,
    dados_formulario: options.dadosFormulario,
    data: dateIso,
    turno: options.turno || 'Manhã',
    valor_medido: options.valorMedido || `Registro ${options.formularioCodigo}`,
    status: options.status,
    responsavel: options.responsavel,
    observacoes: options.observacoes || '',
    lote: options.lote || '',
    status_assinatura: 'Pendente Assinatura',
    registro_anterior: options.registroAnteriorIdOuCodigo || '',
    registros_seguintes: chainLinks,
    origem_registro: options.origemRegistro || 'sistema_automatico',
    status_execucao: 'Preenchido',
    aviso_pendencia: options.customAvisoPendencia,
  })

  const proximosGerados: MonitoringRecord[] = []

  // 3. Se houver próximos registros exigidos, cria-os automaticamente no banco em estado 'Pendente'
  if (proximosExigidos.length > 0) {
    const updatedLinks = [...chainLinks]

    for (let i = 0; i < proximosExigidos.length; i++) {
      const p = proximosExigidos[i]

      // Se for atualização do Anexo II vindo do Anexo I, executamos a atualização da lista
      if (p.codigo === 'ANEXO II') {
        try {
          const dados = options.dadosFormulario || {}
          const statusForn =
            dados.parecer_final === 'Aprovado' ||
            dados.parecer_final === 'Aprovado Condicionalmente'
              ? 'Ativo'
              : 'Desqualificado'

          await salvarFornecedorNoAnexoII(
            options.procedureId,
            {
              razao_social: dados.razao_social,
              cnpj: dados.cnpj,
              produtos_fornecidos: dados.documentacao_complementar || 'Matérias-Primas Homologadas',
              data_qualificacao: dados.data_qualificacao || new Date().toISOString().split('T')[0],
              data_validade: dados.data_validade_qualificacao || '',
              status: statusForn,
              responsavel_tecnico: dados.responsavel_tecnico,
              telefone: dados.telefone,
              email: dados.email,
              motivo_desqualificacao: dados.motivo_rejeicao,
            },
            options.responsavel,
          )
        } catch (e) {
          console.error('Erro ao atualizar Anexo II:', e)
        }
        continue
      }

      // Criação do registro pendente vinculado
      const aviso: RecordAvisoPendencia = {
        criado_por: 'sistema',
        titulo: p.titulo,
        descricao: p.motivo,
        prazo_horas: p.prazoHoras || 24,
        data_alerta: new Date().toISOString(),
        prioridade: options.status === 'Não Conforme' ? 'critica' : 'alta',
      }

      const pendenteRecord = await pb.collection('records').create<MonitoringRecord>({
        procedure: options.procedureId,
        formulario_codigo: p.codigo,
        dados_formulario: {
          origem_automatica: true,
          registro_pai_id: mainRecord.id,
          registro_pai_codigo: options.formularioCodigo,
          lote_vinculado: options.lote,
          produto_vinculado:
            options.dadosFormulario?.produto_nome || options.dadosFormulario?.produto_insumo || '',
          fornecedor_vinculado:
            options.dadosFormulario?.fornecedor_razao_social ||
            options.dadosFormulario?.razao_social ||
            '',
        },
        data: dateIso,
        turno: options.turno || 'Manhã',
        valor_medido: `[PENDENTE] ${p.titulo} - Ref: ${options.formularioCodigo}`,
        status: options.status, // Herda o contexto
        responsavel: 'Aguardando Atribuição Técnica',
        observacoes: `Registro pendente gerado automaticamente a partir de ${options.formularioCodigo} (${mainRecord.id}). Motivo: ${p.motivo}`,
        lote: options.lote || '',
        status_assinatura: 'Pendente Assinatura',
        registro_anterior: mainRecord.id,
        registros_seguintes: [],
        origem_registro: 'sistema_automatico',
        status_execucao: 'Pendente',
        aviso_pendencia: aviso,
      })

      proximosGerados.push(pendenteRecord)
      updatedLinks[i].registro_id = pendenteRecord.id
    }

    // Atualiza o registro pai com os IDs reais dos próximos gerados
    await pb.collection('records').update(mainRecord.id, {
      registros_seguintes: updatedLinks,
    })
  }

  // 4. Integração especial: se for Ação Corretiva (Anexo VII) com recomendação de desqualificação
  if (options.formularioCodigo === 'ANEXO VII' || options.formularioCodigo === 'FR 01') {
    const d = options.dadosFormulario || {}
    if (
      d.impacto_qualificacao_fornecedor &&
      d.acao_recomendada_fornecedor === 'Desqualificação' &&
      d.fornecedor_razao_social
    ) {
      try {
        const fornList = await getFornecedoresQualificados(options.procedureId)
        const fItem = fornList.find(
          (f) => f.razao_social.toLowerCase() === d.fornecedor_razao_social.toLowerCase(),
        )
        if (fItem) {
          await salvarFornecedorNoAnexoII(
            options.procedureId,
            {
              ...fItem,
              status: 'Desqualificado',
              motivo_desqualificacao: `Desqualificado via Ação Corretiva ${d.numero_acao_corretiva || ''}: ${d.justificativa_impacto_fornecedor || 'Falha crítica comprovada'}`,
            },
            options.responsavel,
          )
        }
      } catch (e) {
        console.error('Erro ao desqualificar fornecedor no Anexo II:', e)
      }
    }
  }

  return {
    createdRecord: mainRecord,
    proximosGerados,
  }
}

// =========================================================================
// GERAÇÃO DE REGISTRO POR DEMANDA DO CLIENTE (FORMULÁRIO OU ANEXO)
// =========================================================================

export interface CreateDemandRecordOptions {
  procedureId: string
  procedureCode: string
  formularioCodigo: string
  tipoDemanda: 'formulario_sistema' | 'anexo_cliente'
  titulo: string
  descricao: string
  lote?: string
  responsavel: string
  arquivoAnexo?: File
  registroAnterior?: string
  avisoCustomizado?: {
    titulo: string
    descricao: string
    prioridade?: 'baixa' | 'media' | 'alta' | 'critica'
    prazoHoras?: number
  }
}

export async function createDemandRecord(
  options: CreateDemandRecordOptions,
): Promise<MonitoringRecord> {
  const isAnexo = options.tipoDemanda === 'anexo_cliente'
  const origem: RecordOrigem = isAnexo ? 'demanda_cliente_anexo' : 'demanda_cliente_formulario'

  const aviso: RecordAvisoPendencia = {
    criado_por: 'cliente',
    titulo: options.avisoCustomizado?.titulo || options.titulo,
    descricao: options.avisoCustomizado?.descricao || options.descricao,
    prioridade: options.avisoCustomizado?.prioridade || 'media',
    prazo_horas: options.avisoCustomizado?.prazoHoras || 48,
    data_alerta: new Date().toISOString(),
  }

  const formData = new FormData()
  formData.append('procedure', options.procedureId)
  formData.append('formulario_codigo', options.formularioCodigo)
  formData.append('data', `${new Date().toISOString().split('T')[0]} 08:00:00.000Z`)
  formData.append('turno', 'Manhã')
  formData.append(
    'valor_medido',
    isAnexo
      ? `Documento Anexado pelo Cliente: ${options.titulo}`
      : `Registro por Demanda: ${options.titulo}`,
  )
  formData.append('status', 'Conforme')
  formData.append('responsavel', options.responsavel)
  formData.append('observacoes', options.descricao)
  formData.append('lote', options.lote || '')
  formData.append('status_assinatura', 'Pendente Assinatura')
  formData.append('registro_anterior', options.registroAnterior || '')
  formData.append('origem_registro', origem)
  formData.append('status_execucao', isAnexo ? 'Preenchido' : 'Pendente')
  formData.append('aviso_pendencia', JSON.stringify(aviso))
  formData.append(
    'dados_formulario',
    JSON.stringify({
      criado_por_demanda: true,
      tipo_demanda: options.tipoDemanda,
      titulo_demanda: options.titulo,
      descricao_demanda: options.descricao,
    }),
  )

  if (isAnexo && options.arquivoAnexo) {
    formData.append('anexos', options.arquivoAnexo)
  }

  return await pb.collection('records').create<MonitoringRecord>(formData)
}
