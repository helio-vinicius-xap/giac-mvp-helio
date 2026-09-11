import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  FileCheck2,
  ClipboardList,
  ShieldCheck,
  GitFork,
  AlertTriangle,
  GraduationCap,
  FolderTree,
  LogOut,
  Bell,
  PlusCircle,
  Menu,
  X,
  Wheat,
  UserCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createAudit, getNonConformities, getNotificationsSummary } from '@/services/agroService'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openAuditModal, setOpenAuditModal] = useState(false)
  const [openNCsCount, setOpenNCsCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<any[]>([])

  // Form for quick audit
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditForm, setAuditForm] = useState({
    data: new Date().toISOString().split('T')[0],
    tipo: 'Interna',
    area_processo: 'BPF e Higienização Geral',
    auditor: user?.name || 'Hélio - Auditor Líder',
    status: 'Programada',
    escopo: 'Auditoria de verificação periódica conforme IN 04/2007 e TF-Autocontroles.',
  })

  // Load notifications and open NC count
  const loadAlerts = async () => {
    try {
      const ncs = await getNonConformities("(status = 'Aberta' || status = 'Em Andamento')")
      setOpenNCsCount(ncs.length)

      const notifData: any = await getNotificationsSummary().catch(() => null)
      if (notifData && notifData.alerts) {
        setNotifications(notifData.alerts)
      } else {
        // Fallback from non-conformities
        const fallback = ncs.slice(0, 5).map((n) => ({
          tipo: 'nc_aberta',
          titulo: `NC Aberta: ${n.codigo}`,
          descricao: n.descricao,
          prazo: n.prazo,
          link: `/nao-conformidades/${n.id}`,
        }))
        setNotifications(fallback)
      }
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [location.pathname])

  // Realtime updates on non-conformities & audits
  useRealtime('non_conformities', () => {
    loadAlerts()
  })
  useRealtime('audits', () => {
    loadAlerts()
  })

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuditLoading(true)
    try {
      const created = await createAudit({
        codigo: '', // Hook will auto-generate AUD-xxx
        data: `${auditForm.data} 00:00:00.000Z`,
        tipo: auditForm.tipo as any,
        area_processo: auditForm.area_processo,
        auditor: auditForm.auditor,
        status: auditForm.status as any,
        escopo: auditForm.escopo,
        checklist: {
          planejamento: {
            item48_programa_documentado: true,
            item49_equipe_qualificada: true,
          },
          itens: {},
        },
      })
      toast({
        title: 'Auditoria criada com sucesso',
        description: `Código ${created.codigo || 'AUD'} registrado.`,
      })
      setOpenAuditModal(false)
      navigate(`/auditorias/${created.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao criar auditoria',
        description: err.message || 'Verifique os dados.',
        variant: 'destructive',
      })
    } finally {
      setAuditLoading(false)
    }
  }

  const navItems = [
    { label: 'Visão Geral', path: '/', icon: LayoutDashboard },
    { label: 'Procedimentos', path: '/procedimentos', icon: FileCheck2 },
    { label: 'Registros', path: '/registros', icon: ClipboardList },
    { label: 'Auditorias', path: '/auditorias', icon: ShieldCheck },
    { label: 'Rastreabilidade', path: '/rastreabilidade', icon: GitFork },
    {
      label: 'Não Conformidades',
      path: '/nao-conformidades',
      icon: AlertTriangle,
      badge: openNCsCount,
    },
    { label: 'Treinamentos', path: '/treinamentos', icon: GraduationCap },
    { label: 'Documentos', path: '/documentos', icon: FolderTree },
  ]

  const getPageTitle = () => {
    const p = location.pathname
    if (p === '/') return 'Visão Geral do Autocontrole'
    if (p.startsWith('/procedimentos')) return 'Gestão de Procedimentos (POPs)'
    if (p.startsWith('/registros')) return 'Registros de Monitoramento'
    if (p.startsWith('/auditorias')) return 'Auditorias Internas (MAPA)'
    if (p.startsWith('/rastreabilidade')) return 'Painel de Rastreabilidade e Recall'
    if (p.startsWith('/nao-conformidades')) return 'Gestão de Não Conformidades'
    if (p.startsWith('/treinamentos')) return 'Capacitação e Treinamentos'
    if (p.startsWith('/documentos')) return 'Repositório de Documentos'
    return 'Gestão Agro APPCC'
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F5F1E8]">
      {/* DESKTOP SIDEBAR (280px) */}
      <aside className="hidden lg:flex w-[280px] flex-col justify-between bg-gradient-to-b from-[#2D6A4F] to-[#1B4332] text-white shrink-0 shadow-xl z-20">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-emerald-800/60">
            <div className="h-10 w-10 rounded-lg bg-[#D9A404] flex items-center justify-center text-[#1B4332] shadow-md">
              <Wheat className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-['Sora'] tracking-tight text-white leading-tight">
                Gestão Agro
              </h1>
              <span className="text-xs font-medium text-emerald-200/90 tracking-wide uppercase">
                APPCC • IN 04/2007
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#D9A404] text-[#1B4332] font-semibold shadow-md'
                      : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${isActive ? 'text-[#1B4332]' : 'text-emerald-200'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        isActive
                          ? 'bg-[#B91C1C] text-white'
                          : 'bg-[#B91C1C] text-white animate-pulse-badge'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User profile bottom */}
        <div className="p-4 border-t border-emerald-800/60 bg-[#173a2b]/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-full bg-[#D9A404] text-[#1B4332] flex items-center justify-center font-bold text-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Hélio'}</p>
                <p className="text-[11px] text-emerald-200/80 truncate">
                  {user?.cargo || 'Responsável Técnico'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Encerrar sessão"
              className="p-1.5 rounded-md text-emerald-200 hover:text-white hover:bg-white/10 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-[280px] bg-gradient-to-b from-[#2D6A4F] to-[#1B4332] text-white h-full shadow-2xl p-4 justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-emerald-800/60">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[#D9A404] flex items-center justify-center text-[#1B4332]">
                    <Wheat className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-base font-['Sora']">Gestão Agro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-emerald-200 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path)

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                        isActive
                          ? 'bg-[#D9A404] text-[#1B4332] font-semibold'
                          : 'text-emerald-50 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-xs bg-[#B91C1C] text-white px-2 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold">{user?.name || 'Hélio'}</p>
                <p className="text-[11px] text-emerald-300">{user?.cargo || 'Resp. Técnico'}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-emerald-200 hover:text-white hover:bg-white/10"
              >
                <LogOut className="h-4 w-4 mr-1" /> Sair
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* HEADER (64px) */}
        <header className="h-16 bg-white border-b border-[#E2DCCF] px-4 sm:px-6 flex items-center justify-between shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md text-[#2B2B2B] hover:bg-stone-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#2D6A4F] truncate">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative p-2 rounded-full hover:bg-stone-100 text-[#2B2B2B] transition"
                  title="Notificações e Pendências"
                >
                  <Bell className="h-5 w-5 text-stone-700" />
                  {openNCsCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 bg-[#B91C1C] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-badge">
                      {openNCsCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 border-[#E2DCCF] shadow-lg" align="end">
                <div className="p-3 bg-[#2D6A4F] text-white rounded-t-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Alertas de Autocontrole
                    </span>
                    <Badge variant="secondary" className="bg-[#D9A404] text-[#1B4332] text-[10px]">
                      {openNCsCount} pendente(s)
                    </Badge>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2 divide-y divide-stone-100">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-xs text-center text-stone-500">
                      Nenhuma pendência crítica ou NC vencida no momento.
                    </p>
                  ) : (
                    notifications.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (item.link) navigate(item.link)
                        }}
                        className="p-2.5 hover:bg-stone-50 rounded cursor-pointer transition text-left"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#B91C1C] truncate">
                            {item.titulo}
                          </p>
                          {item.prazo && (
                            <span className="text-[10px] text-stone-400">
                              {new Date(item.prazo).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-2 mt-0.5">
                          {item.descricao}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-stone-100 bg-stone-50 text-center">
                  <button
                    onClick={() => navigate('/nao-conformidades')}
                    className="text-xs font-medium text-[#2D6A4F] hover:underline"
                  >
                    Ver todas as Não Conformidades
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Nova Auditoria CTA */}
            <Button
              onClick={() => setOpenAuditModal(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs sm:text-sm shadow-sm gap-1.5 h-9"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Nova Auditoria</span>
            </Button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F5F1E8]">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>

          {/* Minimalist Agro Footer */}
          <footer className="mt-12 text-center text-xs text-[#6B6B6B] py-4 border-t border-[#E2DCCF]">
            <p>
              © {new Date().getFullYear()} Gestão Agro Documental • Sistema de Autocontroles para
              Alimentação Animal (IN 04/2007 MAPA & Decreto 12.031/2024). v2.4.0
            </p>
          </footer>
        </main>
      </div>

      {/* MODAL: NOVA AUDITORIA */}
      <Dialog open={openAuditModal} onOpenChange={setOpenAuditModal}>
        <DialogContent className="sm:max-w-[540px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#D9A404]" />
              Agendar Nova Auditoria Interna
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Iniciação de auditoria conforme o Termo de Fiscalização TF-Autocontroles (MAPA Módulo
              I/VII).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAudit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="audit_data" className="text-xs font-semibold text-stone-700">
                  Data Agendada
                </Label>
                <Input
                  id="audit_data"
                  type="date"
                  value={auditForm.data}
                  onChange={(e) => setAuditForm({ ...auditForm, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="audit_tipo" className="text-xs font-semibold text-stone-700">
                  Tipo de Auditoria
                </Label>
                <Select
                  value={auditForm.tipo}
                  onValueChange={(val) => setAuditForm({ ...auditForm, tipo: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interna">Interna (Autocontrole)</SelectItem>
                    <SelectItem value="Externa">Externa (Oficial MAPA / Certificação)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="audit_area" className="text-xs font-semibold text-stone-700">
                  Área / Processo
                </Label>
                <Input
                  id="audit_area"
                  value={auditForm.area_processo}
                  onChange={(e) => setAuditForm({ ...auditForm, area_processo: e.target.value })}
                  placeholder="Ex: Peletização e Ensaque"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="audit_auditor" className="text-xs font-semibold text-stone-700">
                  Auditor Responsável
                </Label>
                <Input
                  id="audit_auditor"
                  value={auditForm.auditor}
                  onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}
                  placeholder="Nome do Auditor Líder"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="audit_escopo" className="text-xs font-semibold text-stone-700">
                Escopo e Objetivos
              </Label>
              <Textarea
                id="audit_escopo"
                rows={3}
                value={auditForm.escopo}
                onChange={(e) => setAuditForm({ ...auditForm, escopo: e.target.value })}
                placeholder="Descreva o escopo da avaliação e setores envolvidos..."
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenAuditModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={auditLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold"
              >
                {auditLoading ? 'Criando...' : 'Iniciar Auditoria'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
