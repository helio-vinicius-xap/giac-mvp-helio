import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileCheck2,
  BellRing,
  Sparkles,
} from 'lucide-react'
import type { Procedure, MonitoringRecord } from '@/types/agro'
import { createDemandRecord } from '@/lib/recordFlow'
import { toast } from '@/hooks/use-toast'

interface PopDemandRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedure: Procedure
  userName?: string
  existingRecords?: MonitoringRecord[]
  onRecordCreated: (record: MonitoringRecord) => void
}

export function PopDemandRecordModal({
  open,
  onOpenChange,
  procedure,
  userName = 'Responsável Técnico',
  existingRecords = [],
  onRecordCreated,
}: PopDemandRecordModalProps) {
  const [tipoDemanda, setTipoDemanda] = useState<'formulario_sistema' | 'anexo_cliente'>(
    'formulario_sistema',
  )
  const [origemAviso, setOrigemAviso] = useState<'sistema' | 'cliente'>('sistema')

  // Campos do formulário
  const [formularioCodigo, setFormularioCodigo] = useState('ANEXO III')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [lote, setLote] = useState('')
  const [registroAnterior, setRegistroAnterior] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)

  // Aviso customizado pelo cliente
  const [avisoTitulo, setAvisoTitulo] = useState('')
  const [avisoDescricao, setAvisoDescricao] = useState('')
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'critica'>('alta')
  const [prazoHoras, setPrazoHoras] = useState(48)

  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!titulo.trim()) {
      toast({
        title: 'Campo Obrigatório',
        description: 'Informe o título do registro por demanda.',
        variant: 'destructive',
      })
      return
    }

    if (tipoDemanda === 'anexo_cliente' && !arquivo) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Selecione uma planilha (.xlsx), PDF ou documento para anexar.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const avisoCustom =
        origemAviso === 'cliente'
          ? {
              titulo: avisoTitulo.trim() || titulo,
              descricao: avisoDescricao.trim() || descricao,
              prioridade,
              prazoHoras: Number(prazoHoras) || 48,
            }
          : undefined

      const record = await createDemandRecord({
        procedureId: procedure.id,
        procedureCode: procedure.codigo,
        formularioCodigo: formularioCodigo || 'ANEXO III',
        tipoDemanda,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        lote: lote.trim(),
        responsavel: userName,
        arquivoAnexo: arquivo || undefined,
        registroAnterior: registroAnterior.trim() || undefined,
        avisoCustomizado: avisoCustom,
      })

      toast({
        title: 'Registro por Demanda Criado!',
        description:
          tipoDemanda === 'anexo_cliente'
            ? 'Documento/Planilha anexado com sucesso e integrado à cadeia do Auto Controle.'
            : 'Registro iniciado no sistema. A pendência já está visível para a equipe.',
      })

      onRecordCreated(record)
      onOpenChange(false)

      // Reseta estado
      setTitulo('')
      setDescricao('')
      setLote('')
      setRegistroAnterior('')
      setArquivo(null)
      setAvisoTitulo('')
      setAvisoDescricao('')
    } catch (err: any) {
      console.error('Erro ao criar registro por demanda:', err)
      toast({
        title: 'Erro ao criar registro',
        description: err.message || 'Falha na comunicação com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-stone-900 border-[#E2DCCF]">
        <DialogHeader className="pb-3 border-b border-[#E2DCCF]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
              {procedure.codigo}
            </span>
            <DialogTitle className="text-lg font-bold font-['Sora'] text-[#1B4332]">
              Gerar Registro por Demanda do Cliente
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-stone-600">
            Adicione um registro obrigatório avulso ou anexado pelo cliente, integrando-o
            imediatamente à cadeia de comprovação do Auto Controle.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* 1. Escolha do Tipo de Demanda */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Formato de Geração
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setTipoDemanda('formulario_sistema')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  tipoDemanda === 'formulario_sistema'
                    ? 'border-[#1B4332] bg-[#1B4332]/5 ring-1 ring-[#1B4332]'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <FileText
                  className={`h-5 w-5 mt-0.5 ${tipoDemanda === 'formulario_sistema' ? 'text-[#1B4332]' : 'text-stone-400'}`}
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Formulário Digital do Sistema
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Gera um registro na cadeia para preenchimento direto no GIAC.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setTipoDemanda('anexo_cliente')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                  tipoDemanda === 'anexo_cliente'
                    ? 'border-[#1B4332] bg-[#1B4332]/5 ring-1 ring-[#1B4332]'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <UploadCloud
                  className={`h-5 w-5 mt-0.5 ${tipoDemanda === 'anexo_cliente' ? 'text-[#1B4332]' : 'text-stone-400'}`}
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900">
                    Planilha ou Documento Anexado
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Upload de arquivo externo (.xlsx, .pdf, .docx) fornecido pelo cliente.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Seleção do Módulo / Anexo da Cadeia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Anexo / Etapa do Auto Controle
              </Label>
              <select
                value={formularioCodigo}
                onChange={(e) => setFormularioCodigo(e.target.value)}
                className="w-full h-9 rounded-md border border-stone-300 bg-white px-3 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
              >
                <option value="ANEXO I">Anexo I - Qualificação de Fornecedor (FR 16)</option>
                <option value="ANEXO II">
                  Anexo II - Lista de Fornecedores Qualificados (FR 14)
                </option>
                <option value="ANEXO III">
                  Anexo III - Recebimento de Matérias-Primas (FR 08)
                </option>
                <option value="ANEXO IV">Anexo IV - Coleta de Amostra em Triplicata</option>
                <option value="ANEXO V">Anexo V - Relatório de Análise Laboratorial</option>
                <option value="ANEXO VI">Anexo VI - Destinação de Não Aprovados (FR 18)</option>
                <option value="ANEXO VII">Anexo VII - Ação Corretiva (FR 01 / RNC)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Lote de Matéria-Prima (Opcional)
              </Label>
              <Input
                placeholder="Ex: MP-2025-042"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* 3. Título e Descrição */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-stone-700">
              Título da Demanda / Registro *
            </Label>
            <Input
              placeholder="Ex: Análise Extraordinária Solicitada pelo Cliente ou Lote Especial"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold text-stone-700">
              Descrição / Justificativa da Demanda
            </Label>
            <Textarea
              placeholder="Descreva o motivo desta demanda, requisitos especiais ou observações técnicas..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* 4. Encadeamento Opcional: Registro Anterior (Pai) */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-stone-700">
              Vincular a Registro Anterior na Cadeia (Opcional)
            </Label>
            <select
              value={registroAnterior}
              onChange={(e) => setRegistroAnterior(e.target.value)}
              className="w-full h-9 rounded-md border border-stone-300 bg-white px-3 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#1B4332]"
            >
              <option value="">Sem vínculo anterior (início de uma nova sub-cadeia)</option>
              {existingRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.formulario_codigo || 'Reg'} -{' '}
                  {r.valor_medido || r.lote || r.id.substring(0, 8)} (
                  {new Date(r.data).toLocaleDateString('pt-BR')})
                </option>
              ))}
            </select>
          </div>

          {/* 5. Upload de Arquivo (Quando tipo for anexo_cliente) */}
          {tipoDemanda === 'anexo_cliente' && (
            <div className="p-3.5 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 space-y-2">
              <Label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <UploadCloud className="h-4 w-4 text-[#1B4332]" />
                Anexo Fornecido pelo Cliente (.xlsx, .pdf, .docx, .png, .jpg) *
              </Label>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setArquivo(e.target.files[0])
                  }
                }}
                className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#1B4332] file:text-white hover:file:bg-[#122e22] cursor-pointer"
              />
              {arquivo && (
                <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Arquivo selecionado: {arquivo.name} ({(arquivo.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* 6. Configuração do Aviso de Pendência (Sistema vs Fornecido pelo Cliente) */}
          <div className="p-3.5 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-[#1B4332] flex items-center gap-1.5">
                <BellRing className="h-4 w-4 text-[#D9A404]" />
                Configuração do Aviso de Pendência
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOrigemAviso('sistema')}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition ${
                    origemAviso === 'sistema'
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white text-stone-600 border border-stone-200'
                  }`}
                >
                  Automático do Sistema
                </button>
                <button
                  type="button"
                  onClick={() => setOrigemAviso('cliente')}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-semibold transition ${
                    origemAviso === 'cliente'
                      ? 'bg-[#D9A404] text-[#1B4332]'
                      : 'bg-white text-stone-600 border border-stone-200'
                  }`}
                >
                  Personalizado pelo Cliente
                </button>
              </div>
            </div>

            {origemAviso === 'cliente' ? (
              <div className="space-y-2.5 pt-1 border-t border-stone-200 animate-fade-in">
                <p className="text-[11px] text-stone-600">
                  Defina um aviso sob medida com título, instruções específicas e prazo de
                  atendimento.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-stone-600">Título do Aviso</Label>
                    <Input
                      placeholder="Ex: Auditoria Externa Iminente - Necessário Laudo"
                      value={avisoTitulo}
                      onChange={(e) => setAvisoTitulo(e.target.value)}
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] text-stone-600">Prioridade</Label>
                    <select
                      value={prioridade}
                      onChange={(e: any) => setPrioridade(e.target.value)}
                      className="w-full h-8 rounded-md border border-stone-300 bg-white px-2 text-xs"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica (Impedimento)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-stone-600">Instruções da Pendência</Label>
                  <Input
                    placeholder="Instruções para o operador ou laboratório..."
                    value={avisoDescricao}
                    onChange={(e) => setAvisoDescricao(e.target.value)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-stone-600">
                O aviso será formulado com base nas regras normativas do Auto Controle (prazo padrão
                da cadeia e criticidade regulamentar).
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="text-xs h-9 border-stone-300 text-stone-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#1B4332] hover:bg-[#122e22] text-white text-xs h-9 font-semibold gap-1.5"
            >
              {saving ? (
                <>Salvando e Encadeando...</>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#D9A404]" />
                  Gerar e Inserir na Cadeia
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
