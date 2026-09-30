import React, { useState } from 'react'
import {
  Save,
  Send,
  Printer,
  History,
  Trash2,
  AlertTriangle,
  FileCheck,
  Building2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import type { AnexoVIDestinacaoData, TipoDestinacaoFinal } from '@/types/pop01Forms'
import { gerarCodigoRegistro } from '@/lib/pop01Validators'

interface AnexoVIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoVIDestinacaoData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoVIDestinacaoData>
  recebimentosReprovados: Array<{
    numero_recebimento: string
    fornecedor_razao_social: string
    produto_nome: string
    lote_partida: string
    quantidade: number | string
    unidade: string
    data_rejeicao: string
    motivo_rejeicao?: string
    descricao_motivo?: string
  }>
  currentUser?: { name: string; email: string; role?: string } | null
  usersList: Array<{ id: string; name: string; role: string }>
  onPrintPreview?: (dados: AnexoVIDestinacaoData) => void
  onCriarAcaoCorretivaDireta?: (dadosDestinacao: AnexoVIDestinacaoData) => void
}

export function AnexoVIDestinacaoModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  recebimentosReprovados,
  currentUser,
  usersList,
  onPrintPreview,
  onCriarAcaoCorretivaDireta,
}: AnexoVIModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const defaultState: AnexoVIDestinacaoData = {
    numero_registro: gerarCodigoRegistro('DES', Math.floor(Math.random() * 90000) + 10000),
    data_registro: new Date().toISOString().split('T')[0],
    responsavel_registro: currentUser?.name || 'Responsável pelo Descarte',
    versao: '01-2026',
    status_fluxo: 'Rascunho',

    numero_recebimento: '',
    fornecedor_razao_social: '',
    produto_nome: '',
    lote_partida: '',
    quantidade: '1000',
    unidade: 'kg',
    data_rejeicao: new Date().toISOString().split('T')[0],

    motivo_rejeicao: 'Embalagem Danificada',
    descricao_motivo: 'Presença de perfurações e umidade excessiva nas sacarias.',
    numero_relatorio_analise: '',

    local_armazenamento: 'Área de Produtos Não Aprovados (Quarentena)',
    data_armazenamento: new Date().toISOString().split('T')[0],
    responsavel_armazenamento: currentUser?.name || 'Operador',
    condicoes_armazenamento:
      'Área isolada, identificada por placas vermelhas e trancada com chave sob guarda do CQ.',

    tipo_destinacao: 'Devolução ao Fornecedor',

    // Devolução
    devolucao_data: new Date().toISOString().split('T')[0],
    devolucao_transportadora: 'TransAgro Cargas Especiais Ltda.',
    devolucao_rastreamento: 'BR-9842109',
    devolucao_responsavel: currentUser?.name || 'Responsável',

    // Destruição
    destruicao_data: new Date().toISOString().split('T')[0],
    destruicao_metodo: 'Compostagem',
    destruicao_local: 'Usina Municipal de Tratamento de Resíduos',
    destruicao_responsavel: currentUser?.name || 'Responsável',
    destruicao_comprovante_nome: 'Certificado_Destinacao_Residuo.pdf',

    // Aproveitamento
    aproveitamento_acao_corretiva:
      'Reprocessamento térmico a 90°C para inativação enzimática e novo ensaio bromatológico.',
    aproveitamento_data_reprocessamento: new Date().toISOString().split('T')[0],
    aproveitamento_responsavel: currentUser?.name || 'Responsável',
    aproveitamento_resultado: 'Aprovado',

    // Doação
    doacao_destinatario: '',
    doacao_data: new Date().toISOString().split('T')[0],
    doacao_transportadora: '',
    doacao_rastreamento: '',
    doacao_responsavel: currentUser?.name || 'Responsável',
    doacao_comprovante_nome: '',

    // Outro
    outro_descricao: '',
    outro_data_conclusao: new Date().toISOString().split('T')[0],
    outro_responsavel: currentUser?.name || 'Responsável',
    outro_comprovante_nome: '',

    conformidade_ambiental: true,
    referencia_legislacao: 'Lei 12.305/2010 (PNRS) e Resoluções CONAMA',
    orgao_ambiental_notificado: 'Não Aplicável',
    numero_protocolo_ambiental: '',

    observacoes_gerais:
      'Acompanhamento fotográfico e lacre do caminhão registrados no arquivo do CQ.',
    licoes_aprendidas:
      'Reforçar com transportador o controle de umidade e enlonamento durante o frete.',

    assinado_rq_nome: currentUser?.name || 'Dra. Mariana Siqueira (RQ)',
    assinado_rq_data: new Date().toISOString().split('T')[0],
    assinado_rt_nome:
      usersList.find((u) => u.role === 'RT' || u.role === 'RE')?.name || 'Dr. Hélio Silva (RT)',
    assinado_rt_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoVIDestinacaoData>({
    ...defaultState,
    ...initialData,
  })

  // Sincroniza ao selecionar recebimento reprovado
  const handleSelectRecebimento = (numRec: string) => {
    const rec = recebimentosReprovados.find((x) => x.numero_recebimento === numRec)
    if (rec) {
      setForm((prev) => ({
        ...prev,
        numero_recebimento: rec.numero_recebimento,
        fornecedor_razao_social: rec.fornecedor_razao_social,
        produto_nome: rec.produto_nome,
        lote_partida: rec.lote_partida,
        quantidade: rec.quantidade,
        unidade: rec.unidade,
        data_rejeicao: rec.data_rejeicao,
        motivo_rejeicao: (rec.motivo_rejeicao as any) || prev.motivo_rejeicao,
        descricao_motivo: rec.descricao_motivo || prev.descricao_motivo,
      }))
    } else {
      setForm((prev) => ({ ...prev, numero_recebimento: numRec }))
    }
  }

  const validateForm = (): boolean => {
    if (!form.numero_recebimento) {
      toast({ title: 'Recebimento de Origem é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.descricao_motivo || form.descricao_motivo.trim().length === 0) {
      toast({ title: 'Descrição do motivo da rejeição é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.conformidade_ambiental) {
      toast({
        title: 'Confirmação de Conformidade Ambiental é obrigatória',
        variant: 'destructive',
      })
      return false
    }

    // Validações dinâmicas conforme a destinação
    if (form.tipo_destinacao === 'Devolução ao Fornecedor') {
      if (!form.devolucao_data || !form.devolucao_transportadora || !form.devolucao_rastreamento) {
        toast({
          title: 'Preencha todos os dados da transportadora e rastreamento da devolução',
          variant: 'destructive',
        })
        return false
      }
    } else if (form.tipo_destinacao === 'Destruição/Inutilização') {
      if (!form.destruicao_data || !form.destruicao_local || !form.destruicao_comprovante_nome) {
        toast({
          title: 'Data, local e comprovante de destruição são obrigatórios',
          variant: 'destructive',
        })
        return false
      }
    } else if (form.tipo_destinacao === 'Aproveitamento Condicional') {
      if (
        !form.aproveitamento_acao_corretiva ||
        form.aproveitamento_acao_corretiva.trim().length === 0
      ) {
        toast({
          title: 'Descrição da ação corretiva de reprocessamento é obrigatória',
          variant: 'destructive',
        })
        return false
      }
    }
    return true
  }

  const handleSubmitAction = async (isDraft: boolean) => {
    if (!isDraft && !validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const statusFinal = isDraft ? 'Rascunho' : 'Concluído'

      const logItem = {
        usuario: currentUser?.name || 'Operador',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Concluir Destinação de Produto',
        detalhes: `Destinação: ${form.tipo_destinacao} • Status: ${statusFinal}`,
      }

      const updatedForm: AnexoVIDestinacaoData = {
        ...form,
        status_fluxo: statusFinal as any,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar destinação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E2DCCF] bg-[#FAF7EF] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO VI
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  POP 01 (FR 18) • IN 04/2007
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Registro de Destinação de Produtos Não Aprovados
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Tratamento definitivo de cargas reprovadas (devolução, incineração, aterro ou
                reprocessamento).
              </DialogDescription>
            </div>

            {form.historico_alteracoes && form.historico_alteracoes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs h-8 border-stone-300 gap-1.5"
              >
                <History className="h-3.5 w-3.5 text-stone-600" />
                Histórico ({form.historico_alteracoes.length})
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-stone-800">
          {/* Histórico retrátil */}
          {showHistory && form.historico_alteracoes && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
              <span className="font-bold text-[11px] uppercase text-[#1B4332]">
                Histórico de Alterações
              </span>
              <div className="space-y-1">
                {form.historico_alteracoes.map((h, i) => (
                  <div
                    key={i}
                    className="text-[11px] text-stone-600 flex justify-between border-b border-stone-200 pb-0.5"
                  >
                    <span>
                      <strong>{h.usuario}</strong>: {h.acao} {h.detalhes ? `(${h.detalhes})` : ''}
                    </span>
                    <span className="text-stone-400">
                      {new Date(h.data_hora).toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
            <div>
              <Label className="text-xs">Nº do Registro (Auto)</Label>
              <Input
                readOnly
                value={form.numero_registro}
                className="h-8 text-xs mt-1 bg-stone-100 font-mono font-bold text-[#1B4332]"
              />
            </div>
            <div>
              <Label className="text-xs">Data de Registro</Label>
              <Input
                type="date"
                value={form.data_registro}
                onChange={(e) => setForm({ ...form, data_registro: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável Registro</Label>
              <Input
                value={form.responsavel_registro}
                onChange={(e) => setForm({ ...form, responsavel_registro: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Versão</Label>
              <Input
                value={form.versao}
                onChange={(e) => setForm({ ...form, versao: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
          </div>

          {/* SEÇÃO 1 – IDENTIFICAÇÃO DO PRODUTO NÃO APROVADO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 1 – Vínculo com Recebimento Reprovado (Anexo III)
            </h3>

            <div>
              <Label className="text-xs">
                Recebimento Reprovado <span className="text-red-500">*</span>
              </Label>
              <Select value={form.numero_recebimento} onValueChange={handleSelectRecebimento}>
                <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                  <SelectValue placeholder="Selecione o recebimento reprovado..." />
                </SelectTrigger>
                <SelectContent>
                  {recebimentosReprovados.map((rec) => (
                    <SelectItem key={rec.numero_recebimento} value={rec.numero_recebimento}>
                      {rec.numero_recebimento} — {rec.produto_nome} ({rec.quantidade} {rec.unidade})
                      - {rec.fornecedor_razao_social}
                    </SelectItem>
                  ))}
                  {recebimentosReprovados.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum recebimento reprovado recente
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <Label className="text-[11px] text-stone-500">Fornecedor (Auto)</Label>
                <p className="font-semibold text-stone-800 text-xs">
                  {form.fornecedor_razao_social || '—'}
                </p>
              </div>
              <div>
                <Label className="text-[11px] text-stone-500">Produto (Auto)</Label>
                <p className="font-semibold text-stone-800 text-xs">{form.produto_nome || '—'}</p>
              </div>
              <div>
                <Label className="text-[11px] text-stone-500">Lote (Auto)</Label>
                <p className="font-mono font-bold text-stone-800 text-xs">
                  {form.lote_partida || '—'}
                </p>
              </div>
              <div>
                <Label className="text-[11px] text-stone-500">Qtd Reprovada</Label>
                <p className="font-mono font-bold text-red-700 text-xs">
                  {form.quantidade} {form.unidade}
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 – MOTIVO DA REJEIÇÃO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 2 – Motivo da Não Conformidade e Relatório
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Motivo da Rejeição</Label>
                <Select
                  value={form.motivo_rejeicao}
                  onValueChange={(val) => setForm({ ...form, motivo_rejeicao: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Validade Expirada">Validade Expirada</SelectItem>
                    <SelectItem value="Embalagem Danificada">Embalagem Danificada</SelectItem>
                    <SelectItem value="Contaminação Microbiológica">
                      Contaminação Microbiológica
                    </SelectItem>
                    <SelectItem value="Contaminação Química">
                      Contaminação Química (Resíduos/Micotoxinas)
                    </SelectItem>
                    <SelectItem value="Contaminação Física">
                      Contaminação Física / Matérias Estranhas
                    </SelectItem>
                    <SelectItem value="Fornecedor Não Qualificado">
                      Fornecedor Não Qualificado
                    </SelectItem>
                    <SelectItem value="Análise Reprovada">
                      Laudo de Análise Reprovado (Anexo V)
                    </SelectItem>
                    <SelectItem value="Outro">Outro Motivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Nº do Relatório de Análise (se aplicável)</Label>
                <Input
                  value={form.numero_relatorio_analise || ''}
                  onChange={(e) => setForm({ ...form, numero_relatorio_analise: e.target.value })}
                  placeholder="Ex: LAB-20260315-00123"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">
                Descrição do Motivo (máx 500) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                maxLength={500}
                rows={2}
                value={form.descricao_motivo}
                onChange={(e) => setForm({ ...form, descricao_motivo: e.target.value })}
                placeholder="Detalhes técnicos da reprovação da carga..."
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 3 – ARMAZENAMENTO PROVISÓRIO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 3 – Armazenamento Provisório (Quarentena)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Local (Fixo Quarentena)</Label>
                <Input
                  readOnly
                  value={form.local_armazenamento}
                  className="h-8 text-xs mt-1 bg-stone-100 text-[#1B4332] font-semibold"
                />
              </div>
              <div>
                <Label className="text-xs">Data de Entrada Quarentena</Label>
                <Input
                  type="date"
                  value={form.data_armazenamento}
                  onChange={(e) => setForm({ ...form, data_armazenamento: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Responsável Guarda</Label>
                <Input
                  value={form.responsavel_armazenamento}
                  onChange={(e) => setForm({ ...form, responsavel_armazenamento: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Condições de Segregação (máx 300)</Label>
              <Input
                maxLength={300}
                value={form.condicoes_armazenamento || ''}
                onChange={(e) => setForm({ ...form, condicoes_armazenamento: e.target.value })}
                placeholder="Ex: Área delimitada com fita zebrada e placa de Quarentena..."
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 4 – DESTINAÇÃO FINAL COM CAMPOS DINÂMICOS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 4 – Destinação Final Autorizada
            </h3>

            <div>
              <Label className="text-xs">Tipo de Destinação</Label>
              <Select
                value={form.tipo_destinacao}
                onValueChange={(val: TipoDestinacaoFinal) =>
                  setForm({ ...form, tipo_destinacao: val })
                }
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-white font-semibold text-[#1B4332]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Devolução ao Fornecedor">Devolução ao Fornecedor</SelectItem>
                  <SelectItem value="Destruição/Inutilização">
                    Destruição / Inutilização (Incineração/Aterro)
                  </SelectItem>
                  <SelectItem value="Aproveitamento Condicional">
                    Aproveitamento Condicional (Reprocessamento)
                  </SelectItem>
                  <SelectItem value="Doação">Doação (Uso não zootécnico)</SelectItem>
                  <SelectItem value="Outro">Outro Procedimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dinâmico: Devolução */}
            {form.tipo_destinacao === 'Devolução ao Fornecedor' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <span className="font-bold text-[11px] text-[#1B4332] uppercase">
                  Parâmetros de Devolução ao Fornecedor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Data de Devolução</Label>
                    <Input
                      type="date"
                      value={form.devolucao_data || ''}
                      onChange={(e) => setForm({ ...form, devolucao_data: e.target.value })}
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Transportadora Contratada</Label>
                    <Input
                      maxLength={100}
                      value={form.devolucao_transportadora || ''}
                      onChange={(e) =>
                        setForm({ ...form, devolucao_transportadora: e.target.value })
                      }
                      placeholder="Nome da transportadora"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Nº Rastreamento / CTE</Label>
                    <Input
                      maxLength={50}
                      value={form.devolucao_rastreamento || ''}
                      onChange={(e) => setForm({ ...form, devolucao_rastreamento: e.target.value })}
                      placeholder="Ex: CTE 104820"
                      className="h-8 text-xs mt-1 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dinâmico: Destruição */}
            {form.tipo_destinacao === 'Destruição/Inutilização' && (
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200 space-y-3">
                <span className="font-bold text-[11px] text-red-800 uppercase">
                  Parâmetros de Inutilização / Destruição
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Data da Destruição</Label>
                    <Input
                      type="date"
                      value={form.destruicao_data || ''}
                      onChange={(e) => setForm({ ...form, destruicao_data: e.target.value })}
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Método de Destruição</Label>
                    <Select
                      value={form.destruicao_metodo}
                      onValueChange={(val) => setForm({ ...form, destruicao_metodo: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Incineração">Incineração</SelectItem>
                        <SelectItem value="Aterro">Aterro Industrial Licenciado</SelectItem>
                        <SelectItem value="Compostagem">Compostagem Controlada</SelectItem>
                        <SelectItem value="Outro">Outro Método</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Local / Usina</Label>
                    <Input
                      value={form.destruicao_local || ''}
                      onChange={(e) => setForm({ ...form, destruicao_local: e.target.value })}
                      placeholder="Nome do aterro ou usina"
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Comprovante / Certificado</Label>
                    <Input
                      value={form.destruicao_comprovante_nome || ''}
                      onChange={(e) =>
                        setForm({ ...form, destruicao_comprovante_nome: e.target.value })
                      }
                      placeholder="Nome arquivo PDF..."
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Dinâmico: Aproveitamento Condicional */}
            {form.tipo_destinacao === 'Aproveitamento Condicional' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                <span className="font-bold text-[11px] text-amber-900 uppercase">
                  Aproveitamento Condicional / Reprocessamento
                </span>
                <div>
                  <Label className="text-xs">Descrição da Ação Corretiva</Label>
                  <Textarea
                    maxLength={500}
                    rows={2}
                    value={form.aproveitamento_acao_corretiva || ''}
                    onChange={(e) =>
                      setForm({ ...form, aproveitamento_acao_corretiva: e.target.value })
                    }
                    placeholder="Instruções operacionais de mistura, moagem fina ou tratamento térmico..."
                    className="text-xs mt-1 bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Data do Reprocessamento</Label>
                    <Input
                      type="date"
                      value={form.aproveitamento_data_reprocessamento || ''}
                      onChange={(e) =>
                        setForm({ ...form, aproveitamento_data_reprocessamento: e.target.value })
                      }
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Responsável</Label>
                    <Input
                      value={form.aproveitamento_responsavel || ''}
                      onChange={(e) =>
                        setForm({ ...form, aproveitamento_responsavel: e.target.value })
                      }
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Resultado Pós-Reprocesso</Label>
                    <Select
                      value={form.aproveitamento_resultado}
                      onValueChange={(val: any) =>
                        setForm({ ...form, aproveitamento_resultado: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aprovado">Aprovado (Liberado)</SelectItem>
                        <SelectItem value="Reprovado">Reprovado (Descarte Obrigatório)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 5 – CONFORMIDADE AMBIENTAL */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 5 – Conformidade com a Legislação Ambiental
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-[#1B4332]">
                  <input
                    type="checkbox"
                    checked={form.conformidade_ambiental}
                    onChange={(e) => setForm({ ...form, conformidade_ambiental: e.target.checked })}
                    className="h-4 w-4 rounded accent-[#1B4332]"
                  />
                  Em conformidade com legislação ambiental
                </label>
              </div>

              <div>
                <Label className="text-xs">Órgão Notificado</Label>
                <Select
                  value={form.orgao_ambiental_notificado}
                  onValueChange={(val: any) =>
                    setForm({ ...form, orgao_ambiental_notificado: val })
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Não Aplicável">Não Aplicável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Nº do Protocolo / MTR</Label>
                <Input
                  maxLength={50}
                  value={form.numero_protocolo_ambiental || ''}
                  onChange={(e) => setForm({ ...form, numero_protocolo_ambiental: e.target.value })}
                  placeholder="Manifesto Transporte Resíduos"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 6 & 7 – OBSERVAÇÕES E ASSINATURAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 6 & 7 – Observações, Lições e Assinaturas Oficiais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Lições Aprendidas (máx 500)</Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.licoes_aprendidas || ''}
                  onChange={(e) => setForm({ ...form, licoes_aprendidas: e.target.value })}
                  placeholder="Melhorias preventivas decorrentes deste descarte..."
                  className="text-xs mt-1"
                />
              </div>

              {onCriarAcaoCorretivaDireta && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-xs text-amber-900 block">
                      Ação Corretiva Vinculada
                    </span>
                    <p className="text-[11px] text-amber-800 mt-1">
                      Abertura imediata do Formulário de Ação Corretiva (Anexo VII) com dados
                      pré-preenchidos.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onCriarAcaoCorretivaDireta(form)}
                    className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white mt-2"
                  >
                    Abrir Ação Corretiva (Anexo VII)
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 block">
                  Responsável pela Qualidade (RQ)
                </span>
                <p className="text-xs font-semibold text-stone-900 mt-1">{form.assinado_rq_nome}</p>
                <p className="text-[10px] text-stone-500">Data: {form.assinado_rq_data}</p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 block">
                  Responsável Técnico (RT)
                </span>
                <Select
                  value={form.assinado_rt_nome}
                  onValueChange={(val) => setForm({ ...form, assinado_rt_nome: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {usersList
                      .filter(
                        (u) =>
                          u.role === 'RT' ||
                          u.role === 'RE' ||
                          u.role === 'admin' ||
                          u.role === 'admin_cliente',
                      )
                      .map((u) => (
                        <SelectItem key={u.id} value={u.name}>
                          {u.name} (RT)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-stone-500 mt-1">Data: {form.assinado_rt_data}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t border-[#E2DCCF] bg-[#FAF7EF] flex flex-wrap gap-2 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            {onPrintPreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPrintPreview(form)}
                className="text-xs h-9 border-[#1B4332] text-[#1B4332] gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Imprimir Destinação PDF
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() => handleSubmitAction(true)}
              className="text-xs h-9 border-stone-300 text-stone-700 gap-1.5"
            >
              <Save className="h-4 w-4 text-stone-500" />
              Salvar Rascunho
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => handleSubmitAction(false)}
              className="text-xs h-9 bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold gap-1.5 shadow-sm"
            >
              <Send className="h-4 w-4 text-[#D9A404]" />
              {submitting ? 'Gravando...' : 'Concluir Destinação'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
