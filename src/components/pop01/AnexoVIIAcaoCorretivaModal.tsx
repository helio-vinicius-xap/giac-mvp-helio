import React, { useState, useEffect } from 'react'
import {
  Save,
  Send,
  Printer,
  History,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ShieldAlert,
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
import type {
  AnexoVIIAcaoCorretivaData,
  AcaoCorretivaItem,
  AcompanhamentoHistoricoItem,
} from '@/types/pop01Forms'
import { gerarCodigoRegistro, calcularDiasAteVencimento } from '@/lib/pop01Validators'
import { countNcsFornecedor12Meses } from '@/services/pop01IntegrationService'

interface AnexoVIIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoVIIAcaoCorretivaData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoVIIAcaoCorretivaData>
  currentUser?: { name: string; email: string; role?: string } | null
  usersList: Array<{ id: string; name: string; role: string }>
  fornecedoresList: Array<{ id: string; razao_social: string; cnpj: string }>
  onPrintPreview?: (dados: AnexoVIIAcaoCorretivaData) => void
  onDesqualificarFornecedor?: (razaoSocial: string, motivo: string) => Promise<void>
}

export function AnexoVIIAcaoCorretivaModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  currentUser,
  usersList,
  fornecedoresList,
  onPrintPreview,
  onDesqualificarFornecedor,
}: AnexoVIIModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const defaultAction: AcaoCorretivaItem = {
    id: '1',
    descricao:
      'Emitir notificação formal de não conformidade ao fornecedor exigindo plano de contenção em 5 dias.',
    responsavel: currentUser?.name || 'Responsável Qualidade',
    data_inicio: new Date().toISOString().split('T')[0],
    data_conclusao_prevista: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'Em Execução',
    resultado: '',
    data_conclusao_real: '',
  }

  const defaultHistorico: AcompanhamentoHistoricoItem = {
    id: '1',
    data: new Date().toISOString().split('T')[0],
    responsavel: currentUser?.name || 'Responsável Qualidade',
    status: 'Abertura do Processo',
    observacoes:
      'Instauração da Ação Corretiva conforme POP 01 e notificação da diretoria técnica.',
  }

  const defaultState: AnexoVIIAcaoCorretivaData = {
    numero_acao_corretiva: gerarCodigoRegistro('AC', Math.floor(Math.random() * 90000) + 10000),
    data_abertura: new Date().toISOString().split('T')[0],
    responsavel_abertura: currentUser?.name || 'Responsável Qualidade',
    versao: '01-2026',
    status_geral: 'Aberta',

    tipo_nc: 'Recebimento',
    numero_recebimento: '',
    numero_relatorio_analise: '',
    fornecedor_razao_social: fornecedoresList[0]?.razao_social || 'Agro Grãos do Brasil S.A.',
    produto_nome: 'Farelo de Soja 46%',
    lote_partida: 'FS-2026-089',
    data_identificacao: new Date().toISOString().split('T')[0],

    descricao_detalhada:
      'Identificada violação de especificações físicas e limite de umidade durante conferência na recepção.',
    impacto_potencial: 'Médio',
    justificativa_impacto:
      'Risco de aglomeração no silo de matéria-prima e possível proliferação fúngica se mantida sem descarte/reprocesso.',
    evidencias_anexo: '',

    causa_raiz_identificada:
      'Falha no processo de secagem do fabricante e transporte em lona com permeabilidade à chuva.',
    metodo_analise: '5 Porquês',
    responsavel_analise: currentUser?.name || 'Responsável Qualidade',
    data_analise: new Date().toISOString().split('T')[0],

    acoes_corretivas: [defaultAction],

    acoes_preventivas_necessarias: false,
    acoes_preventivas: [],

    frequencia_acompanhamento: 'Semanal',
    responsavel_acompanhamento: currentUser?.name || 'Responsável Qualidade',
    data_proximo_acompanhamento: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    historico_acompanhamento: [defaultHistorico],

    acao_efetiva: 'Pendente Verificação',
    motivo_inefetividade: '',
    acoes_adicionais: '',
    data_reabertura: '',
    evidencias_efetividade: '',
    data_fechamento: '',

    impacto_qualificacao_fornecedor: true,
    acao_recomendada_fornecedor: 'Revisão Especial',
    justificativa_impacto_fornecedor:
      'Fornecedor advertido para reforçar protocolo de auditoria e inspeção de transporte.',
    ncs_anteriores_contagem: 1,

    observacoes_gerais: 'Registro arquivado na pasta de rastreabilidade do POP 01 por 24 meses.',
    licoes_aprendidas:
      'Auditar previamente o transportador subcontratado pelo fornecedor antes de novas emissões de OC.',

    assinado_rq_nome: currentUser?.name || 'Dra. Mariana Siqueira (RQ)',
    assinado_rq_data: new Date().toISOString().split('T')[0],
    assinado_rt_nome:
      usersList.find((u) => u.role === 'RT' || u.role === 'RE')?.name || 'Dr. Hélio Silva (RT)',
    assinado_rt_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoVIIAcaoCorretivaData>({
    ...defaultState,
    ...initialData,
  })

  // Consulta automática de contagem de NCs anteriores do fornecedor selecionado nos últimos 12 meses
  useEffect(() => {
    if (form.fornecedor_razao_social) {
      countNcsFornecedor12Meses(form.fornecedor_razao_social).then((count) => {
        setForm((prev) => ({
          ...prev,
          ncs_anteriores_contagem: count,
          // Se tiver 2 ou mais, sugere automaticamente Desqualificação ou Revisão Especial
          acao_recomendada_fornecedor:
            count >= 2 ? 'Desqualificação' : prev.acao_recomendada_fornecedor,
        }))
      })
    }
  }, [form.fornecedor_razao_social])

  const updateAcaoCorretiva = (index: number, patch: Partial<AcaoCorretivaItem>) => {
    const list = [...form.acoes_corretivas]
    const item = { ...list[index], ...patch }

    // Calcula status automático 'Atrasada' se passou da data de previsão e não está concluída
    if (item.status !== 'Concluída' && item.data_conclusao_prevista) {
      const dias = calcularDiasAteVencimento(item.data_conclusao_prevista)
      if (dias < 0) {
        item.status = 'Atrasada'
      }
    }

    list[index] = item
    setForm({ ...form, acoes_corretivas: list })
  }

  const addAcaoCorretiva = () => {
    const nova: AcaoCorretivaItem = {
      id: String(Date.now()),
      descricao: '',
      responsavel: currentUser?.name || 'Responsável',
      data_inicio: new Date().toISOString().split('T')[0],
      data_conclusao_prevista: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'Planejada',
    }
    setForm({ ...form, acoes_corretivas: [...form.acoes_corretivas, nova] })
  }

  const removeAcaoCorretiva = (index: number) => {
    if (form.acoes_corretivas.length <= 1) {
      toast({ title: 'Mínimo de 1 ação corretiva é obrigatório', variant: 'destructive' })
      return
    }
    setForm({ ...form, acoes_corretivas: form.acoes_corretivas.filter((_, i) => i !== index) })
  }

  const validateForm = (): boolean => {
    if (!form.descricao_detalhada || form.descricao_detalhada.trim().length === 0) {
      toast({ title: 'Descrição detalhada da NC é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.causa_raiz_identificada || form.causa_raiz_identificada.trim().length === 0) {
      toast({ title: 'Causa raiz identificada é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.acoes_corretivas || form.acoes_corretivas.length === 0) {
      toast({ title: 'Ao menos uma ação corretiva deve ser informada', variant: 'destructive' })
      return false
    }
    for (const a of form.acoes_corretivas) {
      if (!a.descricao || a.descricao.trim().length === 0) {
        toast({
          title: 'Descrição de todas as ações corretivas é obrigatória',
          variant: 'destructive',
        })
        return false
      }
      if (a.status === 'Concluída' && (!a.resultado || !a.data_conclusao_real)) {
        toast({
          title: 'Ações concluídas exigem Resultado e Data de Conclusão Real',
          variant: 'destructive',
        })
        return false
      }
    }

    if (form.status_geral === 'Fechada' && form.acao_efetiva !== 'Sim') {
      toast({ title: 'Fechamento exige Verificação de Efetividade = Sim', variant: 'destructive' })
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
        ? 'Aberta'
        : form.acao_efetiva === 'Sim'
          ? 'Fechada'
          : form.acao_efetiva === 'Não'
            ? 'Reaberta'
            : 'Em Andamento'

      const logItem = {
        usuario: currentUser?.name || 'Responsável',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Atualizar / Concluir Ação Corretiva',
        detalhes: `Status: ${statusFinal} • Efetividade: ${form.acao_efetiva}`,
      }

      const updatedForm: AnexoVIIAcaoCorretivaData = {
        ...form,
        status_geral: statusFinal as any,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      // Se desqualificar fornecedor estiver selecionado e a função existir
      if (
        form.impacto_qualificacao_fornecedor &&
        form.acao_recomendada_fornecedor === 'Desqualificação' &&
        onDesqualificarFornecedor &&
        form.fornecedor_razao_social
      ) {
        await onDesqualificarFornecedor(
          form.fornecedor_razao_social,
          `Desqualificado via Ação Corretiva ${form.numero_acao_corretiva}: ${form.justificativa_impacto_fornecedor || 'Reincidência de NCs'}`,
        )
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar ação corretiva',
        description: err.message,
        variant: 'destructive',
      })
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
                  ANEXO VII
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  POP 01 (FR 01/RNC) • IN 04/2007
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Formulário de Ação Corretiva (Tratamento de Desvios e Causa Raiz)
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Investigação formal por 5 Porquês/Ishikawa, plano de ações, verificação de eficácia
                e impacto no fornecedor.
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
              <Label className="text-xs">Nº da Ação Corretiva (Auto)</Label>
              <Input
                readOnly
                value={form.numero_acao_corretiva}
                className="h-8 text-xs mt-1 bg-stone-100 font-mono font-bold text-[#1B4332]"
              />
            </div>
            <div>
              <Label className="text-xs">Data de Abertura</Label>
              <Input
                type="date"
                value={form.data_abertura}
                onChange={(e) => setForm({ ...form, data_abertura: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável Abertura</Label>
              <Input
                value={form.responsavel_abertura}
                onChange={(e) => setForm({ ...form, responsavel_abertura: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Status Geral</Label>
              <Select
                value={form.status_geral}
                onValueChange={(val: any) => setForm({ ...form, status_geral: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-white font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                  <SelectItem value="Fechada">Fechada (Eficaz)</SelectItem>
                  <SelectItem value="Reaberta">Reaberta (Ineficaz)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEÇÃO 1 – IDENTIFICAÇÃO DA NÃO CONFORMIDADE */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 1 – Identificação da Origem da Não Conformidade
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">
                  Tipo de NC <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.tipo_nc}
                  onValueChange={(val: any) => setForm({ ...form, tipo_nc: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Recebimento">Recebimento de MP (Anexo III)</SelectItem>
                    <SelectItem value="Análise Laboratorial">
                      Análise Laboratorial (Anexo V)
                    </SelectItem>
                    <SelectItem value="Armazenamento">Armazenamento / Quarentena</SelectItem>
                    <SelectItem value="Fornecedor">Fornecedor / Auditoria</SelectItem>
                    <SelectItem value="Outro">Outro Desvio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  {form.tipo_nc === 'Recebimento'
                    ? 'Nº Recebimento (Obrigatório)'
                    : 'Nº Recebimento'}
                </Label>
                <Input
                  value={form.numero_recebimento || ''}
                  onChange={(e) => setForm({ ...form, numero_recebimento: e.target.value })}
                  placeholder="REC-YYYYMMDD-NNNNN"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">
                  {form.tipo_nc === 'Análise Laboratorial'
                    ? 'Nº Relatório Análise (Obrigatório)'
                    : 'Nº Relatório Análise'}
                </Label>
                <Input
                  value={form.numero_relatorio_analise || ''}
                  onChange={(e) => setForm({ ...form, numero_relatorio_analise: e.target.value })}
                  placeholder="LAB-YYYYMMDD-NNNNN"
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Fornecedor</Label>
                <Select
                  value={form.fornecedor_razao_social}
                  onValueChange={(val) => setForm({ ...form, fornecedor_razao_social: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedoresList.map((f) => (
                      <SelectItem key={f.id || f.cnpj} value={f.razao_social}>
                        {f.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">
                  Produto <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={100}
                  value={form.produto_nome}
                  onChange={(e) => setForm({ ...form, produto_nome: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">
                  Lote/Partida <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={50}
                  value={form.lote_partida}
                  onChange={(e) => setForm({ ...form, lote_partida: e.target.value })}
                  className="h-8 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">Data da Identificação</Label>
                <Input
                  type="date"
                  value={form.data_identificacao}
                  onChange={(e) => setForm({ ...form, data_identificacao: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 – DESCRIÇÃO DA NÃO CONFORMIDADE */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 2 – Descrição do Desvio e Avaliação de Impacto
            </h3>

            <div>
              <Label className="text-xs">
                Descrição Detalhada do Desvio (máx 1000) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                maxLength={1000}
                rows={3}
                value={form.descricao_detalhada}
                onChange={(e) => setForm({ ...form, descricao_detalhada: e.target.value })}
                placeholder="Narrativa dos fatos constatados, desvios em relação à especificação técnica..."
                className="text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Impacto Potencial</Label>
                <Select
                  value={form.impacto_potencial}
                  onValueChange={(val: any) => setForm({ ...form, impacto_potencial: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixo">Baixo (Desvio estético ou documental)</SelectItem>
                    <SelectItem value="Médio">
                      Médio (Desvio de processo sem contaminação)
                    </SelectItem>
                    <SelectItem value="Alto">
                      Alto (Risco à inocuidade dos alimentos/MAPA)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs">
                  Justificativa do Impacto (máx 500) <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={500}
                  value={form.justificativa_impacto}
                  onChange={(e) => setForm({ ...form, justificativa_impacto: e.target.value })}
                  placeholder="Fundamente com base no risco de autocontrole..."
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3 – ANÁLISE DE CAUSA RAIZ */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 3 – Análise de Causa Raiz
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Método Utilizado</Label>
                <Select
                  value={form.metodo_analise}
                  onValueChange={(val) => setForm({ ...form, metodo_analise: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5 Porquês">5 Porquês (Qualidade Lean)</SelectItem>
                    <SelectItem value="Diagrama de Ishikawa">
                      Diagrama de Ishikawa (Espinha de Peixe)
                    </SelectItem>
                    <SelectItem value="Análise de Falhas">Análise de Falhas (FMEA)</SelectItem>
                    <SelectItem value="Outro">Outro Método</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Responsável pela Análise</Label>
                <Input
                  value={form.responsavel_analise}
                  onChange={(e) => setForm({ ...form, responsavel_analise: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Data da Análise</Label>
                <Input
                  type="date"
                  value={form.data_analise}
                  onChange={(e) => setForm({ ...form, data_analise: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">
                Causa Raiz Identificada (máx 500) <span className="text-red-500">*</span>
              </Label>
              <Textarea
                maxLength={500}
                rows={2}
                value={form.causa_raiz_identificada}
                onChange={(e) => setForm({ ...form, causa_raiz_identificada: e.target.value })}
                placeholder="Qual o fator primário que originou a falha?..."
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 4 – AÇÕES CORRETIVAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1">
              <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider">
                Seção 4 – Plano de Ações Corretivas (Mínimo 1)
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAcaoCorretiva}
                className="h-7 text-xs border-stone-300 text-[#1B4332] gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Ação
              </Button>
            </div>

            <div className="space-y-3">
              {form.acoes_corretivas.map((acao, idx) => {
                const diasRestantes = calcularDiasAteVencimento(acao.data_conclusao_prevista)
                const isAtrasada =
                  acao.status === 'Atrasada' || (acao.status !== 'Concluída' && diasRestantes < 0)
                const isProximo = diasRestantes >= 0 && diasRestantes <= 3

                return (
                  <div
                    key={acao.id || idx}
                    className={`p-3 rounded-xl border transition-all ${
                      isAtrasada
                        ? 'border-red-300 bg-red-50/40'
                        : isProximo
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-stone-200 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-[#1B4332]">Ação {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        {isAtrasada ? (
                          <Badge className="bg-red-700 text-white text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Atrasada ({Math.abs(diasRestantes)}d)
                          </Badge>
                        ) : isProximo ? (
                          <Badge className="bg-amber-600 text-white text-[10px] gap-1">
                            <Clock className="h-3 w-3" />
                            Vence em breve ({diasRestantes}d)
                          </Badge>
                        ) : null}

                        {form.acoes_corretivas.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAcaoCorretiva(idx)}
                            className="h-6 w-6 p-0 text-stone-400 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div className="sm:col-span-2">
                        <Label className="text-[10px]">Descrição da Ação</Label>
                        <Input
                          maxLength={500}
                          value={acao.descricao}
                          onChange={(e) => updateAcaoCorretiva(idx, { descricao: e.target.value })}
                          placeholder="O que será feito..."
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Responsável</Label>
                        <Select
                          value={acao.responsavel}
                          onValueChange={(val) => updateAcaoCorretiva(idx, { responsavel: val })}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {usersList.map((u) => (
                              <SelectItem key={u.id} value={u.name}>
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px]">Status</Label>
                        <Select
                          value={acao.status}
                          onValueChange={(val: any) => updateAcaoCorretiva(idx, { status: val })}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5 bg-white font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Planejada">Planejada</SelectItem>
                            <SelectItem value="Em Execução">Em Execução</SelectItem>
                            <SelectItem value="Concluída">Concluída</SelectItem>
                            <SelectItem value="Atrasada">Atrasada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-stone-200">
                      <div>
                        <Label className="text-[10px]">Data Início</Label>
                        <Input
                          type="date"
                          value={acao.data_inicio}
                          onChange={(e) =>
                            updateAcaoCorretiva(idx, { data_inicio: e.target.value })
                          }
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Conclusão Prevista</Label>
                        <Input
                          type="date"
                          value={acao.data_conclusao_prevista}
                          onChange={(e) =>
                            updateAcaoCorretiva(idx, { data_conclusao_prevista: e.target.value })
                          }
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Conclusão Real</Label>
                        <Input
                          type="date"
                          value={acao.data_conclusao_real || ''}
                          onChange={(e) =>
                            updateAcaoCorretiva(idx, { data_conclusao_real: e.target.value })
                          }
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px]">Resultado Observado</Label>
                        <Input
                          maxLength={500}
                          value={acao.resultado || ''}
                          onChange={(e) => updateAcaoCorretiva(idx, { resultado: e.target.value })}
                          placeholder="Evidência de conclusão..."
                          className="h-7 text-xs mt-0.5 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SEÇÃO 6 – ACOMPANHAMENTO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 6 – Acompanhamento e Follow-up
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Frequência</Label>
                <Select
                  value={form.frequencia_acompanhamento}
                  onValueChange={(val: any) => setForm({ ...form, frequencia_acompanhamento: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Diária">Diária</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Responsável</Label>
                <Input
                  value={form.responsavel_acompanhamento}
                  onChange={(e) => setForm({ ...form, responsavel_acompanhamento: e.target.value })}
                  className="h-8 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Próximo Acompanhamento</Label>
                <Input
                  type="date"
                  value={form.data_proximo_acompanhamento}
                  onChange={(e) =>
                    setForm({ ...form, data_proximo_acompanhamento: e.target.value })
                  }
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 7 – VERIFICAÇÃO DE EFETIVIDADE */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 7 – Verificação de Efetividade (Garantia de Qualidade)
            </h3>

            <div className="flex flex-wrap items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800">
                <input
                  type="radio"
                  name="acao_efetiva"
                  value="Sim"
                  checked={form.acao_efetiva === 'Sim'}
                  onChange={() =>
                    setForm({
                      ...form,
                      acao_efetiva: 'Sim',
                      data_fechamento: new Date().toISOString().split('T')[0],
                    })
                  }
                  className="accent-emerald-700 h-4 w-4"
                />
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sim (Ação Efetiva — Permitido Fechamento)
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-800">
                <input
                  type="radio"
                  name="acao_efetiva"
                  value="Não"
                  checked={form.acao_efetiva === 'Não'}
                  onChange={() =>
                    setForm({
                      ...form,
                      acao_efetiva: 'Não',
                      data_reabertura: new Date().toISOString().split('T')[0],
                    })
                  }
                  className="accent-red-600 h-4 w-4"
                />
                <XCircle className="h-4 w-4 text-red-600" />
                Não (Ineficaz — Reabertura Obrigatória)
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
                <input
                  type="radio"
                  name="acao_efetiva"
                  value="Pendente Verificação"
                  checked={form.acao_efetiva === 'Pendente Verificação'}
                  onChange={() => setForm({ ...form, acao_efetiva: 'Pendente Verificação' })}
                  className="accent-stone-500 h-4 w-4"
                />
                Pendente Verificação
              </label>
            </div>

            {form.acao_efetiva === 'Sim' && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <Label className="text-xs text-emerald-900 font-bold">
                  Evidências Objetivas da Efetividade (máx 500){' '}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.evidencias_efetividade || ''}
                  onChange={(e) => setForm({ ...form, evidencias_efetividade: e.target.value })}
                  placeholder="Laudos de três lotes subsequentes conformes, ausência de reincidência..."
                  className="text-xs bg-white border-emerald-300"
                />
              </div>
            )}

            {form.acao_efetiva === 'Não' && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <Label className="text-xs text-red-900 font-bold">
                  Motivo da Inefetividade & Ações Adicionais <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.motivo_inefetividade || ''}
                  onChange={(e) => setForm({ ...form, motivo_inefetividade: e.target.value })}
                  placeholder="Por que a causa raiz não foi sanada?..."
                  className="text-xs bg-white border-red-300"
                />
              </div>
            )}
          </div>

          {/* SEÇÃO 8 – IMPACTO NA QUALIFICAÇÃO DO FORNECEDOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-1">
              <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-[#2D6A4F]" />
                Seção 8 – Impacto na Qualificação do Fornecedor (Anexo II)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-[#1B4332]">
                <input
                  type="checkbox"
                  checked={form.impacto_qualificacao_fornecedor}
                  onChange={(e) =>
                    setForm({ ...form, impacto_qualificacao_fornecedor: e.target.checked })
                  }
                  className="h-4 w-4 rounded accent-[#1B4332]"
                />
                Desvio Afeta Fornecedor
              </label>
            </div>

            {form.impacto_qualificacao_fornecedor && (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-stone-800">Ação Recomendada:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="acao_rec_forn"
                        value="Manutenção"
                        checked={form.acao_recomendada_fornecedor === 'Manutenção'}
                        onChange={() =>
                          setForm({ ...form, acao_recomendada_fornecedor: 'Manutenção' })
                        }
                        className="accent-[#1B4332]"
                      />
                      Manutenção com Advertência
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="acao_rec_forn"
                        value="Revisão Especial"
                        checked={form.acao_recomendada_fornecedor === 'Revisão Especial'}
                        onChange={() =>
                          setForm({ ...form, acao_recomendada_fornecedor: 'Revisão Especial' })
                        }
                        className="accent-amber-600"
                      />
                      Revisão Especial
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-red-700">
                      <input
                        type="radio"
                        name="acao_rec_forn"
                        value="Desqualificação"
                        checked={form.acao_recomendada_fornecedor === 'Desqualificação'}
                        onChange={() =>
                          setForm({ ...form, acao_recomendada_fornecedor: 'Desqualificação' })
                        }
                        className="accent-red-600"
                      />
                      Desqualificação Imediata
                    </label>
                  </div>

                  <div className="text-right text-[11px] text-stone-600">
                    NCs anteriores (12 meses):{' '}
                    <strong className="text-red-700">{form.ncs_anteriores_contagem || 0}</strong>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">
                    Justificativa do Impacto (máx 500) <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    maxLength={500}
                    rows={2}
                    value={form.justificativa_impacto_fornecedor || ''}
                    onChange={(e) =>
                      setForm({ ...form, justificativa_impacto_fornecedor: e.target.value })
                    }
                    placeholder="Justifique a penalidade ou manutenção..."
                    className="text-xs mt-1 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SEÇÃO 10 – ASSINATURAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 10 – Assinaturas Oficiais (RQ & RT)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                Imprimir Ação Corretiva PDF
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
              {submitting ? 'Salvando...' : 'Atualizar / Concluir Ação'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
