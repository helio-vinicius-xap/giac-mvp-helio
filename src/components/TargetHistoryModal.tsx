import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  History,
  FileCheck2,
  Clock,
  UserCheck,
  AlertTriangle,
  FileEdit,
  Trash2,
  ArrowRight,
  Eye,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IntegrityBadge, evaluateIntegrity } from '@/components/IntegrityBadge'
import { getAuditLogsByTarget } from '@/services/agroService'
import type { AuditLog, MonitoringRecord, Procedure } from '@/types/agro'

interface TargetHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: MonitoringRecord | Procedure | null
  targetType: 'record' | 'procedure'
  targetTitle?: string
}

export function TargetHistoryModal({
  open,
  onOpenChange,
  target,
  targetType,
  targetTitle,
}: TargetHistoryModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  const targetId = target?.id

  const loadLogs = async () => {
    if (!targetId) {
      setLogs([])
      return
    }
    setLoading(true)
    try {
      const data = await getAuditLogsByTarget(targetId)
      setLogs(data as unknown as AuditLog[])
    } catch (err) {
      console.error('Erro ao buscar trilha de auditoria do alvo:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && targetId) {
      loadLogs()
    }
  }, [open, targetId])

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id))
  }

  const integrityInfo = evaluateIntegrity(target, logs)

  // Extrair histórico estruturado de revisões registrado no dados_formulario se for record
  const revisoesEstruturadas: any[] = []
  if (target && 'dados_formulario' in target && target.dados_formulario) {
    const dados = target.dados_formulario as any
    if (Array.isArray(dados?.historico_revisoes)) {
      dados.historico_revisoes.forEach((rev: any, index: number) => {
        revisoesEstruturadas.push({
          id: `rev-${index}`,
          action: 'RETIFICACAO_RE',
          created: rev.revisao_data || target.updated,
          user_name: 'Responsável pelo Estabelecimento (RE)',
          user_role: 'RE',
          details: {
            motivo: rev.motivo || 'Registro retificado após comprovação formal.',
            valor_medido_anterior: rev.valor_medido_anterior,
            status_anterior: rev.status_anterior,
            observacoes_anterior: rev.observacoes_anterior,
          },
        })
      })
    }
  }

  // Assinaturas aplicadas diretamente no objeto
  const assinaturasRegistradas: any[] = []
  if (target) {
    if ('assinaturas_registro' in target && target.assinaturas_registro) {
      const sigs: any = target.assinaturas_registro
      if (sigs.rt) assinaturasRegistradas.push({ ...sigs.rt, key: 'rt', papelPadrao: 'RT' })
      if (sigs.re) assinaturasRegistradas.push({ ...sigs.re, key: 're', papelPadrao: 'RE' })
      if (sigs.rq) assinaturasRegistradas.push({ ...sigs.rq, key: 'rq', papelPadrao: 'RQ' })
      if (sigs.operador)
        assinaturasRegistradas.push({ ...sigs.operador, key: 'operador', papelPadrao: 'Operador' })
    } else if ('assinaturas_pop' in target && target.assinaturas_pop) {
      const sigs: any = target.assinaturas_pop
      if (sigs.rt) assinaturasRegistradas.push({ ...sigs.rt, key: 'rt', papelPadrao: 'RT' })
      if (sigs.re) assinaturasRegistradas.push({ ...sigs.re, key: 're', papelPadrao: 'RE' })
      if (sigs.rq) assinaturasRegistradas.push({ ...sigs.rq, key: 'rq', papelPadrao: 'RQ' })
      if (sigs.direcao)
        assinaturasRegistradas.push({ ...sigs.direcao, key: 'direcao', papelPadrao: 'Direção' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col bg-white border-[#E2DCCF] p-0 overflow-hidden">
        {/* Header com banner verde floresta */}
        <DialogHeader className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-[#D9A404] text-[#1B4332] flex items-center justify-center font-black shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold font-['Sora'] text-white flex items-center gap-2">
                  Histórico & Integridade da Trilha
                </DialogTitle>
                <DialogDescription className="text-xs text-emerald-100">
                  {targetType === 'record' ? 'Registro de Monitoramento' : 'Auto Controle'} •
                  Anti-falsificação & IN MAPA 04/2007
                </DialogDescription>
              </div>
            </div>

            <IntegrityBadge target={target} logs={logs} size="sm" showTooltip={false} />
          </div>

          {targetTitle && (
            <div className="mt-3 pt-2 border-t border-emerald-600/40 text-xs text-emerald-100 flex items-center justify-between">
              <span className="truncate font-semibold">{targetTitle}</span>
              <span className="font-mono text-[11px] text-[#D9A404] shrink-0">ID: {targetId}</span>
            </div>
          )}
        </DialogHeader>

        {/* Resumo de Integridade e Status */}
        <div className="p-4 bg-[#FAF7EF] border-b border-[#E2DCCF] text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-700">
              <Lock className="h-3.5 w-3.5 text-emerald-700" />
              <span className="font-semibold">Livro Imutável:</span>
              <span className="text-stone-600">Update/Delete Bloqueados</span>
            </div>
            <span className="text-stone-300">•</span>
            <div className="flex items-center gap-1.5 text-stone-700">
              <History className="h-3.5 w-3.5 text-[#D9A404]" />
              <span className="font-semibold">Eventos Auditados:</span>
              <span className="font-bold text-[#1B4332]">{logs.length}</span>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadLogs}
            disabled={loading}
            className="h-7 text-[11px] gap-1 text-stone-600 hover:text-stone-900"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Timeline body scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Seção das Assinaturas Eletrônicas Válidas (Régua RT/RE + RQ) */}
          {assinaturasRegistradas.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-700" />
                  Régua de Assinaturas Digitais Autenticadas
                </span>
                <Badge className="bg-emerald-700 text-white text-[10px]">
                  {assinaturasRegistradas.length} aplicada(s)
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {assinaturasRegistradas.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-emerald-200/80 shadow-2xs space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1B4332] flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Papel: {sig.papel || sig.papelPadrao}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {sig.data_assinatura
                          ? new Date(sig.data_assinatura).toLocaleString('pt-BR')
                          : 'Data gravada'}
                      </span>
                    </div>

                    <p className="font-semibold text-stone-800 text-[11px]">
                      {sig.responsavel_nome}
                    </p>

                    {sig.responsavel_identificacao && (
                      <p className="text-[10px] text-stone-500 font-mono">
                        {sig.responsavel_identificacao}
                      </p>
                    )}

                    <div className="pt-1 text-[10px] text-emerald-800 border-t border-stone-100 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        {sig.autenticidade_mapa || `Autenticado via ${sig.metodo || 'eletrônica'}`}
                      </span>
                      {sig.hash_documento && (
                        <span
                          className="font-mono text-stone-400 text-[9px]"
                          title={sig.hash_documento}
                        >
                          Hash: {sig.hash_documento.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Destaque de Retificação Formal do RE se houver */}
          {revisoesEstruturadas.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <History className="h-4 w-4 text-amber-700" />
                Revisões e Retificações Homologadas pelo RE ({revisoesEstruturadas.length})
              </span>
              <p className="text-[11px] text-amber-800">
                Alterações executadas sob autoridade do Responsável pelo Estabelecimento (RE) após
                comprovação técnica formal, com registro do valor prévio para auditoria fiscal MAPA.
              </p>

              <div className="space-y-2 pt-1">
                {revisoesEstruturadas.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">Retificação Formal</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(rev.created).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-700 italic">
                      &quot;{rev.details.motivo}&quot;
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-stone-50 p-2 rounded">
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">
                          Valor Anterior
                        </span>
                        <span className="font-mono text-stone-700">
                          {rev.details.valor_medido_anterior || '(vazio)'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">
                          Status Anterior
                        </span>
                        <span className="font-semibold text-stone-700">
                          {rev.details.status_anterior || 'Conforme'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Linha do Tempo Cronológica Completa de audit_logs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora'] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#D9A404]" />
              Trilha de Auditoria Audit_Logs (Mais Recente Primeiro)
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-stone-500">
                Carregando registros da trilha...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
                <p className="font-semibold text-stone-700">Nenhum log gravado ainda neste alvo.</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Qualquer nova ação (criação, edição, retificação ou assinatura) gerará
                  automaticamente um registro imutável nesta trilha.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const isCreate = log.action === 'CREATE'
                  const isUpdate = log.action === 'UPDATE' || log.action === 'RECTIFY'
                  const isDelete = log.action === 'DELETE'
                  const isSignature = log.action === 'SIGNATURE_APPLIED'

                  let dotColor = 'bg-stone-400'
                  let badgeClass = 'bg-stone-100 text-stone-800'
                  let IconAction = Clock
                  let actionTitle = log.action

                  if (isCreate) {
                    dotColor = 'bg-emerald-600'
                    badgeClass = 'bg-emerald-100 text-emerald-800 font-bold'
                    IconAction = CheckCircle2
                    actionTitle = 'Registro Criado'
                  } else if (isUpdate) {
                    dotColor = 'bg-amber-500'
                    badgeClass = 'bg-amber-100 text-amber-900 font-bold'
                    IconAction = FileEdit
                    actionTitle = 'Edição / Retificação'
                  } else if (isSignature) {
                    dotColor = 'bg-[#1B4332]'
                    badgeClass = 'bg-[#1B4332] text-white font-bold'
                    IconAction = UserCheck
                    actionTitle = 'Assinatura Registrada'
                  } else if (isDelete) {
                    dotColor = 'bg-red-600'
                    badgeClass = 'bg-red-100 text-red-800 font-bold'
                    IconAction = Trash2
                    actionTitle = 'Tentativa / Exclusão'
                  }

                  // Parse dos detalhes
                  let parsedDetails: any = null
                  if (typeof log.details === 'string') {
                    try {
                      parsedDetails = JSON.parse(log.details)
                    } catch {
                      parsedDetails = log.details
                    }
                  } else {
                    parsedDetails = log.details
                  }

                  const executorNome =
                    log.user_name ||
                    log.expand?.user?.name ||
                    log.user_email ||
                    parsedDetails?.responsavel ||
                    'Usuário Autenticado'
                  const executorRole = log.user_role || log.expand?.user?.role || ''

                  return (
                    <div key={log.id} className="relative group">
                      {/* Marcador na linha */}
                      <span
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full ${dotColor} ring-4 ring-white shadow-xs`}
                      />

                      <div className="p-3.5 bg-white rounded-xl border border-[#E2DCCF] hover:border-[#2D6A4F] transition text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-[10px] gap-1 ${badgeClass}`}>
                              <IconAction className="h-3 w-3" />
                              {actionTitle}
                            </Badge>
                            <span className="font-bold text-stone-800">{executorNome}</span>
                            {executorRole && (
                              <Badge
                                variant="outline"
                                className="text-[9px] uppercase font-bold text-stone-600 bg-stone-50"
                              >
                                {executorRole}
                              </Badge>
                            )}
                          </div>

                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(log.created).toLocaleString('pt-BR')}
                          </span>
                        </div>

                        {/* Comparativo antes/depois legível se for UPDATE */}
                        {isUpdate && parsedDetails && (
                          <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase text-stone-500 block">
                              Modificações Detectadas:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {parsedDetails.valor_medido_anterior !== undefined && (
                                <div>
                                  <span className="text-stone-400 block text-[9px]">
                                    Valor Medido:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="line-through text-red-600 font-mono">
                                      {parsedDetails.valor_medido_anterior || '(vazio)'}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-stone-400" />
                                    <span className="font-bold text-emerald-800 font-mono">
                                      {parsedDetails.valor_medido_atual || '(vazio)'}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {parsedDetails.status_anterior !== undefined && (
                                <div>
                                  <span className="text-stone-400 block text-[9px]">Status:</span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="line-through text-stone-500">
                                      {parsedDetails.status_anterior}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-stone-400" />
                                    <span className="font-bold text-stone-800">
                                      {parsedDetails.status_atual}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Dados de Assinatura se for SIGNATURE_APPLIED */}
                        {isSignature && parsedDetails && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-[11px] space-y-1">
                            <p className="font-semibold text-emerald-950">
                              Assinatura formal de {parsedDetails.papel} aplicada por{' '}
                              <strong>{parsedDetails.responsavel_nome}</strong>
                            </p>
                            {parsedDetails.responsavel_identificacao && (
                              <p className="text-[10px] text-stone-600 font-mono">
                                Identificação: {parsedDetails.responsavel_identificacao}
                              </p>
                            )}
                            <p className="text-[10px] text-emerald-800">
                              Método:{' '}
                              {parsedDetails.metodo === 'gov_br'
                                ? 'Autenticação Qualificada Gov.br'
                                : 'Certificado ICP-Brasil (PFX)'}
                            </p>
                          </div>
                        )}

                        {/* Toggle para detalhes técnicos JSON */}
                        <div className="pt-1 flex items-center justify-between border-t border-stone-100">
                          <span className="text-[10px] text-stone-400 font-mono">ID: {log.id}</span>
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-[11px] text-[#2D6A4F] hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                Ocultar JSON <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                Ver JSON Técnico <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <pre className="p-2.5 bg-stone-900 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto">
                            {JSON.stringify(
                              {
                                id: log.id,
                                action: log.action,
                                target: log.target,
                                target_id: log.target_id,
                                user: log.user,
                                user_email: log.user_email,
                                user_name: log.user_name,
                                user_role: log.user_role,
                                organization: log.organization,
                                created: log.created,
                                details: parsedDetails,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
