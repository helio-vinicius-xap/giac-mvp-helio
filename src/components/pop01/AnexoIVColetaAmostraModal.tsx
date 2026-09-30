import React, { useState } from 'react'
import {
  Save,
  Send,
  Printer,
  History,
  FlaskConical,
  AlertTriangle,
  QrCode,
  Tag,
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
import type { AnexoIVColetaAmostraData, AmostraTriplicataItem } from '@/types/pop01Forms'
import { gerarCodigoRegistro } from '@/lib/pop01Validators'

interface AnexoIVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoIVColetaAmostraData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoIVColetaAmostraData>
  recebimentosPendentes: Array<{
    numero_recebimento: string
    fornecedor_razao_social: string
    produto_nome: string
    lote_partida: string
    data_fabricacao: string
    data_validade: string
    quantidade_recebida: number | string
    unidade: string
  }>
  currentUser?: { name: string; email: string; role?: string } | null
  onPrintPreview?: (dados: AnexoIVColetaAmostraData) => void
}

export function AnexoIVColetaAmostraModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  recebimentosPendentes,
  currentUser,
  onPrintPreview,
}: AnexoIVModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const defaultTriplicata: AmostraTriplicataItem[] = [
    { identificacao: 'Amostra 1 - Ensaio Imediato', quantidade: '0.50', destino: 'Análise' },
    {
      identificacao: 'Amostra 2 - Contra-Prova Lacrada',
      quantidade: '0.50',
      destino: 'Contra-Prova',
    },
    {
      identificacao: 'Amostra 3 - Arquivo/Retenção Legal',
      quantidade: '0.50',
      destino: 'Retenção',
    },
  ]

  const defaultState: AnexoIVColetaAmostraData = {
    numero_amostra: gerarCodigoRegistro('AMS', Math.floor(Math.random() * 90000) + 10000),
    data_coleta: new Date().toISOString().split('T')[0],
    hora_coleta: new Date().toTimeString().substring(0, 5),
    responsavel_coleta: currentUser?.name || 'Amostrador Responsável',
    versao: '01-2026',
    status_fluxo: 'Rascunho',

    recebimento_numero: '',
    fornecedor_razao_social: '',
    produto_nome: '',
    lote_partida: '',
    data_fabricacao: '',
    data_validade: '',

    quantidade_total_recebida: '1000',
    quantidade_coletada: '1.50',
    unidade: 'kg',
    metodo_coleta: 'Amostragem Aleatória',

    amostra_em_triplicata: true,
    amostras: defaultTriplicata,

    tipo_embalagem: 'Frasco de Vidro',
    identificacao_embalagem: 'Frasco Âmbar Estéril com Tampa Rosqueável',
    lacre_selo: true,
    numero_lacre: `LAC-${Math.floor(Math.random() * 90000) + 10000}`,
    temperatura_armazenamento_c: '4',
    local_armazenamento: 'Câmara Fria',
    data_armazenamento: new Date().toISOString().split('T')[0],
    responsavel_armazenamento: currentUser?.name || 'Amostrador',

    analises: {
      micro_mesofilos: true,
      micro_coliformes: true,
      micro_salmonella: true,
      micro_listeria: false,
      fq_umidade: true,
      fq_proteina: true,
      fq_gordura: false,
      microscopica_contaminantes: true,
      residuos_pesticidas: false,
      residuos_metais: false,
      molecular_ogm: false,
      outras_analises: '',
    },

    observacoes_gerais: '',
    condicoes_transporte:
      'Transporte refrigerado entre 2°C e 8°C em caixa isotérmica com monitoramento.',

    assinado_por_nome: currentUser?.name || 'Amostrador Responsável',
    assinado_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoIVColetaAmostraData>({
    ...defaultState,
    ...initialData,
  })

  // Sincroniza dados ao selecionar recebimento pendente
  const handleSelectRecebimento = (numRec: string) => {
    const r = recebimentosPendentes.find((x) => x.numero_recebimento === numRec)
    if (r) {
      setForm((prev) => ({
        ...prev,
        recebimento_numero: r.numero_recebimento,
        fornecedor_razao_social: r.fornecedor_razao_social,
        produto_nome: r.produto_nome,
        lote_partida: r.lote_partida,
        data_fabricacao: r.data_fabricacao,
        data_validade: r.data_validade,
        quantidade_total_recebida: r.quantidade_recebida,
        unidade: r.unidade || 'kg',
      }))
    } else {
      setForm((prev) => ({ ...prev, recebimento_numero: numRec }))
    }
  }

  // Atualizar sub-amostra na triplicata
  const updateAmostraItem = (index: number, patch: Partial<AmostraTriplicataItem>) => {
    const list = [...(form.amostras || defaultTriplicata)]
    list[index] = { ...list[index], ...patch }

    // Calcula soma automática das 3 amostras
    const soma = list.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0)

    setForm({
      ...form,
      amostras: list,
      quantidade_coletada: soma.toFixed(2),
    })
  }

  const validateForm = (): boolean => {
    if (!form.recebimento_numero) {
      toast({ title: 'Recebimento de Origem é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.quantidade_coletada || Number(form.quantidade_coletada) <= 0) {
      toast({ title: 'Quantidade coletada inválida', variant: 'destructive' })
      return false
    }
    if (Number(form.quantidade_coletada) > Number(form.quantidade_total_recebida)) {
      toast({
        title: 'Quantidade coletada excede o recebido',
        description: 'A amostra não pode ser maior do que a carga total recebida.',
        variant: 'destructive',
      })
      return false
    }
    if (form.lacre_selo && (!form.numero_lacre || form.numero_lacre.trim().length === 0)) {
      toast({
        title: 'Número do lacre é obrigatório se lacre estiver marcado',
        variant: 'destructive',
      })
      return false
    }
    if (
      form.temperatura_armazenamento_c === '' ||
      isNaN(Number(form.temperatura_armazenamento_c))
    ) {
      toast({ title: 'Temperatura de armazenamento (°C) é obrigatória', variant: 'destructive' })
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
      const statusFinal = isDraft ? 'Rascunho' : 'Enviado para Análise'

      const logItem = {
        usuario: currentUser?.name || 'Amostrador',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Enviar Amostra para Laboratório',
        detalhes: `Status: ${statusFinal} • Lacre: ${form.numero_lacre || 'N/A'}`,
      }

      const updatedForm: AnexoIVColetaAmostraData = {
        ...form,
        status_fluxo: statusFinal as any,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar coleta', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const qtdColetadaNum = Number(form.quantidade_coletada) || 0
  const qtdRecebidaNum = Number(form.quantidade_total_recebida) || 0
  const isQtdExcedente = qtdColetadaNum > qtdRecebidaNum

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E2DCCF] bg-[#FAF7EF] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO IV
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  Auto Controle 01 (IN 04/2007)
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Formulário de Coleta de Amostra
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Amostragem representativa com triplicata oficial, lacre inviolável e requisição
                analítica.
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
              <Label className="text-xs">Nº da Amostra (Auto)</Label>
              <Input
                readOnly
                value={form.numero_amostra}
                className="h-8 text-xs mt-1 bg-stone-100 font-mono font-bold text-[#1B4332]"
              />
            </div>
            <div>
              <Label className="text-xs">Data da Coleta</Label>
              <Input
                type="date"
                value={form.data_coleta}
                onChange={(e) => setForm({ ...form, data_coleta: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Hora da Coleta</Label>
              <Input
                type="time"
                value={form.hora_coleta}
                onChange={(e) => setForm({ ...form, hora_coleta: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável pela Coleta</Label>
              <Input
                value={form.responsavel_coleta}
                onChange={(e) => setForm({ ...form, responsavel_coleta: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
          </div>

          {/* SEÇÃO 1 – IDENTIFICAÇÃO DO RECEBIMENTO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 1 – Vínculo com Recebimento de Origem
            </h3>

            <div>
              <Label className="text-xs">
                Recebimento Pendente de Análise <span className="text-red-500">*</span>
              </Label>
              <Select value={form.recebimento_numero} onValueChange={handleSelectRecebimento}>
                <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                  <SelectValue placeholder="Selecione o número do recebimento..." />
                </SelectTrigger>
                <SelectContent>
                  {recebimentosPendentes.map((rec) => (
                    <SelectItem key={rec.numero_recebimento} value={rec.numero_recebimento}>
                      {rec.numero_recebimento} — {rec.produto_nome} (Lote: {rec.lote_partida}) -{' '}
                      {rec.fornecedor_razao_social}
                    </SelectItem>
                  ))}
                  {recebimentosPendentes.length === 0 && (
                    <SelectItem value="none" disabled>
                      Nenhum recebimento pendente cadastrado
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
                <Label className="text-[11px] text-stone-500">Validade da Carga</Label>
                <p className="text-stone-800 text-xs">
                  {form.data_validade
                    ? new Date(form.data_validade).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 – COLETA DE AMOSTRA */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 2 – Parâmetros de Coleta e Amostragem
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Qtd Total Recebida (Auto)</Label>
                <Input
                  readOnly
                  value={`${form.quantidade_total_recebida} ${form.unidade}`}
                  className="h-8 text-xs mt-1 bg-stone-100 font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Qtd Coletada para Análise <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.quantidade_coletada}
                  onChange={(e) => setForm({ ...form, quantidade_coletada: e.target.value })}
                  className={`h-8 text-xs mt-1 font-mono ${isQtdExcedente ? 'border-red-500 bg-red-50' : ''}`}
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
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="mL">mL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Método de Amostragem</Label>
                <Select
                  value={form.metodo_coleta}
                  onValueChange={(val) => setForm({ ...form, metodo_coleta: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Amostragem Aleatória">Amostragem Aleatória</SelectItem>
                    <SelectItem value="Amostragem Sistemática">Amostragem Sistemática</SelectItem>
                    <SelectItem value="Amostragem Estratificada">
                      Amostragem Estratificada
                    </SelectItem>
                    <SelectItem value="Amostragem Intencional">Amostragem Intencional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isQtdExcedente && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Alerta: A quantidade coletada é superior à quantidade total recebida!</span>
              </div>
            )}
          </div>

          {/* SEÇÃO 3 – TRIPLICATA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1">
              <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider">
                Seção 3 – Triplicata Oficial (IN 04/2007 MAPA)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#1B4332]">
                <input
                  type="checkbox"
                  checked={form.amostra_em_triplicata}
                  onChange={(e) => setForm({ ...form, amostra_em_triplicata: e.target.checked })}
                  className="h-4 w-4 rounded accent-[#1B4332]"
                />
                Exigência Triplicata Ativa
              </label>
            </div>

            {form.amostra_em_triplicata && (
              <div className="space-y-2">
                {(form.amostras || defaultTriplicata).map((am, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-2.5 bg-stone-50 rounded-lg border border-stone-200 items-center"
                  >
                    <div>
                      <Label className="text-[11px]">Identificação ({idx + 1})</Label>
                      <Input
                        maxLength={50}
                        value={am.identificacao}
                        onChange={(e) => updateAmostraItem(idx, { identificacao: e.target.value })}
                        className="h-7 text-xs mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Quantidade ({form.unidade})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={am.quantidade}
                        onChange={(e) => updateAmostraItem(idx, { quantidade: e.target.value })}
                        className="h-7 text-xs mt-1 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Destino Regulamentar</Label>
                      <Select
                        value={am.destino}
                        onValueChange={(val: any) => updateAmostraItem(idx, { destino: val })}
                      >
                        <SelectTrigger className="h-7 text-xs mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Análise">Análise Laboratorial</SelectItem>
                          <SelectItem value="Contra-Prova">Contra-Prova (Fiscalização)</SelectItem>
                          <SelectItem value="Retenção">Arquivo / Retenção</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO 4 – ACONDICIONAMENTO E ARMAZENAMENTO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 4 – Acondicionamento, Lacre e Temperatura
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo de Embalagem</Label>
                <Select
                  value={form.tipo_embalagem}
                  onValueChange={(val) => setForm({ ...form, tipo_embalagem: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Frasco de Vidro">Frasco de Vidro Âmbar</SelectItem>
                    <SelectItem value="Saco Plástico">Saco Plástico Estéril (Whirl-Pak)</SelectItem>
                    <SelectItem value="Caixa de Papelão">Caixa de Papelão</SelectItem>
                    <SelectItem value="Outro">Outro Recipiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Identificação do Recipiente</Label>
                <Input
                  maxLength={100}
                  value={form.identificacao_embalagem || ''}
                  onChange={(e) => setForm({ ...form, identificacao_embalagem: e.target.value })}
                  placeholder="Ex: Frasco estéril 500 mL"
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Lacre de Segurança</Label>
                  <label className="text-[11px] flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.lacre_selo}
                      onChange={(e) => setForm({ ...form, lacre_selo: e.target.checked })}
                      className="accent-[#1B4332]"
                    />
                    Com Lacre
                  </label>
                </div>
                <Input
                  maxLength={50}
                  disabled={!form.lacre_selo}
                  value={form.numero_lacre || ''}
                  onChange={(e) => setForm({ ...form, numero_lacre: e.target.value })}
                  placeholder="Número do lacre inviolável"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">
                  Temperatura Armazenamento (°C) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={form.temperatura_armazenamento_c}
                  onChange={(e) =>
                    setForm({ ...form, temperatura_armazenamento_c: e.target.value })
                  }
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>

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
                    <SelectItem value="Câmara Fria">Câmara Fria (2 a 8°C)</SelectItem>
                    <SelectItem value="Temperatura Ambiente">Temperatura Ambiente</SelectItem>
                    <SelectItem value="Congelador">Congelador (-18°C)</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Data Armazenamento</Label>
                <Input
                  type="date"
                  value={form.data_armazenamento}
                  onChange={(e) => setForm({ ...form, data_armazenamento: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 5 – ANÁLISES SOLICITADAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 5 – Análises Requisitadas ao Laboratório
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px]">
              {[
                { key: 'micro_mesofilos', label: 'Contagem de Mesófilos' },
                { key: 'micro_coliformes', label: 'Coliformes Totais e Termotolerantes' },
                { key: 'micro_salmonella', label: 'Salmonella sp. (Ausência/25g)' },
                { key: 'micro_listeria', label: 'Listeria monocytogenes' },
                { key: 'fq_umidade', label: 'Umidade e Voláteis (%)' },
                { key: 'fq_proteina', label: 'Proteína Bruta (PB %)' },
                { key: 'fq_gordura', label: 'Extrato Etéreo / Gordura (%)' },
                {
                  key: 'microscopica_contaminantes',
                  label: 'Microscopia (Contaminantes Estranhos)',
                },
                { key: 'residuos_pesticidas', label: 'Pesticidas / Agrotóxicos' },
                { key: 'residuos_metais', label: 'Metais Pesados (Chumbo/Cádmio/Arsênio)' },
                { key: 'molecular_ogm', label: 'Análise Molecular / Transgênicos (OGM)' },
              ].map((an) => (
                <label
                  key={an.key}
                  className="flex items-center gap-2 cursor-pointer hover:text-[#1B4332]"
                >
                  <input
                    type="checkbox"
                    checked={Boolean((form.analises as any)[an.key])}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        analises: { ...form.analises, [an.key]: e.target.checked },
                      })
                    }
                    className="h-4 w-4 rounded accent-[#1B4332]"
                  />
                  <span>{an.label}</span>
                </label>
              ))}
            </div>

            <div>
              <Label className="text-xs">Outras Análises (máx 500)</Label>
              <Textarea
                maxLength={500}
                rows={2}
                value={form.analises.outras_analises || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    analises: { ...form.analises, outras_analises: e.target.value },
                  })
                }
                placeholder="Ex: Aflatoxinas B1/B2/G1/G2, Zearalenona, Fibra Bruta..."
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 6 & 7 – OBSERVAÇÕES & ASSINATURA */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 6 & 7 – Condições Especiais de Transporte e Assinatura
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Condições Especiais de Transporte (máx 500)</Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.condicoes_transporte || ''}
                  onChange={(e) => setForm({ ...form, condicoes_transporte: e.target.value })}
                  placeholder="Instruções para o portador/laboratório..."
                  className="text-xs mt-1"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-700 block">
                    Assinatura do Responsável pela Coleta
                  </span>
                  <p className="text-xs font-semibold text-stone-900 mt-1">
                    {form.assinado_por_nome}
                  </p>
                  <p className="text-[10px] text-stone-500">Data: {form.assinado_data}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mt-2">
                  <Tag className="h-3.5 w-3.5 text-[#1B4332]" />
                  <span>Etiqueta com código de barras disponível no PDF impresso.</span>
                </div>
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
                Imprimir / Etiqueta PDF
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
              {submitting ? 'Salvando...' : 'Enviar para Laboratório'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
