import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileCheck2,
  ChevronRight,
  Edit3,
  PlusCircle,
  Printer,
  Archive,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  UploadCloud,
  FileText,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  getProcedureById,
  updateProcedure,
  getRecords,
  createRecord,
  getCompany,
} from '@/services/agroService'
import type { Procedure, MonitoringRecord, RecordShift, RecordStatus, Company } from '@/types/agro'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  canManagePopForms,
  canEditPopStructure,
  canSignAsRT,
  canSignAsRE,
  canSignAsRQ,
  canDeleteRecord,
} from '@/lib/permissions'
import { useRealtime } from '@/hooks/use-realtime'
import { PopDocumentPdfModal } from '@/components/PopDocumentPdfModal'
import { RecordDocumentPdfModal } from '@/components/RecordDocumentPdfModal'
import { Pop01NormativeViewer } from '@/components/Pop01NormativeViewer'
import { Pop01FormsManager } from '@/components/Pop01FormsManager'
import { Pop01KpiDashboard } from '@/components/Pop01KpiDashboard'
import { PaasoContainer } from '@/components/paaso/PaasoContainer'
import { RtSignatureUpload } from '@/components/RtSignatureUpload'
import { PopPendingPanel } from '@/components/PopPendingPanel'
import { PopNormativeEditor } from '@/components/PopNormativeEditor'
import { PopFormBuilderModal } from '@/components/PopFormBuilderModal'
import { PopCustomRecordFillModal } from '@/components/PopCustomRecordFillModal'
import { getPopCustomForms, deletePopCustomForm } from '@/services/agroService'
import type { PopCustomForm } from '@/types/agro'
import { PopDemandRecordModal } from '@/components/PopDemandRecordModal'
import { evaluatePopChain } from '@/lib/recordFlow'
import type { POP01PainelResumo } from '@/types/pop01Forms'
import {
  POP_ITEM07_CATALOG,
  type POPFormDefinition,
  type POPExecutionCustomFields,
} from '@/types/popFormsCatalog'
import { FileCheck, ShieldAlert, KeyRound, Award, Sliders, Layers, Trash2 } from 'lucide-react'

