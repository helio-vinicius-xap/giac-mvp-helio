import React, { useState, useMemo } from 'react'
import {
  Save,
  Send,
  Printer,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FlaskConical,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import type { AnexoVAnaliseLaboratorialData, EnsaioLaboratorialItem } from '@/types/pop01Forms'
import { gerarCodigoRegistro } from '@/lib/pop01Validators'

interface AnexoVModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoVAnaliseLaboratorialData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoVAnaliseLaboratorialData>
  amostrasDisponiveis: Array<{
    numero_amostra: string
    recebimento_numero: string
    fornecedor_razao_social: string
    produto_nome: string
    lote_partida: string
    data_coleta: string
  }>
  currentUser?: { name: string; email: string; role?: string } | null
  onPrintPreview?: (dados: AnexoVAnaliseLaboratorialData) => void
  onCriarDescarteDireto?: (dadosLaudo: AnexoVAnaliseLaboratorialData) => void
  onCriarAcaoCorretivaDireta?: (dadosLaudo: AnexoVAnaliseLaboratorialData) => void
}

export function AnexoVAnaliseLaboratorialModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  amostrasDisponiveis,
  currentUser,
  onPrintPreview,
  onCriarDescarteDireto,
  onCriarAcaoCorretivaDireta,
}: AnexoVModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const defaultEnsaios: EnsaioLaboratorialItem[] = [
    {
      id: '1',
      grupo: 'Microbiológica',
      analise: 'Salmonella sp. (em 25g)',
      resultado: 'Ausência',
      unidade: 'Presença/Ausência',
      limite_especificacao: 'Ausência em 25g (IN 04/2007)',
      status: 'Conforme',
      observacoes: 'Metodologia ISO 6579',
    },
    {
      id: '2',
      grupo: 'Microbiológica',
      analise: 'Contagem de Mesófilos Estritos e Facultativos',
      resultado: '1200',
      unidade: 'UFC/g',
      limite_especificacao: '< 50.000 UFC/g',
      status: 'Conforme',
      observacoes: 'Dentro dos padrões aceitáveis',
    },
    {
      id: '3',
      grupo: 'Físico-Química',
      analise: 'Umidade e Substâncias Voláteis',
      resultado: '11.8',
      unidade: '%',
      limite_especificacao: 'Máx. 12,5%',
      status: 'Conforme',
      observacoes: 'Gravimetria em estufa a 105°C',
    },
    {
      id: '4',
      grupo: 'Físico-Química',
      analise: 'Proteína Bruta (PB)',
      resultado: '46.4',
      unidade: '%',
      limite_especificacao: 'Mín. 46,0%',
      status: 'Conforme',
      observacoes: 'Método Kjeldahl',
    },
    {
      id: '5',
      grupo: 'Complementar',
      analise: 'Aflatoxinas Totais (B1+B2+G1+G2)',
      resultado: 'Não Detectado',
      unidade: 'ppb (µg/kg)',
      limite_especificacao: 'Máx. 20 ppb (MAPA)',
      status: 'Conforme',
      observacoes: 'HPLC com detecção fluorescente',
    },
  ]

  const defaultState: AnexoVAnaliseLaboratorialData = {
    numero_relatorio: gerarCodigoRegistro('LAB', Math.floor(Math.random() * 90000) + 10000),
    data_emissao: new Date().toISOString().split('T')[0],
    responsavel_emissao: currentUser?.name || 'Analista de CQ',
    versao: '01-2026',
    status_fluxo: 'Rascunho',

    numero_amostra: '',
    numero_recebimento: '',
    fornecedor_razao_social: '',
    produto_nome: '',
    lote_partida: '',
    data_coleta: '',
    data_recebimento_laboratorio: new Date().toISOString().split('T')[0],

    laboratorio_nome: 'LabNutri Análises Bromatológicas e Microbiológicas Ltda.',
    responsavel_tecnico_laboratorio: 'Dr. Roberto Mendes (CRQ IV 0421890)',
    acreditacao: 'ISO/IEC 17025 (Cgcre/Inmetro) & Credenciado MAPA CRL-0412',
    data_inicio_analise: new Date().toISOString().split('T')[0],
    data_conclusao_analise: new Date().toISOString().split('T')[0],

    ensaios: defaultEnsaios,

    total_analises: 5,
    analises_conformes: 5,
    analises_nao_conformes: 0,
    percentual_conformidade: 100,
    resultado_geral: 'Aprovado',
    motivo_rejeicao_relatorio: '',

    parecer_laboratorio:
      'A amostra atende integralmente aos limites e especificações físico-químicas e microbiológicas da IN 04/2007 do MAPA e padrões contratuais da NutriAgro.',
    recomendacoes: 'Lote liberado para estocagem e utilização na fábrica.',
    observacoes_gerais:
      'Ensaios realizados de acordo com o Compêndio Brasileiro de Alimentação Animal.',

    assinado_rt_laboratorio_nome: 'Dr. Roberto Mendes (RT Laboratório)',
    assinado_rt_laboratorio_data: new Date().toISOString().split('T')[0],
    assinado_rq_empresa_nome: currentUser?.name || 'Dra. Mariana Siqueira (RQ)',
    assinado_rq_empresa_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoVAnaliseLaboratorialData>({
    ...defaultState,
    ...initialData,
  })

  // Sincronizar ao selecionar amostra
  const handleSelectAmostra = (numAmostra: string) => {
    const am = amostrasDisponiveis.find((x) => x.numero_amostra === numAmostra)
    if (am) {
      setForm((prev) => ({
        ...prev,
        numero_amostra: am.numero_amostra,
        numero_recebimento: am.recebimento_numero,
        fornecedor_razao_social: am.fornecedor_razao_social,
        produto_nome: am.produto_nome,
        lote_partida: am.lote_partida,
        data_coleta: am.data_coleta,
      }))
    } else {
      setForm((prev) => ({ ...prev, numero_amostra: numAmostra }))
    }
  }

  // Recalcular métricas de conformidade
  const recalcularConformidade = (ensaios: EnsaioLaboratorialItem[]) => {
    const total = ensaios.length
    const conformes = ensaios.filter((e) => e.status === 'Conforme').length
    const naoConformes = ensaios.filter((e) => e.status === 'Não Conforme').length
    const percent = total > 0 ? Math.round((conformes / total) * 100) : 100

    const novoResultado = naoConformes > 0 ? 'Reprovado' : 'Aprovado'

    setForm((prev) => ({
      ...prev,
      ensaios,
      total_analises: total,
      analises_conformes: conformes,
      analises_nao_conformes: naoConformes,
      percentual_conformidade: percent,
      resultado_geral: novoResultado,
    }))
  }

  const updateEnsaio = (index: number, patch: Partial<EnsaioLaboratorialItem>) => {
    const list = [...form.ensaios]
    list[index] = { ...list[index], ...patch }
    recalcularConformidade(list)
  }

  const addEnsaio = () => {
    const novo: EnsaioLaboratorialItem = {
      id: String(Date.now()),
      grupo: 'Físico-Química',
      analise: 'Novo Ensaio',
      resultado: '0.00',
      unidade: '%',
      limite_especificacao: 'Padrão MAPA',
      status: 'Conforme',
    }
    recalcularConformidade([...form.ensaios, novo])
  }

  const removeEnsaio = (index: number) => {
    const list = form.ensaios.filter((_, i) => i !== index)
    recalcularConformidade(list)
  }

  const validateForm = (): boolean => {
    if (!form.numero_amostra) {
      toast({ title: 'Amostra de Origem é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.laboratorio_nome) {
      toast({ title: 'Nome do Laboratório é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.parecer_laboratorio || form.parecer_laboratorio.trim().length === 0) {
      toast({ title: 'Parecer do Laboratório é obrigatório', variant: 'destructive' })
      return false
    }
    if (
      form.resultado_geral === 'Reprovado' &&
      (!form.motivo_rejeicao_relatorio || form.motivo_rejeicao_relatorio.trim().length === 0)
    ) {
      toast({ title: 'Informe o motivo do laudo reprovado', variant: 'destructive' })
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
      const statusFinal = isDraft ? 'Rascunho' : form.resultado_geral

      const logItem = {
        usuario: currentUser?.name || 'Analista',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Concluir Laudo Laboratorial',
        detalhes: `Resultado: ${form.resultado_geral} (${form.percentual_conformidade}% conformidade)`,
      }

      const updatedForm: AnexoVAnaliseLaboratorialData = {
        ...form,
        status_fluxo: statusFinal as any,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: 'Erro ao salvar relatório', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 border-b border-[#E2DCCF] bg-[#FAF7EF] shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                  ANEXO V
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  Auto Controle 01 (IN 04/2007)
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Relatório de Análise Laboratorial
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Laudo técnico de ensaios microbiológicos, bromatológicos, resíduos e parecer
                conclusivo.
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
              <Label className="text-xs">Nº do Relatório (Auto)</Label>
              <Input
                readOnly
                value={form.numero_relatorio}
                className="h-8 text-xs mt-1 bg-stone-100 font-mono font-bold text-[#1B4332]"
              />
            </div>
            <div>
              <Label className="text-xs">Data de Emissão</Label>
              <Input
                type="date"
                value={form.data_emissao}
                onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável Emissão</Label>
              <Input
                value={form.responsavel_emissao}
                onChange={(e) => setForm({ ...form, responsavel_emissao: e.target.value })}
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

          {/* SEÇÃO 1 – IDENTIFICAÇÃO DA AMOSTRA */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 1 – Vínculo com a Amostra Coletada (Anexo IV)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Número da Amostra (Anexo IV) <span className="text-red-500">*</span>
                </Label>
                <Select value={form.numero_amostra} onValueChange={handleSelectAmostra}>
                  <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                    <SelectValue placeholder="Selecione a amostra..." />
                  </SelectTrigger>
                  <SelectContent>
                    {amostrasDisponiveis.map((am) => (
                      <SelectItem key={am.numero_amostra} value={am.numero_amostra}>
                        {am.numero_amostra} — {am.produto_nome} (Lote: {am.lote_partida})
                      </SelectItem>
                    ))}
                    {amostrasDisponiveis.length === 0 && (
                      <SelectItem value="none" disabled>
                        Nenhuma amostra coletada pendente
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  Data de Recebimento no Laboratório <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.data_recebimento_laboratorio}
                  onChange={(e) =>
                    setForm({ ...form, data_recebimento_laboratorio: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <Label className="text-[11px] text-stone-500">Recebimento (Auto)</Label>
                <p className="font-mono text-stone-800 text-xs">{form.numero_recebimento || '—'}</p>
              </div>
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
            </div>
          </div>

          {/* SEÇÃO 2 – INFORMAÇÕES DO LABORATÓRIO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 2 – Laboratório Analítico Credenciado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">
                  Laboratório <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.laboratorio_nome}
                  onChange={(e) => setForm({ ...form, laboratorio_nome: e.target.value })}
                  placeholder="Nome do laboratório credenciado"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Responsável Técnico do Laboratório</Label>
                <Input
                  value={form.responsavel_tecnico_laboratorio}
                  onChange={(e) =>
                    setForm({ ...form, responsavel_tecnico_laboratorio: e.target.value })
                  }
                  placeholder="Nome e registro profissional do RT"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Acreditação / Registro MAPA</Label>
                <Input
                  value={form.acreditacao}
                  onChange={(e) => setForm({ ...form, acreditacao: e.target.value })}
                  placeholder="Ex: ISO 17025 CRL-0412"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Data de Início da Análise <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.data_inicio_analise}
                  onChange={(e) => setForm({ ...form, data_inicio_analise: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  Data de Conclusão da Análise <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.data_conclusao_analise}
                  onChange={(e) => setForm({ ...form, data_conclusao_analise: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÕES 3 A 5 – RESULTADOS DOS ENSAIOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1">
              <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider">
                Seções 3 a 5 – Ensaios Analíticos (Microbiológicos / Físico-Químicos /
                Complementares)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEnsaio}
                className="h-7 text-xs border-stone-300 text-[#1B4332] gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Ensaio
              </Button>
            </div>

            <div className="space-y-2">
              {form.ensaios.map((e, idx) => {
                const isConforme = e.status === 'Conforme'
                const isNaoConforme = e.status === 'Não Conforme'

                return (
                  <div
                    key={e.id || idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isNaoConforme
                        ? 'border-red-300 bg-red-50/50'
                        : isConforme
                          ? 'border-emerald-200 bg-emerald-50/30'
                          : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center">
                      <div className="sm:col-span-2">
                        <Label className="text-[10px]">Parâmetro / Ensaio</Label>
                        <Input
                          value={e.analise}
                          onChange={(ev) => updateEnsaio(idx, { analise: ev.target.value })}
                          className="h-7 text-xs mt-0.5 bg-white font-medium"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px]">Grupo</Label>
                        <Select
                          value={e.grupo}
                          onValueChange={(val: any) => updateEnsaio(idx, { grupo: val })}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Microbiológica">Microbiológica</SelectItem>
                            <SelectItem value="Físico-Química">Físico-Química</SelectItem>
                            <SelectItem value="Complementar">Complementar / Resíduos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[10px]">Resultado</Label>
                        <Input
                          value={e.resultado}
                          onChange={(ev) => updateEnsaio(idx, { resultado: ev.target.value })}
                          className="h-7 text-xs mt-0.5 bg-white font-mono font-bold"
                        />
                      </div>

                      <div>
                        <Label className="text-[10px]">Unidade / Limite</Label>
                        <div className="flex gap-1">
                          <Input
                            value={e.unidade}
                            onChange={(ev) => updateEnsaio(idx, { unidade: ev.target.value })}
                            className="h-7 text-[11px] mt-0.5 bg-white w-14"
                          />
                          <Input
                            value={e.limite_especificacao}
                            onChange={(ev) =>
                              updateEnsaio(idx, { limite_especificacao: ev.target.value })
                            }
                            className="h-7 text-[10px] mt-0.5 bg-white flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-1 pt-3 sm:pt-0">
                        <Select
                          value={e.status}
                          onValueChange={(val: any) => updateEnsaio(idx, { status: val })}
                        >
                          <SelectTrigger
                            className={`h-7 text-xs font-bold ${
                              isConforme
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : isNaoConforme
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : 'bg-white'
                            }`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Conforme">Conforme</SelectItem>
                            <SelectItem value="Não Conforme">Não Conforme</SelectItem>
                            <SelectItem value="Não Realizado">Não Realizado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEnsaio(idx)}
                          className="h-7 w-7 p-0 text-stone-400 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SEÇÃO 6 – RESUMO DE CONFORMIDADE */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 6 – Resumo Automático de Conformidade
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
              <div>
                <span className="text-[10px] text-stone-500 font-bold uppercase">
                  Total de Ensaios
                </span>
                <p className="text-base font-mono font-bold text-stone-900 mt-1">
                  {form.total_analises}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold uppercase">Conformes</span>
                <p className="text-base font-mono font-bold text-emerald-700 mt-1">
                  {form.analises_conformes}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-red-700 font-bold uppercase">Não Conformes</span>
                <p className="text-base font-mono font-bold text-red-700 mt-1">
                  {form.analises_nao_conformes}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-stone-600 font-bold uppercase">
                  % Conformidade
                </span>
                <p className="text-base font-mono font-bold text-stone-900 mt-1">
                  {form.percentual_conformidade}%
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1 flex flex-col justify-center items-center">
                <span className="text-[10px] text-stone-500 font-bold uppercase">
                  Resultado Geral
                </span>
                <Badge
                  className={`mt-1 text-xs ${
                    form.resultado_geral === 'Aprovado'
                      ? 'bg-emerald-600 text-white'
                      : form.resultado_geral === 'Reprovado'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-600 text-white'
                  }`}
                >
                  {form.resultado_geral}
                </Badge>
              </div>
            </div>

            {form.resultado_geral === 'Reprovado' && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-800 text-xs flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Laudo Reprovado — Iniciar Tratamento de Não Conformidade
                  </span>
                  <div className="flex gap-2">
                    {onCriarDescarteDireto && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onCriarDescarteDireto(form)}
                        className="h-7 text-xs bg-red-700 hover:bg-red-800 text-white"
                      >
                        Abrir Destinação (Anexo VI)
                      </Button>
                    )}
                    {onCriarAcaoCorretivaDireta && (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onCriarAcaoCorretivaDireta(form)}
                        className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white"
                      >
                        Abrir Ação Corretiva (Anexo VII)
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-red-800 font-bold">
                    Motivo da Rejeição do Laudo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    maxLength={500}
                    rows={2}
                    value={form.motivo_rejeicao_relatorio || ''}
                    onChange={(e) =>
                      setForm({ ...form, motivo_rejeicao_relatorio: e.target.value })
                    }
                    placeholder="Descreva detalhadamente o parâmetro fora dos limites que motivou a reprovação..."
                    className="text-xs mt-1 bg-white border-red-300"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 7 – PARECER TÉCNICO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 7 – Parecer Técnico Conclusivo do Laboratório
            </h3>

            <div>
              <Label className="text-xs">
                Parecer do Laboratório (máx 1000) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                maxLength={1000}
                rows={3}
                value={form.parecer_laboratorio}
                onChange={(e) => setForm({ ...form, parecer_laboratorio: e.target.value })}
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Recomendações Técnicas (máx 500)</Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.recomendacoes || ''}
                  onChange={(e) => setForm({ ...form, recomendacoes: e.target.value })}
                  placeholder="Recomendações de manuseio ou estocagem..."
                  className="text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Observações Gerais (máx 500)</Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.observacoes_gerais || ''}
                  onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                  placeholder="Incertezas de medição, desvios operacionais..."
                  className="text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 8 – ASSINATURAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 8 – Assinaturas Oficiais (RT Laboratório & RQ Empresa)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 block">
                  Responsável Técnico do Laboratório
                </span>
                <Input
                  value={form.assinado_rt_laboratorio_nome}
                  onChange={(e) =>
                    setForm({ ...form, assinado_rt_laboratorio_nome: e.target.value })
                  }
                  className="h-8 text-xs mt-1 bg-white"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Data: {form.assinado_rt_laboratorio_data}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[11px] font-bold text-stone-700 block">
                  Responsável pela Qualidade da Empresa (RQ)
                </span>
                <Input
                  value={form.assinado_rq_empresa_nome}
                  onChange={(e) => setForm({ ...form, assinado_rq_empresa_nome: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Data: {form.assinado_rq_empresa_data}
                </p>
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
                Imprimir Laudo PDF
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
              {submitting ? 'Gravando...' : 'Aprovar e Liberar Laudo'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
