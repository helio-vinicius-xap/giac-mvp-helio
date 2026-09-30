import React from 'react'
import { ShieldCheck, History, CheckCircle2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { MonitoringRecord, Procedure, AuditLog } from '@/types/agro'

export interface IntegrityStatus {
  status: 'integro' | 'retificado' | 'assinado_integral' | 'em_andamento'
  label: string
  descricao: string
  hasRetificacao: boolean
  totalRevisoes: number
  totalAssinaturas: number
}

export function evaluateIntegrity(
  target: MonitoringRecord | Procedure | null | undefined,
  logs: AuditLog[] = [],
): IntegrityStatus {
  if (!target) {
    return {
      status: 'em_andamento',
      label: 'Não Iniciado',
      descricao: 'Nenhum dado registrado ainda.',
      hasRetificacao: false,
      totalRevisoes: 0,
      totalAssinaturas: 0,
    }
  }

  // Verifica se o registro possui retificações registradas em dados_formulario ou no audit_logs
  let hasRetificacao = false
  let totalRevisoes = 0

  if ('dados_formulario' in target && target.dados_formulario) {
    const dados = target.dados_formulario as any
    if (dados?.historico_revisoes && Array.isArray(dados.historico_revisoes)) {
      totalRevisoes = dados.historico_revisoes.length
      if (totalRevisoes > 0) hasRetificacao = true
    }
  }

  // Também checa logs de auditoria se há ação de UPDATE ou retificação formal
  const updateLogs = logs.filter((l) => l.action === 'UPDATE' || l.action === 'RECTIFY')
  if (updateLogs.length > 0 && !hasRetificacao) {
    hasRetificacao = true
    totalRevisoes = Math.max(totalRevisoes, updateLogs.length)
  }

  // Assinaturas
  let totalAssinaturas = 0
  let isAssinadoCompleto = false

  if ('assinaturas_registro' in target && target.assinaturas_registro) {
    const sigs = target.assinaturas_registro
    if (sigs.rt || sigs.re) totalAssinaturas++
    if (sigs.rq) totalAssinaturas++
    if (sigs.operador) totalAssinaturas++
    if ((sigs.rt || sigs.re) && sigs.rq) {
      isAssinadoCompleto = true
    }
  } else if ('assinaturas_pop' in target && target.assinaturas_pop) {
    const sigs = target.assinaturas_pop
    if (sigs.rt || sigs.re) totalAssinaturas++
    if (sigs.rq) totalAssinaturas++
    if ((sigs.rt || sigs.re) && sigs.rq) {
      isAssinadoCompleto = true
    }
  }

  if (hasRetificacao) {
    return {
      status: 'retificado',
      label: `Retificado (${totalRevisoes} rev.)`,
      descricao: `Possui ${totalRevisoes} revisão(ões) técnica(s) registrada(s) pelo RE com justificativa formal. Trilha consistente e rastreável.`,
      hasRetificacao: true,
      totalRevisoes,
      totalAssinaturas,
    }
  }

  if (isAssinadoCompleto) {
    return {
      status: 'assinado_integral',
      label: 'Íntegro (Comprovado)',
      descricao:
        'Trilha de auditoria 100% íntegra, com assinaturas obrigatórias RT/RE + RQ autenticadas eletronicamente sem alterações posteriores.',
      hasRetificacao: false,
      totalRevisoes: 0,
      totalAssinaturas,
    }
  }

  return {
    status: 'integro',
    label: 'Íntegro',
    descricao:
      'Trilha de auditoria consistente, imutável e sem lacunas registradas. Dados protegidos contra fraudes.',
    hasRetificacao: false,
    totalRevisoes: 0,
    totalAssinaturas,
  }
}

interface IntegrityBadgeProps {
  target: MonitoringRecord | Procedure | null | undefined
  logs?: AuditLog[]
  size?: 'sm' | 'md'
  showTooltip?: boolean
  onClick?: () => void
  className?: string
}

export function IntegrityBadge({
  target,
  logs = [],
  size = 'md',
  showTooltip = true,
  onClick,
  className = '',
}: IntegrityBadgeProps) {
  const info = evaluateIntegrity(target, logs)

  const isSm = size === 'sm'

  let badgeVariantClass =
    'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
  let Icon = ShieldCheck

  if (info.status === 'retificado') {
    badgeVariantClass =
      'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-semibold'
    Icon = History
  } else if (info.status === 'assinado_integral') {
    badgeVariantClass =
      'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800 font-bold shadow-xs'
    Icon = CheckCircle2
  } else if (info.status === 'em_andamento') {
    badgeVariantClass =
      'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200 font-medium'
    Icon = AlertCircle
  }

  const badgeContent = (
    <Badge
      variant="outline"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 transition select-none ${
        onClick ? 'cursor-pointer hover:shadow-xs' : ''
      } ${isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'} ${badgeVariantClass} ${className}`}
    >
      <Icon className={isSm ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0 text-[#D9A404]'} />
      <span>{info.label}</span>
    </Badge>
  )

  if (!showTooltip) return badgeContent

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badgeContent}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-xs p-2.5 bg-stone-900 text-stone-100 border-stone-800"
        >
          <p className="font-bold text-[#D9A404] mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Integridade da Trilha de Auditoria
          </p>
          <p className="text-[11px] leading-relaxed text-stone-200">{info.descricao}</p>
          {onClick && (
            <p className="text-[10px] text-emerald-300 font-semibold mt-1.5 pt-1 border-t border-stone-700">
              Clique para abrir o Histórico & Integridade completo →
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
