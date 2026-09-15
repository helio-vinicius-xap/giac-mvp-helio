import React, { useState } from 'react'
import {
  FileText,
  Printer,
  PlusCircle,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Thermometer,
  Truck,
  Trash2,
  CalendarCheck,
  Shield,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { createRecord, createNonConformity } from '@/services/agroService'
import type { Procedure, MonitoringRecord, Company, UserProfile } from '@/types/agro'
import type {
  FR08RecebimentoData,
  FR14FornecedorItem,
  FR15MedicaoLinha,
  FR16QualificacaoData,
  FR18ItemDescarte,
  FR19VerificacaoData,
  A8AuditoriaData,
  A10DeclaracaoData,
  FR01RNCData,
} from '@/types/pop01Forms'

interface Pop01FormsManagerProps {
  procedure: Procedure
  company: Company | null
  user: UserProfile | null
  records: MonitoringRecord[]
  onRecordCreated?: () => void
  onOpenRecordPdf?: (record: MonitoringRecord) => void
}

export function Pop01FormsManager({
  procedure,
  company,
  user,
  records,
  onRecordCreated,
  onOpenRecordPdf,
}: Pop01FormsManagerProps) {
  const { toast } = useToast()
  const [selectedFormCode, setSelectedFormCode] = useState<string>('FR 08')

  // Modais de Criação para cada modelo
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Estados dos formulários de preenchimento (dados puros inseridos pelo usuário, sem linhas de seed)
  const [fr08Form, setFr08Form] = useState<FR08RecebimentoData>({
    data_recebimento: new Date().toISOString().split('T')[0],
    horario: '08:30',
    fornecedor_razao_social: '',
    fabricante_razao_social: '',
    nota_fiscal: '',
    transportadora: '',
    placa_veiculo: '',
    tipo_veiculo: 'Baú',
    produto_insumo: '',
    lote_fornecedor: '',
    lote_interno: `L-INT-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`,
    data_fabricacao: '',
    data_validade: '',
    peso_nf_kg: '',
    peso_aferido_kg: '',
    variacao_peso_percent: 0,
    numero_volumes: '',
    checklist_veiculo: {
      item_1_higiene: 'C',
      item_2_integridade: 'C',
      item_3_lona: 'C',
      item_4_incompatíveis: 'C',
      item_5_embalagens: 'C',
      item_6_rotulagem_decreto: 'C',
      item_7_fornecedor_qualificado_fr14: 'C',
      item_8_laudo_conforme: 'C',
    },
    sensorial: {
      cor: 'Característica (Típica)',
      odor: 'Característico',
      aspecto_textura: 'Uniforme (Normal)',
      umidade_visivel: 'Ausente',
      pragas_sujidades: 'Ausente',
    },
    parecer_final: 'Liberado para Descarga',
    observacoes_desvios: '',
    responsavel_recebimento_nome: user?.name || 'Almoxarife / CQ',
    visto_cq_nome: company?.rq_nome || 'Dra. Mariana Siqueira (CQ)',
  })

  // Formulário FR 14 (adicionar novo fornecedor na lista)
  const [fr14Item, setFr14Item] = useState<FR14FornecedorItem>({
    codigo: '',
    materia_prima_insumo: '',
    razao_social: '',
    registro_mapa: '',
    registro_cadastro_produto: '',
    risco_insumo: 'Médio',
    validade_qualificacao: '',
    status_cadastral: 'Ativo',
  })

  // Formulário FR 15 (medição diária de temp/UR)
  const [fr15Item, setFr15Item] = useState<FR15MedicaoLinha>({
    dia: new Date().getDate(),
    hora: '08:30',
    temp_atual: '21.5',
    temp_min: '18.0',
    temp_max: '24.0',
    ur_atual: '60',
    ur_min: '55',
    ur_max: '70',
    conforme: true,
    visto_responsavel: user?.name || 'Op. Qualidade',
  })
  const [fr15Local, setFr15Local] = useState('Sala de Medicamentos')

  // Formulário FR 16 (Dossiê de Qualificação)
  const [fr16Form, setFr16Form] = useState<FR16QualificacaoData>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    registro_mapa: '',
    endereco_completo: '',
    uf: 'SP',
    responsavel_tecnico: '',
    registro_classe_rt: '',
    produto_denominacao: '',
    produto_registro_mapa: '',
    categoria: 'MP Vegetal',
    risco_appcc: 'Médio',
    checklist_documental: {
      item_1_registro_estabelecimento_mapa: true,
      item_2_registro_produto_isencao: true,
      item_3_ficha_tecnica: true,
      item_4_declaracao_conformidade_a10: true,
      item_5_controle_ractopamina: true,
      item_6_certificados_3_ultimos_lotes: true,
    },
    amostra_piloto: {
      laudo_numero: '',
      data_laudo: new Date().toISOString().split('T')[0],
      resultado: 'Aprovado',
      umidade_percent: '',
      proteina_bruta_percent: '',
      cinzas_percent: '',
      microscopia: 'Conforme RTIQ',
    },
    parecer_conclusivo: 'Qualificado sem Restrições',
    restricoes_observacoes: '',
    coordenador_cq_nome: company?.rq_nome || 'Coordenador CQ',
    coordenador_cq_data: new Date().toISOString().split('T')[0],
    rt_nome: company?.rt_nome || 'Dr. Hélio Silva (RT)',
    rt_data: new Date().toISOString().split('T')[0],
  })

  // Formulário FR 18 (Descarte)
  const [fr18Form, setFr18Form] = useState<{
    motivo: string
    descricao: string
    lote_interno: string
    lote_fornecedor: string
    qtd_kg: string
    local_descarte: string
  }>({
    motivo: 'Validade Vencida',
    descricao: '',
    lote_interno: '',
    lote_fornecedor: '',
    qtd_kg: '',
    local_descarte: 'Compostagem Licenciada / Aterro Industrial',
  })

  // Formulário FR 19 (Verificação Anual)
  const [fr19Form, setFr19Form] = useState<FR19VerificacaoData>({
    fornecedor_razao_social: '',
    codigo_fr14: '',
    insumos_fornecidos: '',
    data_avaliacao: new Date().toISOString().split('T')[0],
    verificacao_itens: {
      item_1_registro_mapa_vigente: true,
      item_2_produtos_regulares: true,
      item_3_indice_nc_menor_meta: true,
      item_4_rotulagem_decreto: true,
      item_5_prazos_validade_especificacoes: true,
    },
    decisao_comissao: 'Manter Qualificação Ativa (12 meses)',
    avaliador_cq_nome: company?.rq_nome || 'Coordenador CQ',
    homologacao_rt_nome: company?.rt_nome || 'Dr. Hélio Silva (RT)',
  })

  // Formulário A8 (Checklist Auditoria)
  const [a8Form, setA8Form] = useState<{
    fornecedor: string
    data: string
    registro_mapa: string
    auditor: string
    c_count: number
    nc_count: number
    classificacao: string
    plano_acao: string
  }>({
    fornecedor: '',
    data: new Date().toISOString().split('T')[0],
    registro_mapa: '',
    auditor: user?.name || 'Auditor Líder BPF',
    c_count: 8,
    nc_count: 0,
    classificacao: 'Aprovado (>85%)',
    plano_acao: '',
  })

  // Formulário A10 (Declaração de Conformidade do Fornecedor)
  const [a10Form, setA10Form] = useState<A10DeclaracaoData>({
    compradora_empresa: company?.razao_social || 'NutriAgro Nutrição Animal',
    fornecedor_razao_social: '',
    fornecedor_cnpj: '',
    fornecedor_estabelecimento_endereco: '',
    fornecedor_registro_mapa: '',
    opcao_ractopamina: 'consta_lista_mapa',
    local_data: `${company?.municipio || 'Ribeirão Preto'}, ${new Date().toLocaleDateString('pt-BR')}`,
    rt_fornecedor_nome: '',
    rt_fornecedor_titulo: 'Médico Veterinário / Zootecnista',
    rt_fornecedor_registro_classe: '',
  })

  // Formulário FR 01 (RNC)
  const [fr01Form, setFr01Form] = useState<FR01RNCData>({
    numero_rnc: `RNC-POP01-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, '0')}`,
    data_ocorrencia: new Date().toISOString().split('T')[0],
    origem: 'Recebimento',
    grau: 'Maior',
    fornecedor_razao_social: '',
    produto_materia_prima: '',
    lote_fornecedor: '',
    lote_interno: '',
    quantidade_afetada_kg: '',
    nota_fiscal: '',
    descricao_detalhada: '',
    disposicao_imediata: 'Bloqueio no Depósito de Não Aprovadas',
    analise_causa_raiz: {
      ishikawa_resumo: '',
      cinco_porques_resumo: '',
    },
    capa_acoes: [
      {
        acao: 'Notificar fornecedor e exigir laudo corretivo',
        responsavel: 'Coordenador CQ',
        prazo: '5 dias',
      },
    ],
    verificacao_eficacia: {
      data_avaliacao: '',
      parecer: 'Eficaz — Encerrar RNC',
      coordenador_cq_nome: company?.rq_nome || 'Dra. Mariana Siqueira',
    },
  })

  const formModelList = [
    {
      code: 'FR 08',
      title: 'Registro de Recebimento de Mercadorias',
      desc: 'Inspeção veicular do art. 77 Decreto 12.031/2024, rotulagem e sensorial.',
      icon: Truck,
      retencao: '2 anos (3 anos com medicamento)',
    },
    {
      code: 'FR 14',
      title: 'Lista de Fornecedores e Fabricantes Qualificados',
      desc: 'Quadro homologado com registro MAPA, risco e validade cadastral.',
      icon: ClipboardList,
      retencao: 'Permanente (histórico 5 anos)',
    },
    {
      code: 'FR 15',
      title: 'Monitoramento Diário de Temperatura e Umidade',
      desc: 'Aferições 2x ao dia com limites (Medicamentos 15-25°C / Armazéns <35°C, UR <85%).',
      icon: Thermometer,
      retencao: '2 anos (3 anos p/ salas de medicamentos)',
    },
    {
      code: 'FR 16',
      title: 'Formulário de Qualificação de Fornecedores',
      desc: 'Dossiê cadastral, checklist dos 6 critérios limitantes e amostra piloto.',
      icon: FileCheck,
      retencao: '5 anos após desativação',
    },
    {
      code: 'FR 18',
      title: 'Solicitação de Descarte de Insumos e Produtos',
      desc: 'Descaracterização e destinação ambiental de itens impróprios (arts. 95-99).',
      icon: Trash2,
      retencao: '2 anos (3 anos com medicamento)',
    },
    {
      code: 'FR 19',
      title: 'Verificação Anual dos Critérios de Qualificação',
      desc: 'Avaliação anual dos 5 quesitos e decisão da comissão de requalificação.',
      icon: CalendarCheck,
      retencao: '3 anos',
    },
    {
      code: 'IT 14',
      title: 'Instrução de Trabalho: Análise de Matérias-Primas',
      desc: 'Rotina laboratorial, fluxo 2.1-2.5, parâmetros por categoria e contraprovas.',
      icon: FileText,
      retencao: '2 anos (3 anos com medicamento)',
    },
    {
      code: 'A8',
      title: 'Checklist de Auditoria / Visita Técnica a Fornecedores',
      desc: 'Avaliação dos 8 requisitos de BPF (instalações, pragas, água, ractopamina).',
      icon: Shield,
      retencao: '3 anos',
    },
    {
      code: 'A9',
      title: 'Matriz de Risco de Matérias-Primas (APPCC)',
      desc: 'Categorização de perigos biológicos, químicos e físicos e classes de risco.',
      icon: AlertTriangle,
      retencao: 'Permanente',
    },
    {
      code: 'A10',
      title: 'Declaração de Conformidade do Fornecedor',
      desc: 'Declaração formal do RT fornecedor com termo de ractopamina e ausência de proibições.',
      icon: FileText,
      retencao: '5 anos',
    },
    {
      code: 'FR 01',
      title: 'Registro de Não Conformidade (RNC)',
      desc: 'Tratamento de desvios, causa-raiz Ishikawa/5PB, plano CAPA e eficácia.',
      icon: AlertTriangle,
      retencao: '3 anos',
    },
  ]

  // Salvar registro genérico tipado no banco PocketBase
  const handleSaveFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      let dadosFormulario: any = {}
      let valorMedido = 'Registro em conformidade'
      let statusRegistro: 'Conforme' | 'Não Conforme' = 'Conforme'
      let loteRef = ''
      let observacoes = ''

      if (selectedFormCode === 'FR 08') {
        dadosFormulario = fr08Form
        valorMedido = `Parecer: ${fr08Form.parecer_final} | Variação: ${fr08Form.variacao_peso_percent}%`
        statusRegistro =
          fr08Form.parecer_final === 'Liberado para Descarga' ? 'Conforme' : 'Não Conforme'
        loteRef = fr08Form.lote_interno || fr08Form.lote_fornecedor
        observacoes = fr08Form.observacoes_desvios || ''
      } else if (selectedFormCode === 'FR 14') {
        dadosFormulario = fr14Item
        valorMedido = `Fornecedor: ${fr14Item.razao_social} (${fr14Item.materia_prima_insumo}) - ${fr14Item.status_cadastral}`
        statusRegistro = fr14Item.status_cadastral === 'Ativo' ? 'Conforme' : 'Não Conforme'
        loteRef = fr14Item.codigo
      } else if (selectedFormCode === 'FR 15') {
        dadosFormulario = { ...fr15Item, local_monitorado: fr15Local }
        valorMedido = `Temp: ${fr15Item.temp_atual}°C | UR: ${fr15Item.ur_atual}% (${fr15Local})`
        statusRegistro = fr15Item.conforme ? 'Conforme' : 'Não Conforme'
      } else if (selectedFormCode === 'FR 16') {
        dadosFormulario = fr16Form
        valorMedido = `Qualificação: ${fr16Form.parecer_conclusivo} - ${fr16Form.razao_social}`
        statusRegistro = fr16Form.parecer_conclusivo.includes('Reprovado')
          ? 'Não Conforme'
          : 'Conforme'
        loteRef = fr16Form.produto_registro_mapa
      } else if (selectedFormCode === 'FR 18') {
        dadosFormulario = fr18Form
        valorMedido = `Descarte: ${fr18Form.qtd_kg} kg de ${fr18Form.descricao} (${fr18Form.motivo})`
        statusRegistro = 'Não Conforme' // descarte implica resíduo/produto impróprio
        loteRef = fr18Form.lote_interno
        observacoes = `Motivo: ${fr18Form.motivo}. Destinação: ${fr18Form.local_descarte}`
      } else if (selectedFormCode === 'FR 19') {
        dadosFormulario = fr19Form
        valorMedido = `Requalificação: ${fr19Form.decisao_comissao} - ${fr19Form.fornecedor_razao_social}`
        statusRegistro = fr19Form.decisao_comissao.includes('Desqualificar')
          ? 'Não Conforme'
          : 'Conforme'
        loteRef = fr19Form.codigo_fr14
      } else if (selectedFormCode === 'A8') {
        dadosFormulario = a8Form
        valorMedido = `Auditoria Fornecedor ${a8Form.fornecedor}: ${a8Form.classificacao} (C: ${a8Form.c_count}, NC: ${a8Form.nc_count})`
        statusRegistro = a8Form.classificacao.includes('Reprovado') ? 'Não Conforme' : 'Conforme'
      } else if (selectedFormCode === 'A10') {
        dadosFormulario = a10Form
        valorMedido = `Declaração de Conformidade do Fornecedor ${a10Form.fornecedor_razao_social}`
        statusRegistro = 'Conforme'
      } else if (selectedFormCode === 'FR 01') {
        dadosFormulario = fr01Form
        valorMedido = `RNC nº ${fr01Form.numero_rnc} (${fr01Form.grau}): ${fr01Form.descricao_detalhada.slice(0, 50)}...`
        statusRegistro = 'Não Conforme'
        loteRef = fr01Form.lote_interno || fr01Form.lote_fornecedor
        observacoes = fr01Form.descricao_detalhada

        // Integrar com o módulo de Não Conformidades existente
        try {
          await createNonConformity({
            codigo: fr01Form.numero_rnc,
            descricao: `[${fr01Form.origem} - POP-01] ${fr01Form.descricao_detalhada}`,
            classificacao:
              fr01Form.grau === 'Crítico'
                ? 'Crítica'
                : fr01Form.grau === 'Maior'
                  ? 'Maior'
                  : 'Menor',
            origem: 'Registro',
            area: 'Recepção / Almoxarifado',
            data_identificacao: `${fr01Form.data_ocorrencia} 08:00:00.000Z`,
            status: 'Aberta',
            responsavel: user?.name || 'Controle de Qualidade',
            plano_acao: fr01Form.capa_acoes?.[0]?.acao || '',
            prazo_acao: `${new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]} 08:00:00.000Z`,
            responsavel_acao: fr01Form.capa_acoes?.[0]?.responsavel || '',
            medidas_preventivas: 'Disposição imediata: ' + fr01Form.disposicao_imediata,
            lote: loteRef,
            procedure: procedure.id,
          })
        } catch {
          /* intentionally ignored */
        }
      }

      // Adicionar assinatura do RT se o usuário tiver foto no perfil
      if (user?.assinatura_imagem) {
        dadosFormulario.rt_assinatura_imagem = user.assinatura_imagem
      }

      const created = await createRecord({
        procedure: procedure.id,
        formulario_codigo: selectedFormCode,
        dados_formulario: dadosFormulario,
        data: `${new Date().toISOString().split('T')[0]} 08:00:00.000Z`,
        turno: 'Manhã',
        valor_medido: valorMedido,
        status: statusRegistro,
        responsavel: user?.name || 'Dr. Hélio Silva (RT)',
        observacoes: observacoes,
        lote: loteRef,
        status_assinatura: 'Pendente Assinatura',
      })

      toast({
        title: `Registro digital ${selectedFormCode} gravado`,
        description: `Armazenado com sucesso na base de autocontrole.`,
      })

      setModalOpen(false)
      if (onRecordCreated) onRecordCreated()
    } catch (err: any) {
      toast({
        title: 'Erro ao gravar formulário',
        description: err.message || 'Verifique os dados preenchidos.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filtrar registros do modelo selecionado
  const filteredRecords = records.filter(
    (r) =>
      r.formulario_codigo === selectedFormCode ||
      (selectedFormCode === 'FR 08' &&
        (!r.formulario_codigo || r.formulario_codigo === 'F-01-POP-001')),
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Grade de seleção dos 11 formulários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {formModelList.map((f) => {
          const Icon = f.icon
          const isSelected = selectedFormCode === f.code
          const count = records.filter(
            (r) =>
              r.formulario_codigo === f.code ||
              (f.code === 'FR 08' &&
                (!r.formulario_codigo || r.formulario_codigo === 'F-01-POP-001')),
          ).length

          return (
            <button
              key={f.code}
              type="button"
              onClick={() => setSelectedFormCode(f.code)}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'border-[#2D6A4F] bg-emerald-50/50 ring-2 ring-[#2D6A4F] shadow-sm'
                  : 'border-[#E2DCCF] bg-white hover:border-[#2D6A4F]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#2D6A4F]">
                    {f.code}
                  </span>
                  <Badge variant="secondary" className="text-[10px] bg-stone-100 text-stone-600">
                    {count} registro(s)
                  </Badge>
                </div>
                <h4 className="text-xs font-bold text-stone-900 leading-snug">{f.title}</h4>
                <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{f.desc}</p>
              </div>

              <div className="pt-2 mt-2 border-t border-stone-100 text-[10px] text-stone-400">
                Retenção: {f.retencao}
              </div>
            </button>
          )
        })}
      </div>

      {/* 2. Área do Formulário Ativo com Ação de Preenchimento e Lista de Registros */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#2D6A4F] text-white">
                {selectedFormCode}
              </span>
              <h3 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                {formModelList.find((f) => f.code === selectedFormCode)?.title}
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {formModelList.find((f) => f.code === selectedFormCode)?.desc}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setModalOpen(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4" />
              Preencher {selectedFormCode}
            </Button>
          </div>
        </div>

        {/* Tabela dos registros deste modelo */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Lote / Código</th>
                <th className="py-2.5 px-3">Resumo da Medição / Parecer</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Responsável</th>
                <th className="py-2.5 px-3 text-right">PDF / Assinatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">
                    Nenhum registro de {selectedFormCode} cadastrado ainda. Clique em
                    &quot;Preencher&quot; para inserir um novo.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-medium text-stone-800 whitespace-nowrap">
                      {new Date(r.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-stone-900 whitespace-nowrap font-mono text-[11px]">
                      {r.lote || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate">
                      {r.valor_medido || 'Conforme padrão'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge
                        className={
                          r.status === 'Conforme'
                            ? 'bg-[#2E8B57] text-white'
                            : 'bg-[#B91C1C] text-white'
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 whitespace-nowrap">
                      {r.responsavel || 'Operador CQ'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (onOpenRecordPdf) onOpenRecordPdf(r)
                        }}
                        className="h-7 text-[11px] border-stone-300 text-stone-700 hover:bg-stone-50 gap-1"
                      >
                        <FileText className="h-3 w-3 text-[#2D6A4F]" />
                        Ver / Assinar RT
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. DIALOG DE PREENCHIMENTO DO FORMULÁRIO SELECIONADO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#D9A404]" />
              Novo Registro: {selectedFormCode} —{' '}
              {formModelList.find((f) => f.code === selectedFormCode)?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Formulário normativo digital do POP 01. Os dados inseridos alimentam em tempo real os
              indicadores do painel.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveFormSubmission} className="space-y-4 pt-2">
            {/* RENDERIZADOR ESPECÍFICO POR MODELO */}
            {selectedFormCode === 'FR 08' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Data de Recebimento</Label>
                    <Input
                      type="date"
                      value={fr08Form.data_recebimento}
                      onChange={(e) =>
                        setFr08Form({ ...fr08Form, data_recebimento: e.target.value })
                      }
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Horário</Label>
                    <Input
                      value={fr08Form.horario}
                      onChange={(e) => setFr08Form({ ...fr08Form, horario: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Razão Social do Fornecedor</Label>
                    <Input
                      value={fr08Form.fornecedor_razao_social}
                      onChange={(e) =>
                        setFr08Form({ ...fr08Form, fornecedor_razao_social: e.target.value })
                      }
                      placeholder="Nome do Fornecedor"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Razão Social do Fabricante</Label>
                    <Input
                      value={fr08Form.fabricante_razao_social}
                      onChange={(e) =>
                        setFr08Form({ ...fr08Form, fabricante_razao_social: e.target.value })
                      }
                      placeholder="Fabricante original"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nota Fiscal nº</Label>
                    <Input
                      value={fr08Form.nota_fiscal}
                      onChange={(e) => setFr08Form({ ...fr08Form, nota_fiscal: e.target.value })}
                      placeholder="Ex: 12345"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Placa do Veículo</Label>
                    <Input
                      value={fr08Form.placa_veiculo}
                      onChange={(e) => setFr08Form({ ...fr08Form, placa_veiculo: e.target.value })}
                      placeholder="ABC-1234"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Veículo</Label>
                    <Select
                      value={fr08Form.tipo_veiculo}
                      onValueChange={(val) => setFr08Form({ ...fr08Form, tipo_veiculo: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baú">Baú</SelectItem>
                        <SelectItem value="Sider">Sider</SelectItem>
                        <SelectItem value="Graneleiro">Graneleiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Produto / Insumo</Label>
                    <Input
                      value={fr08Form.produto_insumo}
                      onChange={(e) => setFr08Form({ ...fr08Form, produto_insumo: e.target.value })}
                      placeholder="Ex: Farelo de Soja"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lote do Fornecedor</Label>
                    <Input
                      value={fr08Form.lote_fornecedor}
                      onChange={(e) =>
                        setFr08Form({ ...fr08Form, lote_fornecedor: e.target.value })
                      }
                      placeholder="Lote externo"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lote Interno Atribuído</Label>
                    <Input
                      value={fr08Form.lote_interno}
                      onChange={(e) => setFr08Form({ ...fr08Form, lote_interno: e.target.value })}
                      className="h-8 text-xs mt-1 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Peso NF (kg)</Label>
                    <Input
                      type="number"
                      value={fr08Form.peso_nf_kg}
                      onChange={(e) => setFr08Form({ ...fr08Form, peso_nf_kg: e.target.value })}
                      placeholder="0"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Peso Balança (kg)</Label>
                    <Input
                      type="number"
                      value={fr08Form.peso_aferido_kg}
                      onChange={(e) =>
                        setFr08Form({ ...fr08Form, peso_aferido_kg: e.target.value })
                      }
                      placeholder="0"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nº Volumes / Sacos</Label>
                    <Input
                      value={fr08Form.numero_volumes}
                      onChange={(e) => setFr08Form({ ...fr08Form, numero_volumes: e.target.value })}
                      placeholder="Volumes"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                {/* Checklist Veículo e Carga (8 itens) */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                  <h4 className="font-bold text-[#2D6A4F] text-[11px] uppercase tracking-wider">
                    Checklist de Inspeção do Veículo e da Carga (C / NC / NA)
                  </h4>
                  <div className="space-y-1.5 text-[11px]">
                    {[
                      { key: 'item_1_higiene', label: '1. Higiene e limpeza do compartimento' },
                      { key: 'item_2_integridade', label: '2. Integridade carroceria e assoalho' },
                      { key: 'item_3_lona', label: '3. Lona de cobertura limpa e sem rasgos' },
                      { key: 'item_4_incompatíveis', label: '4. Ausência de cargas incompatíveis' },
                      { key: 'item_5_embalagens', label: '5. Embalagens íntegras e paletizadas' },
                      {
                        key: 'item_6_rotulagem_decreto',
                        label: '6. Rotulagem Decreto 12.031/2024',
                      },
                      {
                        key: 'item_7_fornecedor_qualificado_fr14',
                        label: '7. Fornecedor ativo na FR 14',
                      },
                      {
                        key: 'item_8_laudo_conforme',
                        label: '8. Laudo analítico do lote conforme',
                      },
                    ].map((it) => (
                      <div key={it.key} className="flex items-center justify-between gap-2">
                        <span className="text-stone-700">{it.label}</span>
                        <div className="flex items-center gap-1">
                          {(['C', 'NC', 'NA'] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() =>
                                setFr08Form({
                                  ...fr08Form,
                                  checklist_veiculo: {
                                    ...fr08Form.checklist_veiculo,
                                    [it.key]: opt,
                                  },
                                })
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                (fr08Form.checklist_veiculo as any)[it.key] === opt
                                  ? opt === 'C'
                                    ? 'bg-emerald-600 text-white'
                                    : opt === 'NC'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-stone-500 text-white'
                                  : 'bg-white border text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parecer Final */}
                <div>
                  <Label className="text-xs font-bold text-stone-800">
                    Parecer Final do Recebimento
                  </Label>
                  <Select
                    value={fr08Form.parecer_final}
                    onValueChange={(val) => setFr08Form({ ...fr08Form, parecer_final: val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liberado para Descarga">Liberado para Descarga</SelectItem>
                      <SelectItem value="Retido em Quarentena">Retido em Quarentena</SelectItem>
                      <SelectItem value="Rejeitado Totalmente">Rejeitado Totalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* FR 14: Adicionar Fornecedor */}
            {selectedFormCode === 'FR 14' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Código (FR 14)</Label>
                    <Input
                      value={fr14Item.codigo}
                      onChange={(e) => setFr14Item({ ...fr14Item, codigo: e.target.value })}
                      placeholder="Ex: MP-001"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Matéria-Prima / Insumo</Label>
                    <Input
                      value={fr14Item.materia_prima_insumo}
                      onChange={(e) =>
                        setFr14Item({ ...fr14Item, materia_prima_insumo: e.target.value })
                      }
                      placeholder="Denominação do insumo"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Razão Social Fabricante/Fornecedor</Label>
                    <Input
                      value={fr14Item.razao_social}
                      onChange={(e) => setFr14Item({ ...fr14Item, razao_social: e.target.value })}
                      placeholder="Razão social"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Registro Estabelecimento MAPA</Label>
                    <Input
                      value={fr14Item.registro_mapa}
                      onChange={(e) => setFr14Item({ ...fr14Item, registro_mapa: e.target.value })}
                      placeholder="Ex: SP-001234-5"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Registro/Cadastro Produto</Label>
                    <Input
                      value={fr14Item.registro_cadastro_produto}
                      onChange={(e) =>
                        setFr14Item({ ...fr14Item, registro_cadastro_produto: e.target.value })
                      }
                      placeholder="Isento / Nº SIPEAGRO"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Risco do Insumo</Label>
                    <Select
                      value={fr14Item.risco_insumo}
                      onValueChange={(val) => setFr14Item({ ...fr14Item, risco_insumo: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alto">Alto</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status Cadastral</Label>
                    <Select
                      value={fr14Item.status_cadastral}
                      onValueChange={(val: any) =>
                        setFr14Item({ ...fr14Item, status_cadastral: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Validade da Qualificação</Label>
                  <Input
                    type="date"
                    value={fr14Item.validade_qualificacao}
                    onChange={(e) =>
                      setFr14Item({ ...fr14Item, validade_qualificacao: e.target.value })
                    }
                    required
                    className="h-8 text-xs mt-1"
                  />
                </div>
              </div>
            )}

            {/* FR 15: Medição Diária */}
            {selectedFormCode === 'FR 15' && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs font-bold text-stone-800">Local Monitorado</Label>
                  <Select value={fr15Local} onValueChange={setFr15Local}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sala de Medicamentos">
                        Sala de Medicamentos (Limites: 15–25 ºC / UR &lt; 85%)
                      </SelectItem>
                      <SelectItem value="Armazém MP">
                        Armazém MP (Limites: &lt; 35 ºC / UR &lt; 85%)
                      </SelectItem>
                      <SelectItem value="Armazém PA">
                        Armazém PA (Limites: &lt; 35 ºC / UR &lt; 85%)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Hora da Leitura</Label>
                    <Input
                      value={fr15Item.hora}
                      onChange={(e) => setFr15Item({ ...fr15Item, hora: e.target.value })}
                      placeholder="Ex: 08:30 ou 15:30"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Visto do Responsável</Label>
                    <Input
                      value={fr15Item.visto_responsavel}
                      onChange={(e) =>
                        setFr15Item({ ...fr15Item, visto_responsavel: e.target.value })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Temp. Atual (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fr15Item.temp_atual}
                      onChange={(e) => setFr15Item({ ...fr15Item, temp_atual: e.target.value })}
                      className="h-8 text-xs mt-1 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Temp. Mín (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fr15Item.temp_min}
                      onChange={(e) => setFr15Item({ ...fr15Item, temp_min: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Temp. Máx (°C)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={fr15Item.temp_max}
                      onChange={(e) => setFr15Item({ ...fr15Item, temp_max: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">UR Atual (%)</Label>
                    <Input
                      type="number"
                      value={fr15Item.ur_atual}
                      onChange={(e) => setFr15Item({ ...fr15Item, ur_atual: e.target.value })}
                      className="h-8 text-xs mt-1 font-semibold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">UR Mín (%)</Label>
                    <Input
                      type="number"
                      value={fr15Item.ur_min}
                      onChange={(e) => setFr15Item({ ...fr15Item, ur_min: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">UR Máx (%)</Label>
                    <Input
                      type="number"
                      value={fr15Item.ur_max}
                      onChange={(e) => setFr15Item({ ...fr15Item, ur_max: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="fr15-conforme"
                    checked={Boolean(fr15Item.conforme)}
                    onChange={(e) => setFr15Item({ ...fr15Item, conforme: e.target.checked })}
                    className="h-4 w-4 text-[#2D6A4F] rounded"
                  />
                  <Label htmlFor="fr15-conforme" className="text-xs cursor-pointer font-bold">
                    Medição dentro dos limites regulamentares (Conforme)
                  </Label>
                </div>
              </div>
            )}

            {/* FR 18: Solicitação de Descarte */}
            {selectedFormCode === 'FR 18' && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs font-bold text-stone-800">Motivo do Descarte</Label>
                  <Select
                    value={fr18Form.motivo}
                    onValueChange={(val) => setFr18Form({ ...fr18Form, motivo: val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Validade Vencida">Validade Vencida</SelectItem>
                      <SelectItem value="Produto Impróprio (Arts. 95-99)">
                        Produto Impróprio (Arts. 95-99 Decreto 12.031/2024)
                      </SelectItem>
                      <SelectItem value="Contaminação Física/Química">
                        Contaminação Física/Química
                      </SelectItem>
                      <SelectItem value="Avaria Crítica">Avaria Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Descrição do Produto / Insumo</Label>
                    <Input
                      value={fr18Form.descricao}
                      onChange={(e) => setFr18Form({ ...fr18Form, descricao: e.target.value })}
                      placeholder="Ex: Premix Mineral Confinamento"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Quantidade Descartada (kg)</Label>
                    <Input
                      type="number"
                      value={fr18Form.qtd_kg}
                      onChange={(e) => setFr18Form({ ...fr18Form, qtd_kg: e.target.value })}
                      placeholder="Ex: 500"
                      required
                      className="h-8 text-xs mt-1 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Lote Interno</Label>
                    <Input
                      value={fr18Form.lote_interno}
                      onChange={(e) => setFr18Form({ ...fr18Form, lote_interno: e.target.value })}
                      placeholder="L-0000"
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lote Fornecedor</Label>
                    <Input
                      value={fr18Form.lote_fornecedor}
                      onChange={(e) =>
                        setFr18Form({ ...fr18Form, lote_fornecedor: e.target.value })
                      }
                      placeholder="Lote externo"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Local de Descarte / Destinação Ambiental</Label>
                  <Input
                    value={fr18Form.local_descarte}
                    onChange={(e) => setFr18Form({ ...fr18Form, local_descarte: e.target.value })}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-tight">
                  <strong>Parecer Técnico-Ambiental Padronizado:</strong> &quot;Os produtos
                  discriminados foram descaracterizados e descartados em conformidade com as normas
                  sanitárias e ambientais vigentes, não havendo qualquer possibilidade de
                  reaproveitamento na alimentação animal.&quot;
                </div>
              </div>
            )}

            {/* FR 01: Registro de Não Conformidade (RNC) */}
            {selectedFormCode === 'FR 01' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nº da RNC</Label>
                    <Input
                      value={fr01Form.numero_rnc}
                      onChange={(e) => setFr01Form({ ...fr01Form, numero_rnc: e.target.value })}
                      required
                      className="h-8 text-xs mt-1 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Origem</Label>
                    <Select
                      value={fr01Form.origem}
                      onValueChange={(val) => setFr01Form({ ...fr01Form, origem: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recebimento">Recebimento</SelectItem>
                        <SelectItem value="Análise Laboratorial">Análise Laboratorial</SelectItem>
                        <SelectItem value="Auditoria">Auditoria</SelectItem>
                        <SelectItem value="Processo">Processo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Grau da NC</Label>
                    <Select
                      value={fr01Form.grau}
                      onValueChange={(val: any) => setFr01Form({ ...fr01Form, grau: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Crítico">Crítico</SelectItem>
                        <SelectItem value="Maior">Maior</SelectItem>
                        <SelectItem value="Menor">Menor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fornecedor</Label>
                    <Input
                      value={fr01Form.fornecedor_razao_social}
                      onChange={(e) =>
                        setFr01Form({ ...fr01Form, fornecedor_razao_social: e.target.value })
                      }
                      placeholder="Fornecedor do lote"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Produto / Insumo</Label>
                    <Input
                      value={fr01Form.produto_materia_prima}
                      onChange={(e) =>
                        setFr01Form({ ...fr01Form, produto_materia_prima: e.target.value })
                      }
                      placeholder="Produto com desvio"
                      required
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Qtd Afetada (kg)</Label>
                    <Input
                      type="number"
                      value={fr01Form.quantidade_afetada_kg}
                      onChange={(e) =>
                        setFr01Form({ ...fr01Form, quantidade_afetada_kg: e.target.value })
                      }
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lote Interno</Label>
                    <Input
                      value={fr01Form.lote_interno}
                      onChange={(e) => setFr01Form({ ...fr01Form, lote_interno: e.target.value })}
                      className="h-8 text-xs mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nota Fiscal</Label>
                    <Input
                      value={fr01Form.nota_fiscal}
                      onChange={(e) => setFr01Form({ ...fr01Form, nota_fiscal: e.target.value })}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Descrição Detalhada do Desvio</Label>
                  <Textarea
                    rows={2}
                    value={fr01Form.descricao_detalhada}
                    onChange={(e) =>
                      setFr01Form({ ...fr01Form, descricao_detalhada: e.target.value })
                    }
                    placeholder="Descreva o que ocorreu, parâmetros em desacordo..."
                    required
                    className="text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-stone-800">
                    Disposição Imediata do Lote
                  </Label>
                  <Select
                    value={fr01Form.disposicao_imediata}
                    onValueChange={(val) => setFr01Form({ ...fr01Form, disposicao_imediata: val })}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bloqueio no Depósito de Não Aprovadas">
                        Bloqueio no Depósito de Não Aprovadas
                      </SelectItem>
                      <SelectItem value="Devolução ao Fornecedor">
                        Devolução ao Fornecedor
                      </SelectItem>
                      <SelectItem value="Solicitação de Descarte (FR 18)">
                        Solicitação de Descarte (FR 18)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Outros modelos simplificados (FR 16, FR 19, A8, A10, IT 14, A9) */}
            {['FR 16', 'FR 19', 'A8', 'A10', 'IT 14', 'A9'].includes(selectedFormCode) && (
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Razão Social / Identificação Principal</Label>
                  <Input
                    placeholder="Nome do fornecedor ou categoria"
                    required
                    className="h-8 text-xs mt-1"
                    onChange={(e) => {
                      if (selectedFormCode === 'FR 16')
                        setFr16Form({ ...fr16Form, razao_social: e.target.value })
                      if (selectedFormCode === 'FR 19')
                        setFr19Form({ ...fr19Form, fornecedor_razao_social: e.target.value })
                      if (selectedFormCode === 'A8')
                        setA8Form({ ...a8Form, fornecedor: e.target.value })
                      if (selectedFormCode === 'A10')
                        setA10Form({ ...a10Form, fornecedor_razao_social: e.target.value })
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs">Observações / Parecer Técnico</Label>
                  <Textarea
                    rows={3}
                    placeholder={`Insira os apontamentos referentes a ${selectedFormCode}...`}
                    className="text-xs mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-stone-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submitting}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {submitting ? 'Salvando...' : 'Salvar Registro Digital'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
