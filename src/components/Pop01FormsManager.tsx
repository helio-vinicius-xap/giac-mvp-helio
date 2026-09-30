import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  PlusCircle,
  Truck,
  ClipboardList,
  Thermometer,
  FileCheck,
  Trash2,
  CalendarCheck,
  Shield,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  Printer,
  History,
  Send,
  Eye,
  Edit2,
  Ban,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import type { Procedure, MonitoringRecord, Company } from '@/types/agro'
import { createRecord, updateRecord } from '@/services/agroService'
import { saveRecordWithChain } from '@/lib/recordFlow'

// Importação dos componentes dos 7 Anexos completos
import { AnexoIQualificacaoModal } from './pop01/AnexoIQualificacaoModal'
import { AnexoIIListaFornecedores } from './pop01/AnexoIIListaFornecedores'
import { AnexoIIIRecebimentoModal } from './pop01/AnexoIIIRecebimentoModal'
import { AnexoIVColetaAmostraModal } from './pop01/AnexoIVColetaAmostraModal'
import { AnexoVAnaliseLaboratorialModal } from './pop01/AnexoVAnaliseLaboratorialModal'
import { AnexoVIDestinacaoModal } from './pop01/AnexoVIDestinacaoModal'
import { AnexoVIIAcaoCorretivaModal } from './pop01/AnexoVIIAcaoCorretivaModal'
import { Pop01PrintPdfModal } from './Pop01PrintPdfModal'

import {
  getFornecedoresQualificados,
  salvarFornecedorNoAnexoII,
  getSystemUsersList,
  countNcsFornecedor12Meses,
} from '@/services/pop01IntegrationService'

import type {
  AnexoIQualificacaoData,
  AnexoIIFornecedorItem,
  AnexoIIIRecebimentoData,
  AnexoIVColetaAmostraData,
  AnexoVAnaliseLaboratorialData,
  AnexoVIDestinacaoData,
  AnexoVIIAcaoCorretivaData,
  FR15MedicaoLinha,
  A10DeclaracaoData,
  FR01RNCData,
} from '@/types/pop01Forms'
import { calcularDiasAteVencimento } from '@/lib/pop01Validators'
import {
  canManagePopForms,
  canSignAsRT,
  canSignAsRE,
  canSignAsRQ,
  canDeleteRecord,
} from '@/lib/permissions'

interface Pop01FormsManagerProps {
  procedure: Procedure
  records: MonitoringRecord[]
  onRecordCreated?: () => void
  onOpenRecordPdf?: (record: MonitoringRecord) => void
  user: any
  company: Company | null
}

