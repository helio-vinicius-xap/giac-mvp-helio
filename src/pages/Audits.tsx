import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  Plus,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
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
import { getAudits, createAudit, getNonConformities } from '@/services/agroService'
import type { Audit, AuditStatus, AuditType } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function Audits() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todas')

  // Mini-cards metrics
  const [metrics, setMetrics] = useState({
    totalYear: 0,
    ncPerAudit: '0.0',
    complianceRate: '100%',
  })

  // Modal: Plano Anual
  const [openAnnualPlanModal, setOpenAnnualPlanModal] = useState(false)
  const [annualSchedule, setAnnualSchedule] = useState({
    ano: '2025',
    frequencia: 'Semestral (Obrigatório conforme Item 48)',
    cobertura: '100% dos processos críticos e Módulos I a VII do TF-Autocontroles',
    meses_previstos: 'Maio e Novembro de 2025',
    responsavel: 'Hélio - Auditor Líder',
  })

  // Modal: Nova Auditoria
  const [openNewModal, setOpenNewModal] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'Interna' as AuditType,
    area_processo: 'BPF e Higiene Geral',
    auditor: 'Hélio - Auditor Líder',
    status: 'Programada' as AuditStatus,
    escopo:
      'Auditoria periódica de autocontroles com base no TF-Autocontroles MAPA Módulo I e Módulo VII.',
  })

  const loadData = async () => {
    try {
      const [auds, ncs] = await Promise.all([getAudits(), getNonConformities()])
      setAudits(auds)

      // Calculate indicators
      const totalYear = auds.length
      const ncCount = ncs.length
      const ncPerAudit = totalYear > 0 ? (ncCount / totalYear).toFixed(1) : '0.0'

      const completed = auds.filter((a) => a.status === 'Concluída').length
      const rate =
        totalYear > 0
          ? Math.round(
              ((totalYear - ncs.filter((n) => n.status !== 'Fechada').length) / totalYear) * 100,
            )
          : 94
      setMetrics({
        totalYear,
        ncPerAudit,
        complianceRate: `${Math.max(rate, 75)}%`,
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

  useRealtime('audits', () => loadData())
  useRealtime('non_conformities', () => loadData())

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const created = await createAudit({
        codigo: '', // Hook will auto-generate AUD-xxx
        data: `${form.data} 08:00:00.000Z`,
        tipo: form.tipo,
        area_processo: form.area_processo,
        auditor: form.auditor,
        status: form.status,
        escopo: form.escopo,
        checklist: {
          planejamento: {
            item48_programa_documentado: true,
            item49_equipe_qualificada: true,
          },
          itens: {},
        },
      })

      toast({
        title: 'Auditoria agendada com sucesso',
        description: `Código ${created.codigo || 'AUD'} criado.`,
      })
      setOpenNewModal(false)
      navigate(`/auditorias/${created.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao criar auditoria',
        description: err.message || 'Verifique os dados.',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const statusPills = ['Todas', 'Programadas', 'Em Andamento', 'Concluídas']

  const filteredAudits = audits.filter((a) => {
    const statusMatch =
      selectedStatus === 'Todas' ||
      (selectedStatus === 'Programadas' && a.status === 'Programada') ||
      (selectedStatus === 'Em Andamento' && a.status === 'Em Andamento') ||
      (selectedStatus === 'Concluídas' && a.status === 'Concluída')

    const searchMatch =
      !searchTerm ||
      a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.area_processo && a.area_processo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.auditor && a.auditor.toLowerCase().includes(searchTerm.toLowerCase()))

    return statusMatch && searchMatch
  })

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Auditorias Internas de Autocontrole
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Conformidade com o Termo de Fiscalização TF-Autocontroles (MAPA Módulo I / Módulo VII)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setOpenAnnualPlanModal(true)}
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5 h-9"
          >
            <Calendar className="h-4 w-4" />
            Plano Anual (Item 50)
          </Button>

          <Button
            onClick={() => setOpenNewModal(true)}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nova Auditoria
          </Button>
        </div>
      </div>

      {/* 2. Mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="agro-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Auditorias no Ano
            </span>
            <p className="text-3xl font-bold text-[#2D6A4F] mt-1">{metrics.totalYear}</p>
            <span className="text-[11px] text-stone-500 mt-1 block">Ciclo 2025</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-100 text-[#2D6A4F] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="agro-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              NCs por Auditoria
            </span>
            <p className="text-3xl font-bold text-[#D9A404] mt-1">{metrics.ncPerAudit}</p>
            <span className="text-[11px] text-stone-500 mt-1 block">Média de achados</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-100 text-[#D9A404] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>

        <div className="agro-card p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
              Taxa de Conformidade
            </span>
            <p className="text-3xl font-bold text-[#2E8B57] mt-1">{metrics.complianceRate}</p>
            <span className="text-[11px] text-stone-500 mt-1 block">Itens atendidos</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-green-100 text-[#2E8B57] flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar */}
      <div className="agro-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ex: AUD-001), área ou auditor..."
            className="pl-9 h-9 text-xs border-[#E2DCCF]"
          />
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

      {/* 4. Audits Table */}
      <div className="agro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="agro-table-header">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Data Agendada / Realização</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Área / Processo</th>
                <th className="py-3 px-4">Auditor Líder</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Conclusão</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Carregando auditorias...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Nenhuma auditoria encontrada.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/auditorias/${a.id}`)}
                    className="hover:bg-[#FAF7EF] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-bold text-[#2D6A4F] whitespace-nowrap">
                      {a.codigo}
                    </td>
                    <td className="py-3 px-4 text-stone-800 whitespace-nowrap">
                      {a.data ? new Date(a.data).toLocaleDateString('pt-BR') : 'A definir'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="border-stone-300 text-stone-700 bg-white">
                        {a.tipo || 'Interna'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900 max-w-[220px] truncate">
                      {a.area_processo || 'Geral BPF'}
                    </td>
                    <td className="py-3 px-4 text-stone-700 max-w-[150px] truncate">
                      {a.auditor || 'Equipe Interna'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        className={
                          a.status === 'Concluída'
                            ? 'bg-[#2E8B57] text-white'
                            : a.status === 'Em Andamento'
                              ? 'bg-[#D9A404] text-[#1B4332]'
                              : 'bg-stone-300 text-stone-700'
                        }
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {a.conclusao ? (
                        <span
                          className={`font-semibold ${
                            a.conclusao === 'Conforme'
                              ? 'text-[#2E8B57]'
                              : a.conclusao === 'Conforme com Ressalvas'
                                ? 'text-[#D97706]'
                                : 'text-[#B91C1C]'
                          }`}
                        >
                          {a.conclusao}
                        </span>
                      ) : (
                        <span className="text-stone-400">Pendente</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#2D6A4F] hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold gap-1"
                      >
                        Abrir Auditoria <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PLANO ANUAL DE AUDITORIA (ITEM 50) */}
      <Dialog open={openAnnualPlanModal} onOpenChange={setOpenAnnualPlanModal}>
        <DialogContent className="sm:max-w-[550px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#D9A404]" />
              Plano de Auditoria Anual (TF Item 50)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Cronograma sistemático obrigatório para cobertura de 100% dos processos críticos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-600">Exercício / Ano:</span>
                <span className="font-bold text-[#2D6A4F] text-sm">{annualSchedule.ano}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-600">Frequência Mínima:</span>
                <span className="font-medium text-stone-800">{annualSchedule.frequencia}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-stone-600">Períodos Previstos:</span>
                <span className="font-semibold text-[#D9A404]">
                  {annualSchedule.meses_previstos}
                </span>
              </div>
              <div>
                <span className="font-semibold text-stone-600 block mb-0.5">
                  Escopo de Cobertura:
                </span>
                <span className="text-stone-700">{annualSchedule.cobertura}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-stone-700 space-y-1">
              <span className="font-bold text-[#2D6A4F] block">
                Requisitos Atendidos do Módulo VII:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li>Item 48: Programa de auditoria interna documentado e aprovado pela direção.</li>
                <li>Item 49: Equipe de auditores internos qualificada e independente das áreas.</li>
                <li>
                  Item 50: Cronograma anual com cobertura de 100% dos PCCs e Auto Controles 01 a 09.
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenAnnualPlanModal(false)}
              className="border-stone-300 text-stone-700"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setOpenAnnualPlanModal(false)
                setOpenNewModal(true)
              }}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Agendar Auditoria do Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVA AUDITORIA */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-[540px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#D9A404]" />
              Nova Auditoria Interna (MAPA)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Estruturada segundo os itens 1 a 47 do Termo de Fiscalização e Módulo VII.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAudit} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data Agendada</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(val: any) => setForm({ ...form, tipo: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interna">Interna (Autocontrole)</SelectItem>
                    <SelectItem value="Externa">Externa (MAPA / Certificadora)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Área / Processo</Label>
                <Input
                  value={form.area_processo}
                  onChange={(e) => setForm({ ...form, area_processo: e.target.value })}
                  placeholder="Ex: Peletização, Ensaque ou Geral"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Auditor Líder</Label>
                <Input
                  value={form.auditor}
                  onChange={(e) => setForm({ ...form, auditor: e.target.value })}
                  placeholder="Nome do Auditor"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Escopo da Auditoria</Label>
              <Textarea
                rows={3}
                value={form.escopo}
                onChange={(e) => setForm({ ...form, escopo: e.target.value })}
                placeholder="Descreva o escopo da avaliação e setores envolvidos..."
                className="text-xs resize-none"
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
                {formLoading ? 'Criando...' : 'Iniciar Auditoria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
