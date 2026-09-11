import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getNonConformities, createNonConformity } from '@/services/agroService'
import type { NonConformity, NCClassification, NCOrigin, NCStatus } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function NonConformities() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [ncs, setNcs] = useState<NonConformity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('Todas')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Mini-cards
  const [metrics, setMetrics] = useState({
    criticalOpen: 0,
    closureRate: '0%',
  })

  // Modal: Nova NC
  const [openNewModal, setOpenNewModal] = useState(searchParams.get('nova') === 'true')
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    descricao: searchParams.get('desc') || '',
    classificacao: 'Maior' as NCClassification,
    origem: (searchParams.get('origem') as NCOrigin) || 'Registro',
    area: searchParams.get('area') || 'Produção',
    data_identificacao: new Date().toISOString().split('T')[0],
    prazo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Aberta' as NCStatus,
    responsavel: 'Hélio - Resp. Técnico',
    lote: searchParams.get('lote') || '',
  })

  const loadData = async () => {
    try {
      const data = await getNonConformities()
      setNcs(data)

      const critical = data.filter(
        (n) => n.status !== 'Fechada' && n.classificacao === 'Crítica',
      ).length
      const closed = data.filter((n) => n.status === 'Fechada').length
      const rate = data.length > 0 ? Math.round((closed / data.length) * 100) : 100

      setMetrics({
        criticalOpen: critical,
        closureRate: `${rate}%`,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('non_conformities', () => loadData())

  const handleCreateNC = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const created = await createNonConformity({
        codigo: '', // auto-generate NC-xxx
        descricao: form.descricao,
        classificacao: form.classificacao,
        origem: form.origem,
        area: form.area,
        data_identificacao: `${form.data_identificacao} 00:00:00.000Z`,
        prazo: `${form.prazo} 00:00:00.000Z`,
        status: form.status,
        responsavel: form.responsavel,
        lote: form.lote,
        procedure: searchParams.get('procId') || undefined,
        record: searchParams.get('recId') || undefined,
      })

      toast({
        title: 'Não Conformidade registrada',
        description: `Código ${created.codigo || 'NC'} criado com sucesso.`,
      })
      setOpenNewModal(false)
      navigate(`/nao-conformidades/${created.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar NC',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const statusPills = ['Todas', 'Abertas', 'Em Andamento', 'Fechadas']

  const filteredNCs = ncs.filter((n) => {
    const statusMatch =
      selectedStatus === 'Todas' ||
      (selectedStatus === 'Abertas' && n.status === 'Aberta') ||
      (selectedStatus === 'Em Andamento' && n.status === 'Em Andamento') ||
      (selectedStatus === 'Fechadas' && n.status === 'Fechada')

    const searchMatch =
      !searchTerm ||
      n.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.area && n.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (n.lote && n.lote.toLowerCase().includes(searchTerm.toLowerCase()))

    let dateMatch = true
    if (startDate) {
      dateMatch = dateMatch && new Date(n.data_identificacao) >= new Date(startDate)
    }
    if (endDate) {
      dateMatch = dateMatch && new Date(n.data_identificacao) <= new Date(`${endDate}T23:59:59`)
    }

    return statusMatch && searchMatch && dateMatch
  })

  // Trend data for last 6 months (mock-aligned with agro operations)
  const trendMonths = [
    { mes: 'Dez/24', menor: 1, maior: 2, critica: 0 },
    { mes: 'Jan/25', menor: 3, maior: 1, critica: 1 },
    { mes: 'Fev/25', menor: 2, maior: 3, critica: 0 },
    { mes: 'Mar/25', menor: 4, maior: 1, critica: 0 },
    { mes: 'Abr/25', menor: 2, maior: 2, critica: 1 },
    { mes: 'Mai/25', menor: 1, maior: 1, critica: 0 },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & New NC CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Registro Centralizado de Não Conformidades
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Gestão de desvios, ações corretivas, Ishikawa e verificação de eficácia (Itens 52 a 58)
          </p>
        </div>

        <Button
          onClick={() => setOpenNewModal(true)}
          className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Nova Não Conformidade
        </Button>
      </div>

      {/* 2. Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="agro-card p-5 flex items-center justify-between border-l-4 border-l-[#B91C1C]">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Abertas Críticas (Risco Imediato)
            </span>
            <p className="text-3xl font-bold text-[#B91C1C] mt-1">{metrics.criticalOpen}</p>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Exigem intervenção imediata da direção
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-red-100 text-[#B91C1C] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="agro-card p-5 flex items-center justify-between border-l-4 border-l-[#2E8B57]">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Taxa de Fechamento & Eficácia
            </span>
            <p className="text-3xl font-bold text-[#2E8B57] mt-1">{metrics.closureRate}</p>
            <span className="text-[11px] text-stone-500 mt-1 block">
              Planos validados após mín. 30 dias
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-100 text-[#2E8B57] flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="agro-card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (NC-001), descrição, setor ou lote..."
              className="pl-9 h-9 text-xs border-[#E2DCCF]"
            />
          </div>

          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-[11px] px-2"
              title="Data inicial"
            />
            <span className="text-stone-400 text-xs">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-[11px] px-2"
              title="Data final"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusPills.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                selectedStatus === st
                  ? 'bg-[#D9A404] text-[#1B4332] shadow-xs'
                  : 'bg-white text-stone-600 border border-[#E2DCCF] hover:bg-stone-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Non-Conformities Table */}
      <div className="agro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="agro-table-header">
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Descrição da Ocorrência</th>
                <th className="py-3 px-3">Classificação</th>
                <th className="py-3 px-3">Origem</th>
                <th className="py-3 px-3">Área / Setor</th>
                <th className="py-3 px-3">Identificação</th>
                <th className="py-3 px-3">Prazo Limite</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-500">
                    Carregando não conformidades...
                  </td>
                </tr>
              ) : filteredNCs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-500">
                    Nenhuma não conformidade encontrada para o filtro.
                  </td>
                </tr>
              ) : (
                filteredNCs.map((nc) => (
                  <tr
                    key={nc.id}
                    onClick={() => navigate(`/nao-conformidades/${nc.id}`)}
                    className="hover:bg-[#FAF7EF] cursor-pointer transition"
                  >
                    <td className="py-3 px-3 font-bold text-[#2D6A4F] whitespace-nowrap">
                      {nc.codigo}
                    </td>
                    <td className="py-3 px-3 font-medium text-stone-900 max-w-[260px] truncate">
                      {nc.descricao}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          nc.classificacao === 'Crítica'
                            ? 'bg-red-50 text-[#B91C1C] border-red-300 font-bold'
                            : nc.classificacao === 'Maior'
                              ? 'bg-amber-50 text-[#D9A404] border-amber-300 font-bold'
                              : 'bg-yellow-50 text-yellow-700 border-yellow-300 font-bold'
                        }
                      >
                        {nc.classificacao}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                      {nc.origem || 'Auditoria'}
                    </td>
                    <td className="py-3 px-3 text-stone-800 max-w-[140px] truncate">
                      {nc.area || 'Produção'}
                    </td>
                    <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                      {new Date(nc.data_identificacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 text-stone-700 whitespace-nowrap font-medium">
                      {nc.prazo ? new Date(nc.prazo).toLocaleDateString('pt-BR') : '30 dias'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
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
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#2D6A4F] hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold gap-1"
                      >
                        Ver Detalhe <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Tendência dos Últimos 6 Meses (Item 58: Análise de Tendências) */}
      <div className="agro-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
          <div>
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2D6A4F]" />
              Análise de Tendências e Histórico Semestral (Item 58)
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Evolução mensal da incidência por classificação de criticidade
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /> Menor (90d)
            </span>
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D9A404]" /> Maior (30d)
            </span>
            <span className="flex items-center gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full bg-[#B91C1C]" /> Crítica (Imediata)
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-6 gap-3 text-center">
          {trendMonths.map((m) => {
            const total = m.menor + m.maior + m.critica
            return (
              <div
                key={m.mes}
                className="p-3 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] flex flex-col justify-between h-36"
              >
                <span className="text-xs font-bold text-stone-800">{m.mes}</span>

                {/* Stacked visualization bars */}
                <div className="w-full flex flex-col justify-end items-center flex-1 py-2">
                  <div className="w-7 bg-white rounded overflow-hidden border border-stone-200 flex flex-col justify-end">
                    {m.critica > 0 && (
                      <div
                        style={{ height: `${m.critica * 20}px` }}
                        className="w-full bg-[#B91C1C]"
                        title={`Críticas: ${m.critica}`}
                      />
                    )}
                    {m.maior > 0 && (
                      <div
                        style={{ height: `${m.maior * 18}px` }}
                        className="w-full bg-[#D9A404]"
                        title={`Maiores: ${m.maior}`}
                      />
                    )}
                    {m.menor > 0 && (
                      <div
                        style={{ height: `${m.menor * 15}px` }}
                        className="w-full bg-yellow-400"
                        title={`Menores: ${m.menor}`}
                      />
                    )}
                  </div>
                </div>

                <span className="text-[11px] font-bold text-[#2D6A4F]">{total} ocorrências</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL: NOVA NÃO CONFORMIDADE */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-[560px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[#B91C1C]" />
              Abertura de Não Conformidade (NC)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Registro formal de desvio operacional, auditoria ou monitoramento de autocontrole.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNC} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Descrição Detalhada do Desvio
              </Label>
              <Textarea
                rows={3}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva detalhadamente o achado, limites excedidos ou falha operacional..."
                required
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Classificação de Criticidade
                </Label>
                <Select
                  value={form.classificacao}
                  onValueChange={(val: any) => setForm({ ...form, classificacao: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Crítica">Crítica (Risco imediato à inocuidade)</SelectItem>
                    <SelectItem value="Maior">Maior (Potencial risco / Falha BPF)</SelectItem>
                    <SelectItem value="Menor">Menor (Desvio sem risco imediato)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Origem da Identificação
                </Label>
                <Select
                  value={form.origem}
                  onValueChange={(val: any) => setForm({ ...form, origem: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auditoria">Auditoria Interna / Fiscal</SelectItem>
                    <SelectItem value="Registro">Registro de Monitoramento</SelectItem>
                    <SelectItem value="Reclamação">Reclamação de Cliente</SelectItem>
                    <SelectItem value="Recall">Simulado ou Recall Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Área / Setor Afetado</Label>
                <Input
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                  placeholder="Ex: Peletização, Silos, Misturador"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Lote Afetado (se houver)
                </Label>
                <Input
                  value={form.lote}
                  onChange={(e) => setForm({ ...form, lote: e.target.value })}
                  placeholder="Ex: LOTE-2025-045"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Data de Identificação
                </Label>
                <Input
                  type="date"
                  value={form.data_identificacao}
                  onChange={(e) => setForm({ ...form, data_identificacao: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Prazo de Resolução</Label>
                <Input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Responsável pela Abertura
              </Label>
              <Input
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                placeholder="Nome do Auditor ou Responsável Técnico"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold"
              >
                {formLoading ? 'Gravando...' : 'Salvar e Abrir Plano de Ação'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