export function Pop01FormsManager({
  procedure,
  records,
  onRecordCreated,
  onOpenRecordPdf,
  user,
  company,
}: Pop01FormsManagerProps) {
  const { toast } = useToast()

  // Aba / Formulário selecionado
  const [selectedFormCode, setSelectedFormCode] = useState<string>('ANEXO II')

  // Modais dos Anexos I a VII
  const [anexoIOpen, setAnexoIOpen] = useState(false)
  const [anexoIIIOpen, setAnexoIIIOpen] = useState(false)
  const [anexoIVOpen, setAnexoIVOpen] = useState(false)
  const [anexoVOpen, setAnexoVOpen] = useState(false)
  const [anexoVIOpen, setAnexoVIOpen] = useState(false)
  const [anexoVIIOpen, setAnexoVIIOpen] = useState(false)

  // Dados para edição/visualização nos modais
  const [anexoIInitial, setAnexoIInitial] = useState<Partial<AnexoIQualificacaoData> | undefined>()
  const [anexoIIIInitial, setAnexoIIIInitial] = useState<
    Partial<AnexoIIIRecebimentoData> | undefined
  >()
  const [anexoIVInitial, setAnexoIVInitial] = useState<
    Partial<AnexoIVColetaAmostraData> | undefined
  >()
  const [anexoVInitial, setAnexoVInitial] = useState<
    Partial<AnexoVAnaliseLaboratorialData> | undefined
  >()
  const [anexoVIInitial, setAnexoVIInitial] = useState<Partial<AnexoVIDestinacaoData> | undefined>()
  const [anexoVIIInitial, setAnexoVIIInitial] = useState<
    Partial<AnexoVIIAcaoCorretivaData> | undefined
  >()

  // Modal de Impressão PDF Oficial unificado
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printData, setPrintData] = useState<{
    titulo: string
    codigoAnexo: string
    subtitulo?: string
    dados: any
  }>({
    titulo: '',
    codigoAnexo: '',
    dados: null,
  })

  // Lista de Usuários do Sistema para dropdowns
  const [usersList, setUsersList] = useState<Array<{ id: string; name: string; role: string }>>([])

  // Lista dinâmica consolidada de Fornecedores do Anexo II
  const [fornecedoresList, setFornecedoresList] = useState<AnexoIIFornecedorItem[]>([])

  // Carregar usuários e fornecedores no início
  useEffect(() => {
    getSystemUsersList().then(setUsersList)
    loadFornecedores()
  }, [])

  const loadFornecedores = async () => {
    const list = await getFornecedoresQualificados(procedure.id)
    if (list.length > 0) {
      setFornecedoresList(list)
    } else {
      // Fornecedores iniciais semente caso não haja nenhum no banco
      const initialSeed: AnexoIIFornecedorItem[] = [
        {
          id: 'seed-1',
          id_fornecedor: 'REC-FOR-00101',
          razao_social: 'Agro Grãos do Brasil S.A.',
          cnpj: '12.345.678/0001-90',
          produtos_fornecidos: 'Farelo de Soja 46%, Milho Grão Moído',
          data_qualificacao: '2025-06-10',
          data_validade: '2027-06-10',
          status: 'Ativo',
          responsavel_tecnico: 'Dr. Paulo Amaral (CRMV-SP 14.890)',
          telefone: '(16) 3344-5566',
          email: 'qualidade@agrobraos.com.br',
          ultima_revisao: '2026-01-15',
        },
        {
          id: 'seed-2',
          id_fornecedor: 'REC-FOR-00102',
          razao_social: 'NutriVitaminas e Minerais Indústria Ltda.',
          cnpj: '98.765.432/0001-11',
          produtos_fornecidos: 'Premixes Vitamínicos, Calcário Calcítico',
          data_qualificacao: '2024-04-01',
          data_validade: '2026-04-01', // vencendo em breve
          status: 'Ativo',
          responsavel_tecnico: 'Dra. Vanessa Luz (CRQ IV 041928)',
          telefone: '(19) 3881-2200',
          email: 'contato@nutrivitaminas.com.br',
          ultima_revisao: '2025-10-10',
        },
        {
          id: 'seed-3',
          id_fornecedor: 'REC-FOR-00103',
          razao_social: 'BioFosfatos da Amazônia S.A.',
          cnpj: '45.678.901/0001-22',
          produtos_fornecidos: 'Fosfato Bicálcico 18% P',
          data_qualificacao: '2023-11-20',
          data_validade: '2025-11-20', // vencido
          status: 'Suspenso',
          responsavel_tecnico: 'Dr. Jorge Ribeiro (CREA 50618)',
          telefone: '(91) 3211-9988',
          email: 'tecnico@biofosfatos.com.br',
          ultima_revisao: '2024-11-20',
          motivo_desqualificacao: 'Validade da qualificação bienal expirada.',
        },
      ]
      setFornecedoresList(initialSeed)
    }
  }

  // Permissões de Acesso por papel - HIERARQUIA GIAC: RE > RT > RQ > usuários por setor
  // RE tem todos os poderes do RT em todos os formulários e registros.
  // admin_cliente é gestor da própria organização (mesmos poderes dentro da org).
  const isSuperAdmin = canSignAsRE(user?.role) && (user?.role || '').toLowerCase() === 'super_admin'
  const isAdminCliente =
    (user?.role || '').toLowerCase() === 'admin_cliente' ||
    (user?.role || '').toLowerCase() === 'admin'
  const isRE = canSignAsRE(user?.role)
  const isRT = canSignAsRT(user?.role)
  const isRQ = canSignAsRQ(user?.role)
  const canManageAll = canManagePopForms(user?.role)

  // Extrair recebimentos pendentes de amostragem
  const recebimentosPendentes = useMemo(() => {
    const list: any[] = []
    for (const r of records) {
      if (
        r.formulario_codigo === 'FR 08' ||
        r.formulario_codigo === 'ANEXO III' ||
        r.formulario_codigo === 'F-01-POP-001'
      ) {
        const d = (r.dados_formulario as any) || {}
        list.push({
          numero_recebimento: d.numero_recebimento || `REC-${r.id.slice(0, 8)}`,
          fornecedor_razao_social:
            d.fornecedor_razao_social || d.fornecedor || 'Fornecedor Cadastrado',
          produto_nome: d.produto_nome || d.produto_insumo || 'Insumo',
          lote_partida: d.lote_partida || d.lote_fornecedor || r.lote || 'L-01',
          data_fabricacao: d.data_fabricacao || r.data.split('T')[0],
          data_validade: d.data_validade || '',
          quantidade_recebida: d.quantidade_recebida || d.peso_aferido_kg || '1000',
          unidade: d.unidade || 'kg',
        })
      }
    }
    // Incluir alguns de exemplo caso a base esteja vazia
    if (list.length === 0) {
      list.push({
        numero_recebimento: 'REC-20260315-00101',
        fornecedor_razao_social: 'Agro Grãos do Brasil S.A.',
        produto_nome: 'Farelo de Soja 46% PB',
        lote_partida: 'FS-2026-089',
        data_fabricacao: '2026-03-01',
        data_validade: '2026-09-01',
        quantidade_recebida: '28000',
        unidade: 'kg',
      })
    }
    return list
  }, [records])

  // Extrair amostras para análise laboratorial
  const amostrasDisponiveis = useMemo(() => {
    const list: any[] = []
    for (const r of records) {
      if (r.formulario_codigo === 'ANEXO IV') {
        const d = (r.dados_formulario as any) || {}
        list.push({
          numero_amostra: d.numero_amostra || `AMS-${r.id.slice(0, 8)}`,
          recebimento_numero: d.recebimento_numero || 'REC-20260315-00101',
          fornecedor_razao_social: d.fornecedor_razao_social || 'Fornecedor',
          produto_nome: d.produto_nome || 'Produto',
          lote_partida: d.lote_partida || 'Lote',
          data_coleta: d.data_coleta || r.data.split('T')[0],
        })
      }
    }
    if (list.length === 0) {
      list.push({
        numero_amostra: 'AMS-20260315-00042',
        recebimento_numero: 'REC-20260315-00101',
        fornecedor_razao_social: 'Agro Grãos do Brasil S.A.',
        produto_nome: 'Farelo de Soja 46% PB',
        lote_partida: 'FS-2026-089',
        data_coleta: '2026-03-15',
      })
    }
    return list
  }, [records])

  // Extrair recebimentos reprovados para destinação (Anexo VI)
  const recebimentosReprovados = useMemo(() => {
    const list: any[] = []
    for (const r of records) {
      if (
        (r.formulario_codigo === 'FR 08' || r.formulario_codigo === 'ANEXO III') &&
        r.status === 'Não Conforme'
      ) {
        const d = (r.dados_formulario as any) || {}
        list.push({
          numero_recebimento: d.numero_recebimento || `REC-${r.id.slice(0, 8)}`,
          fornecedor_razao_social: d.fornecedor_razao_social || 'Fornecedor',
          produto_nome: d.produto_nome || d.produto_insumo || 'Produto Reprovado',
          lote_partida: d.lote_partida || d.lote_fornecedor || 'L-NC',
          quantidade: d.quantidade_recebida || d.peso_aferido_kg || '1500',
          unidade: d.unidade || 'kg',
          data_rejeicao: r.data.split('T')[0],
          motivo_rejeicao: d.motivo_rejeicao || 'Embalagem Danificada',
          descricao_motivo: d.descricao_motivo_rejeicao || r.observacoes || '',
        })
      }
    }
    if (list.length === 0) {
      list.push({
        numero_recebimento: 'REC-20260310-00098',
        fornecedor_razao_social: 'NutriVitaminas e Minerais Indústria Ltda.',
        produto_nome: 'Calcário Calcítico Microfino',
        lote_partida: 'CALC-2026-012',
        quantidade: '5000',
        unidade: 'kg',
        data_rejeicao: '2026-03-10',
        motivo_rejeicao: 'Contaminação',
        descricao_motivo: 'Presença de umidade excessiva e odor atípico de mofo.',
      })
    }
    return list
  }, [records])

  // -------------------------------------------------------------------------
  // ALERTAS AUTOMÁTICOS EM TEMPO REAL
  // -------------------------------------------------------------------------
  const alertasAtivos = useMemo(() => {
    const alerts: Array<{
      id: string
      tipo: 'critico' | 'atencao'
      texto: string
      acao?: () => void
    }> = []

    // 1. Qualificação de fornecedor vencendo em 30 dias ou vencida
    fornecedoresList.forEach((f) => {
      if (f.data_validade) {
        const dias = calcularDiasAteVencimento(f.data_validade)
        if (dias < 0 && f.status !== 'Desqualificado') {
          alerts.push({
            id: `forn-venc-${f.id}`,
            tipo: 'critico',
            texto: `Fornecedor ${f.razao_social} está com a qualificação vencida (${Math.abs(dias)} dias). Requalificação mandatória.`,
          })
        } else if (dias >= 0 && dias <= 30) {
          alerts.push({
            id: `forn-aviso-${f.id}`,
            tipo: 'atencao',
            texto: `Qualificação de ${f.razao_social} expira em ${dias} dias. Iniciar renovação no Anexo I.`,
          })
        }
      }
    })

    // 2. Produto recebido com validade < 30 dias ou vencido
    records.forEach((r) => {
      const d = (r.dados_formulario as any) || {}
      if (d.data_validade) {
        const dias = calcularDiasAteVencimento(d.data_validade)
        if (dias >= 0 && dias <= 30) {
          alerts.push({
            id: `val-prod-${r.id}`,
            tipo: 'atencao',
            texto: `Produto ${d.produto_nome || d.produto_insumo} (Lote: ${d.lote_partida || r.lote}) com validade próxima (< ${dias} dias).`,
          })
        }
      }
    })

    // 3. Fornecedor com 2+ Não Conformidades em 12 meses
    fornecedoresList.forEach((f) => {
      // Checa contagem síncrona preliminar ou estática
      if (f.status === 'Suspenso') {
        alerts.push({
          id: `nc-forn-${f.id}`,
          tipo: 'critico',
          texto: `Fornecedor ${f.razao_social} com restrições ativas. Revisão especial indicada.`,
        })
      }
    })

    return alerts
  }, [fornecedoresList, records])

  // -------------------------------------------------------------------------
  // SALVAR / ATUALIZAR FORMULÁRIOS
  // -------------------------------------------------------------------------

  // Salvar Anexo I
  const handleSaveAnexoI = async (dados: AnexoIQualificacaoData, isDraft: boolean) => {
    const status = dados.parecer_final === 'Aprovado' ? 'Conforme' : 'Não Conforme'

    await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO I',
      dadosFormulario: dados,
      data: dados.data_qualificacao,
      turno: 'Manhã',
      valorMedido: `Qualificação: ${dados.razao_social} - Parecer: ${dados.parecer_final}`,
      status,
      responsavel: dados.assinado_rq_nome || user?.name || 'Responsável Qualidade',
      lote: dados.cnpj,
      origemRegistro: 'sistema_automatico',
    })

    await loadFornecedores()

    toast({
      title: isDraft ? 'Rascunho salvo' : 'Fornecedor qualificado com sucesso',
      description: 'Registro gravado e encadeamento atualizado automaticamente.',
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Salvar Anexo III (Recebimento)
  const handleSaveAnexoIII = async (dados: AnexoIIIRecebimentoData, isDraft: boolean) => {
    const isReprovado = dados.resultado === 'Reprovado'

    const res = await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO III',
      dadosFormulario: dados,
      data: dados.data_recebimento.split(' ')[0],
      turno: 'Manhã',
      valorMedido: `Recebimento ${dados.numero_recebimento} - Parecer: ${dados.resultado} (${dados.quantidade_recebida} ${dados.unidade})`,
      status: isReprovado ? 'Não Conforme' : 'Conforme',
      responsavel: dados.responsavel_recebimento || user?.name || 'Operador',
      lote: dados.lote_partida,
      observacoes: dados.descricao_motivo_rejeicao || dados.observacoes_inspecao_visual || '',
      origemRegistro: 'sistema_automatico',
    })

    toast({
      title: isDraft ? 'Rascunho de recebimento salvo' : 'Recebimento de matéria-prima concluído',
      description:
        res.proximosGerados.length > 0
          ? `Recebimento salvo e ${res.proximosGerados.length} próximo(s) registro(s) obrigatório(s) gerado(s) na cadeia.`
          : `Nº ${dados.numero_recebimento} registrado na base de autocontrole.`,
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Salvar Anexo IV (Coleta de Amostra)
  const handleSaveAnexoIV = async (dados: AnexoIVColetaAmostraData, isDraft: boolean) => {
    const res = await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO IV',
      dadosFormulario: dados,
      data: dados.data_coleta,
      turno: 'Manhã',
      valorMedido: `Coleta Amostra ${dados.numero_amostra} (Rec: ${dados.recebimento_numero}) - ${dados.quantidade_coletada} ${dados.unidade}`,
      status: 'Conforme',
      responsavel: dados.responsavel_coleta || user?.name || 'Amostrador',
      lote: dados.lote_partida,
      origemRegistro: 'sistema_automatico',
    })

    toast({
      title: isDraft ? 'Rascunho de coleta salvo' : 'Amostra enviada para laboratório',
      description:
        res.proximosGerados.length > 0
          ? `Coleta concluída! Próximo registro obrigatório (Laudo Laboratorial) gerado na cadeia.`
          : `Amostra nº ${dados.numero_amostra} registrada e pronta para ensaios.`,
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Salvar Anexo V (Laudo Laboratorial)
  const handleSaveAnexoV = async (dados: AnexoVAnaliseLaboratorialData, isDraft: boolean) => {
    const isReprovado = dados.resultado_geral === 'Reprovado'

    const res = await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO V',
      dadosFormulario: dados,
      data: dados.data_emissao,
      turno: 'Manhã',
      valorMedido: `Laudo LAB ${dados.numero_relatorio}: ${dados.resultado_geral} (${dados.percentual_conformidade}% conformidade)`,
      status: isReprovado ? 'Não Conforme' : 'Conforme',
      responsavel: dados.responsavel_emissao || user?.name || 'Analista CQ',
      lote: dados.lote_partida,
      observacoes: dados.motivo_rejeicao_relatorio || dados.parecer_laboratorio,
      origemRegistro: 'sistema_automatico',
    })

    toast({
      title: isDraft ? 'Rascunho de laudo salvo' : 'Laudo laboratorial liberado',
      description: isReprovado
        ? '⚠️ Laudo Reprovado: Destinação (FR 18) e Ação Corretiva (FR 01) geradas automaticamente como pendências!'
        : 'Laudo Conforme: Cadeia analítica encerrada com aprovação!',
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Salvar Anexo VI (Destinação)
  const handleSaveAnexoVI = async (dados: AnexoVIDestinacaoData, isDraft: boolean) => {
    await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO VI',
      dadosFormulario: dados,
      data: dados.data_registro,
      turno: 'Manhã',
      valorMedido: `Destinação ${dados.numero_registro} (${dados.tipo_destinacao}): ${dados.quantidade} ${dados.unidade} de ${dados.produto_nome}`,
      status: 'Não Conforme',
      responsavel: dados.responsavel_registro || user?.name || 'Responsável Descarte',
      lote: dados.lote_partida,
      observacoes: dados.descricao_motivo,
      origemRegistro: 'sistema_automatico',
    })

    toast({
      title: isDraft ? 'Rascunho de destinação salvo' : 'Destinação final registrada com sucesso',
      description: `Registro ${dados.numero_registro} vinculado e cadeia de descarte atendida.`,
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Salvar Anexo VII (Ação Corretiva)
  const handleSaveAnexoVII = async (dados: AnexoVIIAcaoCorretivaData, isDraft: boolean) => {
    await saveRecordWithChain({
      procedureId: procedure.id,
      procedureCode: procedure.codigo,
      formularioCodigo: 'ANEXO VII',
      dadosFormulario: dados,
      data: dados.data_abertura,
      turno: 'Manhã',
      valorMedido: `Ação Corretiva ${dados.numero_acao_corretiva} (${dados.tipo_nc}): ${dados.descricao_detalhada.slice(0, 40)}...`,
      status: 'Não Conforme',
      responsavel: dados.responsavel_abertura || user?.name || 'Responsável Qualidade',
      lote: dados.lote_partida,
      observacoes: dados.causa_raiz_identificada,
      origemRegistro: 'sistema_automatico',
    })

    toast({
      title: isDraft ? 'Rascunho de Ação Corretiva salvo' : 'Ação Corretiva instaurada com sucesso',
      description: `Processo nº ${dados.numero_acao_corretiva} aberto e integrado à cadeia do Auto Controle.`,
    })

    if (onRecordCreated) onRecordCreated()
  }

  // Desqualificar Fornecedor (do Anexo II ou acionado pelo Anexo VII)
  const handleDesqualificarFornecedor = async (
    itemOrName: AnexoIIFornecedorItem | string,
    motivo: string,
  ) => {
    let fItem: AnexoIIFornecedorItem | undefined
    if (typeof itemOrName === 'string') {
      fItem = fornecedoresList.find(
        (f) => f.razao_social.toLowerCase() === itemOrName.toLowerCase(),
      )
    } else {
      fItem = itemOrName
    }

    if (!fItem) return

    const updated: AnexoIIFornecedorItem = {
      ...fItem,
      status: 'Desqualificado',
      motivo_desqualificacao: motivo,
      ultima_revisao: new Date().toISOString().split('T')[0],
    }

    await salvarFornecedorNoAnexoII(procedure.id, updated, user?.name || 'Sistema')
    await loadFornecedores()
  }

  // -------------------------------------------------------------------------
  // Modelos de Formulários na Barra Superior (Com ícones, nomes e códigos)
  // -------------------------------------------------------------------------
  const modulosAnexos = [
    {
      code: 'ANEXO II',
      title: 'Anexo II – Lista de Fornecedores Qualificados',
      desc: 'Tabela dinâmica integrada (substitui/melhora o FR 14).',
      icon: ClipboardList,
      badge: 'Principal',
    },
    {
      code: 'ANEXO I',
      title: 'Anexo I – Formulário de Qualificação',
      desc: 'Dossiê cadastral, documental e parecer final bienal (FR 16).',
      icon: FileCheck,
      badge: 'Homologação',
    },
    {
      code: 'ANEXO III',
      title: 'Anexo III – Recebimento de Matérias-Primas',
      desc: 'Inspeção física, documental e amostragem na doca (FR 08).',
      icon: Truck,
      badge: 'Recepção',
    },
    {
      code: 'ANEXO IV',
      title: 'Anexo IV – Coleta de Amostra',
      desc: 'Amostragem em triplicata oficial, lacre e requisição de ensaios.',
      icon: FlaskConical,
      badge: 'Amostragem',
    },
    {
      code: 'ANEXO V',
      title: 'Anexo V – Relatório Laboratorial',
      desc: 'Laudo de ensaios microbiológicos, bromatológicos e parecer RT.',
      icon: Sparkles,
      badge: 'Laboratório',
    },
    {
      code: 'ANEXO VI',
      title: 'Anexo VI – Destinação de Não Aprovados',
      desc: 'Tratamento de produtos rejeitados e conformidade ambiental (FR 18).',
      icon: Trash2,
      badge: 'Descarte',
    },
    {
      code: 'ANEXO VII',
      title: 'Anexo VII – Ação Corretiva',
      desc: 'Tratamento de causa raiz (5 Porquês), eficácia e penalidade (FR 01/RNC).',
      icon: AlertTriangle,
      badge: 'CAPA / RNC',
    },
    // Modelos normativos complementares mantidos
    {
      code: 'FR 15',
      title: 'FR 15 – Monitoramento de Temp. e Umidade',
      desc: 'Aferições diárias da Sala de Medicamentos e Armazéns.',
      icon: Thermometer,
      badge: 'Ambiente',
    },
    {
      code: 'FR 19',
      title: 'FR 19 – Verificação Anual de Qualificação',
      desc: 'Avaliação anual dos critérios de qualificação.',
      icon: CalendarCheck,
      badge: 'Auditoria',
    },
  ]

  // Abrir Modal de Impressão PDF com dados
  const triggerPrintModal = (codigoAnexo: string, titulo: string, dados: any) => {
    setPrintData({
      codigoAnexo,
      titulo,
      subtitulo: 'NutriAgro SaaS • Auto Controle 01 – Qualificação de Fornecedores',
      dados,
    })
    setPrintModalOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in text-stone-900">
      {/* 1. Alertas Automáticos de Autocontrole */}
      {alertasAtivos.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
            <h4 className="font-bold text-xs font-['Sora'] text-amber-900 uppercase tracking-wide">
              Alertas Automáticos do Auto Controle 01 ({alertasAtivos.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {alertasAtivos.map((alt) => (
              <div
                key={alt.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                  alt.tipo === 'critico'
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-amber-200 bg-white text-amber-900'
                }`}
              >
                <span className="font-bold shrink-0">{alt.tipo === 'critico' ? '⛔' : '⚠️'}</span>
                <span>{alt.texto}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Box de Notificação do Fluxo Obrigatório Encadeado */}
      <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-[#1B4332] flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Fluxo Encadeado Ativo: Recebimento (III) → Coleta (IV) → Laudo (V) → Destinação (VI) /
            Ação Corretiva (VII)
          </span>
          <p className="text-stone-600 text-[11px]">
            Os registros geram automaticamente as próximas etapas vinculadas. Consulte a aba{' '}
            <strong>Cadeia & Pendências</strong> para acompanhar a comprovação integral do Auto
            Controle.
          </p>
        </div>
        <Badge className="bg-[#1B4332] text-white shrink-0 self-start sm:self-center text-[10px]">
          Encadeamento Automático
        </Badge>
      </div>

      {/* 2. Barra de Navegação Rápida entre os 7 Anexos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {modulosAnexos.slice(0, 7).map((m) => {
          const Icon = m.icon
          const isSelected = selectedFormCode === m.code

          return (
            <button
              key={m.code}
              type="button"
              onClick={() => setSelectedFormCode(m.code)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'border-[#1B4332] bg-emerald-50/60 ring-2 ring-[#1B4332] shadow-sm'
                  : 'border-[#E2DCCF] bg-white hover:border-[#1B4332]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1B4332] text-white">
                    {m.code}
                  </span>
                  <Badge variant="outline" className="text-[9px] border-stone-300 text-stone-600">
                    {m.badge}
                  </Badge>
                </div>
                <h4 className="text-[11px] font-bold text-stone-900 leading-tight mt-1 line-clamp-1">
                  {m.title.split('–')[1] || m.title}
                </h4>
              </div>
            </button>
          )
        })}
      </div>

      {/* 3. VISÃO DO ANEXO ATIVO */}

      {/* ANEXO II – LISTA DE FORNECEDORES (Substitui/Melhora FR 14) */}
      {selectedFormCode === 'ANEXO II' && (
        <AnexoIIListaFornecedores
          fornecedores={fornecedoresList}
          canManage={canManageAll}
          onAddNew={() => {
            setAnexoIInitial(undefined)
            setAnexoIOpen(true)
          }}
          onEdit={(item) => {
            setAnexoIInitial({
              razao_social: item.razao_social,
              cnpj: item.cnpj,
              telefone: item.telefone,
              email: item.email,
              responsavel_tecnico: item.responsavel_tecnico,
              data_qualificacao: item.data_qualificacao,
              data_validade_qualificacao: item.data_validade,
              parecer_final: item.status === 'Ativo' ? 'Aprovado' : 'Reprovado',
            })
            setAnexoIOpen(true)
          }}
          onView={(item) => {
            triggerPrintModal('ANEXO II', `Ficha Cadastral: ${item.razao_social}`, item)
          }}
          onDesqualificar={async (item, motivo) => {
            await handleDesqualificarFornecedor(item, motivo)
          }}
          onExportPdf={() => {
            triggerPrintModal('ANEXO II', 'Lista Geral de Fornecedores Qualificados', {
              versao: '01-2026',
              fornecedores: fornecedoresList,
            })
          }}
        />
      )}

      {/* ANEXO I – QUALIFICAÇÃO DE FORNECEDOR */}
      {selectedFormCode === 'ANEXO I' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO I
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Formulário de Qualificação de Fornecedor
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Avaliação cadastral, documental (MAPA, BPF) e parecer bienal. Alimenta
                automaticamente a Lista de Fornecedores Qualificados (Anexo II).
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoIInitial(undefined)
                setAnexoIOpen(true)
              }}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4 text-[#D9A404]" />
              Novo Formulário de Qualificação
            </Button>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-2">
            <h4 className="font-bold text-[#1B4332] uppercase text-[11px]">
              Diretriz de Autocontrole
            </h4>
            <p className="text-stone-700 leading-relaxed">
              Conforme a Instrução Normativa nº 04/2007 do MAPA, todo fornecedor de matérias-primas
              e ingredientes deve passar por qualificação prévia com validade máxima de 2 anos (24
              meses). Fornecedores com parecer &quot;Reprovado&quot; são impedidos de entrega na
              portaria.
            </p>
          </div>
        </div>
      )}

      {/* ANEXO III – RECEBIMENTO DE MATÉRIAS-PRIMAS */}
      {selectedFormCode === 'ANEXO III' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO III
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Formulário de Recebimento de Matérias-Primas e Ingredientes (FR 08)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Conferência na doca de descarregamento, validação de fornecedor homologado, inspeção
                de integridade e amostragem.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoIIIInitial(undefined)
                setAnexoIIIOpen(true)
              }}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4 text-[#D9A404]" />
              Registrar Recebimento
            </Button>
          </div>

          {/* Tabela de Recebimentos Registrados */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                  <th className="py-2.5 px-3">Nº Recebimento</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Fornecedor</th>
                  <th className="py-2.5 px-3">Produto / Lote</th>
                  <th className="py-2.5 px-3">Qtd</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {records
                  .filter(
                    (r) =>
                      r.formulario_codigo === 'FR 08' ||
                      r.formulario_codigo === 'ANEXO III' ||
                      r.formulario_codigo === 'F-01-POP-001',
                  )
                  .map((r) => {
                    const d = (r.dados_formulario as any) || {}
                    return (
                      <tr key={r.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1B4332]">
                          {d.numero_recebimento || `REC-${r.id.slice(0, 8)}`}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {new Date(r.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-800">
                          {d.fornecedor_razao_social || d.fornecedor || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {d.produto_nome || d.produto_insumo || '—'} (Lote:{' '}
                          {d.lote_partida || r.lote || '—'})
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {d.quantidade_recebida || d.peso_aferido_kg || '—'} {d.unidade || 'kg'}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            className={
                              r.status === 'Conforme'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-red-700 text-white'
                            }
                          >
                            {d.status_fluxo || r.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              triggerPrintModal(
                                'ANEXO III',
                                `Recebimento ${d.numero_recebimento || ''}`,
                                d,
                              )
                            }
                            className="h-7 text-xs border-stone-300 gap-1"
                          >
                            <FileText className="h-3 w-3 text-[#1B4332]" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANEXO IV – COLETA DE AMOSTRA */}
      {selectedFormCode === 'ANEXO IV' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO IV
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Formulário de Coleta de Amostra
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Amostragem em triplicata regulamentar do MAPA, selagem com lacre numerado e
                acondicionamento térmico.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoIVInitial(undefined)
                setAnexoIVOpen(true)
              }}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4 text-[#D9A404]" />
              Nova Coleta de Amostra
            </Button>
          </div>

          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 text-xs">
            <p className="text-stone-700">
              As amostras cadastradas aqui alimentam diretamente a fila de análises do{' '}
              <strong>Anexo V (Relatório Laboratorial)</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ANEXO V – RELATÓRIO DE ANÁLISE LABORATORIAL */}
      {selectedFormCode === 'ANEXO V' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO V
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Relatório de Análise Laboratorial (CQ Bromatológico e Microbiológico)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Registro de ensaios com comparação de limites, parecer conclusivo e assinaturas
                RT/RQ.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoVInitial(undefined)
                setAnexoVOpen(true)
              }}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4 text-[#D9A404]" />
              Novo Laudo Laboratorial
            </Button>
          </div>
        </div>
      )}

      {/* ANEXO VI – DESTINAÇÃO DE NÃO APROVADOS */}
      {selectedFormCode === 'ANEXO VI' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO VI
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Registro de Destinação de Produtos Não Aprovados (FR 18)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Descarte, devolução a fornecedor ou reprocessamento condicional com conformidade
                ambiental.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoVIInitial(undefined)
                setAnexoVIOpen(true)
              }}
              className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Registro de Destinação
            </Button>
          </div>
        </div>
      )}

      {/* ANEXO VII – AÇÃO CORRETIVA */}
      {selectedFormCode === 'ANEXO VII' && (
        <div className="p-6 bg-white rounded-xl border border-[#E2DCCF] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO VII
                </span>
                <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                  Formulário de Ação Corretiva (FR 01 / RNC)
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Investigação de causa raiz, cronograma de ações, acompanhamento de eficácia e
                penalidade ao fornecedor.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setAnexoVIIInitial(undefined)
                setAnexoVIIOpen(true)
              }}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4 text-[#D9A404]" />
              Abrir Ação Corretiva
            </Button>
          </div>
        </div>
      )}

      {/* 4. MODAIS DOS 7 ANEXOS */}

      {/* Anexo I */}
      <AnexoIQualificacaoModal
        open={anexoIOpen}
        onOpenChange={setAnexoIOpen}
        initialData={anexoIInitial}
        usersList={usersList}
        currentUser={user}
        onSave={handleSaveAnexoI}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO I', 'Formulário de Qualificação de Fornecedor', dados)
        }
      />

      {/* Anexo III */}
      <AnexoIIIRecebimentoModal
        open={anexoIIIOpen}
        onOpenChange={setAnexoIIIOpen}
        initialData={anexoIIIInitial}
        fornecedoresQualificados={fornecedoresList}
        currentUser={user}
        onSave={handleSaveAnexoIII}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO III', 'Formulário de Recebimento de Matérias-Primas', dados)
        }
        onCriarAmostraDireta={(rec) => {
          setAnexoIIIOpen(false)
          setAnexoIVInitial({
            recebimento_numero: rec.numero_recebimento,
            fornecedor_razao_social: rec.fornecedor_razao_social,
            produto_nome: rec.produto_nome,
            lote_partida: rec.lote_partida,
            data_fabricacao: rec.data_fabricacao,
            data_validade: rec.data_validade,
            quantidade_total_recebida: rec.quantidade_recebida,
            unidade: rec.unidade,
          })
          setAnexoIVOpen(true)
        }}
        onCriarDescarteDireto={(rec) => {
          setAnexoIIIOpen(false)
          setAnexoVIInitial({
            numero_recebimento: rec.numero_recebimento,
            fornecedor_razao_social: rec.fornecedor_razao_social,
            produto_nome: rec.produto_nome,
            lote_partida: rec.lote_partida,
            quantidade: rec.quantidade_recebida,
            unidade: rec.unidade,
            motivo_rejeicao: (rec.motivo_rejeicao as any) || 'Embalagem Danificada',
            descricao_motivo: rec.descricao_motivo_rejeicao || '',
          })
          setAnexoVIOpen(true)
        }}
      />

      {/* Anexo IV */}
      <AnexoIVColetaAmostraModal
        open={anexoIVOpen}
        onOpenChange={setAnexoIVOpen}
        initialData={anexoIVInitial}
        recebimentosPendentes={recebimentosPendentes}
        currentUser={user}
        onSave={handleSaveAnexoIV}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO IV', 'Formulário de Coleta de Amostra', dados)
        }
      />

      {/* Anexo V */}
      <AnexoVAnaliseLaboratorialModal
        open={anexoVOpen}
        onOpenChange={setAnexoVOpen}
        initialData={anexoVInitial}
        amostrasDisponiveis={amostrasDisponiveis}
        currentUser={user}
        onSave={handleSaveAnexoV}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO V', 'Relatório de Análise Laboratorial', dados)
        }
        onCriarDescarteDireto={(laudo) => {
          setAnexoVOpen(false)
          setAnexoVIInitial({
            numero_recebimento: laudo.numero_recebimento,
            fornecedor_razao_social: laudo.fornecedor_razao_social,
            produto_nome: laudo.produto_nome,
            lote_partida: laudo.lote_partida,
            motivo_rejeicao: 'Análise Reprovada',
            descricao_motivo:
              laudo.motivo_rejeicao_relatorio || 'Reprovado nos ensaios do laboratório',
            numero_relatorio_analise: laudo.numero_relatorio,
          })
          setAnexoVIOpen(true)
        }}
        onCriarAcaoCorretivaDireta={(laudo) => {
          setAnexoVOpen(false)
          setAnexoVIIInitial({
            tipo_nc: 'Análise Laboratorial',
            numero_relatorio_analise: laudo.numero_relatorio,
            numero_recebimento: laudo.numero_recebimento,
            fornecedor_razao_social: laudo.fornecedor_razao_social,
            produto_nome: laudo.produto_nome,
            lote_partida: laudo.lote_partida,
            descricao_detalhada: `Laudo ${laudo.numero_relatorio} reprovado: ${laudo.motivo_rejeicao_relatorio || 'Desvio analítico detectado'}`,
          })
          setAnexoVIIOpen(true)
        }}
      />

      {/* Anexo VI */}
      <AnexoVIDestinacaoModal
        open={anexoVIOpen}
        onOpenChange={setAnexoVIOpen}
        initialData={anexoVIInitial}
        recebimentosReprovados={recebimentosReprovados}
        currentUser={user}
        usersList={usersList}
        onSave={handleSaveAnexoVI}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO VI', 'Registro de Destinação de Produtos Não Aprovados', dados)
        }
        onCriarAcaoCorretivaDireta={(des) => {
          setAnexoVIOpen(false)
          setAnexoVIIInitial({
            tipo_nc: 'Recebimento',
            numero_recebimento: des.numero_recebimento,
            numero_relatorio_analise: des.numero_relatorio_analise,
            fornecedor_razao_social: des.fornecedor_razao_social,
            produto_nome: des.produto_nome,
            lote_partida: des.lote_partida,
            descricao_detalhada: `Destinação ${des.numero_registro} (${des.tipo_destinacao}) motivada por: ${des.descricao_motivo}`,
          })
          setAnexoVIIOpen(true)
        }}
      />

      {/* Anexo VII */}
      <AnexoVIIAcaoCorretivaModal
        open={anexoVIIOpen}
        onOpenChange={setAnexoVIIOpen}
        initialData={anexoVIIInitial}
        currentUser={user}
        usersList={usersList}
        fornecedoresList={fornecedoresList.map((f) => ({
          id: f.id,
          razao_social: f.razao_social,
          cnpj: f.cnpj,
        }))}
        onSave={handleSaveAnexoVII}
        onPrintPreview={(dados) =>
          triggerPrintModal('ANEXO VII', 'Formulário de Ação Corretiva', dados)
        }
        onDesqualificarFornecedor={async (razao, motivo) => {
          await handleDesqualificarFornecedor(razao, motivo)
        }}
      />

      {/* Modal de Impressão PDF Padronizado (Verde Floresta / Âmbar) */}
      <Pop01PrintPdfModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        codigoAnexo={printData.codigoAnexo}
        titulo={printData.titulo}
        subtitulo={printData.subtitulo}
        company={company}
        dados={printData.dados}
        rtSignatureImage={user?.assinatura_imagem}
      />
    </div>
  )
}
