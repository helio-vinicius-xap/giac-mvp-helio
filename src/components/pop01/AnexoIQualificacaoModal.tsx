import React, { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Save, Send, Printer, X, History } from 'lucide-react'
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
import type { AnexoIQualificacaoData } from '@/types/pop01Forms'
import {
  validarCNPJ,
  formatarCNPJ,
  formatarCPF,
  formatarTelefone,
  validarEmail,
  calcularValidade2Anos,
} from '@/lib/pop01Validators'

interface AnexoIModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (dados: AnexoIQualificacaoData, isDraft: boolean) => Promise<void>
  initialData?: Partial<AnexoIQualificacaoData>
  usersList: Array<{ id: string; name: string; role: string }>
  currentUser?: { name: string; email: string; role?: string; assinatura_imagem?: string } | null
  onPrintPreview?: (dados: AnexoIQualificacaoData) => void
}

export function AnexoIQualificacaoModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  usersList,
  currentUser,
  onPrintPreview,
}: AnexoIModalProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const defaultState: AnexoIQualificacaoData = {
    versao: '01-2026',
    data_qualificacao: new Date().toISOString().split('T')[0],
    responsavel_qualificacao: currentUser?.name || 'Responsável Qualidade',
    status_fluxo: 'Rascunho',

    razao_social: '',
    cnpj: '',
    cpf: '',
    endereco_completo: '',
    telefone: '',
    email: '',
    responsavel_tecnico: '',
    inscricao_profissional: '',

    doc_cnpj_cpf: true,
    doc_registro_mapa: true,
    doc_regularidade_fiscal: true,
    doc_manual_bpf: true,
    doc_autocontrole: true,
    doc_especificacao_tecnica: true,
    doc_certificado_analise_recente: true,
    doc_certificado_origem_animal: false,
    doc_licenca_mapa_medicamentos: false,
    doc_certificado_conformidade_embalagens: false,
    documentacao_complementar: '',

    criterio_registro_mapa: 'Sim',
    criterio_bpf: 'Conforme',
    criterio_autocontrole: 'Implementado',
    criterio_historico: 'Satisfatório',
    criterio_capacidade_tecnica: 'Adequada',
    criterio_origem_animal: 'N/A',
    criterio_medicamentos: 'N/A',
    criterio_produtos_importados: 'N/A',

    parecer_final: 'Aprovado',
    motivo_rejeicao: '',
    condicoes_aprovacao_condicional: '',
    observacoes_gerais: '',
    data_validade_qualificacao: calcularValidade2Anos(),

    assinado_rq_nome: currentUser?.name || 'Dra. Mariana Siqueira (RQ)',
    assinado_rq_data: new Date().toISOString().split('T')[0],
    assinado_rt_nome:
      usersList.find((u) => u.role === 'RT' || u.role === 'RE')?.name || 'Dr. Hélio Silva (RT)',
    assinado_rt_data: new Date().toISOString().split('T')[0],
    historico_alteracoes: [],
  }

  const [form, setForm] = useState<AnexoIQualificacaoData>({
    ...defaultState,
    ...initialData,
  })

  // Validação estrita para Enviar para Aprovação
  const validateForm = (): boolean => {
    if (!form.razao_social || form.razao_social.trim().length === 0) {
      toast({ title: 'Razão Social é obrigatória', variant: 'destructive' })
      return false
    }
    if (!form.cnpj || !validarCNPJ(form.cnpj)) {
      toast({
        title: 'CNPJ inválido ou incompleto',
        description: 'Digite um CNPJ válido com 14 dígitos.',
        variant: 'destructive',
      })
      return false
    }
    if (!form.endereco_completo || form.endereco_completo.trim().length === 0) {
      toast({ title: 'Endereço Completo é obrigatório', variant: 'destructive' })
      return false
    }
    if (!form.telefone || form.telefone.replace(/\D/g, '').length < 10) {
      toast({ title: 'Telefone é obrigatório (mínimo 10 dígitos)', variant: 'destructive' })
      return false
    }
    if (!form.email || !validarEmail(form.email)) {
      toast({ title: 'E-mail inválido', variant: 'destructive' })
      return false
    }
    if (!form.responsavel_tecnico || form.responsavel_tecnico.trim().length === 0) {
      toast({ title: 'Responsável Técnico do fornecedor é obrigatório', variant: 'destructive' })
      return false
    }
    if (
      form.parecer_final === 'Reprovado' &&
      (!form.motivo_rejeicao || form.motivo_rejeicao.trim().length === 0)
    ) {
      toast({ title: 'Motivo da Rejeição é obrigatório se Reprovado', variant: 'destructive' })
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
      const logItem = {
        usuario: currentUser?.name || 'Usuário',
        data_hora: now,
        acao: isDraft ? 'Salvar Rascunho' : 'Enviar para Aprovação / Concluir Qualificação',
        detalhes: `Status: ${isDraft ? 'Rascunho' : form.parecer_final}`,
      }

      const updatedForm: AnexoIQualificacaoData = {
        ...form,
        status_fluxo: isDraft ? 'Rascunho' : form.parecer_final,
        historico_alteracoes: [...(form.historico_alteracoes || []), logItem],
      }

      await onSave(updatedForm, isDraft)
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Verifique os dados informados.',
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
                  ANEXO I
                </span>
                <span className="text-xs text-stone-500 font-semibold">
                  Auto Controle 01 (IN 04/2007)
                </span>
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold text-[#1B4332] font-['Sora']">
                Formulário de Qualificação de Fornecedor
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Avaliação cadastral, documental, técnica e parecer conclusivo do
                fornecedor/fabricante.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
            <div>
              <Label className="text-xs">Versão do Documento</Label>
              <Input
                value={form.versao}
                onChange={(e) => setForm({ ...form, versao: e.target.value })}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Data da Qualificação</Label>
              <Input
                type="date"
                value={form.data_qualificacao}
                onChange={(e) => {
                  const val = e.target.value
                  setForm({
                    ...form,
                    data_qualificacao: val,
                    data_validade_qualificacao: calcularValidade2Anos(new Date(val)),
                  })
                }}
                className="h-8 text-xs mt-1 bg-white"
              />
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Select
                value={form.responsavel_qualificacao}
                onValueChange={(val) => setForm({ ...form, responsavel_qualificacao: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {usersList.map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEÇÃO 1 – DADOS DO FORNECEDOR */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 1 – Dados do Fornecedor
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={150}
                  value={form.razao_social}
                  onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  placeholder="Nome empresarial completo"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={18}
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: formatarCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">CPF (Opcional - Produtor Rural)</Label>
                <Input
                  maxLength={14}
                  value={form.cpf || ''}
                  onChange={(e) => setForm({ ...form, cpf: formatarCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">
                  Endereço Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={200}
                  value={form.endereco_completo}
                  onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })}
                  placeholder="Logradouro, número, bairro, cidade, UF, CEP"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Telefone <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={15}
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: formatarTelefone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">
                  E-mail <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="fornecedor@empresa.com.br"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">
                  Responsável Técnico do Fornecedor <span className="text-red-500">*</span>
                </Label>
                <Input
                  maxLength={100}
                  value={form.responsavel_tecnico}
                  onChange={(e) => setForm({ ...form, responsavel_tecnico: e.target.value })}
                  placeholder="Nome do RT do fornecedor"
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Inscrição Profissional (CRMV/CRQ/CREA)</Label>
                <Input
                  value={form.inscricao_profissional || ''}
                  onChange={(e) => setForm({ ...form, inscricao_profissional: e.target.value })}
                  placeholder="Ex: CRMV-SP 12.345"
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2 – DOCUMENTAÇÃO APRESENTADA */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 2 – Documentação Apresentada
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-3 bg-stone-50 rounded-xl border border-stone-200">
              {[
                { key: 'doc_cnpj_cpf', label: 'Cópia do CNPJ/CPF' },
                { key: 'doc_registro_mapa', label: 'Registro/Cadastro no MAPA' },
                { key: 'doc_regularidade_fiscal', label: 'Comprovante de Regularidade Fiscal' },
                { key: 'doc_manual_bpf', label: 'Manual de BPF ou Resumo de Procedimentos' },
                { key: 'doc_autocontrole', label: 'Descrição do Programa de Autocontrole' },
                { key: 'doc_especificacao_tecnica', label: 'Especificação Técnica dos Produtos' },
                {
                  key: 'doc_certificado_analise_recente',
                  label: 'Certificado de Análise Recente (máx 12 meses)',
                },
                {
                  key: 'doc_certificado_origem_animal',
                  label: 'Certificado de Origem (para produtos de origem animal)',
                },
                { key: 'doc_licenca_mapa_medicamentos', label: 'Licença MAPA (para medicamentos)' },
                {
                  key: 'doc_certificado_conformidade_embalagens',
                  label: 'Certificado de Conformidade (para embalagens)',
                },
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

            <div>
              <Label className="text-xs">Documentação Complementar (máx 500 caracteres)</Label>
              <Textarea
                maxLength={500}
                rows={2}
                value={form.documentacao_complementar || ''}
                onChange={(e) => setForm({ ...form, documentacao_complementar: e.target.value })}
                placeholder="Detalhes sobre licenças ambientais, certidões ou certificados ISO/FSSC..."
                className="text-xs mt-1"
              />
            </div>
          </div>

          {/* SEÇÃO 3 – CRITÉRIOS DE QUALIFICAÇÃO */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 3 – Critérios de Qualificação
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Registro no MAPA</Label>
                <Select
                  value={form.criterio_registro_mapa}
                  onValueChange={(val: any) => setForm({ ...form, criterio_registro_mapa: val })}
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
                <Label className="text-xs">Conformidade com BPF</Label>
                <Select
                  value={form.criterio_bpf}
                  onValueChange={(val: any) => setForm({ ...form, criterio_bpf: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conforme">Conforme</SelectItem>
                    <SelectItem value="Não Conforme">Não Conforme</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Programa de Autocontrole</Label>
                <Select
                  value={form.criterio_autocontrole}
                  onValueChange={(val: any) => setForm({ ...form, criterio_autocontrole: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Implementado">Implementado</SelectItem>
                    <SelectItem value="Em Implementação">Em Implementação</SelectItem>
                    <SelectItem value="Não Implementado">Não Implementado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Histórico de Conformidade</Label>
                <Select
                  value={form.criterio_historico}
                  onValueChange={(val: any) => setForm({ ...form, criterio_historico: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satisfatório">Satisfatório</SelectItem>
                    <SelectItem value="Insatisfatório">Insatisfatório</SelectItem>
                    <SelectItem value="Sem Histórico">Sem Histórico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Capacidade Técnica</Label>
                <Select
                  value={form.criterio_capacidade_tecnica}
                  onValueChange={(val: any) =>
                    setForm({ ...form, criterio_capacidade_tecnica: val })
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Adequada">Adequada</SelectItem>
                    <SelectItem value="Inadequada">Inadequada</SelectItem>
                    <SelectItem value="Pendente Avaliação">Pendente Avaliação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Produtos de Origem Animal</Label>
                <Select
                  value={form.criterio_origem_animal}
                  onValueChange={(val: any) => setForm({ ...form, criterio_origem_animal: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Registrado">Registrado</SelectItem>
                    <SelectItem value="Não Registrado">Não Registrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Medicamentos</Label>
                <Select
                  value={form.criterio_medicamentos}
                  onValueChange={(val: any) => setForm({ ...form, criterio_medicamentos: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Licenciado">Licenciado</SelectItem>
                    <SelectItem value="Não Licenciado">Não Licenciado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Produtos Importados</Label>
                <Select
                  value={form.criterio_produtos_importados}
                  onValueChange={(val: any) =>
                    setForm({ ...form, criterio_produtos_importados: val })
                  }
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="N/A">N/A</SelectItem>
                    <SelectItem value="Documentação Completa">Documentação Completa</SelectItem>
                    <SelectItem value="Documentação Incompleta">Documentação Incompleta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4 – PARECER FINAL */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 4 – Parecer Final & Validade
            </h3>

            <div className="flex flex-wrap items-center gap-6 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-emerald-800">
                <input
                  type="radio"
                  name="parecer_final"
                  value="Aprovado"
                  checked={form.parecer_final === 'Aprovado'}
                  onChange={() => setForm({ ...form, parecer_final: 'Aprovado' })}
                  className="accent-emerald-700 h-4 w-4"
                />
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Aprovado
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-amber-800">
                <input
                  type="radio"
                  name="parecer_final"
                  value="Aprovado Condicionalmente"
                  checked={form.parecer_final === 'Aprovado Condicionalmente'}
                  onChange={() => setForm({ ...form, parecer_final: 'Aprovado Condicionalmente' })}
                  className="accent-amber-600 h-4 w-4"
                />
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Aprovado Condicionalmente
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-semibold text-red-800">
                <input
                  type="radio"
                  name="parecer_final"
                  value="Reprovado"
                  checked={form.parecer_final === 'Reprovado'}
                  onChange={() => setForm({ ...form, parecer_final: 'Reprovado' })}
                  className="accent-red-600 h-4 w-4"
                />
                <XCircle className="h-4 w-4 text-red-600" />
                Reprovado
              </label>
            </div>

            {form.parecer_final === 'Reprovado' && (
              <div>
                <Label className="text-xs text-red-700 font-bold">
                  Motivo da Rejeição (obrigatório, máx 500) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.motivo_rejeicao || ''}
                  onChange={(e) => setForm({ ...form, motivo_rejeicao: e.target.value })}
                  placeholder="Descreva as não conformidades limitantes que impedem a homologação..."
                  className="text-xs mt-1 border-red-300"
                />
              </div>
            )}

            {form.parecer_final === 'Aprovado Condicionalmente' && (
              <div>
                <Label className="text-xs text-amber-800 font-bold">
                  Condições para Aprovação Condicional (máx 500)
                </Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.condicoes_aprovacao_condicional || ''}
                  onChange={(e) =>
                    setForm({ ...form, condicoes_aprovacao_condicional: e.target.value })
                  }
                  placeholder="Ex: Análises laboratoriais lote a lote por 90 dias ou auditoria presencial em 60 dias..."
                  className="text-xs mt-1 border-amber-300"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Observações Gerais (máx 500)</Label>
                <Textarea
                  maxLength={500}
                  rows={2}
                  value={form.observacoes_gerais || ''}
                  onChange={(e) => setForm({ ...form, observacoes_gerais: e.target.value })}
                  placeholder="Observações complementares..."
                  className="text-xs mt-1"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-[#1B4332] uppercase">
                  Data de Validade da Qualificação (Auto +2 anos)
                </span>
                <span className="text-base font-mono font-bold text-stone-900 mt-1">
                  {form.data_validade_qualificacao
                    ? new Date(form.data_validade_qualificacao).toLocaleDateString('pt-BR')
                    : '—'}
                </span>
                <span className="text-[10px] text-stone-500">
                  Calculada conforme exigência do MAPA (validade máxima de 24 meses).
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 5 – ASSINATURAS */}
          <div className="space-y-3">
            <h3 className="font-bold text-[#1B4332] text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              Seção 5 – Assinaturas de Homologação
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
              {submitting ? 'Salvando...' : 'Enviar para Aprovação'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
