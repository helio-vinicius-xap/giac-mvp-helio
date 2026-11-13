import React, { useEffect, useState } from 'react'
import {
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  ClipboardList,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { registerDigitalSignature, getCompany } from '@/services/agroService'
import { canSignAsRT, canSignAsRE, canSignAsRQ } from '@/lib/permissions'
import { PA_ANEXOS, PA_ORG } from './paAnexosData'
import type { Company, DigitalSignatureRecord } from '@/types/agro'

interface PaAnexoPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anexoId: string
}

type TabActivo = 'visualizar' | 'assinar'

const ASSINATURAS_PA = 'assinaturas_pa'

export function PaAnexoPdfModal({ open, onOpenChange, anexoId }: PaAnexoPdfModalProps) {
  const { toast } = useToast()
  const { user, userRole } = (useAuth() as any) || {}
  const [company, setCompany] = useState<Company | null>(null)
  const [activeTab, setActiveTab] = useState<TabActivo>('visualizar')
  const [signatureMethod, setSignatureMethod] = useState<'gov_br' | 'pfx'>('gov_br')
  const [observacao, setObservacao] = useState('')
  const [savingSig, setSavingSig] = useState(false)
  const [assinaturas, setAssinaturas] = useState<
    Record<string, DigitalSignatureRecord | undefined>
  >({})

  const anexo = PA_ANEXOS.find((a) => a.id === anexoId)

  useEffect(() => {
    if (!open) return
    getCompanyProfile()
      .then(setCompany)
      .catch(() => setCompany(null))
    try {
      const raw = localStorage.getItem(ASSINATURAS_PA)
      if (raw) setAssinaturas(JSON.parse(raw))
    } catch {
      /* noop */
    }
  }, [open])

  if (!anexo) return null

  const isFullySigned = Boolean(assinaturas.rt && assinaturas.rq)
  const canRT = canSignAsRT(userRole)
  const canRE = canSignAsRE(userRole)
  const canRQ = canSignAsRQ(userRole)

  const handlePrint = () => window.print()

  const handleRegisterSignature = async (targetRole: 'RT' | 'RE' | 'RQ') => {
    setSavingSig(true)
    try {
      let respNome = user?.name || 'Responsável'
      let respId = user?.cpf || user?.conselho_classe || ''

      if (targetRole === 'RT') {
        respNome = company?.rt_nome || user?.name || 'Responsável Técnico'
        respId = company?.rt_registro_conselho || ''
      } else if (targetRole === 'RE') {
        respNome = company?.re_nome || user?.name || 'Responsável Estabelecimento'
        respId = company?.re_cpf || ''
      } else {
        respNome = company?.rq_nome || user?.name || 'Responsável Qualidade'
        respId = company?.rq_cpf || ''
      }

      await registerDigitalSignature({
        tipo_alvo: 'pa_anexo',
        id_alvo: anexo.id,
        papel: targetRole,
        metodo: signatureMethod,
        responsavel_nome: respNome,
        responsavel_identificacao: respId,
        observacao: observacao || `Assinatura do ${anexo.sigla} — ${anexo.titulo}`,
      })

      const nova = { ...assinaturas, [targetRole]: { responsavel_nome: respNome } as any }
      setAssinaturas(nova)
      localStorage.setItem(ASSINATURAS_PA, JSON.stringify(nova))

      toast({
        title: `Anexo assinado como ${targetRole}`,
        description: `Comprovação registrada via ${signatureMethod === 'gov_br' ? 'Gov.br' : 'ICP-Brasil (PFX)'}.`,
      })
      setActiveTab('visualizar')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar assinatura',
        description: err?.message || 'Falha ao autenticar.',
        variant: 'destructive',
      })
    } finally {
      setSavingSig(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#2D6A4F] text-white text-[11px] font-bold">
                  {anexo.sigla}
                </Badge>
                {isFullySigned ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Comprovado (RT/RE + RQ)
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                  >
                    <Clock className="h-3 w-3" /> Pendente Assinatura
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                {anexo.sigla} — {anexo.titulo}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                {anexo.descricaoCurta}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 print:hidden shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab(activeTab === 'visualizar' ? 'assinar' : 'visualizar')}
                className="h-8 text-xs bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {activeTab === 'visualizar' ? 'Assinar Documento' : 'Ver Documento'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'assinar' ? (
            <div className="space-y-5 max-w-xl mx-auto py-2">
              <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2D6A4F] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                    Comprovação Formal do Documento do Plano de Amostragem
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Cada anexo do plano exige dupla comprovação conforme a IN 04/2007:
                    <strong> Assinatura 1 (RT ou RE)</strong> + <strong>Assinatura 2 (RQ)</strong>.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-stone-700">
                    Método de Assinatura:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSignatureMethod('gov_br')}
                      className={`p-2.5 rounded-lg border text-left text-xs ${
                        signatureMethod === 'gov_br'
                          ? 'border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F] font-bold'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      Assinatura Gov.br
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMethod('pfx')}
                      className={`p-2.5 rounded-lg border text-left text-xs ${
                        signatureMethod === 'pfx'
                          ? 'border-[#2D6A4F] bg-emerald-50 text-[#2D6A4F] font-bold'
                          : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      Certificado ICP-Brasil (PFX)
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Observações</Label>
                  <Input
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Matriz de risco revisada conforme histórico de desvios."
                    className="h-9 text-xs"
                  />
                </div>
                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row gap-2 justify-end flex-wrap">
                  {canRT && (
                    <Button
                      type="button"
                      disabled={savingSig}
                      onClick={() => handleRegisterSignature(canRE ? 'RE' : 'RT')}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs gap-1.5 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#D9A404]" />
                      {savingSig
                        ? 'Salvando...'
                        : canRE
                          ? 'Assinar como RE'
                          : 'Assinar como RT (Assinatura 1)'}
                    </Button>
                  )}
                  {canRQ && (
                    <Button
                      type="button"
                      disabled={savingSig}
                      onClick={() => handleRegisterSignature('RQ')}
                      className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs gap-1.5 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {savingSig ? 'Salvando...' : 'Assinar como RQ (Assinatura 2)'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <PaAnexoDocumento anexo={anexo} company={company} assinaturas={assinaturas} />
          )}
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t border-[#E2DCCF] bg-white flex justify-between shrink-0">
          <span className="text-xs text-stone-500">
            Status: <strong>{isFullySigned ? 'Comprovado' : 'Pendente Assinatura'}</strong>
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaAnexoDocumento({ anexo, company, assinaturas }: any) {
  const cabecalho = (
    <div className="border-b-2 border-stone-800 pb-3 flex justify-between items-start gap-4">
      <div>
        <h3 className="font-bold text-sm text-[#1B4332] uppercase">
          {company?.razao_social || 'Estabelecimento — Autocontrole'}
        </h3>
        <p className="text-[11px] text-stone-600">
          Registro MAPA: <strong>{company?.numero_registro_mapa || '—'}</strong> | CNPJ:{' '}
          {company?.cnpj || '—'}
        </p>
        <p className="text-[10px] text-stone-500">
          Plano de Amostragem — Decreto 12.031/2024, IN MAPA 04/2007, IN 110/2020, Portaria
          1.412/2025
        </p>
      </div>
      <div className="text-right">
        <Badge
          variant="outline"
          className="text-xs font-mono font-bold text-[#2D6A4F] border-[#2D6A4F]"
        >
          {anexo.sigla}
        </Badge>
        <p className="text-[10px] text-stone-500 mt-0.5">Plano de Amostragem</p>
      </div>
    </div>
  )

  const regua = (
    <div className="pt-4 border-t-2 border-stone-800 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 text-center">
        Comprovação e Dupla Assinatura (RT/RE + RQ)
      </h4>
      <div className="grid grid-cols-3 gap-4 pt-2">
        {['Execução / Elaboração', 'Assinatura 1 (RT/RE)', 'Assinatura 2 (RQ)'].map((rotulo, i) => {
          const key = ['execucao', 'rt', 'rq'][i]
          const assinado = assinaturas?.[key]
          return (
            <div
              key={rotulo}
              className="p-2.5 border border-stone-300 rounded text-center flex flex-col justify-between min-h-[110px] bg-stone-50"
            >
              <span className="text-[10px] font-bold text-stone-600 uppercase">{rotulo}</span>
              {assinado ? (
                <>
                  <div className="p-1.5 bg-emerald-50 rounded border border-emerald-300 text-[10px] text-emerald-900">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto" />
                    <strong>{assinado.responsavel_nome}</strong>
                  </div>
                  <p className="text-[9px] text-stone-500">
                    {key === 'rt' ? 'RT/RE' : 'RQ'} — {assinado.responsavel_identificacao || '—'}
                  </p>
                </>
              ) : (
                <>
                  <div className="border-b border-dashed border-stone-400 w-3/4 mx-auto my-3" />
                  <p className="text-[9px] text-stone-500">
                    {key === 'execucao'
                      ? 'CQ / Monitor de Processo'
                      : key === 'rt'
                        ? 'Responsável Técnico'
                        : 'Responsável pela Qualidade'}
                  </p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-300 shadow-sm max-w-3xl mx-auto text-xs space-y-5">
      {cabecalho}
      <div className="space-y-2">
        {anexo.secoes.map((secao: any) => (
          <div key={secao.titulo} className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] border-b border-stone-200 pb-1">
              {secao.titulo}
            </h4>
            {secao.paragrafos?.map((p: string, i: number) => (
              <p key={i} className="text-[11px] text-stone-700 leading-relaxed whitespace-pre-wrap">
                {p}
              </p>
            ))}
            {secao.tabela && (
              <TabelaPA colunas={secao.tabela.colunas} linhas={secao.tabela.linhas} />
            )}
          </div>
        ))}
      </div>
      {regua}
    </div>
  )
}

function TabelaPA({ colunas, linhas }: { colunas: string[]; linhas: any[][] }) {
  return (
    <div className="overflow-x-auto border border-stone-200 rounded">
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr className="bg-stone-100">
            {colunas.map((c) => (
              <th key={c} className="border border-stone-300 p-1.5 text-left font-bold uppercase">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr key={i} className={i % 2 ? 'bg-stone-50' : ''}>
              {linha.map((cel: any, j: number) => (
                <td key={j} className="border border-stone-300 p-1.5 align-top">
                  {typeof cel === 'string' || typeof cel === 'number' ? cel : JSON.stringify(cel)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
