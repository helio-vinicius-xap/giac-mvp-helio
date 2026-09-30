import React, { useState, useEffect } from 'react'
import {
  FileText,
  History,
  RotateCcw,
  CheckCircle2,
  Lock,
  Save,
  Clock,
  Eye,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ChevronUp,
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
import {
  saveProcedureRevision,
  restoreProcedureRevision,
  getProcedureRevisions,
} from '@/services/agroService'
import type { Procedure, Company, ProcedureRevision } from '@/types/agro'
import { POP01_NORMATIVE_DATA } from '@/types/pop01NormativeContent'
import { formatProcedureCode, formatProcedureDisplayName } from '@/lib/procedureNaming'

interface PopNormativeEditorProps {
  procedure: Procedure
  company: Company | null
  onRevisionSaved: () => void
}

export function PopNormativeEditor({
  procedure,
  company,
  onRevisionSaved,
}: PopNormativeEditorProps) {
  const { toast } = useToast()
  const { user, isSuperAdmin } = useAuth()
  const userRole = user?.role || 'operador'

  // Seções normativas editáveis
  const defaultSections = procedure.secoes_normativas || {
    objetivo:
      procedure.objetivo ||
      'Padronizar a metodologia executiva para qualificação, recebimento e controle de matérias-primas e insumos em conformidade com a IN 04/2007 do MAPA.',
    campo_aplicacao:
      'Aplica-se a todas as matérias-primas, macro e micro-ingredientes, premixes, concentrados e embalagens manipulados no estabelecimento fabril.',
    referencias_normativas:
      POP01_NORMATIVE_DATA.referencias_normativas?.map((r) => `${r.item}. ${r.texto}`).join('\n') ||
      '',
    definicoes:
      POP01_NORMATIVE_DATA.definicoes?.map((d) => `• ${d.termo}: ${d.conceito}`).join('\n') || '',
    descricao_detalhada:
      procedure.texto_normativo_custom ||
      '6.1 QUALIFICAÇÃO DE FORNECEDORES:\nO processo de qualificação de fornecedores é obrigatório para todos os parceiros comerciais antes da realização de qualquer ordem de compra ou recebimento de insumos.\n\n6.2 RECEBIMENTO E INSPEÇÃO:\nO ato de recepção de insumos segue roteiro sistemático com conferência documental, inspeção higiênico-sanitária do caminhão e coleta de amostras representativas.',
    acoes_corretivas:
      'Em caso de desvios em qualquer etapa de inspeção ou ensaio de liberação, procede-se à retenção cautelar do lote e notificação do fornecedor.',
  }

  const [sections, setSections] = useState<any>(defaultSections)
  const [descricaoAlteracao, setDescricaoAlteracao] = useState('')
  const [novaVersaoInput, setNovaVersaoInput] = useState('')

  // Modal de Validação de Senha do Administrador da Organização
  const [openAuthModal, setOpenAuthModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [saving, setSaving] = useState(false)

  // Histórico de Revisões
  const [revisions, setRevisions] = useState<ProcedureRevision[]>([])
  const [loadingRevisions, setLoadingRevisions] = useState(false)
  const [selectedRevision, setSelectedRevision] = useState<ProcedureRevision | null>(null)
  const [openDiffModal, setOpenDiffModal] = useState(false)
  const [openRestoreModal, setOpenRestoreModal] = useState(false)
  const [restorePassword, setRestorePassword] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [viewTab, setViewTab] = useState<'editor' | 'historico'>('editor')

  // Carregar histórico de revisões
  const loadRevisions = async () => {
    if (!procedure?.id) return
    try {
      setLoadingRevisions(true)
      const list = (await getProcedureRevisions(procedure.id)) as unknown as ProcedureRevision[]
      setRevisions(list)
    } catch (err: any) {
      console.error('Erro ao carregar revisões:', err)
    } finally {
      setLoadingRevisions(false)
    }
  }

  useEffect(() => {
    loadRevisions()
  }, [procedure?.id])

  // Calcular próxima versão sugerida
  const getNextVersion = () => {
    const cur = procedure.versao || '1.0'
    const parts = cur.split('.')
    const maj = parseInt(parts[0], 10) || 1
    const min = parseInt(parts[1], 10) || 0
    return `${maj}.${min + 1}`
  }

  // Submeter salvamento
  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword) {
      toast({
        title: 'Senha Obrigatória',
        description:
          'Digite a senha do administrador da organização para autorizar a alteração normativa.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const fullText = `=== ${formatProcedureDisplayName(procedure)} (${procedure.codigo}) ===\n\n1. OBJETIVO:\n${sections.objetivo}\n\n2. CAMPO DE APLICAÇÃO:\n${sections.campo_aplicacao}\n\n3. REFERÊNCIAS NORMATIVAS:\n${sections.referencias_normativas}\n\n4. DEFINIÇÕES:\n${sections.definicoes}\n\n5. DESCRIÇÃO DETALHADA:\n${sections.descricao_detalhada}\n\n6. AÇÕES CORRETIVAS:\n${sections.acoes_corretivas}`

      const res: any = await saveProcedureRevision(procedure.id, {
        admin_password: adminPassword,
        admin_email: adminEmail || undefined,
        descricao_alteracao:
          descricaoAlteracao || `Atualização do texto normativo por ${user?.name || userRole}`,
        versao: novaVersaoInput || getNextVersion(),
        secoes_normativas: sections,
        texto_completo: fullText,
      })

      toast({
        title: 'Revisão Normativa Salva',
        description: `Nova versão ${res.versao} criada e gravada no histórico de revisões.`,
      })

      setOpenAuthModal(false)
      setAdminPassword('')
      setDescricaoAlteracao('')
      setNovaVersaoInput('')
      loadRevisions()
      onRevisionSaved()
    } catch (err: any) {
      toast({
        title: 'Erro de Autorização',
        description: err.message || 'Senha do Administrador incorreta ou permissão negada.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // Restaurar revisão
  const handleConfirmRestore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRevision || !restorePassword) return

    setRestoring(true)
    try {
      const res: any = await restoreProcedureRevision(procedure.id, {
        revision_id: selectedRevision.id,
        admin_password: restorePassword,
      })

      toast({
        title: 'Versão Restaurada',
        description: `O documento foi restaurado com sucesso como a revisão ${res.nova_versao}.`,
      })

      setOpenRestoreModal(false)
      setRestorePassword('')
      loadRevisions()
      onRevisionSaved()
    } catch (err: any) {
      toast({
        title: 'Falha ao restaurar',
        description: err.message || 'Senha do Administrador incorreta.',
        variant: 'destructive',
      })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra Superior de Ações do Editor */}
      <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Editor Normativo de Auto Controle
            </span>
            <Badge className="bg-[#1B4332] text-white text-[11px] font-mono">
              Versão Vigente: {procedure.versao || '1.0'}
            </Badge>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Edite as seções oficiais do procedimento. Cada alteração cria uma{' '}
            <strong>nova revisão rastreável</strong> e exige a senha do{' '}
            <strong>Administrador da Organização Cliente</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={viewTab === 'editor' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewTab('editor')}
            className={
              viewTab === 'editor' ? 'bg-[#2D6A4F] text-white text-xs' : 'text-xs border-stone-300'
            }
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            Editor
          </Button>

          <Button
            type="button"
            variant={viewTab === 'historico' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setViewTab('historico')
              loadRevisions()
            }}
            className={
              viewTab === 'historico'
                ? 'bg-[#2D6A4F] text-white text-xs'
                : 'text-xs border-stone-300'
            }
          >
            <History className="h-3.5 w-3.5 mr-1" />
            Revisões ({revisions.length})
          </Button>

          {viewTab === 'editor' && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setNovaVersaoInput(getNextVersion())
                setOpenAuthModal(true)
              }}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs gap-1.5 shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              Salvar Nova Revisão
            </Button>
          )}
        </div>
      </div>

      {viewTab === 'editor' ? (
        /* SEÇÕES DO EDITOR NORMATIVO */
        <div className="space-y-4">
          {/* Seção 1: Objetivo */}
          <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#D9A404]" />
                1. Objetivo e Justificativa Técnica
              </Label>
              <span className="text-[10px] text-stone-400">Item 7.1 da IN MAPA nº 04/2007</span>
            </div>
            <Textarea
              rows={3}
              value={sections.objetivo}
              onChange={(e) => setSections({ ...sections, objetivo: e.target.value })}
              placeholder="Descreva a finalidade técnica do procedimento..."
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Seção 2: Campo de Aplicação */}
          <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-[#D9A404]" />
                2. Campo de Aplicação
              </Label>
              <span className="text-[10px] text-stone-400">Abrangência fabril</span>
            </div>
            <Textarea
              rows={3}
              value={sections.campo_aplicacao}
              onChange={(e) => setSections({ ...sections, campo_aplicacao: e.target.value })}
              placeholder="Defina as áreas, etapas fabris e insumos abrangidos..."
              className="text-xs leading-relaxed"
            />
          </div>

          {/* Seção 3 e 4: Referências Normativas e Definições */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                3. Referências Normativas
              </Label>
              <Textarea
                rows={5}
                value={sections.referencias_normativas}
                onChange={(e) =>
                  setSections({ ...sections, referencias_normativas: e.target.value })
                }
                placeholder="Ex: Instrução Normativa MAPA nº 04/2007, Decreto nº 12.031/2024..."
                className="text-xs font-mono leading-relaxed"
              />
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                4. Definições e Conceitos Técnicos
              </Label>
              <Textarea
                rows={5}
                value={sections.definicoes}
                onChange={(e) => setSections({ ...sections, definicoes: e.target.value })}
                placeholder="Ex: Fabricante, Fornecedor Qualificado, Amostra Representativa..."
                className="text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Seção 5: Descrição Detalhada do Procedimento */}
          <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F]">
                5. Descrição Detalhada do Procedimento (Passo a Passo Operacional)
              </Label>
              <span className="text-[10px] text-stone-400">
                Texto normativo completo do Auto Controle
              </span>
            </div>
            <Textarea
              rows={12}
              value={sections.descricao_detalhada}
              onChange={(e) => setSections({ ...sections, descricao_detalhada: e.target.value })}
              placeholder="Insira o texto normativo completo do Auto Controle, rotinas operacionais, critérios de aceitação, etc."
              className="text-xs font-mono leading-relaxed"
            />{' '}
          </div>

          {/* Seção 6: Ações Corretivas */}
          <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-red-700">
              6. Ações Corretivas Diante de Desvios
            </Label>
            <Textarea
              rows={3}
              value={sections.acoes_corretivas}
              onChange={(e) => setSections({ ...sections, acoes_corretivas: e.target.value })}
              placeholder="Procedimento adotado caso o limite crítico seja ultrapassado..."
              className="text-xs leading-relaxed"
            />
          </div>
        </div>
      ) : (
        /* HISTÓRICO DE REVISÕES DO POP */
        <div className="bg-white rounded-xl border border-[#E2DCCF] overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-[#E2DCCF] flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Histórico de Revisões Normativas
              </h3>
              <p className="text-[11px] text-stone-500">
                Trilha auditável de todas as versões do Auto Controle, autor, data e descrição da
                alteração.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Total: {revisions.length} versões
            </Badge>
          </div>

          <div className="divide-y divide-[#E2DCCF]">
            {revisions.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                Nenhuma revisão anterior registrada. Salve uma alteração no editor para criar o
                primeiro registro de versionamento.
              </div>
            ) : (
              revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 hover:bg-amber-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#2D6A4F] text-white font-mono text-[11px]">
                        Rev. {rev.versao}
                      </Badge>
                      <span className="font-semibold text-stone-800">
                        {rev.descricao_alteracao || 'Atualização do texto normativo'}
                      </span>
                      {rev.restaurado_de && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-700 border-amber-300"
                        >
                          Restaurado da Rev. {rev.restaurado_de}
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-3">
                      <span>
                        Autor: <strong>{rev.autor_nome || rev.autor_email}</strong> (
                        {rev.autor_role || 'N/A'})
                      </span>
                      <span>•</span>
                      <span>Data: {new Date(rev.created).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRevision(rev)
                        setOpenDiffModal(true)
                      }}
                      className="h-8 text-[11px] border-stone-300 gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Visualizar
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRevision(rev)
                        setRestorePassword('')
                        setOpenRestoreModal(true)
                      }}
                      className="h-8 text-[11px] border-amber-300 text-amber-800 hover:bg-amber-50 gap-1 font-semibold"
                    >
                      <RotateCcw className="h-3 w-3 text-amber-700" />
                      Restaurar Versão
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: AUTORIZAÇÃO POR SENHA DO ADMINISTRADOR DA ORGANIZAÇÃO (PARTE B) */}
      <Dialog open={openAuthModal} onOpenChange={setOpenAuthModal}>
        <DialogContent className="sm:max-w-[480px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#D9A404]" />
              Autorização do Administrador da Organização
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Conforme as diretrizes regulatórias e de segurança do GIAC, a alteração de textos
              normativos dos Auto Controles exige a validação formal da senha do Administrador da
              Organização Cliente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmSave} className="space-y-3 pt-2">
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Segurança Regulatória Obrigatória
              </p>
              <p className="text-[11px] leading-relaxed">
                Mesmo que o Responsável pelo Estabelecimento (RE) ou RT esteja editando, a senha do
                administrador da organização (ou Super Admin em suporte) é validada diretamente no
                servidor antes de aplicar a nova revisão.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Número da Revisão</Label>
                <Input
                  value={novaVersaoInput}
                  onChange={(e) => setNovaVersaoInput(e.target.value)}
                  placeholder="Ex: 1.1 ou 2.0"
                  className="h-9 text-xs font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Seu Papel</Label>
                <Input
                  value={userRole}
                  disabled
                  className="h-9 text-xs bg-stone-100 font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Descrição da Alteração / Justificativa *
              </Label>
              <Input
                value={descricaoAlteracao}
                onChange={(e) => setDescricaoAlteracao(e.target.value)}
                placeholder="Ex: Ajuste na rotina de coleta de amostras e referências normativas"
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-bold text-stone-800">
                Senha do Administrador da Organização *
              </Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Digite a senha de admin da organização"
                className="h-9 text-xs border-amber-300 focus:border-[#2D6A4F]"
                required
              />
              <span className="text-[10px] text-stone-500">
                Conta com papel admin_cliente, admin ou super_admin.
              </span>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenAuthModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving || !adminPassword}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                {saving ? 'Validando senha...' : 'Autorizar e Gravar Revisão'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: VISUALIZAR CONTEÚDO DE UMA REVISÃO HISTÓRICA */}
      <Dialog open={openDiffModal} onOpenChange={setOpenDiffModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
          <DialogHeader className="p-4 border-b border-[#E2DCCF] bg-white shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-[#2D6A4F] text-white font-mono text-[10px] mb-1">
                  Revisão {selectedRevision?.versao}
                </Badge>
                <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora']">
                  {selectedRevision?.descricao_alteracao}
                </DialogTitle>
                <DialogDescription className="text-xs text-stone-500">
                  Criada em{' '}
                  {selectedRevision && new Date(selectedRevision.created).toLocaleString('pt-BR')}{' '}
                  por {selectedRevision?.autor_nome}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
            {selectedRevision?.texto_completo ? (
              <pre className="p-4 bg-white rounded-xl border border-stone-200 text-[11px] leading-relaxed font-mono whitespace-pre-wrap text-stone-800">
                {selectedRevision.texto_completo}
              </pre>
            ) : (
              <div className="p-4 bg-white rounded-xl border border-stone-200 text-stone-500">
                Texto completo não registrado para esta revisão.
              </div>
            )}
          </div>

          <DialogFooter className="p-3 bg-white border-t border-[#E2DCCF]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenDiffModal(false)}
              className="text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR RESTAURAÇÃO DE VERSÃO COM SENHA ADMIN */}
      <Dialog open={openRestoreModal} onOpenChange={setOpenRestoreModal}>
        <DialogContent className="sm:max-w-[460px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-amber-800 font-['Sora'] flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Restaurar Versão do Auto Controle
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Você está prestes a restaurar a revisão <strong>
                {selectedRevision?.versao}
              </strong>{' '}
              como a nova versão ativa do procedimento.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRestore} className="space-y-3 pt-2">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
              <p className="leading-relaxed">
                A restauração criará uma nova revisão registrando o retorno a este ponto histórico.
                Digite a senha do Administrador da Organização para confirmar.
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-stone-800">
                Senha do Administrador da Organização *
              </Label>
              <Input
                type="password"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                placeholder="Senha de admin para autorizar"
                className="h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenRestoreModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={restoring || !restorePassword}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {restoring ? 'Restaurando...' : 'Confirmar Restauração'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