export default function ProcedureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [records, setRecords] = useState<MonitoringRecord[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Modals for PDF and signatures
  const [openPopPdfModal, setOpenPopPdfModal] = useState(false)
  const [selectedRecordForPdf, setSelectedRecordForPdf] = useState<MonitoringRecord | null>(null)
  const [openRecordPdfModal, setOpenRecordPdfModal] = useState(false)
  const [openDemandRecordModal, setOpenDemandRecordModal] = useState(false)

  // Custom Forms (Parte c)
  const [customForms, setCustomForms] = useState<PopCustomForm[]>([])
  const [openBuilderModal, setOpenBuilderModal] = useState(false)
  const [formToEdit, setFormToEdit] = useState<PopCustomForm | null>(null)
  const [openFillCustomRecordModal, setOpenFillCustomRecordModal] = useState(false)
  const [selectedCustomFormToFill, setSelectedCustomFormToFill] = useState<PopCustomForm | null>(
    null,
  )

  // Edit mode on Overview
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Procedure>>({})
  const [saveLoading, setSaveLoading] = useState(false)

  // Campos editáveis de Execução (Como deve ser executado)
  const [camposExec, setCamposExec] = useState<POPExecutionCustomFields>({})
  const [savingExec, setSavingExec] = useState(false)

  // Modal: Novo Registro com suporte ao formulário do Item 07
  const [openNewRecordModal, setOpenNewRecordModal] = useState(false)
  const [selectedFormDef, setSelectedFormDef] = useState<POPFormDefinition | null>(null)
  const [dynamicFormValues, setDynamicFormValues] = useState<Record<string, any>>({})
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordForm, setRecordForm] = useState({
    data: new Date().toISOString().split('T')[0],
    turno: 'Manhã' as RecordShift,
    valor_medido: '',
    status: 'Conforme' as RecordStatus,
    responsavel: user?.name || 'Hélio - Resp. Técnico',
    observacoes: '',
    lote: '',
  })

  const loadAll = async () => {
    if (!id) return
    try {
      const [p, comp] = await Promise.all([getProcedureById(id), getCompany().catch(() => null)])
      setProcedure(p)
      setEditForm(p)
      setCompany(comp)

      // Fallback catalog item 07
      const cat = POP_ITEM07_CATALOG[p.codigo]
      if (cat) {
        setCamposExec({
          ...cat.default_execucao,
          ...(p.campos_execucao || {}),
        })
      } else {
        setCamposExec(p.campos_execucao || {})
      }

      const recs = await getRecords(`procedure = '${id}'`, '-data')
      setRecords(recs)

      const cForms = (await getPopCustomForms(id).catch(() => [])) as PopCustomForm[]
      setCustomForms(cForms)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar procedimento',
        description: err.message || 'Procedimento não localizado.',
        variant: 'destructive',
      })
      navigate('/procedimentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  useRealtime('records', () => {
    if (id) {
      getRecords(`procedure = '${id}'`, '-data')
        .then(setRecords)
        .catch(() => {})
    }
  })

  const isPop01 = procedure?.codigo === 'POP-01' || procedure?.codigo === 'POP-001'

  // Cálculo Dinâmico de Indicadores para o Painel do POP 01 (Seção 14 e PAINEL_Indicadores)
  const calculatePop01Summary = (): POP01PainelResumo => {
    const fr08Records = records.filter(
      (r) =>
        r.formulario_codigo === 'FR 08' ||
        r.formulario_codigo === 'ANEXO III' ||
        r.formulario_codigo === 'F-01-POP-001' ||
        (!r.formulario_codigo && r.procedure === procedure?.id),
    )
    const fr14Records = records.filter(
      (r) =>
        r.formulario_codigo === 'FR 14' ||
        r.formulario_codigo === 'ANEXO II' ||
        r.formulario_codigo === 'FR 16' ||
        r.formulario_codigo === 'ANEXO I',
    )
    const fr15Records = records.filter((r) => r.formulario_codigo === 'FR 15')
    const fr18Records = records.filter(
      (r) => r.formulario_codigo === 'FR 18' || r.formulario_codigo === 'ANEXO VI',
    )
    const fr01Records = records.filter(
      (r) => r.formulario_codigo === 'FR 01' || r.formulario_codigo === 'ANEXO VII',
    )

    const totalRecebimentos = fr08Records.length
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recebimentos30Dias = fr08Records.filter((r) => new Date(r.data) >= thirtyDaysAgo).length

    // Recebimento não conforme / reprovado
    const ncRecebimento = fr08Records.filter(
      (r) =>
        r.status === 'Não Conforme' ||
        (r.dados_formulario?.parecer_final &&
          r.dados_formulario.parecer_final !== 'Liberado para Descarga'),
    ).length

    // RNCs
    const totalRncs = fr01Records.length
    const rncsCriticas = fr01Records.filter((r) => r.dados_formulario?.grau === 'Crítico').length

    // Descartes
    const totalDescartes = fr18Records.length
    const descartesKg = fr18Records.reduce((acc, r) => {
      const q = Number(r.dados_formulario?.qtd_kg || 0)
      return acc + (isNaN(q) ? 0 : q)
    }, 0)

    // Fornecedores FR 14
    const totalFornecedores = fr14Records.length
    const fornecedoresAtivos = fr14Records.filter(
      (r) =>
        !r.dados_formulario?.status_cadastral || r.dados_formulario?.status_cadastral === 'Ativo',
    ).length
    const today = new Date().toISOString().split('T')[0]
    const fornecedoresVencidos = fr14Records.filter(
      (r) =>
        r.dados_formulario?.validade_qualificacao &&
        r.dados_formulario.validade_qualificacao < today,
    ).length
    const fornecedoresSuspensos = fr14Records.filter(
      (r) => r.dados_formulario?.status_cadastral === 'Suspenso',
    ).length

    // Temperatura e Umidade FR 15
    const totalTemp = fr15Records.length
    const tempConformes = fr15Records.filter((r) => r.status === 'Conforme').length

    // Desqualificação por fraude / falha crítica (IDF)
    const idfCount = fr14Records.filter(
      (r) => r.dados_formulario?.status_cadastral === 'Suspenso',
    ).length

    // Descarte por Validade Vencida
    const descarteValidadeKg = fr18Records
      .filter((r) => r.dados_formulario?.motivo === 'Validade Vencida')
      .reduce((sum, r) => {
        const itens = r.dados_formulario?.itens || []
        const somaItens = itens.reduce((s: number, it: any) => {
          const val = parseFloat(String(it.quantidade_kg || '0').replace(/[^0-9.]/g, '')) || 0
          return s + val
        }, 0)
        return sum + somaItens
      }, 0)

    // Métricas calculadas
    const pesoRecebidoKg = fr08Records.reduce((sum, r) => {
      const peso =
        parseFloat(
          String(
            r.dados_formulario?.peso_balanca_kg || r.dados_formulario?.peso_nf_kg || '0',
          ).replace(/[^0-9.]/g, ''),
        ) || 0
      return sum + peso
    }, 0)
    const idmp =
      pesoRecebidoKg > 0
        ? (descartesKg / pesoRecebidoKg) * 100
        : totalRecebimentos > 0
          ? (descartesKg / (totalRecebimentos * 1000)) * 100
          : 0
    const incr = totalRecebimentos > 0 ? (ncRecebimento / totalRecebimentos) * 100 : 0
    const cdf = totalFornecedores > 0 ? (fornecedoresAtivos / totalFornecedores) * 100 : 100
    const ilfe =
      totalRecebimentos > 0
        ? (fr08Records.filter((r) => {
            const sens = r.dados_formulario?.sensorial
            return (
              sens?.cor === 'Alterada' ||
              sens?.odor === 'Alterado' ||
              sens?.aspecto === 'Alterado' ||
              sens?.umidade_visivel === 'Sim' ||
              sens?.pragas_sujidades === 'Sim' ||
              r.status === 'Não Conforme'
            )
          }).length /
            totalRecebimentos) *
          100
        : 0
    const conformidadeTermica = totalTemp > 0 ? (tempConformes / totalTemp) * 100 : 100
    const conformidadeRecebimento =
      totalRecebimentos > 0 ? ((totalRecebimentos - ncRecebimento) / totalRecebimentos) * 100 : 100

    return {
      kpis: [
        {
          id: 'kpi-1',
          codigo: 'IDMP',
          nome: 'Índice de Devolução de Matérias-Primas',
          formula: '(Qtd descartada em FR18 / Qtd recebida em FR08) × 100%',
          periodicidade: 'Mensal',
          meta: '≤ 0,5%',
          valor_calculado: idmp,
          valor_formatado: `${idmp.toFixed(2)}%`,
          status_meta: idmp <= 0.5 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-2',
          codigo: 'INCR',
          nome: 'Índice de Não Conformidades no Recebimento',
          formula: '(Lotes FR08 c/ parecer ≠ Liberado / Total) × 100%',
          periodicidade: 'Mensal',
          meta: '≤ 1,5%',
          valor_calculado: incr,
          valor_formatado: `${incr.toFixed(2)}%`,
          status_meta: incr <= 1.5 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-3',
          codigo: 'RNC',
          nome: 'Não Conformidades Registradas (FR 01)',
          formula: 'Contagem total de registros FR 01 emitidos',
          periodicidade: 'Mensal',
          meta: '< 2 / mês',
          valor_calculado: totalRncs,
          valor_formatado: `${totalRncs} RNCs`,
          status_meta: totalRncs < 2 ? 'dentro' : 'alerta',
        },
        {
          id: 'kpi-4',
          codigo: 'RNC-CRIT',
          nome: 'RNCs de Grau Crítico',
          formula: 'Nº de RNCs com Grau = Crítico no FR 01',
          periodicidade: 'Contínuo',
          meta: '0 (Zero)',
          valor_calculado: rncsCriticas,
          valor_formatado: `${rncsCriticas}`,
          status_meta: rncsCriticas === 0 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-5',
          codigo: 'CDF',
          nome: 'Conformidade Documental de Fornecedores',
          formula: '(Fornecedores Ativos / Total Cadastrados FR 14) × 100%',
          periodicidade: 'Trimestral',
          meta: '100%',
          valor_calculado: cdf,
          valor_formatado: `${cdf.toFixed(1)}%`,
          status_meta: cdf >= 100 ? 'dentro' : 'alerta',
        },
        {
          id: 'kpi-6',
          codigo: 'DOC-VENC',
          nome: 'Fornecedores c/ Documentação Vencida',
          formula: 'Nº de linhas FR 14 com Validade < Hoje',
          periodicidade: 'Contínuo',
          meta: '0 (Zero)',
          valor_calculado: fornecedoresVencidos,
          valor_formatado: `${fornecedoresVencidos}`,
          status_meta: fornecedoresVencidos === 0 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-7',
          codigo: 'ILFE',
          nome: 'Índice de Lotes Fora de Especificação',
          formula: '(Lotes reprovados sensorial/análise / Total FR 08) × 100%',
          periodicidade: 'Mensal',
          meta: '≤ 0,8%',
          valor_calculado: ilfe,
          valor_formatado: `${ilfe.toFixed(2)}%`,
          status_meta: ilfe <= 0.8 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-8',
          codigo: 'IDF',
          nome: 'Índice de Desqualificação de Fornecedores',
          formula: 'Contagem de fornecedores desqualificados por fraude ou falha crítica',
          periodicidade: 'Anual',
          meta: '0 por fraude',
          valor_calculado: idfCount,
          valor_formatado: `${idfCount}`,
          status_meta: idfCount === 0 ? 'dentro' : 'fora',
        },
        {
          id: 'kpi-9',
          codigo: 'CONF-TERM',
          nome: 'Registros de Temperatura / UR Conformes',
          formula: '(Linhas Conformes FR 15 / Total Medições) × 100%',
          periodicidade: 'Diário / Mensal',
          meta: '100%',
          valor_calculado: conformidadeTermica,
          valor_formatado: `${conformidadeTermica.toFixed(1)}%`,
          status_meta: conformidadeTermica >= 100 ? 'dentro' : 'alerta',
        },
        {
          id: 'kpi-10',
          codigo: 'DESC-VAL',
          nome: 'Descarte por Validade Vencida',
          formula: 'Soma de descartes (kg) com motivo = Validade Vencida no FR 18',
          periodicidade: 'Mensal',
          meta: '0 kg',
          valor_calculado: descarteValidadeKg,
          valor_formatado: `${descarteValidadeKg.toLocaleString('pt-BR')} kg`,
          status_meta: descarteValidadeKg === 0 ? 'dentro' : 'fora',
        },
      ],
      visao_geral: {
        total_recebimentos_fr08: totalRecebimentos,
        recebimentos_30_dias: recebimentos30Dias,
        total_rncs_fr01: totalRncs,
        rncs_criticas: rncsCriticas,
        total_descartes_fr18: totalDescartes,
        descartes_kg: descartesKg,
        fornecedores_cadastrados_fr14: totalFornecedores,
        fornecedores_ativos: fornecedoresAtivos,
        fornecedores_vencidos: fornecedoresVencidos,
        fornecedores_suspensos: fornecedoresSuspensos,
        monitoramentos_temp_fr15: totalTemp,
        conformidade_termica_percent: conformidadeTermica,
        conformidade_recebimento_percent: conformidadeRecebimento,
      },
      atualizado_em: new Date().toISOString(),
    }
  }

  const handleSaveOverview = async () => {
    if (!id) return
    setSaveLoading(true)
    try {
      const updated = await updateProcedure(id, editForm)
      setProcedure(updated)
      setIsEditing(false)
      toast({
        title: 'Procedimento atualizado',
        description: 'Alterações salvas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Verifique os dados informados.',
        variant: 'destructive',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSaveExecucao = async () => {
    if (!id) return
    setSavingExec(true)
    try {
      const updated = await updateProcedure(id, {
        campos_execucao: camposExec,
      })
      setProcedure(updated)
      toast({
        title: 'Instruções de Execução Salvas',
        description: 'Os parâmetros foram atualizados e serão exibidos no PDF do POP.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar execução',
        description: err.message || 'Verifique os dados.',
        variant: 'destructive',
      })
    } finally {
      setSavingExec(false)
    }
  }

  const handleArchive = async () => {
    if (!id || !procedure) return
    try {
      const newStatus = procedure.status === 'Arquivado' ? 'Ativo' : 'Arquivado'
      const updated = await updateProcedure(id, { status: newStatus })
      setProcedure(updated)
      toast({
        title: `Procedimento ${newStatus === 'Arquivado' ? 'arquivado' : 'reativado'}`,
        description: `${procedure.codigo} agora está ${newStatus}.`,
      })
    } catch (err: any) {
      toast({ title: 'Erro ao arquivar', description: err.message, variant: 'destructive' })
    }
  }

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setRecordLoading(true)

    try {
      const created = await createRecord({
        procedure: id,
        formulario_codigo: selectedFormDef?.codigo || `F-01-${procedure?.codigo || 'POP'}`,
        dados_formulario: dynamicFormValues,
        data: `${recordForm.data} 08:00:00.000Z`,
        turno: recordForm.turno,
        valor_medido: recordForm.valor_medido,
        status: recordForm.status,
        responsavel: recordForm.responsavel,
        observacoes: recordForm.observacoes,
        lote: recordForm.lote,
        status_assinatura: 'Pendente Assinatura',
      })

      toast({
        title: 'Registro de monitoramento salvo',
        description: `Status: ${created.status}`,
      })

      setOpenNewRecordModal(false)

      // If status is "Não Conforme", redirect to NC creation flow with prefilled reference
      if (recordForm.status === 'Não Conforme') {
        toast({
          title: 'Atenção: Registro Não Conforme',
          description: 'Redirecionando para abertura da Não Conformidade vinculada.',
        })
        navigate(
          `/nao-conformidades?nova=true&origem=Registro&area=${encodeURIComponent(
            procedure?.area_etapa || 'Produção',
          )}&desc=${encodeURIComponent(
            `Desvio detectado no monitoramento do ${procedure?.codigo}: ${recordForm.valor_medido}. Obs: ${recordForm.observacoes}`,
          )}&lote=${encodeURIComponent(recordForm.lote)}&procId=${id}&recId=${created.id}`,
        )
      } else {
        loadAll()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar registro',
        description: err.message || 'Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setRecordLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading || !procedure) {
    return (
      <div className="py-12 text-center text-stone-500 text-xs">
        Carregando detalhes do procedimento...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-2">
        <nav className="flex items-center text-xs text-stone-500 gap-1.5 no-print">
          <Link to="/procedimentos" className="hover:text-[#2D6A4F] transition">
            Procedimentos
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{procedure.codigo}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#2D6A4F] px-2.5 py-0.5 rounded-full">
                {procedure.codigo}
              </span>
              <Badge variant="outline" className="border-emerald-300 text-[#2D6A4F] bg-emerald-50">
                {procedure.categoria}
              </Badge>
              <Badge
                className={
                  procedure.status === 'Ativo'
                    ? 'bg-[#2E8B57] text-white'
                    : procedure.status === 'Revisão'
                      ? 'bg-[#D9A404] text-[#1B4332]'
                      : 'bg-stone-300 text-stone-700'
                }
              >
                {procedure.status}
              </Badge>
              <span className="text-xs text-stone-500 ml-1">
                Frequência: <strong className="text-stone-700">{procedure.frequencia}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
              {procedure.nome}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            {isEditing ? (
              <Button
                size="sm"
                onClick={handleSaveOverview}
                disabled={saveLoading}
                className="bg-[#2E8B57] hover:bg-[#236e44] text-white text-xs gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saveLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setOpenNewRecordModal(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Registro
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenPopPdfModal(true)}
              className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5 font-semibold"
            >
              <FileCheck className="h-4 w-4 text-[#D9A404]" />
              PDF Oficial & Assinaturas
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 text-xs"
              title="Alternar arquivamento"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Tabs */}
      <Tabs defaultValue={isPop01 ? 'pop_cadeia_pendencias' : 'visao_geral'} className="w-full">
        <TabsList className="bg-[#FAF7EF] p-1 border border-[#E2DCCF] rounded-xl no-print flex-wrap">
          {/* Nova Aba de Cadeia de Registros & Painel de Pendências */}
          <TabsTrigger
            value="pop_cadeia_pendencias"
            className="text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <span className="font-bold">Cadeia & Pendências</span>
            {(() => {
              const chainEval = evaluatePopChain(
                procedure.id,
                procedure.codigo,
                records,
                customForms,
              )
              return chainEval.totalPendencias > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
                  {chainEval.totalPendencias}
                </span>
              ) : chainEval.isComprovado ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-bold">
                  ✓
                </span>
              ) : null
            })()}
          </TabsTrigger>

          {/* Aba Editor de Texto Normativo com Histórico de Revisões (Parte b) */}
          <TabsTrigger
            value="editor_normativo"
            className="text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white rounded-lg gap-1"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#D9A404]" />
            Editor Normativo & Revisões
          </TabsTrigger>

          {/* Aba Construtor de Formulários do POP (Parte c) */}
          <TabsTrigger
            value="formularios_custom"
            className="text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white rounded-lg gap-1"
          >
            <Layers className="h-3.5 w-3.5 text-[#D9A404]" />
            Formulários do POP ({customForms.length})
          </TabsTrigger>

          {isPop01 && (
            <TabsTrigger
              value="pop01_normativo"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              Documento Normativo (15 Seções)
            </TabsTrigger>
          )}
          {isPop01 && (
            <TabsTrigger
              value="pop01_formularios"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              Modelos de Registro Digital (Anexos A1–A11)
            </TabsTrigger>
          )}
          {isPop01 && (
            <TabsTrigger
              value="pop01_painel"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              Painel de Indicadores (Seção 14)
            </TabsTrigger>
          )}
          {isPop01 && (
            <TabsTrigger
              value="pop01_paaso"
              className="text-xs font-semibold data-[state=active]:bg-[#1B4332] data-[state=active]:text-white rounded-lg bg-amber-500/10 border border-[#D9A404]/40"
            >
              PAASO • Qualificação & SIPEAGRO
            </TabsTrigger>
          )}
          <TabsTrigger
            value="visao_geral"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Visão Geral & Requisitos
          </TabsTrigger>
          <TabsTrigger
            value="definicao_execucao"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Definição: Como Executar (Campos Editáveis)
          </TabsTrigger>
          {!isPop01 && (
            <TabsTrigger
              value="formularios_item07"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              Formulários do Item 07 (IN 04/2007)
            </TabsTrigger>
          )}
          <TabsTrigger
            value="registros"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Registros & Comprovação RQ/RE ({records.length})
          </TabsTrigger>
          <TabsTrigger
            value="anexos"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Anexos e Evidências
          </TabsTrigger>
        </TabsList>

        {/* ABA: PAINEL DE PENDÊNCIAS & CADEIA COMPLETA DE REGISTROS */}
        <TabsContent value="pop_cadeia_pendencias" className="space-y-6 mt-4">
          <PopPendingPanel
            procedure={procedure}
            records={records}
            customForms={customForms}
            onOpenRecord={(rec) => {
              if ('id' in rec && rec.id) {
                const fullRec = records.find((r) => r.id === rec.id)
                if (fullRec) {
                  setSelectedRecordForPdf(fullRec)
                  setOpenRecordPdfModal(true)
                  return
                }
              }

              // Checar se é um formulário customizado criado pelo cliente
              const matchedCustom = customForms.find((cf) => cf.codigo === rec.formulario_codigo)
              if (matchedCustom) {
                setSelectedCustomFormToFill(matchedCustom)
                setOpenFillCustomRecordModal(true)
                return
              }

              // Se for formulário do catálogo
              const cat = POP_ITEM07_CATALOG[procedure.codigo]
              if (cat && cat.formularios.length > 0) {
                const found = cat.formularios.find((f) => f.codigo === rec.formulario_codigo)
                if (found) setSelectedFormDef(found)
              }
              setOpenNewRecordModal(true)
            }}
            onOpenDemandModal={() => setOpenDemandRecordModal(true)}
            onOpenRecordPdf={(rec) => {
              setSelectedRecordForPdf(rec)
              setOpenRecordPdfModal(true)
            }}
          />
        </TabsContent>

        {/* ABA: EDITOR NORMATIVO COM HISTÓRICO DE REVISÕES E SENHA DO ADMIN (PARTE B) */}
        <TabsContent value="editor_normativo" className="space-y-6 mt-4">
          <PopNormativeEditor
            procedure={procedure}
            company={company}
            onRevisionSaved={() => {
              loadAll()
            }}
          />
        </TabsContent>

        {/* ABA: CONSTRUTOR DE FORMULÁRIOS DIGITAIS DO CLIENTE POR POP (PARTE C) */}
        <TabsContent value="formularios_custom" className="space-y-6 mt-4">
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                    {procedure.codigo}
                  </span>
                  <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
                    Formulários Digitais Customizados do POP
                  </h3>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Gerencie fichas operacionais próprias definidas para este POP. Cada formulário
                  integra a <strong>Cadeia de Registros</strong>, possui avaliação conforme/não
                  conforme e gera pendências operacionais.
                </p>
              </div>

              {canManagePopForms(user?.role) && (
                <Button
                  size="sm"
                  onClick={() => {
                    setFormToEdit(null)
                    setOpenBuilderModal(true)
                  }}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
                >
                  <PlusCircle className="h-4 w-4 text-[#D9A404]" />
                  Criar Novo Formulário
                </Button>
              )}
            </div>

            {/* Listagem dos formulários existentes (Padrões do Sistema + Customizados) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Formulários do modelo interno do POP */}
              {(POP_ITEM07_CATALOG[procedure.codigo]?.formularios || []).map((formDef) => (
                <div
                  key={formDef.codigo}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] bg-white text-stone-700"
                        >
                          {formDef.codigo}
                        </Badge>
                        <Badge className="bg-stone-200 text-stone-700 hover:bg-stone-200 text-[10px]">
                          Modelo do Sistema
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mt-1.5">{formDef.titulo}</h4>
                      <p className="text-[10px] text-stone-500">
                        Freq: {formDef.frequencia} • Norma: {formDef.item_in04}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFormDef(formDef)
                        setDynamicFormValues({})
                        setOpenNewRecordModal(true)
                      }}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-[11px] h-8 shrink-0 gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Preencher
                    </Button>
                  </div>
                </div>
              ))}

              {/* Formulários Customizados Criados pelo Cliente */}
              {customForms.map((cf) => (
                <div
                  key={cf.id}
                  className="p-4 rounded-xl border border-[#E2DCCF] bg-white hover:border-[#2D6A4F] transition space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className="bg-[#1B4332] text-white font-mono text-[10px]">
                          {cf.codigo}
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                          Criado pelo Cliente
                        </Badge>
                        {cf.obrigatorio_na_cadeia && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-emerald-300 text-emerald-800"
                          >
                            Cadeia Obrigatória
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mt-1.5">{cf.titulo}</h4>
                      <p className="text-[10px] text-stone-500">
                        {cf.descricao || 'Frequência: ' + (cf.frequencia || 'Diário')} •{' '}
                        {cf.campos?.length || 0} campos
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCustomFormToFill(cf)
                          setOpenFillCustomRecordModal(true)
                        }}
                        className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-[11px] h-8 gap-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Preencher
                      </Button>

                      {canEditPopStructure(user?.role) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setFormToEdit(cf)
                            setOpenBuilderModal(true)
                          }}
                          className="h-8 w-8 p-0 text-stone-600 hover:text-stone-900"
                          title="Editar estrutura"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {canEditPopStructure(user?.role) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (confirm(`Deseja excluir o formulário ${cf.codigo}?`)) {
                              try {
                                await deletePopCustomForm(cf.id)
                                toast({ title: 'Formulário excluído' })
                                loadAll()
                              } catch (err: any) {
                                toast({
                                  title: 'Erro ao excluir',
                                  description: err.message,
                                  variant: 'destructive',
                                })
                              }
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          title="Excluir formulário"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Prévia de campos */}
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-1">
                    {(cf.campos || []).slice(0, 5).map((f) => (
                      <span
                        key={f.id}
                        className="text-[9px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-mono"
                      >
                        {f.rotulo}{' '}
                        {f.limite_min !== undefined ? `[${f.limite_min}..${f.limite_max}]` : ''}
                      </span>
                    ))}
                    {(cf.campos || []).length > 5 && (
                      <span className="text-[9px] text-stone-400 self-center">
                        +{(cf.campos?.length || 0) - 5} campos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ABA EXCLUSIVA POP 01: DOCUMENTO NORMATIVO COMPLETO (15 SEÇÕES) */}
        {isPop01 && (
          <TabsContent value="pop01_normativo" className="space-y-6 mt-4">
            <RtSignatureUpload
              currentSignatureUrl={user?.assinatura_imagem}
              rtName={company?.rt_nome}
              rtCrmv={company?.rt_registro_conselho}
              userId={user?.id}
            />
            <Pop01NormativeViewer procedure={procedure} company={company} />
          </TabsContent>
        )}

        {/* ABA EXCLUSIVA POP 01: MODELOS DE REGISTRO DIGITAL (11 ANEXOS) */}
        {isPop01 && (
          <TabsContent value="pop01_formularios" className="space-y-6 mt-4">
            <RtSignatureUpload
              currentSignatureUrl={user?.assinatura_imagem}
              rtName={company?.rt_nome}
              rtCrmv={company?.rt_registro_conselho}
              userId={user?.id}
            />
            <Pop01FormsManager
              procedure={procedure}
              company={company}
              user={user}
              records={records}
              onRecordCreated={loadAll}
              onOpenRecordPdf={(r) => {
                setSelectedRecordForPdf(r)
                setOpenRecordPdfModal(true)
              }}
            />
          </TabsContent>
        )}

        {/* ABA EXCLUSIVA POP 01: PAINEL DE INDICADORES (SEÇÃO 14 / PAINEL_INDICADORES) */}
        {isPop01 && (
          <TabsContent value="pop01_painel" className="space-y-6 mt-4">
            <Pop01KpiDashboard summary={calculatePop01Summary()} />
          </TabsContent>
        )}

        {/* ABA EXCLUSIVA POP 01: PAASO NÚCLEO COMPLETO ITERAÇÃO 1 */}
        {isPop01 && (
          <TabsContent value="pop01_paaso" className="space-y-6 mt-4">
            <PaasoContainer />
          </TabsContent>
        )}

        {/* TAB 1: VISÃO GERAL */}
        <TabsContent value="visao_geral" className="space-y-6 mt-4">
          <div className="agro-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#E2DCCF]">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Responsável Técnico
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.responsavel || ''}
                    onChange={(e) => setEditForm({ ...editForm, responsavel: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-bold text-stone-800 mt-1 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#2D6A4F]" />
                    {procedure.responsavel || 'Hélio - RT'}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Área / Etapa do Processo
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.area_etapa || ''}
                    onChange={(e) => setEditForm({ ...editForm, area_etapa: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-semibold text-stone-800 mt-1">
                    {procedure.area_etapa || 'Linha Industrial Geral'}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Referência Legal (IN 04/2007)
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.referencia_in || ''}
                    onChange={(e) => setEditForm({ ...editForm, referencia_in: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#2D6A4F] mt-1 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-[#D9A404]" />
                    {procedure.referencia_in || 'IN 04/2007 Seção 7'}
                  </p>
                )}
              </div>
            </div>

            {/* Objetivo */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                1. Objetivo e Aplicação
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.objetivo || ''}
                  onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })}
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-xs text-stone-800 leading-relaxed">
                  {procedure.objetivo || 'Não especificado.'}
                </div>
              )}
            </div>

            {/* Perigos APPCC */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                2. Perigos Relacionados (APPCC - Princípio 1)
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.perigos_relacionados || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, perigos_relacionados: e.target.value })
                  }
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 text-xs text-stone-800 leading-relaxed">
                  {procedure.perigos_relacionados ||
                    'Risco microbiológico e desvios de parâmetros toleráveis.'}
                </div>
              )}
            </div>

            {/* Medidas Preventivas */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                3. Medidas Preventivas & Limites Críticos
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.medidas_preventivas || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, medidas_preventivas: e.target.value })
                  }
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-stone-800 leading-relaxed">
                  {procedure.medidas_preventivas ||
                    'Inspeção visual, registros em planilhas e calibração periódica.'}
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="pt-4 border-t border-[#E2DCCF] flex flex-wrap items-center justify-between text-xs text-stone-500">
              <div>
                Última Revisão:{' '}
                <strong className="text-stone-700">
                  {procedure.data_revisao
                    ? new Date(procedure.data_revisao).toLocaleDateString('pt-BR')
                    : '15/01/2025'}
                </strong>
              </div>
              <div>
                Validade da Versão:{' '}
                <strong className="text-stone-700">
                  {procedure.validade
                    ? new Date(procedure.validade).toLocaleDateString('pt-BR')
                    : '15/01/2026'}
                </strong>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: DEFINIÇÃO / COMO DEVE SER EXECUTADO (CAMPOS EDITÁVEIS PELO CLIENTE) */}
        <TabsContent value="definicao_execucao" className="space-y-6 mt-4">
          <div className="agro-card p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#D9A404]" />
                  Definição do Procedimento: Como Deve Ser Executado
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Campos editáveis pelo cliente para adaptar o procedimento oficial às
                  particularidades operacionais da fábrica.
                </p>
              </div>

              <Button
                onClick={handleSaveExecucao}
                disabled={savingExec}
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9"
              >
                <Save className="h-4 w-4" />
                {savingExec ? 'Gravando...' : 'Salvar Como Executar'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Produtos Químicos / Sanitizantes Utilizados
                </Label>
                <Textarea
                  rows={2}
                  value={camposExec.produtos_quimicos_utilizados || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, produtos_quimicos_utilizados: e.target.value })
                  }
                  placeholder="Ex: Detergente alcalino clorado 2,0%, Ácido peracético 0,2%..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Concentrações, Dosagens e Diluições
                </Label>
                <Textarea
                  rows={2}
                  value={camposExec.concentracoes_dosagens || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, concentracoes_dosagens: e.target.value })
                  }
                  placeholder="Ex: 200 mL para 10 Litros de água potável..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Tempos de Ação / Temperaturas de Processo
                </Label>
                <Textarea
                  rows={2}
                  value={camposExec.tempos_temperaturas || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, tempos_temperaturas: e.target.value })
                  }
                  placeholder="Ex: Tempo de contato 15 minutos em temperatura ambiente..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Frequências Detalhadas da Rotina
                </Label>
                <Textarea
                  rows={2}
                  value={camposExec.frequencias_detalhadas || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, frequencias_detalhadas: e.target.value })
                  }
                  placeholder="Ex: Diário ao final do expediente; Penteadeira a cada troca de batelada..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Responsável Designado por Etapa
                </Label>
                <Input
                  value={camposExec.responsavel_etapa || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, responsavel_etapa: e.target.value })
                  }
                  placeholder="Ex: Equipe de Higienização sob supervisão do RQ"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Limites Críticos de Aceitação
                </Label>
                <Input
                  value={camposExec.limites_criticos_aceitacao || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, limites_criticos_aceitacao: e.target.value })
                  }
                  placeholder="Ex: ATP < 30 RLU; Umidade <= 13,0%; Aflatoxina <= 20 ppb"
                  className="h-9 text-xs font-semibold text-emerald-800"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Instruções Específicas do Estabelecimento Fabricante (SIPEAGRO)
                </Label>
                <Textarea
                  rows={3}
                  value={camposExec.instrucoes_especificas_estabelecimento || ''}
                  onChange={(e) =>
                    setCamposExec({
                      ...camposExec,
                      instrucoes_especificas_estabelecimento: e.target.value,
                    })
                  }
                  placeholder="Descreva o passo a passo exato operacional da fábrica: ligar bomba, acionar raspador pneumático, quarentenar..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">EPIs Obrigatórios</Label>
                <Input
                  value={camposExec.epi_obrigatorios || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, epi_obrigatorios: e.target.value })
                  }
                  placeholder="Ex: Botas de PVC, luvas de nitrila, óculos de ampla visão"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Ações Corretivas Imediatas em Desvio
                </Label>
                <Input
                  value={camposExec.acoes_corretivas_imediatas || ''}
                  onChange={(e) =>
                    setCamposExec({ ...camposExec, acoes_corretivas_imediatas: e.target.value })
                  }
                  placeholder="Ex: Rejeitar a batelada, segregar produto, repetir higienização"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB: FORMULÁRIOS DO ITEM 07 (IN 04/2007) */}
        <TabsContent value="formularios_item07" className="space-y-4 mt-4">
          <div className="agro-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#D9A404]" />
                  Formulários Normativos de Registro (Item 07 da IN 04/2007)
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Modelos exigidos pelo MAPA para comprovação da execução deste POP no autocontrole.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                POP_ITEM07_CATALOG[procedure.codigo]?.formularios || [
                  {
                    codigo: `F-01-${procedure.codigo}`,
                    titulo: `Registro de Monitoramento de ${procedure.nome}`,
                    frequencia: procedure.frequencia || 'Diário',
                    item_in04: procedure.referencia_in || 'IN 04/2007 Item 07',
                    campos_fixos: [],
                  },
                ]
              ).map((formDef) => (
                <div
                  key={formDef.codigo}
                  className="p-4 rounded-xl border border-[#E2DCCF] bg-white hover:border-[#2D6A4F] transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-[#2D6A4F]">
                        {formDef.codigo}
                      </span>
                      <h3 className="text-xs font-bold text-stone-900 mt-1.5 leading-snug">
                        {formDef.titulo}
                      </h3>
                      <p className="text-[10px] text-stone-500 mt-0.5">
                        Norma: {formDef.item_in04} • Freq: {formDef.frequencia}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedFormDef(formDef)
                        setDynamicFormValues({})
                        setOpenNewRecordModal(true)
                      }}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-[11px] h-8 shrink-0 gap-1"
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Preencher
                    </Button>
                  </div>

                  {formDef.campos_fixos && formDef.campos_fixos.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                        Campos Normativos de Inspeção:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {formDef.campos_fixos.map((c) => (
                          <span
                            key={c.id}
                            className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded"
                          >
                            {c.label} {c.unidade ? `(${c.unidade})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: REGISTROS & COMPROVAÇÃO RQ/RE */}
        <TabsContent value="registros" className="space-y-4 mt-4">
          <div className="agro-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2DCCF]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                    Registros de Monitoramento & Comprovação RQ/RE
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-amber-900 text-[10px]"
                  >
                    Validação Item 07 IN 04
                  </Badge>
                </div>
                <p className="text-xs text-[#6B6B6B] mt-0.5">
                  Conforme a norma, o POP só é considerado comprovado quando os registros são
                  assinados pelo RQ e pelo RE.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    const cat = POP_ITEM07_CATALOG[procedure.codigo]
                    if (cat && cat.formularios.length > 0) {
                      setSelectedFormDef(cat.formularios[0])
                    }
                    setOpenNewRecordModal(true)
                  }}
                  className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm h-9"
                >
                  <PlusCircle className="h-4 w-4" />
                  Novo Registro
                </Button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="agro-table-header">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Formulário</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3">Valor Medido</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Comprovação RQ/RE</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500">
                        Nenhum registro de monitoramento realizado para este procedimento ainda.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const hasRQ = Boolean(r.assinaturas_registro?.rq)
                      const hasRE = Boolean(r.assinaturas_registro?.re)
                      const isComprovado = hasRQ && hasRE

                      return (
                        <tr key={r.id} className="hover:bg-[#FAF7EF] transition">
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-stone-800">
                            {new Date(r.data).toLocaleDateString('pt-BR')}
                            <span className="block text-[10px] text-stone-400">
                              {r.turno || 'Manhã'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] font-bold text-[#2D6A4F]">
                            {r.formulario_codigo || `F-01-${procedure.codigo}`}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-stone-700">
                            {r.lote || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">
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
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isComprovado ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Comprovado RQ/RE
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                              >
                                <Clock className="h-3 w-3" />
                                {hasRQ ? 'Falta RE' : hasRE ? 'Falta RQ' : 'Pendente RQ/RE'}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRecordForPdf(r)
                                setOpenRecordPdfModal(true)
                              }}
                              className="h-7 text-[11px] border-stone-300 text-stone-700 hover:bg-stone-50 gap-1"
                            >
                              <FileCheck className="h-3 w-3 text-[#2D6A4F]" />
                              PDF / Assinar
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: ANEXOS */}
        <TabsContent value="anexos" className="space-y-4 mt-4">
          <div className="agro-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                  Documentos Anexos & Evidências
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Instruções de trabalho (IT), planilhas em PDF e laudos laboratoriais
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Upload de Anexo',
                    description: 'Selecione o arquivo em PDF ou imagem para anexar.',
                  })
                }
                className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5"
              >
                <UploadCloud className="h-4 w-4" />
                Anexar Arquivo
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF]">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[#2D6A4F]" />
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      {procedure.codigo}_Instrucao_Trabalho_Oficial.pdf
                    </p>
                    <span className="text-[11px] text-stone-500">
                      PDF • 1.4 MB • Versão Aprovada
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#2D6A4F] text-xs gap-1">
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF]">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[#2D6A4F]" />
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      Validacao_Limites_Criticos_MAPA.pdf
                    </p>
                    <span className="text-[11px] text-stone-500">PDF • 850 KB • Laudo Técnico</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#2D6A4F] text-xs gap-1">
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: NOVO REGISTRO COM APOIO AO FORMULÁRIO DO ITEM 07 */}
      <Dialog open={openNewRecordModal} onOpenChange={setOpenNewRecordModal}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#D9A404]" />
              {selectedFormDef
                ? selectedFormDef.titulo
                : `Novo Registro de Monitoramento (${procedure.codigo})`}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Formulário normativo em atendimento ao Item 07 da IN 04/2007 (MAPA).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRecord} className="space-y-3.5 pt-2">
            {/* Seletor de Formulário se o POP tiver mais de um */}
            {POP_ITEM07_CATALOG[procedure.codigo]?.formularios &&
              POP_ITEM07_CATALOG[procedure.codigo].formularios.length > 1 && (
                <div className="space-y-1 pb-2 border-b border-stone-200">
                  <Label className="text-xs font-semibold text-stone-700">
                    Formulário Normativo do Item 07
                  </Label>
                  <Select
                    value={selectedFormDef?.codigo || ''}
                    onValueChange={(val) => {
                      const def = POP_ITEM07_CATALOG[procedure.codigo].formularios.find(
                        (f) => f.codigo === val,
                      )
                      if (def) setSelectedFormDef(def)
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POP_ITEM07_CATALOG[procedure.codigo].formularios.map((f) => (
                        <SelectItem key={f.codigo} value={f.codigo}>
                          [{f.codigo}] {f.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data da Coleta</Label>
                <Input
                  type="date"
                  value={recordForm.data}
                  onChange={(e) => setRecordForm({ ...recordForm, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Turno</Label>
                <Select
                  value={recordForm.turno}
                  onValueChange={(val: any) => setRecordForm({ ...recordForm, turno: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Lote da Produção</Label>
                <Input
                  value={recordForm.lote}
                  onChange={(e) => setRecordForm({ ...recordForm, lote: e.target.value })}
                  placeholder="Ex: LOTE-2025-045"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status da Medição</Label>
                <Select
                  value={recordForm.status}
                  onValueChange={(val: any) => setRecordForm({ ...recordForm, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conforme">Conforme</SelectItem>
                    <SelectItem value="Não Conforme">Não Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CAMPOS ESPECÍFICOS DO FORMULÁRIO DO ITEM 07 */}
            {selectedFormDef &&
              selectedFormDef.campos_fixos &&
              selectedFormDef.campos_fixos.length > 0 && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                  <h4 className="text-[11px] font-bold text-[#2D6A4F] uppercase tracking-wider">
                    Campos Específicos: {selectedFormDef.codigo}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedFormDef.campos_fixos.map((campo) => (
                      <div key={campo.id} className="space-y-1">
                        <Label className="text-[11px] font-medium text-stone-700">
                          {campo.label} {campo.unidade ? `(${campo.unidade})` : ''}
                        </Label>
                        {campo.tipo === 'select' && campo.opcoes ? (
                          <Select
                            value={dynamicFormValues[campo.id] || ''}
                            onValueChange={(val) =>
                              setDynamicFormValues({ ...dynamicFormValues, [campo.id]: val })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs bg-white">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {campo.opcoes.map((op) => (
                                <SelectItem key={op} value={op}>
                                  {op}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : campo.tipo === 'number' ? (
                          <Input
                            type="number"
                            step="any"
                            value={dynamicFormValues[campo.id] || ''}
                            onChange={(e) =>
                              setDynamicFormValues({
                                ...dynamicFormValues,
                                [campo.id]: e.target.value,
                              })
                            }
                            placeholder={campo.unidade ? `Valor em ${campo.unidade}` : 'Número'}
                            className="h-8 text-xs bg-white"
                          />
                        ) : (
                          <Input
                            value={dynamicFormValues[campo.id] || ''}
                            onChange={(e) =>
                              setDynamicFormValues({
                                ...dynamicFormValues,
                                [campo.id]: e.target.value,
                              })
                            }
                            placeholder={`Preencha ${campo.label}`}
                            className="h-8 text-xs bg-white"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Valor Resumo / Medição Principal
              </Label>
              <Input
                value={recordForm.valor_medido}
                onChange={(e) => setRecordForm({ ...recordForm, valor_medido: e.target.value })}
                placeholder="Ex: Conforme especificação / Temp 82°C / Sem desvios"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Responsável pelo Registro (Operador)
              </Label>
              <Input
                value={recordForm.responsavel}
                onChange={(e) => setRecordForm({ ...recordForm, responsavel: e.target.value })}
                placeholder="Nome do Operador ou Supervisor"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Observações Operacionais
              </Label>
              <Textarea
                rows={2}
                value={recordForm.observacoes}
                onChange={(e) => setRecordForm({ ...recordForm, observacoes: e.target.value })}
                placeholder="Descreva eventuais ocorrências operacionais..."
                className="text-xs resize-none"
              />
            </div>

            {recordForm.status === 'Não Conforme' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Ao salvar como <strong>Não Conforme</strong>, você será automaticamente
                  direcionado para preencher o plano de ação e abertura da Não Conformidade.
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewRecordModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={recordLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold"
              >
                {recordLoading ? 'Gravando...' : 'Salvar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* POP DOCUMENT PDF & ASSINATURA MODAL */}
      {procedure && (
        <PopDocumentPdfModal
          open={openPopPdfModal}
          onOpenChange={setOpenPopPdfModal}
          procedure={procedure}
          company={company}
          recordsCount={records.length}
          onSignatureSaved={loadAll}
        />
      )}

      {/* RECORD DOCUMENT PDF & ASSINATURA MODAL */}
      <RecordDocumentPdfModal
        open={openRecordPdfModal}
        onOpenChange={setOpenRecordPdfModal}
        record={selectedRecordForPdf}
        procedure={procedure}
        company={company}
        onSignatureSaved={loadAll}
      />

      {/* POP DEMAND RECORD MODAL (CRIAÇÃO POR DEMANDA DO CLIENTE) */}
      {procedure && (
        <PopDemandRecordModal
          open={openDemandRecordModal}
          onOpenChange={setOpenDemandRecordModal}
          procedure={procedure}
          userName={user?.name || 'Responsável Técnico'}
          existingRecords={records}
          onRecordCreated={() => loadAll()}
        />
      )}

      {/* 6. MODAL: CONSTRUTOR DE FORMULÁRIO PERSONALIZADO (PARTE C) */}
      {procedure && (
        <PopFormBuilderModal
          open={openBuilderModal}
          onOpenChange={setOpenBuilderModal}
          procedure={procedure}
          formToEdit={formToEdit}
          onFormSaved={loadAll}
        />
      )}

      {/* 7. MODAL: PREENCHER FORMULÁRIO PERSONALIZADO (PARTE C) */}
      {procedure && (
        <PopCustomRecordFillModal
          open={openFillCustomRecordModal}
          onOpenChange={setOpenFillCustomRecordModal}
          procedure={procedure}
          form={selectedCustomFormToFill}
          company={company}
          onRecordCreated={loadAll}
        />
      )}
    </div>
  )
}
