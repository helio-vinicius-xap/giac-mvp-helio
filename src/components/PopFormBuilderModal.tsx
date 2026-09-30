import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Layers,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Save,
  PenTool,
  Hash,
  Calendar,
  Type,
  ListOrdered,
  Sliders,
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
import { createPopCustomForm, updatePopCustomForm } from '@/services/agroService'
import type { Procedure, PopCustomForm, PopCustomFormField } from '@/types/agro'

interface PopFormBuilderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedure: Procedure
  formToEdit?: PopCustomForm | null
  onFormSaved: () => void
}

export function PopFormBuilderModal({
  open,
  onOpenChange,
  procedure,
  formToEdit,
  onFormSaved,
}: PopFormBuilderModalProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [codigo, setCodigo] = useState(
    formToEdit?.codigo || `F-${procedure.codigo}-${Math.floor(10 + Math.random() * 90)}`,
  )
  const [titulo, setTitulo] = useState(
    formToEdit?.titulo || `Ficha de Monitoramento Customizada - ${procedure.codigo}`,
  )
  const [descricao, setDescricao] = useState(formToEdit?.descricao || '')
  const [frequencia, setFrequencia] = useState(formToEdit?.frequencia || 'Diário')
  const [obrigatorioNaCadeia, setObrigatorioNaCadeia] = useState(
    formToEdit?.obrigatorio_na_cadeia ?? true,
  )
  const [geraPendencia, setGeraPendencia] = useState(formToEdit?.gera_pendencia ?? true)

  const [campos, setCampos] = useState<PopCustomFormField[]>(
    formToEdit?.campos || [
      {
        id: 'fld_lote',
        nome: 'lote_insumo',
        rotulo: 'Número do Lote ou Batelada',
        tipo: 'text',
        obrigatorio: true,
      },
      {
        id: 'fld_temperatura',
        nome: 'parametro_medido',
        rotulo: 'Temperatura / Medição Aferida (°C ou %)',
        tipo: 'number',
        obrigatorio: true,
        limite_min: 10,
        limite_max: 30,
        unidade_medida: '°C',
        descricao_ajuda: 'Valores fora dos limites serão classificados como Não Conforme.',
      },
      {
        id: 'fld_conformidade',
        nome: 'checklist_conformidade',
        rotulo: 'Inspeção Visual e Integridade da Embalagem',
        tipo: 'checklist',
        obrigatorio: true,
        opcoes: [
          'Embalagem íntegra e sem perfurações',
          'Rótulo legível com carimbo MAPA',
          'Ausência de pragas ou umidade aparente',
        ],
      },
      {
        id: 'fld_assinatura',
        nome: 'assinatura_execucao',
        rotulo: 'Assinatura do Operador Executor da Linha',
        tipo: 'signature_execution',
        obrigatorio: true,
      },
    ],
  )

  const [saving, setSaving] = useState(false)

  // Adicionar novo campo
  const handleAddField = (tipo: PopCustomFormField['tipo']) => {
    const nextIdx = campos.length + 1
    const newFld: PopCustomFormField = {
      id: `fld_${Date.now()}`,
      nome: `campo_${nextIdx}`,
      rotulo: `Novo Campo ${nextIdx}`,
      tipo: tipo,
      obrigatorio: false,
      opcoes: tipo === 'select' || tipo === 'checklist' ? ['Opção 1', 'Opção 2'] : undefined,
    }
    setCampos([...campos, newFld])
  }

  // Mover campo para cima/baixo
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= campos.length) return
    const updated = [...campos]
    const temp = updated[index]
    updated[index] = updated[targetIdx]
    updated[targetIdx] = temp
    setCampos(updated)
  }

  // Remover campo
  const handleRemoveField = (index: number) => {
    setCampos(campos.filter((_, idx) => idx !== index))
  }

  // Atualizar propriedade do campo
  const handleUpdateField = (index: number, patch: Partial<PopCustomFormField>) => {
    const updated = [...campos]
    updated[index] = { ...updated[index], ...patch }
    setCampos(updated)
  }

  // Salvar formulário
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim() || !titulo.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Informe o código e o título do formulário.',
        variant: 'destructive',
      })
      return
    }

    if (campos.length === 0) {
      toast({
        title: 'Nenhum Campo',
        description: 'Adicione pelo menos um campo ao formulário.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        procedure: procedure.id,
        codigo: codigo.trim().toUpperCase(),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        frequencia,
        campos,
        regras_limites: campos
          .filter((f) => f.limite_min !== undefined || f.limite_max !== undefined)
          .map((f) => ({
            campo_id: f.id,
            nome: f.nome,
            limite_min: f.limite_min,
            limite_max: f.limite_max,
            unidade: f.unidade_medida,
          })),
        obrigatorio_na_cadeia: obrigatorioNaCadeia,
        gera_pendencia: geraPendencia,
        is_ativo: true,
        criado_por_nome: user?.name || user?.email,
      }

      if (formToEdit?.id) {
        await updatePopCustomForm(formToEdit.id, payload)
        toast({
          title: 'Formulário Atualizado',
          description: `Formulário ${payload.codigo} salvo com sucesso.`,
        })
      } else {
        await createPopCustomForm(payload)
        toast({
          title: 'Formulário Criado',
          description: `Formulário ${payload.codigo} criado e integrado à cadeia do ${procedure.codigo}.`,
        })
      }

      onFormSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar formulário',
        description: err.message || 'Falha ao salvar no banco.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Construtor de Formulários Digitais
                </span>
                <Badge className="bg-[#2D6A4F] text-white text-[11px] font-mono">
                  {procedure.codigo}
                </Badge>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
                {formToEdit
                  ? 'Editar Formulário do Auto Controle'
                  : 'Novo Formulário Personalizado'}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Crie fichas digitais que entram automaticamente na{' '}
                <strong>Cadeia de Registros Obrigatórios</strong> e no painel de pendências.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* Metadados do Formulário */}
          <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-3">
            <h4 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
              <Layers className="h-4 w-4 text-[#D9A404]" />
              Identificação do Formulário
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Código do Formulário *
                </Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ex: F-01-A, F-TEMP-01"
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Título do Formulário *
                </Label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Registro de Limpeza e Temperatura de Silo"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Frequência Operacional
                </Label>
                <select
                  value={frequencia}
                  onChange={(e) => setFrequencia(e.target.value)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="A cada batelada / recebimento">
                    A cada batelada / recebimento
                  </option>
                  <option value="Diário">Diário (por turno)</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Quinzenal">Quinzenal</option>
                  <option value="Mensal">Mensal</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Descrição / Finalidade
                </Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Utilizado na inspeção diária do setor de recebimento"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Configurações na Cadeia de Registros */}
            <div className="pt-2 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer p-2 rounded bg-[#FAF7EF] border border-[#E2DCCF]">
                <input
                  type="checkbox"
                  checked={obrigatorioNaCadeia}
                  onChange={(e) => setObrigatorioNaCadeia(e.target.checked)}
                  className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
                <div>
                  <Label className="text-xs font-bold text-stone-800">
                    Entrar na Cadeia Obrigatória do Auto Controle
                  </Label>
                  <p className="text-[11px] text-stone-500">
                    O Auto Controle só atinge comprovação quando este formulário for preenchido no
                    ciclo.
                  </p>
                </div>{' '}
              </label>

              <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer p-2 rounded bg-[#FAF7EF] border border-[#E2DCCF]">
                <input
                  type="checkbox"
                  checked={geraPendencia}
                  onChange={(e) => setGeraPendencia(e.target.checked)}
                  className="rounded text-[#2D6A4F] focus:ring-[#2D6A4F]"
                />
                <div>
                  <strong className="block text-stone-900">
                    Gerar Alerta no Painel de Pendências
                  </strong>
                  <span className="text-[10px] text-stone-500">
                    Ficará visível com badge e prazo no painel de pendências do Auto Controle.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Lista de Campos do Formulário */}
          <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
              <div>
                <h4 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-[#D9A404]" />
                  Campos Personalizados do Formulário ({campos.length})
                </h4>
                <p className="text-[11px] text-stone-500">
                  Adicione, ordene e configure limites de tolerância para avaliação Conforme/Não
                  Conforme.
                </p>
              </div>

              {/* Botões de Adicionar Campos */}
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('text')}
                  className="h-7 text-[10px] border-stone-300 gap-1"
                >
                  <Type className="h-3 w-3" /> + Texto
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('textarea')}
                  className="h-7 text-[10px] border-stone-300 gap-1"
                >
                  <Type className="h-3 w-3" /> + Texto Longo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('number')}
                  className="h-7 text-[10px] border-stone-300 gap-1 text-[#2D6A4F]"
                >
                  <Hash className="h-3 w-3" /> + Número (Limites)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('date')}
                  className="h-7 text-[10px] border-stone-300 gap-1"
                >
                  <Calendar className="h-3 w-3" /> + Data
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('select')}
                  className="h-7 text-[10px] border-stone-300 gap-1"
                >
                  <ListOrdered className="h-3 w-3" /> + Seleção
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('checklist')}
                  className="h-7 text-[10px] border-stone-300 gap-1 text-amber-800"
                >
                  <CheckCircle2 className="h-3 w-3" /> + Checklist
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddField('signature_execution')}
                  className="h-7 text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50 gap-1 font-semibold"
                >
                  <PenTool className="h-3 w-3" /> + Assinatura Execução
                </Button>
              </div>
            </div>

            {/* Listagem dos Campos Configurados */}
            <div className="space-y-3">
              {campos.map((campo, idx) => (
                <div
                  key={campo.id}
                  className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 hover:border-[#2D6A4F] transition"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono bg-white">
                        {campo.tipo}
                      </Badge>
                      <strong className="text-xs text-stone-900">
                        {campo.rotulo || 'Sem rótulo'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="h-6 w-6 p-0 text-stone-500"
                        title="Mover para cima"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={idx === campos.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="h-6 w-6 p-0 text-stone-500"
                        title="Mover para baixo"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveField(idx)}
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                        title="Remover campo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Edição dos atributos do campo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div>
                      <Label className="text-[10px] text-stone-600">Rótulo / Pergunta *</Label>
                      <Input
                        value={campo.rotulo}
                        onChange={(e) => handleUpdateField(idx, { rotulo: e.target.value })}
                        className="h-7 text-xs bg-white"
                        placeholder="Ex: Temperatura da Massa"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] text-stone-600">Nome da Variável (slug)</Label>
                      <Input
                        value={campo.nome}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            nome: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                          })
                        }
                        className="h-7 text-xs font-mono bg-white"
                        placeholder="ex: temp_massa"
                      />
                    </div>

                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-stone-700">
                        <input
                          type="checkbox"
                          checked={campo.obrigatorio}
                          onChange={(e) =>
                            handleUpdateField(idx, { obrigatorio: e.target.checked })
                          }
                          className="rounded text-[#2D6A4F]"
                        />
                        <span>Preenchimento Obrigatório</span>
                      </label>
                    </div>
                  </div>

                  {/* Configurações específicas por tipo */}
                  {campo.tipo === 'number' && (
                    <div className="p-2.5 bg-amber-50/60 rounded border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div>
                        <Label className="text-[10px] text-amber-900 font-semibold">
                          Limite Mínimo Conforme
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={campo.limite_min ?? ''}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              limite_min:
                                e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="Ex: 15"
                          className="h-7 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-amber-900 font-semibold">
                          Limite Máximo Conforme
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          value={campo.limite_max ?? ''}
                          onChange={(e) =>
                            handleUpdateField(idx, {
                              limite_max:
                                e.target.value !== '' ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          placeholder="Ex: 30"
                          className="h-7 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-amber-900 font-semibold">
                          Unidade de Medida
                        </Label>
                        <Input
                          value={campo.unidade_medida || ''}
                          onChange={(e) =>
                            handleUpdateField(idx, { unidade_medida: e.target.value })
                          }
                          placeholder="Ex: °C, %, mg/kg, ppm"
                          className="h-7 text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {(campo.tipo === 'select' || campo.tipo === 'checklist') && (
                    <div className="p-2.5 bg-white rounded border border-stone-200 text-[11px] space-y-1">
                      <Label className="text-[10px] text-stone-600 font-semibold">
                        Itens / Opções (separados por vírgula):
                      </Label>
                      <Input
                        value={campo.opcoes?.join(', ') || ''}
                        onChange={(e) =>
                          handleUpdateField(idx, {
                            opcoes: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Ex: Conforme, Não Conforme, Em Análise"
                        className="h-7 text-xs"
                      />
                    </div>
                  )}

                  {campo.tipo === 'signature_execution' && (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-[10px] text-emerald-900">
                      Campo de assinatura formal de execução da linha/setor. O usuário preenchedor
                      registrará sua rubrica gráfica e CPF conforme a hierarquia de operadores do
                      GIAC.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé com botões de ação */}
        <DialogFooter className="p-4 border-t border-[#E2DCCF] bg-white flex justify-between sm:justify-between shrink-0">
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
            type="button"
            size="sm"
            disabled={saving}
            onClick={handleSave}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Gravando Formulário...' : 'Salvar Formulário no Auto Controle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
