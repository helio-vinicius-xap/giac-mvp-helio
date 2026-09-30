import React, { useState } from 'react'
import {
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  PenTool,
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
import { registerDigitalSignature } from '@/services/agroService'
import type { MonitoringRecord, Company, Procedure, DigitalSignatureRecord } from '@/types/agro'

interface RecordDocumentPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MonitoringRecord | null
  procedure?: Procedure | null
  company?: Company | null
  onSignatureSaved?: () => void
}

export function RecordDocumentPdfModal({
  open,
  onOpenChange,
  record,
  procedure,
  company,
  onSignatureSaved,
}: RecordDocumentPdfModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'visualizar' | 'assinar'>('visualizar')
  const [signatureMethod, setSignatureMethod] = useState<'pfx' | 'gov_br'>('gov_br')
  const [observacao, setObservacao] = useState('')
  const [savingSig, setSavingSig] = useState(false)

  if (!record) return null

  const assinaturas = record.assinaturas_registro || {}
  const rqAssinatura: DigitalSignatureRecord | undefined = assinaturas.rq
  const reAssinatura: DigitalSignatureRecord | undefined = assinaturas.re
  const isFullySigned = Boolean(rqAssinatura && reAssinatura)
  const userRole = user?.role || 'operador'

  const handlePrint = () => {
    window.print()
  }

  const handleRegisterSignature = async (targetRole: 'RT' | 'RQ' | 'RE' | string) => {
    if (!record) return

    setSavingSig(true)
    try {
      let respNome = user?.name || 'Responsável'
      let respId = ''

      if (targetRole === 'RT') {
        respNome = company?.rt_nome || user?.name || 'Dr. Hélio Silva'
        respId = company?.rt_registro_conselho || 'CRMV-SP 18.420'
      } else if (targetRole === 'RQ') {
        respNome = company?.rq_nome || user?.name || 'Dra. Mariana Siqueira'
        respId = company?.rq_cpf || user?.cpf || 'CPF RQ'
      } else {
        respNome = company?.re_nome || user?.name || 'Carlos Eduardo Prado de Oliveira'
        respId = company?.re_cpf || user?.cpf || 'CPF RE'
      }

      await registerDigitalSignature({
        tipo_alvo: 'record',
        id_alvo: record.id,
        papel: targetRole,
        metodo: signatureMethod,
        responsavel_nome: respNome,
        responsavel_identificacao: respId,
        imagem_url: user?.assinatura_imagem || undefined,
        observacao: observacao || `Validação diária de BPF/PCC pelo ${targetRole}`,
      })

      toast({
        title: `Registro Assinado como ${targetRole}`,
        description: `Comprovação registrada com sucesso via ${
          signatureMethod === 'gov_br' ? 'Gov.br' : 'ICP-Brasil (PFX)'
        }.`,
      })

      if (onSignatureSaved) onSignatureSaved()
      setActiveTab('visualizar')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar assinatura',
        description: err.message || 'Falha ao autenticar.',
        variant: 'destructive',
      })
    } finally {
      setSavingSig(false)
    }
  }

  const dadosForm = record.dados_formulario || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#2D6A4F] text-white text-[11px] font-bold">
                  {record.formulario_codigo || `F-REG-${record.id.slice(0, 6)}`}
                </Badge>
                {isFullySigned ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Comprovado (Assinado RQ/RE)
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                  >
                    <Clock className="h-3 w-3" /> Pendente Assinatura RQ/RE
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                Registro de Monitoramento • {procedure?.codigo || 'POP'}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Data: {new Date(record.data).toLocaleDateString('pt-BR')} • Turno:{' '}
                {record.turno || 'Manhã'} • Lote: {record.lote || 'N/A'}
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2 print:hidden shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab(activeTab === 'visualizar' ? 'assinar' : 'visualizar')}
                className="h-8 text-xs bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {activeTab === 'visualizar' ? 'Assinar Registro' : 'Ver Ficha'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'assinar' ? (
            <div className="space-y-5 max-w-xl mx-auto py-2">
              <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2D6A4F] flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                    Comprovação Formal de Execução do POP
                  </h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Segundo a IN 04/2007 do MAPA, o POP é considerado comprovadamente executado
                    quando o registro recebe a validação do{' '}
                    <strong>Responsável Técnico (RT)</strong>,{' '}
                    <strong>Responsável pela Qualidade (RQ)</strong> ou do{' '}
                    <strong>Responsável pelo Estabelecimento (RE)</strong>.
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
                  <Label className="text-xs font-semibold text-stone-700">
                    Observações de Verificação
                  </Label>
                  <Input
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    placeholder="Ex: Parâmetros conferidos e em conformidade técnica."
                    className="h-9 text-xs"
                  />
                </div>

                <div className="pt-3 border-t border-stone-200 flex flex-col sm:flex-row gap-2 justify-end flex-wrap">
                  {/* HIERARQUIA GIAC: RE > RT > RQ > usuários por setor */}
                  {/* Assinatura 1: RT ou RE */}
                  {(userRole === 'RT' ||
                    userRole === 'RE' ||
                    userRole === 'super_admin' ||
                    userRole === 'admin_cliente') && (
                    <Button
                      type="button"
                      disabled={savingSig}
                      onClick={() => handleRegisterSignature(userRole === 'RE' ? 'RE' : 'RT')}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs gap-1.5 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#D9A404]" />
                      {savingSig
                        ? 'Salvando...'
                        : userRole === 'RE'
                          ? 'Assinar como RE (Substituição Legal RT)'
                          : 'Assinar como RT (Assinatura 1: Técnica)'}
                    </Button>
                  )}

                  {/* Assinatura 2: RQ ou RE */}
                  {(userRole === 'RQ' ||
                    userRole === 'RE' ||
                    userRole === 'super_admin' ||
                    userRole === 'admin_cliente') && (
                    <Button
                      type="button"
                      disabled={savingSig}
                      onClick={() => handleRegisterSignature('RQ')}
                      className="bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs gap-1.5 font-semibold"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {savingSig ? 'Salvando...' : 'Assinar como RQ (Assinatura 2: Verificação)'}
                    </Button>
                  )}

                  {/* RE pode assinar especificamente como Responsável pelo Estabelecimento */}
                  {(userRole === 'RE' || userRole === 'super_admin') && (
                    <Button
                      type="button"
                      disabled={savingSig}
                      onClick={() => handleRegisterSignature('RE')}
                      className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs gap-1.5"
                    >
                      <KeyRound className="h-4 w-4" />
                      {savingSig ? 'Salvando...' : 'Homologar como RE (Autoridade Máxima)'}
                    </Button>
                  )}

                  {user?.assinatura_imagem && (
                    <div className="w-full p-2 bg-emerald-50 rounded-md border border-emerald-200 text-[11px] text-[#2D6A4F] flex items-center justify-between">
                      <span className="font-semibold">
                        Sua rubrica gráfica vinculada ({userRole}):
                      </span>
                      <img
                        src={user.assinatura_imagem}
                        alt="Assinatura"
                        className="h-6 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* FICHA DO REGISTRO DE MONITORAMENTO FORMATO OFICIAL */
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-300 shadow-sm max-w-2xl mx-auto text-xs space-y-5">
              {/* Top Banner */}
              <div className="border-b-2 border-stone-800 pb-3 flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-sm text-[#1B4332] uppercase">
                    {company?.razao_social || 'NutriAgro Nutrição Animal Ltda.'}
                  </h3>
                  <p className="text-[11px] text-stone-600">
                    Registro MAPA: <strong>{company?.numero_registro_mapa || 'SP-00412-8'}</strong>{' '}
                    | CNPJ: {company?.cnpj || '12.345.678/0001-90'}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono font-bold text-[#2D6A4F] border-[#2D6A4F]"
                  >
                    {record.formulario_codigo || `F-REG-${record.id.slice(0, 6)}`}
                  </Badge>
                  <p className="text-[10px] text-stone-500 mt-0.5">IN 04/2007 MAPA Item 07</p>
                </div>
              </div>

              {/* Detalhes do registro */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-50 p-3 rounded border border-stone-200">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block uppercase">Data</span>
                  <strong className="text-stone-900">
                    {new Date(record.data).toLocaleDateString('pt-BR')}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block uppercase">
                    Turno
                  </span>
                  <strong className="text-stone-900">{record.turno || 'Manhã'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block uppercase">Lote</span>
                  <strong className="text-stone-900">{record.lote || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block uppercase">
                    Avaliação
                  </span>
                  <strong
                    className={record.status === 'Conforme' ? 'text-emerald-700' : 'text-red-700'}
                  >
                    {record.status}
                  </strong>
                </div>
              </div>

              {/* Procedimento Referenciado */}
              {procedure && (
                <div className="p-2.5 rounded bg-emerald-50/50 border border-emerald-200">
                  <p className="text-[11px] text-stone-700">
                    <strong>Procedimento Vinculado:</strong> [{procedure.codigo}] {procedure.nome} (
                    {procedure.area_etapa || 'Fábrica'})
                  </p>
                </div>
              )}

              {/* Rastreabilidade e Encadeamento Obrigatório */}
              {(record.registro_anterior ||
                (record.registros_seguintes && record.registros_seguintes.length > 0)) && (
                <div className="p-2.5 rounded bg-[#FAF7EF] border border-[#E2DCCF] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4332] block">
                    Cadeia de Rastreabilidade e Encadeamento
                  </span>
                  <div className="flex flex-wrap gap-3 text-[11px] text-stone-700">
                    {record.registro_anterior && (
                      <div>
                        <span className="font-semibold text-stone-500">
                          Registro Anterior (Pai):{' '}
                        </span>
                        <strong className="font-mono text-[#1B4332]">
                          {record.registro_anterior}
                        </strong>
                      </div>
                    )}
                    {record.registros_seguintes && record.registros_seguintes.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-semibold text-stone-500">
                          Próximos Exigidos na Cadeia:{' '}
                        </span>
                        {record.registros_seguintes.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white border border-stone-300 font-bold"
                          >
                            {s.codigo_formulario} ({s.registro_id ? 'Instanciado' : 'Aguardando'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dados do Formulário Específico (Item 07 da IN 04) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] border-b border-stone-200 pb-1">
                  Parâmetros de Inspeção / Valores Aferidos
                </h4>

                <div className="border border-stone-200 rounded divide-y divide-stone-200">
                  <div className="p-2 grid grid-cols-2 gap-2 text-stone-800">
                    <span className="font-semibold text-stone-600">Valor / Medição Principal:</span>
                    <span className="font-bold text-stone-900">
                      {record.valor_medido || 'Conforme padrão'}
                    </span>
                  </div>

                  {Object.keys(dadosForm).map((k) => (
                    <div key={k} className="p-2 grid grid-cols-2 gap-2 text-stone-800">
                      <span className="font-semibold text-stone-600 capitalize">
                        {k.replace(/_/g, ' ')}:
                      </span>
                      <span>{String(dadosForm[k])}</span>
                    </div>
                  ))}

                  {record.observacoes && (
                    <div className="p-2 grid grid-cols-2 gap-2 text-stone-800">
                      <span className="font-semibold text-stone-600">Observações do Operador:</span>
                      <span>{record.observacoes}</span>
                    </div>
                  )}

                  <div className="p-2 grid grid-cols-2 gap-2 text-stone-800">
                    <span className="font-semibold text-stone-600">Operador Executor:</span>
                    <span>{record.responsavel || 'Operador da Linha'}</span>
                  </div>
                </div>
              </div>

              {/* Bloco de Assinaturas de Comprovação - HIERARQUIA GIAC: RE > RT > RQ > Execução */}
              {/* REGRA OBRIGATÓRIA: Assinatura 1 = RT ou RE (primeira assinatura) + Assinatura 2 = RQ (segunda assinatura) */}
              <div className="pt-4 border-t-2 border-stone-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 text-center">
                  Comprovação e Dupla Assinatura Obrigatória (RT/RE + RQ)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* ASSINATURA 1: RT ou RE */}
                  <div className="p-2.5 border border-emerald-300 rounded text-center flex flex-col justify-between min-h-[120px] bg-emerald-50/50">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">
                      Assinatura 1: Homologação Técnica (RT ou RE)
                    </span>
                    {reAssinatura ? (
                      <div className="p-1.5 bg-emerald-100 rounded border border-emerald-300 text-[10px] text-emerald-950">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto" />
                        <strong>Assinado pelo RE (Substituição Legal):</strong>{' '}
                        {reAssinatura.responsavel_nome}
                        <br />
                        <span className="text-[8px] text-stone-500">
                          {reAssinatura.autenticidade_mapa}
                        </span>
                      </div>
                    ) : dadosForm?.rt_assinatura_imagem ? (
                      <div className="my-1 p-1 bg-white rounded border border-stone-200 flex items-center justify-center">
                        <img
                          src={dadosForm.rt_assinatura_imagem}
                          alt="Assinatura RT"
                          className="max-h-12 max-w-full object-contain"
                        />
                      </div>
                    ) : record.assinaturas_registro?.rt ? (
                      <div className="p-1.5 bg-emerald-100 rounded border border-emerald-300 text-[10px] text-emerald-950">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto" />
                        <strong>Assinado pelo RT:</strong>{' '}
                        {record.assinaturas_registro.rt.responsavel_nome}
                      </div>
                    ) : (
                      <div className="border-b border-dashed border-emerald-400 w-3/4 mx-auto my-3" />
                    )}
                    <div>
                      <p className="font-bold text-[11px] text-stone-900">
                        {reAssinatura
                          ? reAssinatura.responsavel_nome
                          : company?.rt_nome || 'Dr. Hélio Silva'}
                      </p>
                      <p className="text-[9px] text-stone-500">
                        {reAssinatura
                          ? 'Responsável pelo Estabelecimento (RE MAPA)'
                          : `Responsável Técnico — ${company?.rt_registro_conselho || 'CRMV-SP 18.420'}`}
                      </p>
                    </div>
                  </div>

                  {/* ASSINATURA 2: RQ (Verificação da Qualidade) */}
                  <div className="p-2.5 border border-amber-300 rounded text-center flex flex-col justify-between min-h-[120px] bg-amber-50/50">
                    <span className="text-[10px] font-bold text-amber-800 uppercase">
                      Assinatura 2: Verificação da Qualidade (RQ)
                    </span>
                    {rqAssinatura ? (
                      <div className="p-1.5 bg-emerald-50 rounded border border-emerald-300 text-[10px] text-emerald-900">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto" />
                        <strong>Verificado e Assinado por RQ:</strong>{' '}
                        {rqAssinatura.responsavel_nome}
                        <br />
                        <span className="text-[8px] text-stone-500">
                          {rqAssinatura.autenticidade_mapa}
                        </span>
                      </div>
                    ) : (
                      <div className="border-b border-dashed border-amber-400 w-3/4 mx-auto my-3" />
                    )}
                    <div>
                      <p className="font-bold text-[11px] text-stone-900">
                        {company?.rq_nome || 'Dra. Mariana Siqueira'}
                      </p>
                      <p className="text-[9px] text-stone-500">Responsável pela Qualidade (RQ)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t border-[#E2DCCF] bg-white flex justify-between shrink-0">
          <span className="text-xs text-stone-500">
            Status: <strong>{record.status_assinatura || 'Pendente Assinatura'}</strong>
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
