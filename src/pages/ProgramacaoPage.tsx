import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Sparkles,
  Trash2,
  Edit3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { getProcedures, getRecords, getTrainings } from '@/services/agroService'
import {
  getProgramacoesRegistros,
  createProgramacaoRegistro,
  updateProgramacaoRegistro,
  deleteProgramacaoRegistro,
  getCatalogoRegistrosDisponiveis,
  calcularItensCronograma,
  type ProgramacaoRegistroItem,
  type RegistroCatalogoDisponivel,
  type CronogramaItemVisualizacao,
} from '@/services/programacaoService'
import type { Procedure, MonitoringRecord, Training } from '@/types/agro'
import { RecordDocumentPdfModal } from '@/components/RecordDocumentPdfModal'
import { PopCustomRecordFillModal } from '@/components/PopCustomRecordFillModal'

export default function ProgramacaoPage() {
  const { toast } = useToast()
  const { user, currentOrg } = useAuth()
  const printRef = useRef<HTMLDivElement>(null)

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [records, setRecords] = useState<MonitoringRecord[]>([])
  const [trainings, setTrainings] = useState<Training[]>([])
  const [programacoes, setProgramacoes] = useState<ProgramacaoRegistroItem[]>([])
  const [catalogoDisponivel, setCatalogoDisponivel] = useState<RegistroCatalogoDisponivel[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros de visualização
  const [visualizacao, setVisualizacao] = useState<'dia' | 'semana' | 'mes' | 'ano'>('semana')
  const [dataBase, setDataBase] = useState<Date>(new Date())
  const [buscaTexto, setBuscaTexto] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroPop, setFiltroPop] = useState<string>('todos')

  // Modais
  const [openNovoAgendamento, setOpenNovoAgendamento] = useState(false)
  const [agendamentoEditando, setAgendamentoEditando] = useState<ProgramacaoRegistroItem | null>(
    null,
  )
  const [selectedRecordForPdf, setSelectedRecordForPdf] = useState<MonitoringRecord | null>(null)
  const [openPdfModal, setOpenPdfModal] = useState(false)

  // Preenchimento de revalidação / renovação
  const [openFillModal, setOpenFillModal] = useState(false)
  const [formParaPreencher, setFormParaPreencher] = useState<any>(null)
  const [procedureParaPreencher, setProcedureParaPreencher] = useState<Procedure | null>(null)

  // Formulário de Novo Agendamento
  const [formPopCodigo, setFormPopCodigo] = useState('')
  const [formFormularioCodigo, setFormFormularioCodigo] = useState('')
  const [formTitulo, setFormTitulo] = useState('')
  const [formPeriodicidade, setFormPeriodicidade] = useState<
    'diaria' | 'semanal' | 'mensal' | 'anual'
  >('semanal')
  const [formDataInicio, setFormDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [formDataFim, setFormDataFim] = useState('')
  const [formTurno, setFormTurno] = useState('Manhã')
  const [formSetor, setFormSetor] = useState('')
  const [formResponsavelCargo, setFormResponsavelCargo] = useState('')
  const [formDiasSemana, setFormDiasSemana] = useState<number[]>([1])
  const [formDiaMes, setFormDiaMes] = useState<number>(1)
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [procs, recs, trains, progs] = await Promise.all([
        getProcedures(),
        getRecords(),
        getTrainings(),
        getProgramacoesRegistros(),
      ])
      setProcedures(procs)
      setRecords(recs)
      setTrainings(trains)
      setProgramacoes(progs)

      const cat = await getCatalogoRegistrosDisponiveis(procs)
      setCatalogoDisponivel(cat)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calcular faixa de datas baseada na visualização atual
  const { dataInicioFiltro, dataFimFiltro, labelPeriodo } = useMemo(() => {
    const d = new Date(dataBase)
    d.setHours(0, 0, 0, 0)

    if (visualizacao === 'dia') {
      const inicio = new Date(d)
      const fim = new Date(d)
      fim.setHours(23, 59, 59, 999)
      return {
        dataInicioFiltro: inicio,
        dataFimFiltro: fim,
        labelPeriodo: d.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      }
    } else if (visualizacao === 'semana') {
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Segunda-feira
      const inicio = new Date(d.setDate(diff))
      const fim = new Date(inicio)
      fim.setDate(fim.getDate() + 6)
      fim.setHours(23, 59, 59, 999)
      return {
        dataInicioFiltro: inicio,
        dataFimFiltro: fim,
        labelPeriodo: `Semana de ${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`,
      }
    } else if (visualizacao === 'mes') {
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1)
      const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
      return {
        dataInicioFiltro: inicio,
        dataFimFiltro: fim,
        labelPeriodo: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      }
    } else {
      // ano
      const inicio = new Date(d.getFullYear(), 0, 1)
      const fim = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999)
      return {
        dataInicioFiltro: inicio,
        dataFimFiltro: fim,
        labelPeriodo: `Ano de ${d.getFullYear()}`,
      }
    }
  }, [dataBase, visualizacao])

  // Itens calculados do cronograma
  const itensCronograma = useMemo(() => {
    return calcularItensCronograma({
      programacoes,
      records,
      trainings,
      dataInicioFiltro,
      dataFimFiltro,
    })
  }, [programacoes, records, trainings, dataInicioFiltro, dataFimFiltro])

  // Filtragem
  const itensFiltrados = useMemo(() => {
    return itensCronograma.filter((item) => {
      if (buscaTexto) {
        const q = buscaTexto.toLowerCase()
        const match =
          item.titulo.toLowerCase().includes(q) ||
          item.formulario_codigo.toLowerCase().includes(q) ||
          item.pop_codigo.toLowerCase().includes(q)
        if (!match) return false
      }
      if (filtroPop !== 'todos' && item.pop_codigo !== filtroPop) return false
      if (filtroStatus !== 'todos') {
        if (filtroStatus === 'PENDENTE' && item.status_operacional !== 'PENDENTE') return false
        if (
          filtroStatus === 'AGUARDANDO_APROVACAO' &&
          item.status_operacional !== 'AGUARDANDO_APROVACAO'
        )
          return false
        if (filtroStatus === 'APROVADO' && item.status_operacional !== 'APROVADO') return false
        if (filtroStatus === 'ATRASADO' && item.status_operacional !== 'ATRASADO') return false
        if (filtroStatus === 'VENCIMENTO' && !item.status_validade) return false
      }
      return true
    })
  }, [itensCronograma, buscaTexto, filtroPop, filtroStatus])

  // Contadores de resumo
  const contadores = useMemo(() => {
    let pendentes = 0
    let aguardando = 0
    let aprovados = 0
    let atrasados = 0
    let vencidosOuAVencer = 0

    for (const it of itensCronograma) {
      if (it.status_operacional === 'PENDENTE') pendentes++
      if (it.status_operacional === 'AGUARDANDO_APROVACAO') aguardando++
      if (it.status_operacional === 'APROVADO') aprovados++
      if (it.status_operacional === 'ATRASADO') atrasados++
      if (it.status_validade === 'A_VENCER' || it.status_validade === 'VENCIDO') vencidosOuAVencer++
    }
    return {
      pendentes,
      aguardando,
      aprovados,
      atrasados,
      vencidosOuAVencer,
      total: itensCronograma.length,
    }
  }, [itensCronograma])

  // Avançar / retroceder período
  const navegarPeriodo = (direcao: 'ant' | 'prox') => {
    const d = new Date(dataBase)
    const delta = direcao === 'prox' ? 1 : -1
    if (visualizacao === 'dia') d.setDate(d.getDate() + delta)
    else if (visualizacao === 'semana') d.setDate(d.getDate() + delta * 7)
    else if (visualizacao === 'mes') d.setMonth(d.getMonth() + delta)
    else if (visualizacao === 'ano') d.setFullYear(d.getFullYear() + delta)
    setDataBase(d)
  }

  const handleSelecionarRegistroDoCatalogo = (formCod: string) => {
    const sel = catalogoDisponivel.find((c) => c.formulario_codigo === formCod)
    if (sel) {
      setFormFormularioCodigo(sel.formulario_codigo)
      setFormPopCodigo(sel.pop_codigo)
      setFormTitulo(sel.titulo)
      if (sel.frequencia_sugerida.toLowerCase().includes('diár')) setFormPeriodicidade('diaria')
      else if (sel.frequencia_sugerida.toLowerCase().includes('seman'))
        setFormPeriodicidade('semanal')
      else if (sel.frequencia_sugerida.toLowerCase().includes('mens'))
        setFormPeriodicidade('mensal')
      else if (sel.frequencia_sugerida.toLowerCase().includes('anual'))
        setFormPeriodicidade('anual')
    }
  }

  const handleSalvarAgendamento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formFormularioCodigo || !formTitulo) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }

    setSalvandoAgendamento(true)
    try {
      const proc = procedures.find((p) => p.codigo === formPopCodigo)

      const payload: Partial<ProgramacaoRegistroItem> = {
        pop_codigo: formPopCodigo,
        formulario_codigo: formFormularioCodigo,
        titulo: formTitulo,
        periodicidade: formPeriodicidade,
        data_inicio: formDataInicio,
        data_fim: formDataFim || undefined,
        turno_preferencial: formTurno,
        setor: formSetor,
        responsavel_cargo: formResponsavelCargo,
        dias_semana: formDiasSemana,
        dia_mes: formDiaMes,
        procedure: proc?.id,
        is_ativo: true,
      }

      if (agendamentoEditando) {
        await updateProgramacaoRegistro(agendamentoEditando.id, payload)
        toast({ title: 'Agendamento atualizado com sucesso' })
      } else {
        await createProgramacaoRegistro(payload)
        toast({ title: 'Novo agendamento obrigatório criado' })
      }

      setOpenNovoAgendamento(false)
      setAgendamentoEditando(null)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar agendamento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoAgendamento(false)
    }
  }

  const handleExcluirAgendamento = async (id: string) => {
    if (confirm('Deseja realmente remover este agendamento do cronograma?')) {
      try {
        await deleteProgramacaoRegistro(id)
        toast({ title: 'Agendamento removido' })
        loadData()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
      }
    }
  }

  const handleImprimirCronograma = () => {
    window.print()
  }

  // Ação de Renovar/Revalidar registro com validade
  const handleRenovarRegistro = (item: CronogramaItemVisualizacao) => {
    const proc = procedures.find((p) => p.codigo === item.pop_codigo)
    if (proc) {
      setProcedureParaPreencher(proc)
      // Encontrar modelo customizado ou do catálogo
      const matchedCat = catalogoDisponivel.find(
        (c) => c.formulario_codigo === item.formulario_codigo,
      )
      if (matchedCat) {
        setFormParaPreencher({
          codigo: matchedCat.formulario_codigo,
          titulo: `[Revalidação/Renovação] ${matchedCat.titulo}`,
          tem_vencimento: true,
          dias_validade_padrao: 365,
          dias_alerta_vencimento: 60,
          campos: [
            {
              id: 'fld_lote_ant',
              nome: 'lote_anterior',
              rotulo: 'Lote / Referência Anterior',
              tipo: 'text',
            },
            {
              id: 'fld_motivo',
              nome: 'motivo_revalidacao',
              rotulo: 'Parecer de Revalidação / Renovação',
              tipo: 'textarea',
            },
            {
              id: 'fld_validade',
              nome: 'data_validade',
              rotulo: 'Nova Data de Validade',
              tipo: 'vencimento',
            },
          ],
        })
        setOpenFillModal(true)
      }
    } else {
      toast({
        title: 'Abra o Auto Controle correspondente para preencher uma revalidação.',
        variant: 'default',
      })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-12">
      {/* 1. Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <CalendarDays className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#1B4332]">
                Programação & Cronograma de Registros Obrigatórios
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                Controle operacional por dia, semana, mês e ano. Agendamentos de autocontrole,
                pendências de assinaturas e revalidação de prazos (IN 04/2007).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImprimirCronograma}
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs h-9 gap-1.5 font-semibold"
          >
            <Printer className="h-4 w-4" />
            Imprimir Agenda
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setAgendamentoEditando(null)
              setFormPopCodigo(catalogoDisponivel[0]?.pop_codigo || 'POP-001')
              if (catalogoDisponivel[0])
                handleSelecionarRegistroDoCatalogo(catalogoDisponivel[0].formulario_codigo)
              setOpenNovoAgendamento(true)
            }}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento Obrigatório
          </Button>
        </div>
      </div>

      {/* 2. Cards de Indicadores Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
            Atrasados
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-xl font-bold font-['Sora'] ${contadores.atrasados > 0 ? 'text-red-600' : 'text-stone-800'}`}
            >
              {contadores.atrasados}
            </span>
            {contadores.atrasados > 0 && (
              <Badge className="bg-red-500 text-white text-[9px] animate-pulse">Atenção</Badge>
            )}
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            Pendentes Preenchimento
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-['Sora'] text-amber-700">
              {contadores.pendentes}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
            Aguardando Aprovação (RQ/RE)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-['Sora'] text-blue-700">
              {contadores.aguardando}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            Aprovados no Período
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-['Sora'] text-emerald-700">
              {contadores.aprovados}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
            Prazos de Vencimento
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold font-['Sora'] text-purple-700">
              {contadores.vencidosOuAVencer}
            </span>
            <span className="text-[10px] text-stone-500">vencendo/expirado</span>
          </div>
        </div>
      </div>

      {/* 3. Barra de Controle de Período (Dia, Semana, Mês, Ano) & Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Seletor de modo de visualização */}
          <div className="flex items-center gap-1 bg-[#FAF7EF] p-1 rounded-xl border border-[#E2DCCF]">
            <Button
              size="sm"
              variant={visualizacao === 'dia' ? 'default' : 'ghost'}
              onClick={() => setVisualizacao('dia')}
              className={`h-8 text-xs font-semibold ${visualizacao === 'dia' ? 'bg-[#2D6A4F] text-white' : 'text-stone-700'}`}
            >
              Dia
            </Button>
            <Button
              size="sm"
              variant={visualizacao === 'semana' ? 'default' : 'ghost'}
              onClick={() => setVisualizacao('semana')}
              className={`h-8 text-xs font-semibold ${visualizacao === 'semana' ? 'bg-[#2D6A4F] text-white' : 'text-stone-700'}`}
            >
              Semana
            </Button>
            <Button
              size="sm"
              variant={visualizacao === 'mes' ? 'default' : 'ghost'}
              onClick={() => setVisualizacao('mes')}
              className={`h-8 text-xs font-semibold ${visualizacao === 'mes' ? 'bg-[#2D6A4F] text-white' : 'text-stone-700'}`}
            >
              Mês
            </Button>
            <Button
              size="sm"
              variant={visualizacao === 'ano' ? 'default' : 'ghost'}
              onClick={() => setVisualizacao('ano')}
              className={`h-8 text-xs font-semibold ${visualizacao === 'ano' ? 'bg-[#2D6A4F] text-white' : 'text-stone-700'}`}
            >
              Ano
            </Button>
          </div>

          {/* Navegação de data */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarPeriodo('ant')}
              className="h-8 w-8 p-0 border-stone-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-bold font-['Sora'] text-[#1B4332] min-w-[200px] text-center capitalize">
              {labelPeriodo}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navegarPeriodo('prox')}
              className="h-8 w-8 p-0 border-stone-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDataBase(new Date())}
              className="h-8 text-[11px] text-[#2D6A4F]"
            >
              Hoje
            </Button>
          </div>

          {/* Busca textual */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <Input
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Localizar registro, POP ou código..."
              className="pl-8 h-8 text-xs border-stone-300"
            />
          </div>
        </div>

        {/* Filtros secundários */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-stone-400" />
            <span className="font-semibold text-stone-700">Filtrar por Status:</span>
          </div>

          <button
            onClick={() => setFiltroStatus('todos')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'todos' ? 'bg-[#1B4332] text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'}`}
          >
            Todos ({itensCronograma.length})
          </button>
          <button
            onClick={() => setFiltroStatus('ATRASADO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'ATRASADO' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}
          >
            Atrasados ({contadores.atrasados})
          </button>
          <button
            onClick={() => setFiltroStatus('PENDENTE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'PENDENTE' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            Pendente Preenchimento ({contadores.pendentes})
          </button>
          <button
            onClick={() => setFiltroStatus('AGUARDANDO_APROVACAO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'AGUARDANDO_APROVACAO' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-800 hover:bg-blue-100'}`}
          >
            Aguardando Aprovação ({contadores.aguardando})
          </button>
          <button
            onClick={() => setFiltroStatus('APROVADO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'APROVADO' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
          >
            Aprovados ({contadores.aprovados})
          </button>
          <button
            onClick={() => setFiltroStatus('VENCIMENTO')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${filtroStatus === 'VENCIMENTO' ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}
          >
            Prazos de Vigência ({contadores.vencidosOuAVencer})
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-stone-500">Auto Controle:</span>
            <select
              value={filtroPop}
              onChange={(e) => setFiltroPop(e.target.value)}
              className="h-7 text-xs px-2 rounded border border-stone-300 bg-white"
            >
              <option value="todos">Todos os POPs</option>
              {procedures.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.codigo}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Lista / Grade de Itens da Agenda Imprimível */}
      <div
        ref={printRef}
        className="bg-white rounded-2xl border border-[#E2DCCF] shadow-xs overflow-hidden"
      >
        {/* Cabeçalho de Impressão */}
        <div className="p-4 sm:p-5 border-b border-[#E2DCCF] bg-[#FAF7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#D9A404]" />
              Cronograma Oficial de Execução e Verificação
            </h3>
            <p className="text-[11px] text-stone-600">
              Período: <strong>{labelPeriodo}</strong> • Estabelecimento:{' '}
              <strong>{currentOrg?.razao_social || 'Fabricante'}</strong> (CNPJ{' '}
              {currentOrg?.cnpj || '—'})
            </p>
          </div>
          <Badge className="bg-[#1B4332] text-white text-xs font-mono self-start sm:self-auto">
            {itensFiltrados.length} registro(s) listado(s)
          </Badge>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            Carregando cronograma de registros obrigatórios...
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CalendarDays className="h-10 w-10 text-stone-300 mx-auto" />
            <p className="text-xs text-stone-600 font-semibold">
              Nenhum registro agendado ou pendente encontrado para este período e filtros
              selecionados.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setAgendamentoEditando(null)
                setOpenNovoAgendamento(true)
              }}
              className="bg-[#2D6A4F] text-white text-xs h-8"
            >
              Criar Primeiro Agendamento
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2DCCF]">
            {itensFiltrados.map((item) => {
              const isAtrasado = item.status_operacional === 'ATRASADO'
              const isAprovado = item.status_operacional === 'APROVADO'
              const isAguardando = item.status_operacional === 'AGUARDANDO_APROVACAO'

              return (
                <div
                  key={item.id}
                  className={`p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isAtrasado
                      ? 'bg-red-50/60 hover:bg-red-50 border-l-4 border-l-red-600'
                      : isAguardando
                        ? 'bg-blue-50/40 hover:bg-blue-50 border-l-4 border-l-blue-600'
                        : isAprovado
                          ? 'bg-white hover:bg-stone-50 border-l-4 border-l-emerald-600'
                          : 'bg-white hover:bg-stone-50 border-l-4 border-l-amber-500'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                        {item.pop_codigo}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                        {item.formulario_codigo}
                      </span>

                      {/* Status Operacional */}
                      {isAtrasado && (
                        <Badge className="bg-red-600 text-white text-[10px] gap-1">
                          <AlertTriangle className="h-3 w-3" /> Atrasado
                        </Badge>
                      )}
                      {item.status_operacional === 'PENDENTE' && (
                        <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                          <Clock className="h-3 w-3" /> Pendente de Preenchimento
                        </Badge>
                      )}
                      {isAguardando && (
                        <Badge className="bg-blue-600 text-white text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Aguardando Assinaturas RQ e RT/RE
                        </Badge>
                      )}
                      {isAprovado && (
                        <Badge className="bg-emerald-700 text-white text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Aprovado / Comprovado
                        </Badge>
                      )}

                      {/* Alerta de Validade / Vencimento */}
                      {item.status_validade === 'VENCIDO' && (
                        <Badge className="bg-red-900 text-white text-[10px]">
                          Vencido há {Math.abs(item.dias_para_vencer || 0)} dias
                        </Badge>
                      )}
                      {item.status_validade === 'A_VENCER' && (
                        <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px]">
                          Vence em {item.dias_para_vencer} dias (Renovação Pendente)
                        </Badge>
                      )}
                      {item.status_validade === 'VIGENTE' && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-emerald-800 border-emerald-300"
                        >
                          Vigente até{' '}
                          {item.data_vencimento
                            ? new Date(item.data_vencimento).toLocaleDateString('pt-BR')
                            : '—'}
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-stone-900">{item.titulo}</h4>

                    <div className="flex items-center gap-3 text-[11px] text-stone-500 flex-wrap">
                      <span>
                        Data Prevista:{' '}
                        <strong className="text-stone-800">
                          {new Date(item.data_alvo + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                      <span>
                        Periodicidade: <strong className="capitalize">{item.periodicidade}</strong>
                      </span>
                      {item.turno && (
                        <span>
                          Turno: <strong>{item.turno}</strong>
                        </span>
                      )}
                      {item.registro_executado && (
                        <span className="text-emerald-800">
                          Preenchido por:{' '}
                          <strong>{item.registro_executado.responsavel || 'Operador'}</strong>{' '}
                          (Lote: {item.registro_executado.lote || '—'})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações por Item */}
                  <div className="flex items-center gap-1.5 shrink-0 no-print">
                    {/* Botão de Ver Registro Preenchido ou PDF */}
                    {item.registro_executado && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRecordForPdf(item.registro_executado!)
                          setOpenPdfModal(true)
                        }}
                        className="h-8 text-xs text-[#2D6A4F] border-[#2D6A4F] gap-1"
                        title="Visualizar e Imprimir Registro"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Registro PDF
                      </Button>
                    )}

                    {/* Botão de Renovar / Revalidar Registro com Vencimento */}
                    {(item.status_validade || item.origem === 'vencimento') && (
                      <Button
                        size="sm"
                        onClick={() => handleRenovarRegistro(item)}
                        className="h-8 text-xs bg-purple-700 hover:bg-purple-800 text-white gap-1 font-semibold"
                        title="Abrir novo registro pré-preenchido para revalidação"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Renovar / Revalidar
                      </Button>
                    )}

                    {/* Se for uma programação fixa, permitir editar/excluir */}
                    {item.programacao_id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const prog = programacoes.find((p) => p.id === item.programacao_id)
                          if (prog) {
                            setAgendamentoEditando(prog)
                            setFormPopCodigo(prog.pop_codigo)
                            setFormFormularioCodigo(prog.formulario_codigo)
                            setFormTitulo(prog.titulo)
                            setFormPeriodicidade(prog.periodicidade)
                            setFormDataInicio(prog.data_inicio.split('T')[0])
                            setFormDataFim(prog.data_fim ? prog.data_fim.split('T')[0] : '')
                            setFormTurno(prog.turno_preferencial || 'Manhã')
                            setFormSetor(prog.setor || '')
                            setFormResponsavelCargo(prog.responsavel_cargo || '')
                            setFormDiasSemana(prog.dias_semana || [1])
                            setFormDiaMes(prog.dia_mes || 1)
                            setOpenNovoAgendamento(true)
                          }
                        }}
                        className="h-8 w-8 p-0 text-stone-600 hover:text-stone-900"
                        title="Editar Agendamento"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. Seção de Gerenciamento da Raiz de Agendamentos */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-[#D9A404]" />
              Agendamentos Ativos na Raiz de Programação ({programacoes.length})
            </h3>
            <p className="text-xs text-stone-500">
              Formulários programados que alimentam o calendário diário, semanal, mensal e anual do
              estabelecimento.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setAgendamentoEditando(null)
              setOpenNovoAgendamento(true)
            }}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8 gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Agendamento
          </Button>
        </div>

        {programacoes.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">
            Nenhum agendamento cadastrado. Use o botão acima para criar o cronograma de
            preenchimento dos Auto Controles.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {programacoes.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-[#1B4332] text-white text-[10px] font-mono">
                      {p.pop_codigo}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-mono bg-white">
                      {p.formulario_codigo}
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] capitalize">
                      {p.periodicidade}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 mt-1">{p.titulo}</h4>
                  <p className="text-[11px] text-stone-500">
                    Início: {new Date(p.data_inicio).toLocaleDateString('pt-BR')} • Turno:{' '}
                    {p.turno_preferencial || 'Geral'} • Setor: {p.setor || 'Fabril'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAgendamentoEditando(p)
                      setFormPopCodigo(p.pop_codigo)
                      setFormFormularioCodigo(p.formulario_codigo)
                      setFormTitulo(p.titulo)
                      setFormPeriodicidade(p.periodicidade)
                      setFormDataInicio(p.data_inicio.split('T')[0])
                      setFormDataFim(p.data_fim ? p.data_fim.split('T')[0] : '')
                      setFormTurno(p.turno_preferencial || 'Manhã')
                      setFormSetor(p.setor || '')
                      setFormResponsavelCargo(p.responsavel_cargo || '')
                      setFormDiasSemana(p.dias_semana || [1])
                      setFormDiaMes(p.dia_mes || 1)
                      setOpenNovoAgendamento(true)
                    }}
                    className="h-7 w-7 p-0 text-stone-600 hover:text-stone-900"
                    title="Editar"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleExcluirAgendamento(p.id)}
                    className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: NOVO / EDITAR AGENDAMENTO NA RAIZ DE PROGRAMAÇÃO */}
      <Dialog open={openNovoAgendamento} onOpenChange={setOpenNovoAgendamento}>
        <DialogContent className="max-w-xl bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#D9A404]" />
              {agendamentoEditando
                ? 'Editar Agendamento Obrigatório'
                : 'Programar Novo Registro Obrigatório'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Vincule qualquer formulário de autocontrole ao cronograma operacional diário, semanal,
              mensal ou anual.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarAgendamento} className="space-y-4 pt-2 text-xs">
            {/* Escolha do Formulário do Catálogo */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Selecionar Registro / Formulário Cadastrado *
              </Label>
              <select
                value={formFormularioCodigo}
                onChange={(e) => handleSelecionarRegistroDoCatalogo(e.target.value)}
                className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                required
              >
                <option value="">Selecione um registro cadastrado...</option>
                {catalogoDisponivel.map((c) => (
                  <option key={c.formulario_codigo} value={c.formulario_codigo}>
                    [{c.pop_codigo}] {c.formulario_codigo} — {c.titulo} (
                    {c.origem === 'customizado' ? 'Criado pelo Cliente' : 'Padrão IN 04'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Auto Controle (POP)</Label>
                <Input
                  value={formPopCodigo}
                  onChange={(e) => setFormPopCodigo(e.target.value)}
                  className="h-9 text-xs font-mono font-bold bg-stone-50"
                  readOnly
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Título na Programação *
                </Label>
                <Input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Periodicidade Obrigatória *
                </Label>
                <select
                  value={formPeriodicidade}
                  onChange={(e) => setFormPeriodicidade(e.target.value as any)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="diaria">Diária (Todos os dias de produção)</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensal">Mensal</option>
                  <option value="anual">Anual</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Turno de Execução</Label>
                <select
                  value={formTurno}
                  onChange={(e) => setFormTurno(e.target.value)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="Manhã">1º Turno (Manhã)</option>
                  <option value="Tarde">2º Turno (Tarde)</option>
                  <option value="Noite">3º Turno (Noite)</option>
                  <option value="Qualquer">Qualquer Turno</option>
                </select>
              </div>
            </div>

            {formPeriodicidade === 'semanal' && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Dias da Semana Exigidos:
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { d: 1, l: 'Seg' },
                    { d: 2, l: 'Ter' },
                    { d: 3, l: 'Qua' },
                    { d: 4, l: 'Qui' },
                    { d: 5, l: 'Sex' },
                    { d: 6, l: 'Sáb' },
                    { d: 0, l: 'Dom' },
                  ].map((item) => (
                    <label key={item.d} className="flex items-center gap-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formDiasSemana.includes(item.d)}
                        onChange={(e) => {
                          if (e.target.checked) setFormDiasSemana([...formDiasSemana, item.d])
                          else setFormDiasSemana(formDiasSemana.filter((x) => x !== item.d))
                        }}
                        className="rounded text-[#2D6A4F]"
                      />
                      <span>{item.l}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formPeriodicidade === 'mensal' && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Dia do Mês (1 a 31):</Label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formDiaMes}
                  onChange={(e) => setFormDiaMes(parseInt(e.target.value) || 1)}
                  className="h-9 text-xs"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Data de Início da Exigência *
                </Label>
                <Input
                  type="date"
                  value={formDataInicio}
                  onChange={(e) => setFormDataInicio(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Data Término (Opcional)
                </Label>
                <Input
                  type="date"
                  value={formDataFim}
                  onChange={(e) => setFormDataFim(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Setor / Linha</Label>
                <Input
                  value={formSetor}
                  onChange={(e) => setFormSetor(e.target.value)}
                  placeholder="Ex: Mistura, Ensaque, Expedição"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Responsável / Cargo</Label>
                <Input
                  value={formResponsavelCargo}
                  onChange={(e) => setFormResponsavelCargo(e.target.value)}
                  placeholder="Ex: Operador de Linha, Analista de CQ"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNovoAgendamento(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoAgendamento}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs"
              >
                {salvandoAgendamento ? 'Salvando...' : 'Salvar no Cronograma'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Impressão de Registro */}
      {selectedRecordForPdf && (
        <RecordDocumentPdfModal
          open={openPdfModal}
          onOpenChange={setOpenPdfModal}
          record={selectedRecordForPdf}
          procedure={procedures.find((p) => p.id === selectedRecordForPdf.procedure)}
        />
      )}

      {/* Modal de Preenchimento / Revalidação */}
      {procedureParaPreencher && formParaPreencher && (
        <PopCustomRecordFillModal
          open={openFillModal}
          onOpenChange={setOpenFillModal}
          procedure={procedureParaPreencher}
          form={formParaPreencher}
          onRecordCreated={() => {
            loadData()
            setOpenFillModal(false)
          }}
        />
      )}
    </div>
  )
}
