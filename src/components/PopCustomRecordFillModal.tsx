import React, { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  Save,
  ShieldCheck,
  Calendar,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { createRecord } from '@/services/agroService'
import type { Procedure, PopCustomForm, Company } from '@/types/agro'

interface PopCustomRecordFillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedure: Procedure
  form: PopCustomForm | null
  company?: Company | null
  onRecordCreated: () => void
}

export function PopCustomRecordFillModal({
  open,
  onOpenChange,
  procedure,
  form,
  company,
  onRecordCreated,
}: PopCustomRecordFillModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [dataRegistro, setDataRegistro] = useState(new Date().toISOString().split('T')[0])
  const [turno, setTurno] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã')
  const [lote, setLote] = useState(`LOTE-${Date.now().toString().slice(-6)}`)
  // Validade opcional
  const initialValidade = form?.tem_vencimento
    ? (() => {
        const d = new Date()
        d.setDate(d.getDate() + (form.dias_validade_padrao || 365))
        return d.toISOString().split('T')[0]
      })()
    : ''
  const [dataValidade, setDataValidade] = useState(initialValidade)
  const [diasLembrete, setDiasLembrete] = useState<number>(form?.dias_alerta_vencimento || 60)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  if (!form) return null

  // Avaliação automática de conformidade baseada nos limites numéricos
  const avaliarConformidade = () => {
    let conforms = true
    const limites = form.regras_limites || []

    for (let i = 0; i < limites.length; i++) {
      const reg = limites[i]
      const val = parseFloat(formValues[reg.nome])
      if (!isNaN(val)) {
        if (reg.limite_min !== undefined && val < reg.limite_min) {
          conforms = false
          break
        }
        if (reg.limite_max !== undefined && val > reg.limite_max) {
          conforms = false
          break
        }
      }
    }
    return conforms ? 'Conforme' : 'Não Conforme'
  }

  const statusCalculado = avaliarConformidade()

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let statusValidadeCalculado: 'VIGENTE' | 'A_VENCER' | 'VENCIDO' | undefined
      if (dataValidade) {
        const diffMs = new Date(dataValidade).getTime() - new Date().getTime()
        const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        if (diffDias < 0) {
          statusValidadeCalculado = 'VENCIDO'
        } else if (diffDias <= (diasLembrete || 60)) {
          statusValidadeCalculado = 'A_VENCER'
        } else {
          statusValidadeCalculado = 'VIGENTE'
        }
      }

      const recordPayload: any = {
        procedure: procedure.id,
        formulario_codigo: form.codigo,
        data: dataRegistro,
        turno: turno,
        lote: lote,
        status: statusCalculado,
        valor_medido:
          formValues['parametro_medido'] ||
          formValues['temperatura'] ||
          formValues['valor_medido'] ||
          'Conforme verificação',
        responsavel: user?.name || user?.email || 'Operador da Linha',
        observacoes: observacoes,
        dados_formulario: {
          ...formValues,
          data_validade: dataValidade || null,
          dias_lembrete_vencimento: diasLembrete || 60,
          titulo_formulario: form.titulo,
          frequencia_formulario: form.frequencia,
          executor_nome: user?.name,
          executor_cpf: user?.cpf,
          executor_papel: user?.role,
          executor_rubrica: user?.assinatura_imagem,
        },
        status_assinatura: 'Pendente Assinatura',
        origem_registro: 'demanda_cliente_formulario',
        status_execucao: 'Preenchido',
      }

      if (dataValidade) {
        recordPayload.data_validade = `${dataValidade} 00:00:00.000Z`
        recordPayload.dias_lembrete_vencimento = diasLembrete
        recordPayload.status_validade = statusValidadeCalculado
      }

      await createRecord(recordPayload)

      toast({
        title: 'Registro de Monitoramento Gravado',
        description: `Registro ${form.codigo} salvo com sucesso com status ${statusCalculado}.`,
      })

      onRecordCreated()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao criar registro',
        description: err.message || 'Falha ao salvar ficha de monitoramento.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#2D6A4F] text-white text-[10px] font-mono">
                  {form.codigo}
                </Badge>
                <Badge
                  className={
                    statusCalculado === 'Conforme'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {statusCalculado}
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold font-['Sora'] text-[#1B4332]">
                Preencher Registro: {form.titulo}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Procedimento vinculado: [{procedure.codigo}] {procedure.nome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSaveRecord}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs"
        >
          {/* Cabeçalho do Registro (Data, Turno, Lote) */}
          <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Data do Registro *</Label>
              <Input
                type="date"
                value={dataRegistro}
                onChange={(e) => setDataRegistro(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Turno Operacional *</Label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value as any)}
                className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
              >
                <option value="Manhã">Manhã (1º Turno)</option>
                <option value="Tarde">Tarde (2º Turno)</option>
                <option value="Noite">Noite (3º Turno)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Lote / Batelada *</Label>
              <Input
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ex: LOTE-2025-01"
                className="h-9 text-xs font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Bloco de Vencimento / Validade Opcional */}
          {(form.tem_vencimento || form.campos.some((c) => c.tipo === 'vencimento')) && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#D9A404]" />
                  <Label className="text-xs font-bold text-amber-950">
                    Prazo de Validade / Revalidação (Opcional)
                  </Label>
                </div>
                <span className="text-[10px] text-amber-800 italic">
                  Não bloqueia o envio se vazio
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-stone-700">
                    Data de Vencimento / Revalidação
                  </Label>
                  <Input
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="h-9 text-xs bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-stone-700">
                    Lembrete de Alerta Antecipado (dias)
                  </Label>
                  <Input
                    type="number"
                    value={diasLembrete}
                    onChange={(e) => setDiasLembrete(parseInt(e.target.value) || 60)}
                    placeholder="60"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Campos Personalizados Configurados no Construtor */}
          <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-4">
            <h4 className="font-bold text-[#2D6A4F] text-xs uppercase tracking-wider border-b border-stone-100 pb-2">
              Parâmetros de Inspeção e Controle
            </h4>

            <div className="space-y-3">
              {form.campos.map((campo) => {
                const val = formValues[campo.nome] ?? ''

                return (
                  <div
                    key={campo.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-stone-800">
                        {campo.rotulo}{' '}
                        {campo.obrigatorio && <span className="text-red-600">*</span>}
                      </Label>
                      {campo.tipo === 'number' &&
                        (campo.limite_min !== undefined || campo.limite_max !== undefined) && (
                          <span className="text-[10px] text-amber-800 font-medium">
                            Faixa Conforme: {campo.limite_min ?? '—'} a {campo.limite_max ?? '—'}{' '}
                            {campo.unidade_medida}
                          </span>
                        )}
                    </div>

                    {campo.tipo === 'text' && (
                      <Input
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [campo.nome]: e.target.value })
                        }
                        required={campo.obrigatorio}
                        className="h-9 text-xs bg-white"
                        placeholder={`Informe ${campo.rotulo.toLowerCase()}...`}
                      />
                    )}

                    {campo.tipo === 'textarea' && (
                      <Textarea
                        rows={3}
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [campo.nome]: e.target.value })
                        }
                        required={campo.obrigatorio}
                        className="text-xs bg-white"
                        placeholder={`Descreva ${campo.rotulo.toLowerCase()}...`}
                      />
                    )}

                    {campo.tipo === 'number' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="any"
                          value={val}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [campo.nome]: e.target.value })
                          }
                          required={campo.obrigatorio}
                          className="h-9 text-xs bg-white font-bold"
                          placeholder="0.00"
                        />
                        {campo.unidade_medida && (
                          <span className="text-xs font-bold text-stone-600 shrink-0">
                            {campo.unidade_medida}
                          </span>
                        )}
                      </div>
                    )}

                    {(campo.tipo === 'date' || campo.tipo === 'vencimento') && (
                      <Input
                        type="date"
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [campo.nome]: e.target.value })
                        }
                        required={campo.obrigatorio}
                        className="h-9 text-xs bg-white"
                      />
                    )}

                    {campo.tipo === 'select' && (
                      <select
                        value={val}
                        onChange={(e) =>
                          setFormValues({ ...formValues, [campo.nome]: e.target.value })
                        }
                        required={campo.obrigatorio}
                        className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                      >
                        <option value="">Selecione...</option>
                        {campo.opcoes?.map((op, i) => (
                          <option key={i} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    )}

                    {campo.tipo === 'checklist' && (
                      <div className="space-y-1.5 pt-1">
                        {campo.opcoes?.map((op, i) => {
                          const currentChecks: string[] = Array.isArray(val) ? val : []
                          const isChecked = currentChecks.includes(op)
                          return (
                            <label
                              key={i}
                              className="flex items-center gap-2 cursor-pointer text-stone-700"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...currentChecks, op]
                                    : currentChecks.filter((c) => c !== op)
                                  setFormValues({ ...formValues, [campo.nome]: updated })
                                }}
                                className="rounded text-[#2D6A4F]"
                              />
                              <span>{op}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}

                    {campo.tipo === 'signature_execution' && (
                      <div className="p-2.5 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-emerald-950">
                            Executor: {user?.name || 'Operador da Linha'}
                          </p>
                          <p className="text-[10px] text-emerald-800">
                            CPF: {user?.cpf || 'Cadastrado'} • Papel: {user?.role || 'operador'}
                          </p>
                        </div>
                        {user?.assinatura_imagem ? (
                          <img
                            src={user.assinatura_imagem}
                            alt="Rubrica"
                            className="h-7 object-contain bg-white px-2 py-0.5 rounded border border-emerald-300"
                          />
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-white border-emerald-300"
                          >
                            Rubrica vinculada ao usuário
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1.5">
            <Label className="text-xs font-semibold text-stone-700">Observações Operacionais</Label>
            <Textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Parâmetros aferidos na primeira batelada da manhã..."
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2 flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Gravando...' : 'Salvar Registro de Monitoramento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
