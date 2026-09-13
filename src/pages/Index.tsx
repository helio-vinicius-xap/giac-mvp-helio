import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileCheck2,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  getDashboardSummary,
  getNonConformities,
  getAudits,
  getCompany,
} from '@/services/agroService'
import { useRealtime } from '@/hooks/use-realtime'
import type { Company } from '@/types/agro'
import { Building2, FileCheck } from 'lucide-react'

export default function Index() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    indicators: {
      active_procedures: 9,
      records_month: 5,
      open_ncs: 1,
      open_critical_ncs: 0,
      completed_audits: 0,
    },
    nc_status_distribution: {
      aberta: 1,
      em_andamento: 0,
      fechada: 1,
    },
    records_by_procedure: [],
    recent_ncs: [],
    next_audits: [],
  })

  const [quickLote, setQuickLote] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  const loadData = async () => {
    try {
      const [summary, comp] = await Promise.all([
        getDashboardSummary().catch(() => null),
        getCompany().catch(() => null),
      ])
      if (comp) setCompany(comp)
      if (summary && (summary as any).indicators) {
        setData(summary)
      } else {
        // Fallback directly from client collections
        const ncs = await getNonConformities()
        const audits = await getAudits()
        setData((prev: any) => ({
          ...prev,
          recent_ncs: ncs.slice(0, 5),
          next_audits: audits.slice(0, 5),
        }))
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('records', () => loadData())
  useRealtime('non_conformities', () => loadData())
  useRealtime('audits', () => loadData())
  useRealtime('procedures', () => loadData())

  const handleQuickLote = (e: React.FormEvent) => {
    e.preventDefault()
    if (quickLote.trim()) {
      navigate(`/rastreabilidade?lote=${encodeURIComponent(quickLote.trim())}`)
    }
  }

  // Calendar generation for the month
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const prevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1))
  }
  const nextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1))
  }

  // Pre-calculated chart bars colors
  const barColors = [
    '#2D6A4F', // Forest Green
    '#D9A404', // Amber
    '#8B5A2B', // Earth Brown
    '#0D9488', // Teal
    '#2563EB', // Blue
    '#7C3AED', // Purple
  ]

  const totalNCs =
    (data.nc_status_distribution?.aberta || 0) +
    (data.nc_status_distribution?.em_andamento || 0) +
    (data.nc_status_distribution?.fechada || 0)

  const pctAberta =
    totalNCs > 0 ? ((data.nc_status_distribution?.aberta || 0) / totalNCs) * 100 : 33
  const pctAndamento =
    totalNCs > 0 ? ((data.nc_status_distribution?.em_andamento || 0) / totalNCs) * 100 : 33
  const pctFechada =
    totalNCs > 0 ? ((data.nc_status_distribution?.fechada || 0) / totalNCs) * 100 : 34

  const todayStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold bg-[#D9A404] text-[#1B4332] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SIPEAGRO / MAPA
            </span>
            {company?.numero_registro_mapa && (
              <Badge
                variant="outline"
                className="text-xs font-mono font-bold text-[#2D6A4F] border-[#2D6A4F]"
              >
                MAPA: {company.numero_registro_mapa}
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="bg-emerald-50 text-[#2D6A4F] border-emerald-200 text-xs"
            >
              Perfil: {user?.role || 'RT'} - {user?.name}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Sora'] text-[#2D6A4F]">
            {company?.razao_social || 'NutriAgro Nutrição Animal Ltda.'}
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
            {todayStr} • RT: <strong>{company?.rt_nome || 'Dr. Hélio Silva'}</strong> (
            {company?.rt_registro_conselho || 'CRMV-SP 18.420'}) • RE:{' '}
            <strong>{company?.re_nome || 'Carlos Eduardo Prado'}</strong>
          </p>
        </div>

        {/* Quick Traceability Widget */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <form
            onSubmit={handleQuickLote}
            className="flex items-center gap-2 bg-[#FAF7EF] p-2 rounded-xl border border-[#E2DCCF] w-full sm:w-auto"
          >
            <Search className="h-4 w-4 text-stone-400 ml-2 shrink-0" />
            <Input
              value={quickLote}
              onChange={(e) => setQuickLote(e.target.value)}
              placeholder="Digite nº do lote..."
              className="h-8 text-xs bg-transparent border-0 focus-visible:ring-0 shadow-none w-full sm:w-36"
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs px-3"
            >
              Rastrear
            </Button>
          </form>

          <Button
            size="sm"
            onClick={() => navigate('/empresa')}
            variant="outline"
            className="h-10 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5 shrink-0"
          >
            <Building2 className="h-4 w-4 text-[#2D6A4F]" />
            SIPEAGRO
          </Button>
        </div>
      </div>

      {/* 2. Four Indicator Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div
          onClick={() => navigate('/procedimentos')}
          className="agro-card p-5 cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Procedimentos Ativos
            </span>
            <p className="text-3xl font-bold text-[#2D6A4F] mt-1">
              {data.indicators?.active_procedures || 9}
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">POPs documentados</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-100/70 text-[#2D6A4F] flex items-center justify-center">
            <FileCheck2 className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => navigate('/registros')}
          className="agro-card p-5 cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Registros no Mês
            </span>
            <p className="text-3xl font-bold text-[#2563EB] mt-1">
              {data.indicators?.records_month || 0}
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">Monitoramentos de PCC</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-100/70 text-[#2563EB] flex items-center justify-center">
            <ClipboardList className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => navigate('/nao-conformidades')}
          className="agro-card p-5 cursor-pointer flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                NCs Abertas
              </span>
              {(data.indicators?.open_ncs || 0) > 0 && (
                <span className="h-2 w-2 rounded-full bg-[#B91C1C] animate-pulse-badge" />
              )}
            </div>
            <p className="text-3xl font-bold text-[#B91C1C] mt-1">
              {data.indicators?.open_ncs || 0}
            </p>
            <span className="text-[11px] text-red-600/80 mt-1 block">
              {data.indicators?.open_critical_ncs || 0} crítica(s)
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-100/70 text-[#B91C1C] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => navigate('/auditorias')}
          className="agro-card p-5 cursor-pointer flex items-center justify-between"
        >
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Auditorias Concluídas
            </span>
            <p className="text-3xl font-bold text-[#D9A404] mt-1">
              {data.indicators?.completed_audits || 0}
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">TF-Autocontroles MAPA</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-100/70 text-[#D9A404] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Charts Row: Records by Procedure (Bar) & NC Status (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bars: Registros por Procedimento (2 cols) */}
        <div className="lg:col-span-2 agro-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
            <div>
              <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                Registros por Procedimento (Últimos 30 dias)
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Monitoramento sistemático de parâmetros operacionais
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/registros')}
              className="text-xs border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10"
            >
              Ver todos
            </Button>
          </div>

          <div className="mt-6 space-y-3.5">
            {!data.records_by_procedure || data.records_by_procedure.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500">
                Carregando histórico de monitoramentos...
              </div>
            ) : (
              data.records_by_procedure.slice(0, 6).map((item: any, idx: number) => {
                const maxVal = Math.max(
                  ...data.records_by_procedure.map((r: any) => r.total || 0),
                  1,
                )
                const widthPct = Math.max(((item.total || 0) / maxVal) * 100, 6)
                const color = barColors[idx % barColors.length]

                return (
                  <div key={item.codigo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 truncate max-w-[70%]">
                        <span className="text-[#2D6A4F] font-bold mr-1.5">{item.codigo}</span>
                        {item.nome}
                      </span>
                      <span className="font-bold text-stone-700">{item.total || 0} registros</span>
                    </div>
                    <div className="h-3 w-full bg-[#FAF7EF] rounded-full overflow-hidden border border-[#E2DCCF]">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Donut: Status de Não Conformidades (1 col) */}
        <div className="agro-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
              Status de Não Conformidades
            </h2>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Distribuição do plano de ação</p>

            {/* Circular Donut Visualization via CSS conic-gradient */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div
                className="relative h-44 w-44 rounded-full flex items-center justify-center shadow-inner transition-transform duration-500"
                style={{
                  background: `conic-gradient(
                    #B91C1C 0% ${pctAberta}%,
                    #D9A404 ${pctAberta}% ${pctAberta + pctAndamento}%,
                    #2E8B57 ${pctAberta + pctAndamento}% 100%
                  )`,
                }}
              >
                {/* Donut Hole */}
                <div className="h-28 w-28 rounded-full bg-white flex flex-col items-center justify-center text-center shadow-sm">
                  <span className="text-2xl font-bold font-['Sora'] text-[#2B2B2B]">
                    {totalNCs}
                  </span>
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
                    Total de NCs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-[#E2DCCF] text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#B91C1C]" />
                <span className="text-stone-700 font-medium">Abertas</span>
              </div>
              <span className="font-bold text-stone-900">
                {data.nc_status_distribution?.aberta || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#D9A404]" />
                <span className="text-stone-700 font-medium">Em Andamento</span>
              </div>
              <span className="font-bold text-stone-900">
                {data.nc_status_distribution?.em_andamento || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#2E8B57]" />
                <span className="text-stone-700 font-medium">Fechadas / Eficazes</span>
              </div>
              <span className="font-bold text-stone-900">
                {data.nc_status_distribution?.fechada || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row: Recent Non-Conformities & Upcoming Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela NCs Recentes */}
        <div className="agro-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#B91C1C]" />
              Não Conformidades Recentes
            </h2>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/nao-conformidades')}
              className="text-xs text-[#2D6A4F] font-semibold p-0"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 font-semibold uppercase">
                  <th className="py-2 px-2">Código</th>
                  <th className="py-2 px-2">Descrição</th>
                  <th className="py-2 px-2">Criticidade</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF7EF]">
                {!data.recent_ncs || data.recent_ncs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-400">
                      Nenhuma não conformidade registrada.
                    </td>
                  </tr>
                ) : (
                  data.recent_ncs.map((nc: any) => (
                    <tr
                      key={nc.id}
                      onClick={() => navigate(`/nao-conformidades/${nc.id}`)}
                      className="hover:bg-[#FAF7EF] cursor-pointer transition"
                    >
                      <td className="py-2.5 px-2 font-bold text-[#2D6A4F] whitespace-nowrap">
                        {nc.codigo}
                      </td>
                      <td className="py-2.5 px-2 text-stone-800 line-clamp-1 max-w-[200px]">
                        {nc.descricao}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant="outline"
                          className={
                            nc.classificacao === 'Crítica'
                              ? 'bg-red-50 text-[#B91C1C] border-red-200'
                              : nc.classificacao === 'Maior'
                                ? 'bg-amber-50 text-[#D9A404] border-amber-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          }
                        >
                          {nc.classificacao || 'Maior'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <Badge
                          className={
                            nc.status === 'Aberta'
                              ? 'bg-[#B91C1C] text-white'
                              : nc.status === 'Em Andamento'
                                ? 'bg-[#D9A404] text-[#1B4332]'
                                : 'bg-[#2E8B57] text-white'
                          }
                        >
                          {nc.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela Próximas Auditorias */}
        <div className="agro-card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
              Cronograma de Auditorias Internas
            </h2>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/auditorias')}
              className="text-xs text-[#2D6A4F] font-semibold p-0"
            >
              Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 font-semibold uppercase">
                  <th className="py-2 px-2">Código</th>
                  <th className="py-2 px-2">Data</th>
                  <th className="py-2 px-2">Área / Processo</th>
                  <th className="py-2 px-2">Auditor</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF7EF]">
                {!data.next_audits || data.next_audits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400">
                      Nenhuma auditoria programada.
                    </td>
                  </tr>
                ) : (
                  data.next_audits.map((aud: any) => (
                    <tr
                      key={aud.id}
                      onClick={() => navigate(`/auditorias/${aud.id}`)}
                      className="hover:bg-[#FAF7EF] cursor-pointer transition"
                    >
                      <td className="py-2.5 px-2 font-bold text-[#2D6A4F] whitespace-nowrap">
                        {aud.codigo}
                      </td>
                      <td className="py-2.5 px-2 text-stone-700 whitespace-nowrap">
                        {aud.data ? new Date(aud.data).toLocaleDateString('pt-BR') : 'A definir'}
                      </td>
                      <td className="py-2.5 px-2 text-stone-800 line-clamp-1 max-w-[160px]">
                        {aud.area_processo || 'Geral BPF'}
                      </td>
                      <td className="py-2.5 px-2 text-stone-600 truncate max-w-[120px]">
                        {aud.auditor || 'Equipe Interna'}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className={
                            aud.status === 'Concluída'
                              ? 'bg-emerald-100 text-[#2D6A4F]'
                              : aud.status === 'Em Andamento'
                                ? 'bg-amber-100 text-[#B8860B]'
                                : 'bg-stone-200 text-stone-700'
                          }
                        >
                          {aud.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Calendário de Conformidade */}
      <div className="agro-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2DCCF] gap-3">
          <div>
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2D6A4F]" />
              Calendário de Conformidade & Prazos Regulatórios
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Acompanhamento de prazos de auditorias e resolução de Não Conformidades
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D9A404]" />
                <span className="text-stone-600">Auditoria</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#B91C1C]" />
                <span className="text-stone-600">Prazo NC</span>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF7EF] p-1 rounded-lg border border-[#E2DCCF]">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-stone-200 text-stone-700 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold px-2 min-w-[120px] text-center">
                {monthNames[month]} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-stone-200 text-stone-700 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
            <div
              key={d}
              className="py-1.5 font-bold text-stone-500 uppercase tracking-wider text-[11px]"
            >
              {d}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 rounded-lg bg-stone-50/50" />
          ))}

          {/* Days of month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1
            // Simulated / real indicators
            const hasAudit = dayNum === 8 || dayNum === 22
            const hasNCDeadline = dayNum === 15 || dayNum === 29

            return (
              <div
                key={`day-${dayNum}`}
                className="h-16 p-1.5 rounded-lg border border-[#E2DCCF]/60 bg-white hover:border-[#2D6A4F] transition flex flex-col justify-between text-left"
              >
                <span className="font-semibold text-stone-700 text-xs">{dayNum}</span>
                <div className="flex flex-wrap gap-1">
                  {hasAudit && (
                    <span
                      title="Auditoria agendada"
                      className="h-2 w-2 rounded-full bg-[#D9A404]"
                    />
                  )}
                  {hasNCDeadline && (
                    <span
                      title="Prazo limite de Não Conformidade"
                      className="h-2 w-2 rounded-full bg-[#B91C1C]"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
