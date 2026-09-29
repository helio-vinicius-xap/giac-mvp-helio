import React, { useState, useEffect } from 'react'
import {
  Save,
  Send,
  Printer,
  X,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Truck,
  Box,
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
import type { AnexoIIIRecebimentoData, AnexoIIFornecedorItem } from '@/types/pop01Forms'
import { gerarCodigoRegistro, calcularDiasAteVencimento } from '@/lib/pop01Validators'

interface AnexoIIIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoIIIRecebimentoData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoIIIRecebimentoData>
  fornecedoresQualificados: AnexoIIFornecedorItem[]
  currentUser?: { name: string; email: string; role?: string } | null
  onPrintPreview?: (dados: AnexoIIIRecebimentoData) => void
  onCriarAmostraDireta?: (dadosRecebimento: AnexoIIIRecebimentoData) => void
  onCriarDescarteDireto?: (dadosRecebimento: AnexoIIIRecebimentoData) => void
}

export function AnexoIIIRecebimentoModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  fornecedoresQualificados,
  currentUser,
  onPrintPreview,
  onCriarAmostraDireta,
  onCriarDescarteDireto,
}: AnexoIIIModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Filtra apenas fornecedores ativos ou válidos
  const fornecedoresAtivos = fornecedoresQualificados.filter((f) => f.status === 'Ativo')

  const defaultState: AnexoIIIRecebimentoData = {
    numero_recebimento: gerarCodigoRegistro('REC', Math.floor(Math.random() * 90000) + 10000),
    data_recebimento: new Date().toISOString().replace('T', ' ').substring(0, 16),
    responsavel_recebimento: currentUser?.name || 'Operador de Recebimento',
    versao: '01-2026',
    status_fluxo: 'Rascunho',

    fornecedor_id: '',
    fornecedor_razao_social: '',
    fornecedor_cnpj: '',
    fornecedor_contato: '',
    fornecedor_telefone: '',

    produto_nome: 'Farelo de Soja 46% PB',
    especificacao_tecnica:
      'Teor mín. PB 46%, umidade máx. 12,5%, aflatoxinas < 20 ppb (Decreto 12.031/2024)',
    lote_partida: '',
    data_fabricacao: new Date().toISOString().split('T')[0],
    data_validade: '',
    dias_ate_vencimento: 0,
    quantidade_recebida: '',
    unidade: 'kg',
    numero_nota_fiscal: '',

    insp_embalagem_integra: true,
    insp_rotulo_legivel: true,
    insp_sem_contaminacao: true,
    insp_sem_vazamento: true,
    insp_sem_infestacao: true,
    insp_temperatura_adequada: true,
    observacoes_inspecao_visual: '',

    doc_nota_fiscal: true,
    doc_certificado_analise: true,
    doc_certificado_origem: false,
    doc_registro_mapa: true,
    documentacao_complementar: '',

    coleta_amostra: true,
    amostra_numero: gerarCodigoRegistro('AMS', Math.floor(Math.random() * 90000) + 10000),
    amostra_data: new Date().toISOString().split('T')[0],
    amostra_quantidade: '1.5',
    amostra_triplicata: true,
    amostra_local_armazenamento: 'Câmara Fria',
    amostra_temperatura_c: '4',
    amostra_responsavel: currentUser?.name || 'Operador',

    resultado: 'Aprovado',
    motivo_rejeicao: '',
    descricao_motivo_rejeicao: '',
    condicoes_aprovacao_condicional: '',

    local_armazenamento: 'Armazém A - Granel',
    posicao_armazem: 'Silo 02',
    data_entrada_armazem: new Date().toISOString().split('T')[0],
    responsavel_armazenamento: currentUser?.name || 'Operador',

    assinado_por_nome: currentUser?.name || 'Operador de Recebimento',
    assinado_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoIIIRecebimentoData>({
    ...defaultState,
    ...initialData,
  })

  // Ao selecionar fornecedor no dropdown, preencher automaticamente CNPJ, contato e telefone
  const handleSelectFornecedor = (razao: string) => {
    const f = fornecedoresQualificados.find((x) => x.razao_social === razao)
    if (f) {
      setForm((prev) => ({
        ...prev,
        fornecedor_id: f.id,
        fornecedor_razao_social: f.razao_social,
        fornecedor_cnpj: f.cnpj,
        fornecedor_contato: f.responsavel_tecnico || prev.fornecedor_contato,
        fornecedor_telefone: f.telefone || prev.fornecedor_telefone,
      }))
    } else {
      setForm((prev) => ({ ...prev, fornecedor_razao_social: razao }))
    }
  }

  // Atualizar cálculo de dias até vencimento ao alterar data_validade
  const handleDataValidadeChange = (val: string) => {
    const dias = calcularDiasAteVencimento(val)
    setForm((prev) => ({
      ...prev,
      data_validade: val,
      dias_ate_vencimento: dias,
    }))
  }

  const validateForm = (): boolean => {
    if (!form.fornecedor_razao_social) {
      toast({
        title: 'Fornecedor qualificado é obrigatório',
        description: 'Selecione um fornecedor da lista de qualificação (Anexo II).',
        variant: 'destructive',
      })
      return false
    }
    if (!form.produto_nome || form.produto_nome.trim().length === 0) {
      toast({ title: 'Produto é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.lote_partida || form.lote_partida.trim().length === 0) {
      toast({ title: 'Lote/Partida é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.data_validade) {
      toast({ title: 'Data de Validade é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.quantidade_recebida || Number(form.quantidade_recebida) <= 0) {
      toast({ title: 'Quantidade recebida inválida', variant: 'destructive' })
      return false
    }
    if (!form.numero_nota_fiscal || form.numero_nota_fiscal.trim().length === 0) {
      toast({ title: 'Número da Nota Fiscal é obrigatório', variant: 'destructive' })
      return false
    }
    if (form.resultado === 'Reprovado') {
      if (!form.motivo_rejeicao) {
        toast({ title: 'Motivo da rejeição é obrigatório se Reprovado', variant: 'destructive' })
        return false
      }
      if (!form.descricao_motivo_rejeicao || form.descricao_motivo_rejeicao.trim().length === 0) {
        toast({
          title: 'Descrição detalhada do motivo da rejeição é obrigatória',
          variant: 'destructive',
        })
        return false
      }
    }
    if (
      form.resultado === 'Aprovado Condicionalmente' &&
      (!form.condicoes_aprovacao_condicional ||
        form.condicoes_aprovacao_condicional.trim().length === 0)
    ) {
      toast({ title: 'Condições de aprovação são obrigatórias', variant: 'destructive' })
      return false
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
      const statusFinal = isDraft
        ? 'Rascunho'
        : form.coleta_amostra
          ? 'Aguardando Análise'
          : form.resultado

      const logItem = {
        usuario: currentUser?.name || 'Operador',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Enviar para Análise / Concluir Recebimento',
        detalhes: `Status: ${statusFinal}`,
      }

      const updatedForm: AnexoIIIRecebimentoData = {
        ...form,
        status_fluxo: statusFinal as any,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar recebimento',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const dias =
    form.dias_ate_vencimento ??
    (form.data_validade ? calcularDiasAteVencimento(form.data_validade) : 999)
  const isVencido = dias < 0
  const isProximoVencimento = dias >= 0 && dias <= 30

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E2DCCF] bg-[#FAF7EF] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO III
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  POP 01 (FR 08) • IN 04/2007
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Formulário de Recebimento de Matérias-Primas e Ingredientes
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Registro de inspeção física, visual, documental e amostragem na doca de recebimento.
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

          {/* Cabeçalho do formulário */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
            <div>
              <Label className="text-xs">Nº do Recebimento (Auto)</Label>
              <Input
                readOnly
                value={form.numero_recebimento}
                className="h-8 text-xs mt-1 bg-stone-100 font-mono font-bold text-[#1B4332]"
              />
            </div>
            <div>
              <Label className="text-xs">Data/Hora Recebimento</Label>
              <Input
                value={form.data_recebimento}
                onChange={(e) => setForm({ ...form, data_recebimento: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Input
                value={form.responsavel_recebimento}
                onChange={(e) => setForm({ ...form, responsavel_recebimento: e.target.value })}
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

          {/* SEÇÃO 1 – IDENTIFICAÇÃO DO FORNECEDOR */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1 flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#2D6A4F]" />
              Seção 1 – Identificação do Fornecedor Qualificado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Fornecedor Qualificado (Anexo II) <span className="text-red-500">*</span>
                </Label>
                <Select value={form.fornecedor_razao_social} onValueChange={handleSelectFornecedor}>
                  <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                    <SelectValue placeholder="Selecione um fornecedor qualificado..." />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedoresAtivos.map((f) => (
                      <SelectItem key={f.id || f.cnpj} value={f.razao_social}>
                        {f.razao_social} ({f.cnpj})
                      </SelectItem>
                    ))}
                    {fornecedoresAtivos.length === 0 && (
                      <SelectItem value="none" disabled>
                        Nenhum fornecedor ativo. Cadastre no Anexo I.
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">CNPJ do Fornecedor (Auto, Não Editável)</Label>
                <Input
                  readOnly
                  value={form.fornecedor_cnpj}
                  placeholder="Auto-preenchido"
                  className="h-8 text-xs mt-1 bg-stone-100 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Contato no Fornecedor (Editável)</Label>
                <Input
                  value={form.fornecedor_contato || ''}
                  onChange={(e) => setForm({ ...form, fornecedor_contato: e.target.value })}
                  placeholder="Nome do contato comercial ou RT"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Telefone do Fornecedor (Editável)</Label>
                <Input
                  value={form.fornecedor_telefone || ''}
                  onChange={(e) => setForm({ ...form, fornecedor_telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 – IDENTIFICAÇÃO DO PRODUTO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1 flex items-center gap-2">
              <Box className="h-4 w-4 text-[#2D6A4F]" />
              Seção 2 – Identificação do Produto e Lote
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Produto / Matéria-Prima <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.produto_nome}
                  onChange={(e) => setForm({ ...form, produto_nome: e.target.value })}
                  placeholder="Ex: Milho Grão Moído, Farelo de Soja 46%"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Especificação Técnica (Auto/Padrão)</Label>
                <Input
                  readOnly
                  value={form.especificacao_tecnica || ''}
                  className="h-8 text-xs mt-1 bg-stone-100 text-stone-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">
                  Lote / Partida <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={50}
                  value={form.lote_partida}
                  onChange={(e) => setForm({ ...form, lote_partida: e.target.value })}
                  placeholder="Lote do fornecedor"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Data de Fabricação <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.data_fabricacao}
                  onChange={(e) => setForm({ ...form, data_fabricacao: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Data de Validade <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.data_validade}
                  onChange={(e) => handleDataValidadeChange(e.target.value)}
                  className={`h-8 text-xs mt-1 ${isVencido ? 'border-red-500 bg-red-50' : isProximoVencimento ? 'border-amber-500 bg-amber-50' : ''}`}
                />
              </div>
              <div>
                <Label className="text-xs">
                  Nº da Nota Fiscal <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={20}
                  value={form.numero_nota_fiscal}
                  onChange={(e) => setForm({ ...form, numero_nota_fiscal: e.target.value })}
                  placeholder="Ex: NF-e 004812"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            {/* Alertas de Vencimento */}
            {isVencido && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800 text-xs">
                <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>
                  <strong>ALERTA CRÍTICO:</strong> Produto com validade vencida há {Math.abs(dias)}{' '}
                  dias! Rejeição mandatória no recebimento.
                </span>
              </div>
            )}
            {isProximoVencimento && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Atenção:</strong> Produto próximo ao vencimento ({dias} dias restantes).
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Quantidade Recebida (2 decimais) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quantidade_recebida}
                  onChange={(e) => setForm({ ...form, quantidade_recebida: e.target.value })}
                  placeholder="0.00"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select
                  value={form.unidade}
                  onValueChange={(val) => setForm({ ...form, unidade: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg (Quilogramas)</SelectItem>
                    <SelectItem value="L">L (Litros)</SelectItem>
                    <SelectItem value="unidade">unidade</SelectItem>
                    <SelectItem value="saco">saco (40/50 kg)</SelectItem>
                    <SelectItem value="tonelada">tonelada (t)</SelectItem>
                    <SelectItem value="big bag">big bag (1.000 kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 3 – INSPEÇÃO VISUAL */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 3 – Inspeção Visual e Física
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px]">
              {[
                { key: 'insp_embalagem_integra', label: 'Embalagem Íntegra (sem rasgos)' },
                { key: 'insp_rotulo_legivel', label: 'Rótulo Legível (IN 04/2007)' },
                { key: 'insp_sem_contaminacao', label: 'Sem Sinais de Contaminação' },
                { key: 'insp_sem_vazamento', label: 'Sem Sinais de Vazamento' },
                { key: 'insp_sem_infestacao', label: 'Sem Sinais de Infestação/Pragas' },
                { key: 'insp_temperatura_adequada', label: 'Temperatura Adequada' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 cursor-pointer hover:text-[#1B4332]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean((form as any)[item.key])}
                    onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                    className="h-4 w-4 rounded text-[#1B4332] accent-[#1B4332]"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <div>
              <Label className="text-xs">Observações da Inspeção Visual (máx 500)</Label>
              <Textarea
                maxLength={500}
                rows={2}
                value={form.observacoes_inspecao_visual || ''}
                onChange={(e) => setForm({ ...form, observacoes_inspecao_visual: e.target.value })}
                placeholder="Aspecto, coloração, odor característico, integridade da carga..."
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 4 – DOCUMENTAÇÃO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 4 – Documentação Acompanhante da Carga
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px]">
              {[
                { key: 'doc_nota_fiscal', label: 'Nota Fiscal Presente e Regular' },
                { key: 'doc_certificado_analise', label: 'Certificado de Análise / Laudo do Lote' },
                {
                  key: 'doc_certificado_origem',
                  label: 'Certificado de Origem (Produtos de Origem Animal)',
                },
                { key: 'doc_registro_mapa', label: 'Comprovante Registro/Isenção MAPA' },
              ].map((doc) => (
                <label
                  key={doc.key}
                  className="flex items-center gap-2 cursor-pointer hover:text-[#1B4332]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean((form as any)[doc.key])}
                    onChange={(e) => setForm({ ...form, [doc.key]: e.target.checked })}
                    className="h-4 w-4 rounded text-[#1B4332] accent-[#1B4332]"
                  />
                  <span>{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* SEÇÃO 5 – COLETA DE AMOSTRA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1">
              <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-[#2D6A4F]" />
                Seção 5 – Coleta de Amostra para CQ
              </h3>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#1B4332]">
                <input
                  type="checkbox"
                  checked={form.coleta_amostra}
                  onChange={(e) => setForm({ ...form, coleta_amostra: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#1B4332]"
                />
                Amostra Coletada nesta Carga
              </label>
            </div>

            {form.coleta_amostra && (
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nº da Amostra (Auto)</Label>
                    <Input
                      readOnly
                      value={form.amostra_numero || ''}
                      className="h-8 text-xs mt-1 bg-white font-mono font-bold text-[#1B4332]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Data da Coleta</Label>
                    <Input
                      type="date"
                      value={form.amostra_data || ''}
                      onChange={(e) => setForm({ ...form, amostra_data: e.target.value })}
                      className="h-8 text-xs mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Qtd Coletada ({form.unidade})</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.amostra_quantidade || ''}
                      onChange={(e) => setForm({ ...form, amostra_quantidade: e.target.value })}
                      className="h-8 text-xs mt-1 bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Local de Armazenamento</Label>
                    <Select
                      value={form.amostra_local_armazenamento}
                      onValueChange={(val) =>
                        setForm({ ...form, amostra_local_armazenamento: val })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Câmara Fria">Câmara Fria (2°C a 8°C)</SelectItem>
                        <SelectItem value="Temperatura Ambiente">Temperatura Ambiente</SelectItem>
                        <SelectItem value="Congelador">Congelador (-18°C)</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Temperatura (°C)</Label>
                    <Input
                      type="number"
                      value={form.amostra_temperatura_c || ''}
                      onChange={(e) => setForm({ ...form, amostra_temperatura_c: e.target.value })}
                      className="h-8 text-xs mt-1 bg-white font-mono"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-stone-700">
                      <input
                        type="checkbox"
                        checked={Boolean(form.amostra_triplicata)}
                        onChange={(e) => setForm({ ...form, amostra_triplicata: e.target.checked })}
                        className="h-4 w-4 rounded accent-[#1B4332]"
                      />
                      Coletada em Triplicata (IN 04)
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 6 – RESULTADO DA INSPEÇÃO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 6 – Resultado da Inspeção de Recebimento
            </h3>

            <div className="flex flex-wrap items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800">
                <input
                  type="radio"
                  name="resultado_rec"
                  value="Aprovado"
                  checked={form.resultado === 'Aprovado'}
                  onChange={() => setForm({ ...form, resultado: 'Aprovado' })}
                  className="accent-emerald-700 h-4 w-4"
                />
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Aprovado
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-800">
                <input
                  type="radio"
                  name="resultado_rec"
                  value="Aprovado Condicionalmente"
                  checked={form.resultado === 'Aprovado Condicionalmente'}
                  onChange={() => setForm({ ...form, resultado: 'Aprovado Condicionalmente' })}
                  className="accent-amber-600 h-4 w-4"
                />
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Aprovado Condicionalmente
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-800">
                <input
                  type="radio"
                  name="resultado_rec"
                  value="Reprovado"
                  checked={form.resultado === 'Reprovado'}
                  onChange={() => setForm({ ...form, resultado: 'Reprovado' })}
                  className="accent-red-600 h-4 w-4"
                />
                <XCircle className="h-4 w-4 text-red-600" />
                Reprovado (Rejeitado)
              </label>
            </div>

            {form.resultado === 'Reprovado' && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-800 text-xs flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Carga Reprovada — Ações Subsequentes
                  </span>
                  {onCriarDescarteDireto && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onCriarDescarteDireto(form)}
                      className="h-7 text-xs bg-red-700 hover:bg-red-800 text-white font-semibold"
                    >
                      Abrir Destinação / Descarte (Anexo VI)
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-red-800 font-bold">
                      Motivo da Rejeição <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={form.motivo_rejeicao}
                      onValueChange={(val) => setForm({ ...form, motivo_rejeicao: val })}
                    >
                      <SelectTrigger className="h-8 text-xs mt-1 bg-white border-red-300">
                        <SelectValue placeholder="Selecione o motivo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Validade Expirada">Validade Expirada</SelectItem>
                        <SelectItem value="Embalagem Danificada">
                          Embalagem Danificada / Rompida
                        </SelectItem>
                        <SelectItem value="Contaminação">
                          Contaminação Física/Química/Biológica
                        </SelectItem>
                        <SelectItem value="Fornecedor Não Qualificado">
                          Fornecedor Não Qualificado / Suspenso
                        </SelectItem>
                        <SelectItem value="Outro">Outro Motivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-red-800 font-bold">
                      Descrição Detalhada do Motivo <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      maxLength={500}
                      rows={2}
                      value={form.descricao_motivo_rejeicao || ''}
                      onChange={(e) =>
                        setForm({ ...form, descricao_motivo_rejeicao: e.target.value })
                      }
                      placeholder="Descreva a irregularidade detectada..."
                      className="text-xs mt-1 bg-white border-red-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {form.resultado === 'Aprovado Condicionalmente' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <Label className="text-xs text-amber-900 font-bold">
                  Condições para Aprovação <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.condicoes_aprovacao_condicional || ''}
                  onChange={(e) =>
                    setForm({ ...form, condicoes_aprovacao_condicional: e.target.value })
                  }
                  placeholder="Ex: Aguardar laudo laboratorial microbiológico favorável antes do descarregamento definitivo no silo..."
                  className="text-xs mt-1 bg-white border-amber-300"
                />
              </div>
            )}
          </div>

          {/* SEÇÃO 7 – ARMAZENAMENTO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 7 – Armazenamento Físico
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Local de Armazenamento</Label>
                <Select
                  value={form.local_armazenamento}
                  onValueChange={(val) => setForm({ ...form, local_armazenamento: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Armazém A - Granel">Armazém A - Granel</SelectItem>
                    <SelectItem value="Armazém B - Ensacados">Armazém B - Ensacados</SelectItem>
                    <SelectItem value="Câmara Fria">Câmara Fria</SelectItem>
                    <SelectItem value="Área de Produtos Não Aprovados">
                      Área de Quarentena / Não Aprovados
                    </SelectItem>
                    <SelectItem value="Outro">Outro Armazém</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Posição / Box / Silo</Label>
                <Input
                  maxLength={50}
                  value={form.posicao_armazem || ''}
                  onChange={(e) => setForm({ ...form, posicao_armazem: e.target.value })}
                  placeholder="Ex: Silo 04, Box 12"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Data de Entrada</Label>
                <Input
                  type="date"
                  value={form.data_entrada_armazem}
                  onChange={(e) => setForm({ ...form, data_entrada_armazem: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Responsável Armazenamento</Label>
                <Input
                  value={form.responsavel_armazenamento}
                  onChange={(e) => setForm({ ...form, responsavel_armazenamento: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 8 – ASSINATURA */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 8 – Assinatura do Responsável pelo Recebimento
            </h3>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold text-stone-700 block">
                  Responsável pelo Recebimento
                </span>
                <p className="text-xs font-semibold text-stone-900 mt-0.5">
                  {form.assinado_por_nome}
                </p>
                <p className="text-[10px] text-stone-500">Data: {form.assinado_data}</p>
              </div>
              <span className="text-[11px] text-[#1B4332] font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                Assinatura Digital Registrada
              </span>
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
                Imprimir / PDF
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
              {submitting
                ? 'Gravando...'
                : form.coleta_amostra
                  ? 'Enviar para Análise'
                  : 'Concluir Recebimento'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
