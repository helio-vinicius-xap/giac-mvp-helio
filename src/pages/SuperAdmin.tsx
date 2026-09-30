import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  ShieldAlert,
  Search,
  PlusCircle,
  Eye,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
  DollarSign,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Edit2,
  Save,
  RotateCcw,
  Globe2,
  Trash2,
} from 'lucide-react'
import {
  getFornecedoresValidadosList,
  superAdminAtualizarFornecedorValidado,
  superAdminExcluirFornecedorValidado,
} from '@/services/paasoService'
import type { FornecedorValidadoItem } from '@/types/paaso'
import { formatarCNPJ } from '@/lib/pop01Validators'
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
  getSuperAdminStats,
  getOrganizationsList,
  updateOrganization,
  createOrganization,
  getPlans,
  updatePlan,
  createPlan,
  getInvoices,
  simulateInvoicePayment,
  createBillingInvoice,
  getAuditLogs,
  purgeOrganizationData,
} from '@/services/agroService'
import { useToast } from '@/hooks/use-toast'

export default function SuperAdmin() {
  const { user, isSuperAdmin, startImpersonation } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [validados, setValidados] = useState<FornecedorValidadoItem[]>([])
  const [searchOrg, setSearchOrg] = useState('')
  const [searchValidado, setSearchValidado] = useState('')

  // Modal Edição Fornecedor Validado
  const [openEditValidadoModal, setOpenEditValidadoModal] = useState(false)
  const [selectedValidado, setSelectedValidado] = useState<FornecedorValidadoItem | null>(null)
  const [validadoEditForm, setValidadoEditForm] = useState<{
    status: 'VALIDADO' | 'EXPIRADO'
    validade_aprovacao: string
    categoria_de_risco: string
  }>({
    status: 'VALIDADO',
    validade_aprovacao: '',
    categoria_de_risco: '',
  })

  // Modais
  const [openNewOrgModal, setOpenNewOrgModal] = useState(false)
  const [openEditPlanModal, setOpenEditPlanModal] = useState(false)
  const [openNewPlanModal, setOpenNewPlanModal] = useState(false)
  const [openOrgDetailModal, setOpenOrgDetailModal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  // Modal Zerar Dados da Organização (Parte a)
  const [openPurgeModal, setOpenPurgeModal] = useState(false)
  const [orgToPurge, setOrgToPurge] = useState<any>(null)
  const [purgeStep, setPurgeStep] = useState<1 | 2>(1)
  const [purgeCnpjInput, setPurgeCnpjInput] = useState('')
  const [purgeKeywordInput, setPurgeKeywordInput] = useState('')
  const [purging, setPurging] = useState(false)

  // Forms
  const [orgForm, setOrgForm] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    status: 'ativa',
    plan: '',
    billing_email: '',
    billing_phone: '',
    custom_monthly_price: 0,
  })

  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    description: '',
    monthly_price: 0,
    interval: 'mensal',
    is_active: true,
  })

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [statsRes, orgsRes, plansRes, invoicesRes, logsRes, validsRes] = await Promise.all([
        getSuperAdminStats().catch(() => null),
        getOrganizationsList().catch(() => []),
        getPlans().catch(() => []),
        getInvoices().catch(() => []),
        getAuditLogs().catch(() => []),
        getFornecedoresValidadosList().catch(() => []),
      ])

      setStats(statsRes)
      setOrganizations(orgsRes)
      setPlans(plansRes)
      setInvoices(invoicesRes)
      setAuditLogs(logsRes)
      setValidados(validsRes)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar dados do painel master',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/')
      return
    }
    loadAllData()
  }, [isSuperAdmin])

  const filteredOrgs = organizations.filter((o) => {
    const q = searchOrg.toLowerCase()
    return (
      o.razao_social?.toLowerCase().includes(q) ||
      o.cnpj?.includes(q) ||
      o.nome_fantasia?.toLowerCase().includes(q)
    )
  })

  // Handlers Organização
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOrganization(orgForm)
      toast({
        title: 'Organização Criada',
        description: `Empresa ${orgForm.razao_social} cadastrada com sucesso.`,
      })
      setOpenNewOrgModal(false)
      loadAllData()
    } catch (err: any) {
      toast({
        title: 'Erro ao criar organização',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleUpdateOrgStatus = async (orgId: string, newStatus: string, reason = '') => {
    try {
      await updateOrganization(orgId, { status: newStatus, suspension_reason: reason })
      toast({
        title: 'Status Atualizado',
        description: `Organização definida como ${newStatus}.`,
      })
      loadAllData()
      if (selectedOrg && selectedOrg.id === orgId) {
        setSelectedOrg({ ...selectedOrg, status: newStatus })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Handlers Planos
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedPlan) {
        await updatePlan(selectedPlan.id, planForm)
        toast({
          title: 'Plano Atualizado',
          description: `Valor e regras de faturamento salvos com sucesso.`,
        })
        setOpenEditPlanModal(false)
      } else {
        await createPlan(planForm)
        toast({
          title: 'Plano Criado',
          description: `Novo plano adicionado ao catálogo do sistema.`,
        })
        setOpenNewPlanModal(false)
      }
      loadAllData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar plano',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Ações de Suporte (Entrar como Organização)
  const handleSupportLogin = async (org: any) => {
    try {
      await startImpersonation(org)
      toast({
        title: 'Modo Suporte Ativado',
        description: `Você está operando no contexto da empresa ${org.razao_social}.`,
      })
      navigate('/')
    } catch (err: any) {
      toast({
        title: 'Falha ao ativar modo suporte',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Fatura Manual e Simulação de Pagamento
  const handleSimulatePayment = async (invId: string) => {
    try {
      await simulateInvoicePayment(invId)
      toast({
        title: 'Pagamento Simulado com Sucesso',
        description: 'Fatura marcada como PAGA e assinatura reativada/renovada.',
      })
      loadAllData()
    } catch (err: any) {
      toast({
        title: 'Erro ao simular pagamento',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleGenerateInvoice = async (orgId: string) => {
    try {
      await createBillingInvoice({ organization_id: orgId })
      toast({
        title: 'Fatura Asaas Gerada',
        description: 'Fatura mensal criada com sucesso.',
      })
      loadAllData()
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar fatura',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Carregando painel de administração Master...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Master Header Banner com Diferencial Visual */}
      <div className="bg-gradient-to-r from-[#173a2b] via-[#1B4332] to-[#2D6A4F] text-white p-6 rounded-2xl shadow-lg border-2 border-[#D9A404]/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <ShieldAlert className="h-64 w-64 text-[#D9A404]" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-[#D9A404] text-[#1B4332]">
                Painel Super Admin Master
              </span>
              <span className="text-xs text-emerald-200">
                SaaS Multi-Cliente • Cobrança por CNPJ
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-['Sora'] tracking-tight">
              Controle Geral do Ecossistema GIAC
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
              Gerencie todas as fábricas clientes, configure planos e valores provisórios, simule ou
              processe faturamento via Asaas e acesse clientes pelo Modo Suporte.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setOpenNewOrgModal(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs gap-1.5 shadow-md h-10"
            >
              <PlusCircle className="h-4 w-4" />
              Nova Organização (CNPJ)
            </Button>
          </div>
        </div>
      </div>

      {/* 2. KPIs e Métricas Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orgs */}
        <div className="agro-card p-5 border-l-4 border-l-[#2D6A4F]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">Empresas / CNPJs</span>
            <Building2 className="h-5 w-5 text-[#2D6A4F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-['Sora'] text-[#1B4332]">
              {stats?.organizations?.total ?? organizations.length}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">
              {stats?.organizations?.active ?? 0} ativas
            </span>
          </div>
          <div className="mt-2 flex gap-1.5 text-[11px] text-stone-500">
            <span>{stats?.organizations?.trial ?? 0} em trial</span> •
            <span className="text-amber-700">{stats?.organizations?.suspended ?? 0} suspensas</span>
          </div>
        </div>

        {/* MRR Previsto */}
        <div className="agro-card p-5 border-l-4 border-l-[#D9A404]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">Receita Recorrente (MRR)</span>
            <TrendingUp className="h-5 w-5 text-[#D9A404]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-['Sora'] text-[#1B4332]">
              R$ {(stats?.billing?.mrr_previsto ?? 0).toFixed(2)}
            </span>
            <span className="text-[11px] text-stone-500">/mês previsto</span>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">
            Valores provisórios editáveis no catálogo de planos
          </p>
        </div>

        {/* Faturamento Recebido no Mês */}
        <div className="agro-card p-5 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">Recebido Este Mês</span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-['Sora'] text-emerald-800">
              R$ {(stats?.billing?.pagamentos_mes ?? 0).toFixed(2)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500">
            {stats?.billing?.faturas_pagas ?? 0} faturas confirmadas (Asaas)
          </div>
        </div>

        {/* Usuários Totais */}
        <div className="agro-card p-5 border-l-4 border-l-stone-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">Usuários no Sistema</span>
            <Users className="h-5 w-5 text-stone-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black font-['Sora'] text-stone-900">
              {stats?.total_users ?? 0}
            </span>
            <span className="text-[11px] text-stone-500">RT, RQ, RE e Operadores</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-700 font-semibold">
            Usuários ilimitados por CNPJ
          </p>
        </div>
      </div>

      {/* 3. Abas Principais de Gestão */}
      <Tabs defaultValue="organizacoes" className="w-full space-y-4">
        <TabsList className="bg-[#FAF7EF] p-1 border border-[#E2DCCF] rounded-xl">
          <TabsTrigger
            value="organizacoes"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <Building2 className="h-4 w-4" />
            Organizações ({organizations.length})
          </TabsTrigger>
          <TabsTrigger
            value="planos"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <Layers className="h-4 w-4" />
            Catálogo de Planos & Preços ({plans.length})
          </TabsTrigger>
          <TabsTrigger
            value="faturas"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <CreditCard className="h-4 w-4" />
            Faturamento Global ({invoices.length})
          </TabsTrigger>
          <TabsTrigger
            value="validados"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <Globe2 className="h-4 w-4 text-[#D9A404]" />
            Banco Global Fornecedor Validado ({validados.length})
          </TabsTrigger>
          <TabsTrigger
            value="auditoria"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg gap-1.5"
          >
            <ShieldCheck className="h-4 w-4" />
            Auditoria de Suporte
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: ORGANIZAÇÕES */}
        <TabsContent value="organizacoes" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2DCCF]">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
              <Input
                value={searchOrg}
                onChange={(e) => setSearchOrg(e.target.value)}
                placeholder="Buscar por Razão Social ou CNPJ..."
                className="pl-9 h-9 text-xs"
              />
            </div>
            <span className="text-xs text-stone-500">
              Mostrando {filteredOrgs.length} de {organizations.length} empresas
            </span>
          </div>

          <div className="agro-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-[#E2DCCF] text-stone-600 font-semibold">
                    <th className="p-3">Organização / CNPJ</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Plano Vinculado</th>
                    <th className="p-3">Vencimento / Trial</th>
                    <th className="p-3">Contato / Cobrança</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {filteredOrgs.map((org) => {
                    const planName = org.expand?.plan?.name || 'Plano Padrão'
                    const isTrial = org.status === 'trial'
                    const isSuspended = org.status === 'suspensa'
                    const isAtiva = org.status === 'ativa'

                    return (
                      <tr key={org.id} className="hover:bg-amber-50/40 transition">
                        <td className="p-3">
                          <p className="font-bold text-[#1B4332]">{org.razao_social}</p>
                          <p className="text-[11px] text-stone-500 font-mono">{org.cnpj}</p>
                          {org.nome_fantasia && (
                            <p className="text-[10px] text-stone-400 italic">
                              Fantasia: {org.nome_fantasia}
                            </p>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              isAtiva
                                ? 'bg-emerald-100 text-emerald-800'
                                : isTrial
                                  ? 'bg-amber-100 text-amber-800'
                                  : isSuspended
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-stone-100 text-stone-800'
                            }
                          >
                            {org.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-stone-700">{planName}</span>
                          {org.custom_monthly_price > 0 && (
                            <span className="block text-[10px] text-[#D9A404] font-bold">
                              R$ {org.custom_monthly_price.toFixed(2)} (Custom)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-stone-600">
                          {isTrial && org.trial_ends_at ? (
                            <span className="flex items-center gap-1 text-amber-700 font-medium">
                              <Clock className="h-3 w-3" />
                              Trial até: {new Date(org.trial_ends_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : org.subscription_due_date ? (
                            <span>
                              Vence:{' '}
                              {new Date(org.subscription_due_date).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-stone-400">Sem data definida</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px]">
                          <p className="text-stone-700">{org.billing_email || '-'}</p>
                          <p className="text-stone-400">{org.billing_phone || ''}</p>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Modo Suporte */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSupportLogin(org)}
                              className="h-8 text-[11px] border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold gap-1"
                              title="Entrar como esta organização para suporte técnico"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Modo Suporte
                            </Button>

                            {/* Gerar Fatura */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateInvoice(org.id)}
                              className="h-8 text-[11px] border-stone-300 text-stone-700 hover:bg-stone-50"
                              title="Gerar fatura mensal Asaas"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Fatura
                            </Button>

                            {/* Suspender / Reativar */}
                            {isSuspended ? (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateOrgStatus(org.id, 'ativa')}
                                className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Reativar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateOrgStatus(
                                    org.id,
                                    'suspensa',
                                    'Suspensão manual pelo Super Admin',
                                  )
                                }
                                className="h-8 text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50"
                              >
                                Suspender
                              </Button>
                            )}

                            {/* Ferramenta Zerar Dados da Organização (Parte a) */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setOrgToPurge(org)
                                setPurgeStep(1)
                                setPurgeCnpjInput('')
                                setPurgeKeywordInput('')
                                setOpenPurgeModal(true)
                              }}
                              className="h-8 text-[11px] border-red-300 text-red-700 hover:bg-red-50 font-semibold gap-1"
                              title="Excluir em massa todos os dados de negócio da organização"
                            >
                              <RotateCcw className="h-3.5 w-3.5 text-red-600" />
                              Zerar Dados
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: CATÁLOGO DE PLANOS & PREÇOS (EDITÁVEIS) */}
        <TabsContent value="planos" className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2DCCF]">
            <div>
              <h2 className="text-sm font-bold text-[#1B4332] font-['Sora']">
                Configuração de Planos do SaaS
              </h2>
              <p className="text-xs text-stone-600">
                Os preços foram iniciados como provisórios (R$ 0,00). O Super Admin pode editar o
                valor de cada plano a qualquer momento.
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedPlan(null)
                setPlanForm({
                  name: '',
                  code: '',
                  description: '',
                  monthly_price: 0,
                  interval: 'mensal',
                  is_active: true,
                })
                setOpenNewPlanModal(true)
              }}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs gap-1.5 h-9"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Plano
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="agro-card p-6 border-t-4 border-t-[#2D6A4F] flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-lg font-['Sora'] text-[#1B4332]">
                      {plan.name}
                    </span>
                    <Badge
                      className={
                        plan.is_active
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }
                    >
                      {plan.is_active ? 'ATIVO' : 'INATIVO'}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">{plan.description}</p>

                  <div className="mt-4 p-3 bg-stone-50 rounded-lg flex items-baseline justify-between border border-stone-200">
                    <span className="text-xs font-semibold text-stone-600">
                      Mensalidade por CNPJ:
                    </span>
                    <div className="text-right">
                      <span className="text-xl font-black font-['Sora'] text-[#2D6A4F]">
                        R$ {(plan.monthly_price || 0).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-stone-500 block">/mês por organização</span>
                    </div>
                  </div>

                  {plan.features && Array.isArray(plan.features) && (
                    <div className="mt-3 space-y-1">
                      <span className="text-[11px] font-bold text-stone-700 uppercase">
                        Recursos inclusos:
                      </span>
                      <ul className="text-xs text-stone-600 space-y-1 mt-1">
                        {plan.features.map((feat: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2DCCF] flex items-center justify-between">
                  <span className="text-[10px] text-stone-400 font-mono">Código: {plan.code}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPlan(plan)
                      setPlanForm({
                        name: plan.name,
                        code: plan.code,
                        description: plan.description || '',
                        monthly_price: plan.monthly_price || 0,
                        interval: plan.interval || 'mensal',
                        is_active: plan.is_active ?? true,
                      })
                      setOpenEditPlanModal(true)
                    }}
                    className="h-8 text-xs border-stone-300 gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Editar Preço / Dados
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: FATURAMENTO GLOBAL */}
        <TabsContent value="faturas" className="space-y-4">
          <div className="agro-card overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-[#E2DCCF] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Histórico Global de Faturas (Todas as Organizações)
                </h3>
                <p className="text-[11px] text-stone-500">
                  Acompanhe boletos e cartões emitidos via Asaas ou em modo de simulação.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-[#E2DCCF] text-stone-600 font-semibold">
                    <th className="p-3">Organização</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3">Forma</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ação de Teste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-500">
                        Nenhuma fatura registrada ainda.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-amber-50/30">
                        <td className="p-3 font-semibold text-stone-800">
                          {inv.expand?.organization?.razao_social || 'Organização'}
                        </td>
                        <td className="p-3 font-bold text-[#1B4332]">
                          R$ {(inv.amount || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-stone-600">
                          {new Date(inv.due_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">
                            {inv.billing_type || 'BOLETO'}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              inv.status === 'CONFIRMED' || inv.status === 'RECEIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {inv.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => handleSimulatePayment(inv.id)}
                              className="h-7 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                              title="Simular confirmação de pagamento do Asaas"
                            >
                              Simular Pagamento
                            </Button>
                          )}
                          {(inv.status === 'CONFIRMED' || inv.status === 'RECEIVED') && (
                            <span className="text-[11px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Pago
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: BANCO GLOBAL FORNECEDOR VALIDADO (SUPER ADMIN) */}
        <TabsContent value="validados" className="space-y-4">
          {/* Métricas do Banco Global */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="agro-card p-4 border-l-4 border-l-[#2D6A4F]">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">
                Total Homologados
              </span>
              <p className="text-2xl font-black font-['Sora'] text-[#1B4332] mt-1">
                {validados.length}
              </p>
              <span className="text-[10px] text-stone-500">Base compartilhada</span>
            </div>

            <div className="agro-card p-4 border-l-4 border-l-emerald-600">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">
                Validados Ativos
              </span>
              <p className="text-2xl font-black font-['Sora'] text-emerald-800 mt-1">
                {validados.filter((v) => v.status === 'VALIDADO').length}
              </p>
              <span className="text-[10px] text-stone-500">Dentro do prazo de 1 ano</span>
            </div>

            <div className="agro-card p-4 border-l-4 border-l-red-600">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">
                Expirados
              </span>
              <p className="text-2xl font-black font-['Sora'] text-red-700 mt-1">
                {validados.filter((v) => v.status === 'EXPIRADO').length}
              </p>
              <span className="text-[10px] text-stone-500">Aguardando revalidação</span>
            </div>

            <div className="agro-card p-4 border-l-4 border-l-[#D9A404]">
              <span className="text-[10px] font-bold text-stone-500 uppercase block">
                Total de Adoções
              </span>
              <p className="text-2xl font-black font-['Sora'] text-stone-900 mt-1">
                {validados.reduce((acc, v) => acc + (v.total_utilizacoes || 0), 0)}
              </p>
              <span className="text-[10px] text-stone-500">Uso entre organizações</span>
            </div>
          </div>

          {/* Distribuição por Categoria e Risco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="agro-card p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
                Por Categoria SIPEAGRO
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['fabricante', 'fracionador', 'importador', 'armazenador'].map((cat) => {
                  const count = validados.filter((v) => v.categoria === cat).length
                  return (
                    <div
                      key={cat}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex justify-between"
                    >
                      <span className="capitalize text-stone-700">{cat}</span>
                      <span className="font-bold text-[#1B4332]">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="agro-card p-4 space-y-2">
              <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
                Por Classificação Proporcional de Risco
              </h4>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {[
                  { label: 'Alto Risco (Aditivos/Premix/Núcleo)', pattern: 'Alto' },
                  { label: 'Médio Risco (Rações/Concentrados/Suplementos)', pattern: 'Médio' },
                  { label: 'Baixo Risco (Matérias-primas/Armazenagem)', pattern: 'Baixo' },
                ].map(({ label, pattern }) => {
                  const count = validados.filter((v) =>
                    v.categoria_de_risco?.includes(pattern),
                  ).length
                  return (
                    <div
                      key={pattern}
                      className="p-2 rounded-lg bg-stone-50 border border-stone-200 flex justify-between items-center"
                    >
                      <span className="text-stone-700 text-[11px]">{label}</span>
                      <span className="font-bold text-[#1B4332]">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Busca e Tabela do Banco Global */}
          <div className="agro-card overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-[#E2DCCF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  Listagem Global de Fornecedores Validados
                </h3>
                <p className="text-[11px] text-stone-500">
                  Gerencie status, validade de 1 ano e remova registros se necessário.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  value={searchValidado}
                  onChange={(e) => setSearchValidado(e.target.value)}
                  placeholder="Filtrar por Razão ou CNPJ..."
                  className="pl-9 h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-[#E2DCCF] text-stone-600 font-semibold">
                    <th className="p-3">Fornecedor / CNPJ</th>
                    <th className="p-3">Categoria / Risco</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Validade (1 Ano)</th>
                    <th className="p-3">Origem</th>
                    <th className="p-3 text-right">Ações Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {validados
                    .filter((v) => {
                      const q = searchValidado.toLowerCase()
                      return (
                        v.razao_social.toLowerCase().includes(q) ||
                        v.cnpj.includes(q) ||
                        formatarCNPJ(v.cnpj).includes(q)
                      )
                    })
                    .map((item) => (
                      <tr key={item.cnpj} className="hover:bg-amber-50/30">
                        <td className="p-3">
                          <p className="font-bold text-[#1B4332]">{item.razao_social}</p>
                          <p className="text-[11px] text-stone-500 font-mono">
                            {formatarCNPJ(item.cnpj)} • {item.registro_sipeagro || 'S/ Registro'}
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="capitalize font-semibold text-stone-800">
                            {item.categoria || 'fabricante'}
                          </span>
                          {item.categoria_de_risco && (
                            <span className="block text-[10px] text-stone-500">
                              {item.categoria_de_risco}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              item.status === 'VALIDADO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-stone-600">
                          {item.validade_aprovacao ? (
                            <span>
                              {new Date(item.validade_aprovacao).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-stone-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-stone-600">
                          {item.origem_organizacao_nome || 'Rede GIAC'}
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedValidado(item)
                              setValidadoEditForm({
                                status: item.status,
                                validade_aprovacao: item.validade_aprovacao
                                  ? item.validade_aprovacao.split('T')[0]
                                  : '',
                                categoria_de_risco: item.categoria_de_risco || '',
                              })
                              setOpenEditValidadoModal(true)
                            }}
                            className="h-7 text-[11px] border-stone-300 gap-1"
                          >
                            <Edit2 className="h-3 w-3" /> Editar
                          </Button>

                          {item.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                if (confirm(`Remover ${item.razao_social} do banco global?`)) {
                                  try {
                                    await superAdminExcluirFornecedorValidado(item.id!)
                                    toast({ title: 'Fornecedor removido do banco compartilhado' })
                                    loadAllData()
                                  } catch (err: any) {
                                    toast({
                                      title: 'Erro ao excluir',
                                      description: err.message,
                                      variant: 'destructive',
                                    })
                                  }
                                }
                              }}
                              className="h-7 text-[11px] border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* MODAL: EDIÇÃO MANUAL DE FORNECEDOR VALIDADO (SUPER ADMIN) */}
        <Dialog open={openEditValidadoModal} onOpenChange={setOpenEditValidadoModal}>
          <DialogContent className="sm:max-w-[440px] bg-white border-[#E2DCCF]">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[#D9A404]" />
                Editar Fornecedor no Banco Global
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                {selectedValidado?.razao_social} ({formatarCNPJ(selectedValidado?.cnpj || '')})
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!selectedValidado?.id) return
                try {
                  await superAdminAtualizarFornecedorValidado(selectedValidado.id, {
                    status: validadoEditForm.status,
                    validade_aprovacao: validadoEditForm.validade_aprovacao || undefined,
                    categoria_de_risco: validadoEditForm.categoria_de_risco,
                  })
                  toast({
                    title: 'Fornecedor validado atualizado',
                    description: 'Status e validade alterados com sucesso.',
                  })
                  setOpenEditValidadoModal(false)
                  loadAllData()
                } catch (err: any) {
                  toast({
                    title: 'Erro ao salvar',
                    description: err.message,
                    variant: 'destructive',
                  })
                }
              }}
              className="space-y-3 pt-2"
            >
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status de Validação</Label>
                <select
                  value={validadoEditForm.status}
                  onChange={(e) =>
                    setValidadoEditForm({
                      ...validadoEditForm,
                      status: e.target.value as 'VALIDADO' | 'EXPIRADO',
                    })
                  }
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="VALIDADO">VALIDADO (Vigente)</option>
                  <option value="EXPIRADO">EXPIRADO (Vencido/Revalidação Necessária)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Data Limite de Validade (1 Ano)
                </Label>
                <Input
                  type="date"
                  value={validadoEditForm.validade_aprovacao}
                  onChange={(e) =>
                    setValidadoEditForm({
                      ...validadoEditForm,
                      validade_aprovacao: e.target.value,
                    })
                  }
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Classificação Proporcional de Risco
                </Label>
                <Input
                  value={validadoEditForm.categoria_de_risco}
                  onChange={(e) =>
                    setValidadoEditForm({
                      ...validadoEditForm,
                      categoria_de_risco: e.target.value,
                    })
                  }
                  placeholder="Ex: Alto Risco (Aditivos/Premix)"
                  className="h-9 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenEditValidadoModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold"
                >
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* TAB 5: AUDITORIA DE SUPORTE */}
        <TabsContent value="auditoria" className="space-y-4">
          <div className="agro-card p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                Trilha de Auditoria de Ações Master
              </h3>
              <p className="text-xs text-stone-600">
                Registro imutável de todas as intervenções do Super Admin em contas de clientes e
                simulações de faturamento.
              </p>
            </div>

            <div className="divide-y divide-[#E2DCCF] border border-[#E2DCCF] rounded-xl overflow-hidden">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  Nenhuma intervenção registrada até o momento.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 bg-white hover:bg-stone-50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1B4332]">{log.action}</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(log.created).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-stone-600 text-[11px]">
                      <span>Executor: {log.user_email || 'Super Admin'}</span>
                      {log.target && <span>Alvo: {log.target}</span>}
                    </div>
                    {log.details && (
                      <pre className="mt-1.5 p-2 bg-stone-100 rounded text-[10px] text-stone-700 overflow-x-auto">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: NOVA ORGANIZAÇÃO */}
      <Dialog open={openNewOrgModal} onOpenChange={setOpenNewOrgModal}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora']">
              Cadastrar Nova Empresa Cliente (CNPJ)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Crie uma organização no sistema e vincule um plano de assinatura.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateOrg} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Razão Social *</Label>
              <Input
                value={orgForm.razao_social}
                onChange={(e) => setOrgForm({ ...orgForm, razao_social: e.target.value })}
                placeholder="Ex: Agro Alimentos Ltda."
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">CNPJ *</Label>
                <Input
                  value={orgForm.cnpj}
                  onChange={(e) => setOrgForm({ ...orgForm, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nome Fantasia</Label>
                <Input
                  value={orgForm.nome_fantasia}
                  onChange={(e) => setOrgForm({ ...orgForm, nome_fantasia: e.target.value })}
                  placeholder="Ex: Agro Alimentos"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Plano Inicial</Label>
                <Select
                  value={orgForm.plan}
                  onValueChange={(val) => setOrgForm({ ...orgForm, plan: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} (R$ {(p.monthly_price || 0).toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status Inicial</Label>
                <Select
                  value={orgForm.status}
                  onValueChange={(val) => setOrgForm({ ...orgForm, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial (14 dias)</SelectItem>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="suspensa">Suspensa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">E-mail de Cobrança</Label>
                <Input
                  type="email"
                  value={orgForm.billing_email}
                  onChange={(e) => setOrgForm({ ...orgForm, billing_email: e.target.value })}
                  placeholder="financeiro@empresa.com.br"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Telefone</Label>
                <Input
                  value={orgForm.billing_phone}
                  onChange={(e) => setOrgForm({ ...orgForm, billing_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewOrgModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold"
              >
                Cadastrar Empresa
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR PLANO (VALORES PROVISÓRIOS EDITÁVEIS) */}
      <Dialog
        open={openEditPlanModal || openNewPlanModal}
        onOpenChange={(open) => {
          if (!open) {
            setOpenEditPlanModal(false)
            setOpenNewPlanModal(false)
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora']">
              {selectedPlan ? 'Editar Plano de Assinatura' : 'Novo Plano de Assinatura'}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Defina ou altere o valor mensal cobrado por CNPJ e as regras do plano.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Plano *</Label>
              <Input
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código Identificador *</Label>
                <Input
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                  required
                  disabled={Boolean(selectedPlan)}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-emerald-800">
                  Valor Mensal (R$) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={planForm.monthly_price}
                  onChange={(e) =>
                    setPlanForm({ ...planForm, monthly_price: parseFloat(e.target.value) || 0 })
                  }
                  required
                  className="h-9 text-xs font-bold text-emerald-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição do Plano</Label>
              <Textarea
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpenEditPlanModal(false)
                  setOpenNewPlanModal(false)
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold"
              >
                Salvar Plano
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ZERAR DADOS DE NEGÓCIO DA ORGANIZAÇÃO (CONFIRMAÇÃO DUPLA) */}
      <Dialog open={openPurgeModal} onOpenChange={setOpenPurgeModal}>
        <DialogContent className="sm:max-w-[540px] bg-white border-red-200">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 font-['Sora'] flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Zerar Dados de Negócio da Organização
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Ação irreversível de exclusão de dados de negócio da empresa selecionada.
            </DialogDescription>
          </DialogHeader>

          {orgToPurge && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-900 space-y-1.5">
                <p className="font-bold">
                  Empresa alvo: {orgToPurge.razao_social} (CNPJ: {orgToPurge.cnpj})
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  <strong>O que será apagado:</strong> POPs, registros de monitoramento, auditorias,
                  evidências, não conformidades, testes de rastreabilidade/recall, treinamentos,
                  documentos, dados PAASO (sipeagro, fornecedores, qualificações, devoluções, NCs de
                  fornecedor) e formulários customizados vinculados a este CNPJ.
                </p>
                <p className="text-[11px] text-emerald-900 font-semibold bg-emerald-50/80 p-2 rounded border border-emerald-200">
                  <strong>O que será PRESERVADO:</strong> A organização cadastral, contas de
                  usuários vinculadas, planos contratados, histórico de faturas e a base global de
                  fornecedores homologados.
                </p>
              </div>

              {purgeStep === 1 ? (
                <div className="space-y-3 p-3 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[11px]">
                      1
                    </span>
                    Etapa 1 de 2: Confirme o CNPJ da organização
                  </div>
                  <p className="text-[11px] text-stone-600">
                    Digite exatamente o CNPJ da organização ({orgToPurge.cnpj}):
                  </p>
                  <Input
                    value={purgeCnpjInput}
                    onChange={(e) => setPurgeCnpjInput(e.target.value)}
                    placeholder="Ex: 12.345.678/0001-90"
                    className="h-9 text-xs font-mono"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenPurgeModal(false)}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={
                        purgeCnpjInput.replace(/\D/g, '') !== orgToPurge.cnpj.replace(/\D/g, '')
                      }
                      onClick={() => setPurgeStep(2)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                    >
                      Avançar para Etapa 2
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-red-50/50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[11px]">
                      2
                    </span>
                    Etapa 2 de 2: Confirmação Crítica
                  </div>
                  <p className="text-[11px] text-stone-700">
                    Para autorizar a purga definitiva de dados e registrar a ocorrência no livro de
                    auditoria, digite a palavra{' '}
                    <strong className="font-mono text-red-700">ZERAR</strong> em letras maiúsculas:
                  </p>
                  <Input
                    value={purgeKeywordInput}
                    onChange={(e) => setPurgeKeywordInput(e.target.value)}
                    placeholder="Digite ZERAR"
                    className="h-9 text-xs font-mono font-bold tracking-widest uppercase border-red-300"
                  />
                  <div className="flex justify-between items-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPurgeStep(1)}
                      className="text-xs"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={purging || purgeKeywordInput.trim().toUpperCase() !== 'ZERAR'}
                      onClick={async () => {
                        setPurging(true)
                        try {
                          const res: any = await purgeOrganizationData({
                            organization_id: orgToPurge.id,
                            confirmation_cnpj: purgeCnpjInput,
                            confirmation_keyword: purgeKeywordInput.trim().toUpperCase(),
                          })
                          toast({
                            title: 'Dados da Organização Zerados',
                            description: `Foram removidos ${res.total_deleted || 0} registros de negócio. Ação registrada no Audit Log.`,
                          })
                          setOpenPurgeModal(false)
                          loadAllData()
                        } catch (err: any) {
                          toast({
                            title: 'Erro ao zerar dados',
                            description: err.message || 'Falha na validação das confirmações.',
                            variant: 'destructive',
                          })
                        } finally {
                          setPurging(false)
                        }
                      }}
                      className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold gap-1.5"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      {purging ? 'Excluindo registros...' : 'Confirmar e Zerar Agora'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
