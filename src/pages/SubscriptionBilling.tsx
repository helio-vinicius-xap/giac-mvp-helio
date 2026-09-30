import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  QrCode,
  FileText,
  DollarSign,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getOrganization,
  getPlans,
  updateOrganization,
  getInvoices,
  createBillingInvoice,
  simulateInvoicePayment,
} from '@/services/agroService'
import { useToast } from '@/hooks/use-toast'

export default function SubscriptionBilling() {
  const { user, currentOrg, refreshUser, trialDaysLeft, isSuperAdmin } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [org, setOrg] = useState<any>(currentOrg)
  const [plans, setPlans] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [openPayModal, setOpenPayModal] = useState(false)
  const [openChangePlanModal, setOpenChangePlanModal] = useState(false)

  const loadBillingData = async () => {
    try {
      setLoading(true)
      const orgId = currentOrg?.id || user?.organization
      if (!orgId) return

      const [orgData, plansData, invoicesData] = await Promise.all([
        getOrganization(orgId).catch(() => currentOrg),
        getPlans('is_active = true').catch(() => []),
        getInvoices(`organization = '${orgId}'`, '-created').catch(() => []),
      ])

      setOrg(orgData)
      setPlans(plansData)
      setInvoices(invoicesData)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar dados de faturamento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBillingData()
  }, [currentOrg?.id])

  const handleGenerateNewInvoice = async (method = 'BOLETO') => {
    setGenerating(true)
    try {
      const res: any = await createBillingInvoice({
        organization_id: org.id,
        billing_type: method,
      })
      toast({
        title: 'Fatura Gerada com Sucesso',
        description: 'Boleto/PIX disponibilizado para pagamento mensal.',
      })
      await loadBillingData()
      if (res?.invoice) {
        setSelectedInvoice(res.invoice)
        setOpenPayModal(true)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao emitir fatura',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleSimulatePayment = async (invId: string) => {
    try {
      await simulateInvoicePayment(invId)
      toast({
        title: 'Pagamento Confirmado',
        description: 'Sua assinatura foi ativada com sucesso pelo Asaas!',
      })
      await loadBillingData()
      await refreshUser()
      setOpenPayModal(false)
    } catch (err: any) {
      toast({
        title: 'Erro na confirmação',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleChangePlan = async (newPlanId: string) => {
    try {
      await updateOrganization(org.id, { plan: newPlanId })
      toast({
        title: 'Plano Alterado',
        description: 'Sua organização passará a ser faturada pelo novo plano.',
      })
      setOpenChangePlanModal(false)
      loadBillingData()
    } catch (err: any) {
      toast({
        title: 'Erro ao trocar de plano',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        Carregando informações da assinatura e faturamento...
      </div>
    )
  }

  const planName = org?.expand?.plan?.name || 'Plano Padrão IN 04/2007'
  const planPrice =
    org?.custom_monthly_price > 0
      ? org.custom_monthly_price
      : org?.expand?.plan?.monthly_price || 0.0
  const isTrial = org?.status === 'trial'
  const isSuspended = org?.status === 'suspensa'
  const isAtiva = org?.status === 'ativa'

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 shadow-md">
            <CreditCard className="h-7 w-7 text-[#D9A404]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#2D6A4F] px-2.5 py-0.5 rounded-full">
                Cobrança Mensal por CNPJ
              </span>
              <Badge
                className={
                  isAtiva
                    ? 'bg-emerald-100 text-emerald-800'
                    : isTrial
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                }
              >
                {org?.status?.toUpperCase() || 'TRIAL'}
              </Badge>
              {isTrial && trialDaysLeft !== null && (
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {trialDaysLeft > 0
                    ? `${trialDaysLeft} dias restantes no Trial`
                    : 'Trial Expirado'}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
              Assinatura & Faturamento da Empresa
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Empresa vinculada: <strong className="text-stone-800">{org?.razao_social}</strong> •
              CNPJ: <strong className="font-mono text-stone-800">{org?.cnpj}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            onClick={() => handleGenerateNewInvoice('BOLETO')}
            disabled={generating}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm h-9"
          >
            <DollarSign className="h-4 w-4" />
            {generating ? 'Gerando...' : 'Emitir Fatura do Mês'}
          </Button>
        </div>
      </div>

      {/* 2. Informações do Plano Atual */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="agro-card p-6 border-l-4 border-l-[#2D6A4F] md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Plano Vinculado ao CNPJ
              </span>
              <h3 className="text-lg font-bold text-[#1B4332] font-['Sora']">{planName}</h3>
            </div>
            {plans.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOpenChangePlanModal(true)}
                className="text-xs border-stone-300"
              >
                Trocar de Plano
              </Button>
            )}
          </div>

          <p className="text-xs text-stone-600">
            {org?.expand?.plan?.description ||
              'Acesso completo a procedimentos, registros, SIPEAGRO, auditorias e emissão de relatórios oficiais MAPA.'}
          </p>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-stone-600 font-medium">Valor da Mensalidade:</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black font-['Sora'] text-[#2D6A4F]">
                  R$ {planPrice.toFixed(2)}
                </span>
                <span className="text-xs text-stone-500">/mês por CNPJ</span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium block">
                • Equipe com usuários ilimitados inclusa
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-stone-500 block">Próximo Vencimento:</span>
              <span className="text-sm font-bold text-stone-800">
                {org?.subscription_due_date
                  ? new Date(org.subscription_due_date).toLocaleDateString('pt-BR')
                  : org?.trial_ends_at
                    ? `${new Date(org.trial_ends_at).toLocaleDateString('pt-BR')} (Fim do Trial)`
                    : 'A definir'}
              </span>
            </div>
          </div>
        </div>

        {/* Formas de Pagamento Aceitas via Asaas */}
        <div className="agro-card p-6 border-l-4 border-l-[#D9A404] space-y-3">
          <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
            Meios de Pagamento (Asaas)
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed">
            As faturas mensais podem ser quitadas via <strong>Boleto Bancário</strong>,{' '}
            <strong>PIX Dinâmico</strong> ou <strong>Cartão de Crédito</strong>.
          </p>
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 space-y-1">
            <p className="font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Compensação Automática
            </p>
            <p className="text-emerald-700">
              A liquidação do boleto ou PIX reativa e renova seu acesso imediatamente via Webhook.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Histórico de Faturas da Organização */}
      <div className="agro-card overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-[#E2DCCF] flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Histórico de Faturas Deste CNPJ
          </h3>
          <span className="text-xs text-stone-500">{invoices.length} fatura(s) encontrada(s)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-stone-50 border-b border-[#E2DCCF] text-stone-600 font-semibold">
                <th className="p-3">Descrição / Referência</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Vencimento</th>
                <th className="p-3">Forma</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-500">
                    Nenhuma fatura emitida ainda para esta organização. Clique em "Emitir Fatura do
                    Mês" para gerar a primeira.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-amber-50/30">
                    <td className="p-3">
                      <p className="font-bold text-[#1B4332]">
                        {inv.description || 'Mensalidade SaaS Autocontrole'}
                      </p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        ID: {inv.asaas_payment_id || inv.id}
                      </span>
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
                      {inv.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(inv)
                              setOpenPayModal(true)
                            }}
                            className="h-7 text-xs bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold"
                          >
                            Pagar Fatura
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center justify-end gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Quitado
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

      {/* MODAL: PAGAR FATURA (BOLETO / PIX / CARTÃO) */}
      <Dialog open={openPayModal} onOpenChange={setOpenPayModal}>
        <DialogContent className="sm:max-w-[480px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#D9A404]" />
              Pagamento da Mensalidade
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Efetue o pagamento da fatura para manter seu sistema de autocontrole ativo.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block">Total a pagar:</span>
                  <span className="text-xl font-black font-['Sora'] text-[#2D6A4F]">
                    R$ {(selectedInvoice.amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-stone-500 block">Vencimento:</span>
                  <span className="font-bold text-stone-800">
                    {new Date(selectedInvoice.due_date).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Opções de visualização Asaas */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-stone-700">Link da Cobrança:</Label>
                {selectedInvoice.bank_slip_url && (
                  <Button
                    variant="outline"
                    className="w-full justify-between text-xs h-9 border-stone-300"
                    onClick={() => window.open(selectedInvoice.bank_slip_url, '_blank')}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-stone-600" />
                      Visualizar Boleto Bancário
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-stone-400" />
                  </Button>
                )}

                {selectedInvoice.pix_qr_code && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-[#D9A404]" /> PIX Copia e Cola:
                    </span>
                    <input
                      readOnly
                      value={selectedInvoice.pix_qr_code}
                      className="w-full p-2 text-[10px] font-mono bg-white border border-amber-300 rounded text-stone-700"
                    />
                  </div>
                )}
              </div>

              {/* Botão de simulação para validação imediata */}
              <div className="pt-2 border-t border-stone-200">
                <Button
                  onClick={() => handleSimulatePayment(selectedInvoice.id)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs h-9"
                >
                  Confirmar Pagamento (Simulação Asaas)
                </Button>
                <p className="text-[10px] text-stone-400 text-center mt-1">
                  Ambiente de testes ativo: a confirmação reativa sua organização na hora.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: TROCAR DE PLANO */}
      <Dialog open={openChangePlanModal} onOpenChange={setOpenChangePlanModal}>
        <DialogContent className="sm:max-w-[480px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora']">
              Alterar Plano da Organização
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Escolha um novo plano de autocontrole para a sua fábrica.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {plans.map((p) => (
              <div
                key={p.id}
                onClick={() => handleChangePlan(p.id)}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                  org?.plan === p.id
                    ? 'border-[#2D6A4F] bg-emerald-50/50'
                    : 'border-stone-200 hover:border-emerald-400 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">{p.name}</span>
                  <span className="font-bold text-[#2D6A4F]">
                    R$ {(p.monthly_price || 0).toFixed(2)}/mês
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1">{p.description}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
