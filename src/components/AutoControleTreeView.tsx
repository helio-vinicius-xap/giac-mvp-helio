import React, { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Layers,
  FileText,
  PlusCircle,
  Edit3,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Folder,
  Eye,
  Sliders,
  Sparkles,
  Paperclip,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Procedure, MonitoringRecord, PopCustomForm, Company } from '@/types/agro'
import { POP_ITEM07_CATALOG, type POPFormDefinition } from '@/types/popFormsCatalog'
import { formatProcedureCode, formatProcedureDisplayName } from '@/lib/procedureNaming'
import { canManagePopForms, canEditPopStructure } from '@/lib/permissions'
import { useAuth } from '@/contexts/AuthContext'

interface AutoControleTreeNodeProps {
  procedure: Procedure
  records: MonitoringRecord[]
  customForms: PopCustomForm[]
  autoAvaliacoes?: any[]
  isInitiallyExpanded?: boolean
  onNavigateDetail?: (procedureId: string) => void
  onOpenFillCustomForm: (procedure: Procedure, form: PopCustomForm) => void
  onOpenFillSystemForm: (procedure: Procedure, formDef: POPFormDefinition) => void
  onOpenEditCustomForm: (procedure: Procedure, form: PopCustomForm) => void
  onOpenEditExecucao?: (procedure: Procedure) => void
  onOpenRecordPdf?: (record: MonitoringRecord) => void
  onOpenAutoAvaliacaoPdf?: (item: any) => void
  onOpenNewCustomForm: (procedure: Procedure) => void
}

export function AutoControleTreeView({
  procedures,
  allRecords,
  allCustomForms,
  autoAvaliacoes = [],
  company,
  onNavigateDetail,
  onOpenFillCustomForm,
  onOpenFillSystemForm,
  onOpenEditCustomForm,
  onOpenEditExecucao,
  onOpenRecordPdf,
  onOpenAutoAvaliacaoPdf,
  onOpenNewCustomForm,
}: {
  procedures: Procedure[]
  allRecords: MonitoringRecord[]
  allCustomForms: PopCustomForm[]
  autoAvaliacoes?: any[]
  company?: Company | null
  onNavigateDetail?: (procedureId: string) => void
  onOpenFillCustomForm: (procedure: Procedure, form: PopCustomForm) => void
  onOpenFillSystemForm: (procedure: Procedure, formDef: POPFormDefinition) => void
  onOpenEditCustomForm: (procedure: Procedure, form: PopCustomForm) => void
  onOpenEditExecucao?: (procedure: Procedure) => void
  onOpenRecordPdf?: (record: MonitoringRecord) => void
  onOpenAutoAvaliacaoPdf?: (item: any) => void
  onOpenNewCustomForm: (procedure: Procedure) => void
}) {
  const { user } = useAuth()
  const [expandedPops, setExpandedPops] = useState<Record<string, boolean>>(() => {
    // Expandir o primeiro POP por padrão
    const init: Record<string, boolean> = {}
    if (procedures.length > 0) {
      init[procedures[0].id] = true
    }
    return init
  })

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const togglePop = (popId: string) => {
    setExpandedPops((prev) => ({ ...prev, [popId]: !prev[popId] }))
  }

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => {
    const all: Record<string, boolean> = {}
    procedures.forEach((p) => {
      all[p.id] = true
    })
    setExpandedPops(all)
  }

  const collapseAll = () => {
    setExpandedPops({})
  }

  return (
    <div className="space-y-4 text-stone-900">
      {/* Barra de controle da árvore */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF]">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#2D6A4F]" />
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              Árvore Raiz de Auto Controles & Registros Anexados
            </h3>
            <p className="text-[11px] text-stone-600">
              Estrutura hierárquica completa: <strong>Auto Controle (Raiz)</strong> → Fichas &
              Modelos Normativos → Registros Preenchidos / Anexados (com edição de descritivos
              mínimos e regras).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={expandAll}
            className="text-xs h-7 border-stone-300 text-stone-700 bg-white"
          >
            Expandir Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={collapseAll}
            className="text-xs h-7 border-stone-300 text-stone-700 bg-white"
          >
            Recolher Todos
          </Button>
        </div>
      </div>

      {/* Nós da Árvore Raiz */}
      <div className="space-y-3">
        {procedures.map((proc) => {
          const isExpanded = Boolean(expandedPops[proc.id])
          const isPop01 = proc.codigo === 'POP-01' || proc.codigo === 'POP-001'

          // Registros pertencentes a este procedimento
          const procRecords = allRecords.filter((r) => r.procedure === proc.id)
          // Formulários customizados pertencentes a este procedimento
          const procCustomForms = allCustomForms.filter((f) => f.procedure === proc.id)
          // Modelos padrão do catálogo do Item 07
          const catalogItem = POP_ITEM07_CATALOG[proc.codigo]
          const systemForms = catalogItem?.formularios || []

          // Registros pendentes (incompletos ou sem assinatura)
          const pendentesCount = procRecords.filter(
            (r) =>
              r.status === 'Não Conforme' ||
              r.status_execucao === 'Pendente' ||
              (r.status_assinatura && !r.status_assinatura.includes('Comprovado')),
          ).length

          return (
            <div
              key={proc.id}
              className={`rounded-xl border transition overflow-hidden bg-white shadow-xs ${
                isExpanded ? 'border-[#2D6A4F]/60' : 'border-[#E2DCCF] hover:border-stone-400'
              }`}
            >
              {/* NÓ RAIZ: O AUTO CONTROLE */}
              <div
                onClick={() => togglePop(proc.id)}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition ${
                  isExpanded ? 'bg-emerald-50/50 border-b border-[#E2DCCF]' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-stone-200/60 text-stone-600 transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-[#2D6A4F]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-500" />
                    )}
                  </button>

                  <div className="w-8 h-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-xs">
                    {proc.codigo.replace(/[^0-9]/g, '') || '01'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-[#1B4332] bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                        {formatProcedureCode(proc.codigo)}
                      </span>
                      <h4 className="text-sm font-bold text-[#1B4332] font-['Sora']">
                        {formatProcedureDisplayName(proc)}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-stone-100 text-stone-700"
                      >
                        {proc.categoria}
                      </Badge>
                      {proc.assinaturas_pop?.rt && proc.assinaturas_pop?.re ? (
                        <Badge className="bg-emerald-700 text-white text-[9px] gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Assinado RT & RE
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[9px] border-amber-300 bg-amber-50 text-amber-800"
                        >
                          Pendente Assinatura RT/RE
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                      {proc.nome} • Resp: {proc.responsavel || 'RT'} • Freq:{' '}
                      {proc.frequencia || 'Diário'}
                    </p>
                  </div>
                </div>

                {/* Badges e Ações do Nó Raiz */}
                <div
                  className="flex items-center gap-2 sm:self-center self-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono text-[11px]">
                      {procRecords.length} reg.
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono text-[11px]">
                      {systemForms.length + procCustomForms.length} formulários
                    </span>
                    {pendentesCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold text-[11px] flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-700" />
                        {pendentesCount} pend.
                      </span>
                    )}
                  </div>

                  {canManagePopForms(user?.role) && (
                    <Button
                      size="sm"
                      onClick={() => onOpenNewCustomForm(proc)}
                      className="h-7 text-[11px] bg-[#D9A404] hover:bg-[#b8860b] text-[#1B4332] font-bold gap-1 shadow-xs"
                      title="Anexar novo formulário customizado a este Auto Controle"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Anexar Registro
                    </Button>
                  )}

                  {onNavigateDetail && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigateDetail(proc.id)}
                      className="h-7 text-[11px] border-[#2D6A4F] text-[#2D6A4F] hover:bg-emerald-50 gap-1 font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" /> Abrir Auto Controle
                    </Button>
                  )}
                </div>
              </div>

              {/* RAMIFICAÇÕES: FILHOS DO AUTO CONTROLE */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-4 bg-stone-50/40 border-t border-stone-100">
                  {/* RAMO 1: Descritivo Mínimo & Como Executar */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#E2DCCF] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-[#D9A404]" />
                        <span className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">
                          Descritivos Mínimos & Parâmetros de Execução
                        </span>
                      </div>
                      {canEditPopStructure(user?.role) && onOpenEditExecucao && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onOpenEditExecucao(proc)}
                          className="h-6 text-[10px] text-[#2D6A4F] hover:bg-emerald-50 gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Editar Descritivos Mínimos
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-stone-600 pt-1">
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="block text-stone-800 text-[10px] uppercase font-bold">
                          Objetivo Normativo:
                        </strong>
                        <p className="mt-0.5 line-clamp-2">
                          {proc.objetivo || 'Padrão sanitário conforme IN 04/2007 do MAPA.'}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="block text-stone-800 text-[10px] uppercase font-bold">
                          Perigos & APPCC:
                        </strong>
                        <p className="mt-0.5 line-clamp-2">
                          {proc.perigos_relacionados ||
                            'Controle de contaminações físicas, químicas e microbiológicas.'}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-stone-50 border border-stone-200">
                        <strong className="block text-stone-800 text-[10px] uppercase font-bold">
                          Limites Críticos & Produtos:
                        </strong>
                        <p className="mt-0.5 line-clamp-2">
                          {proc.campos_execucao?.limites_criticos_aceitacao ||
                            proc.campos_execucao?.produtos_quimicos_utilizados ||
                            'Parâmetros e limites estabelecidos na validação técnica do RT.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* RAMO 2: Formulários / Fichas de Registro Anexadas ao Auto Controle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-1.5">
                        <Folder className="h-4 w-4 text-[#D9A404]" />
                        Formulários e Fichas de Monitoramento Anexadas (
                        {systemForms.length + procCustomForms.length})
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Modelos de preenchimento vinculados à raiz
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {/* Formulários do Modelo Oficial do Sistema */}
                      {systemForms.map((sf) => (
                        <div
                          key={sf.codigo}
                          className="p-3 bg-white rounded-lg border border-stone-200 hover:border-emerald-500 transition flex items-start justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge
                                variant="outline"
                                className="font-mono text-[9px] bg-stone-50 text-stone-800 border-stone-300"
                              >
                                {sf.codigo}
                              </Badge>
                              <Badge className="bg-stone-200 text-stone-700 text-[9px]">
                                Modelo Padrão IN 04
                              </Badge>
                            </div>
                            <h5 className="text-xs font-bold text-stone-900 leading-tight">
                              {sf.titulo}
                            </h5>
                            <p className="text-[10px] text-stone-500">
                              Freq: {sf.frequencia} • {sf.campos_fixos?.length || 0} campos
                              regulatórios
                            </p>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => onOpenFillSystemForm(proc, sf)}
                            className="h-7 text-[11px] bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold shrink-0 gap-1"
                          >
                            <PlusCircle className="h-3 w-3" /> Preencher
                          </Button>
                        </div>
                      ))}

                      {/* Formulários Customizados Criados e Editáveis pelo Cliente */}
                      {procCustomForms.map((cf) => (
                        <div
                          key={cf.id}
                          className="p-3 bg-white rounded-lg border border-amber-200 hover:border-[#2D6A4F] transition flex items-start justify-between gap-2 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge className="bg-[#1B4332] text-white font-mono text-[9px]">
                                {cf.codigo}
                              </Badge>
                              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px]">
                                Ficha Customizada
                              </Badge>
                              {cf.obrigatorio_na_cadeia && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-emerald-300 text-emerald-800"
                                >
                                  Cadeia Obrigatória
                                </Badge>
                              )}
                              {cf.tem_vencimento && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-blue-300 text-blue-700"
                                >
                                  Vencimento Ativo
                                </Badge>
                              )}
                            </div>
                            <h5 className="text-xs font-bold text-stone-900 leading-tight">
                              {cf.titulo}
                            </h5>
                            <p className="text-[10px] text-stone-500">
                              Freq: {cf.frequencia || 'Diário'} • {cf.campos?.length || 0} campos
                              configurados
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => onOpenFillCustomForm(proc, cf)}
                              className="h-7 text-[11px] bg-[#D9A404] hover:bg-[#b8860b] text-[#1B4332] font-bold gap-1"
                            >
                              <PlusCircle className="h-3 w-3" /> Preencher
                            </Button>

                            {canEditPopStructure(user?.role) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenEditCustomForm(proc, cf)}
                                className="h-7 text-[10px] border-stone-300 text-stone-700 hover:bg-stone-50 px-2"
                                title="Editar campos e descritivos mínimos deste formulário anexado"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {systemForms.length === 0 && procCustomForms.length === 0 && (
                        <div className="col-span-2 p-3 text-center text-xs text-stone-500 bg-white rounded-lg border border-dashed border-stone-300">
                          Nenhum formulário anexado a este Auto Controle ainda. Clique em{' '}
                          <strong>"Anexar Registro"</strong> para criar o primeiro formulário com
                          campos customizados.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RAMO 3: Registros & Comprovantes Emitidos sob este Auto Controle */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-[#2D6A4F]" />
                        Registros Preenchidos & Evidências Vinculadas ({procRecords.length})
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Histórico operacional auditável
                      </span>
                    </div>

                    {procRecords.length === 0 ? (
                      <div className="p-3 text-center text-xs text-stone-400 bg-white rounded-lg border border-stone-200">
                        Sem registros emitidos neste Auto Controle até o momento.
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-[#E2DCCF] divide-y divide-stone-100 overflow-hidden text-xs">
                        {procRecords.slice(0, 8).map((rec) => {
                          const isConforme = rec.status === 'Conforme'
                          const isAssinado =
                            rec.status_assinatura && rec.status_assinatura.includes('Comprovado')

                          return (
                            <div
                              key={rec.id}
                              className="p-2.5 sm:p-3 flex items-center justify-between gap-3 hover:bg-stone-50/70 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-800 shrink-0">
                                  {rec.formulario_codigo || 'REGISTRO'}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-stone-900 truncate">
                                      {rec.lote ? `Lote: ${rec.lote}` : 'Apontamento de rotina'}
                                    </span>
                                    <Badge
                                      className={
                                        isConforme
                                          ? 'bg-emerald-100 text-emerald-800 text-[9px]'
                                          : 'bg-red-100 text-red-800 text-[9px]'
                                      }
                                    >
                                      {rec.status}
                                    </Badge>
                                    {isAssinado ? (
                                      <Badge className="bg-emerald-700 text-white text-[9px] gap-0.5">
                                        <ShieldCheck className="h-2.5 w-2.5" /> Comprovado
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[9px] border-amber-300 text-amber-800 bg-amber-50"
                                      >
                                        Pendente Assinatura
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-stone-500 truncate">
                                    Data: {new Date(rec.data).toLocaleDateString('pt-BR')} • Resp:{' '}
                                    {rec.responsavel || 'Operador'} • Medição:{' '}
                                    {rec.valor_medido || 'Registrado'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {onOpenRecordPdf && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onOpenRecordPdf(rec)}
                                    className="h-6 text-[10px] border-stone-300 text-[#2D6A4F] hover:bg-emerald-50 px-2 font-semibold"
                                  >
                                    Ver Registro / Assinar
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {procRecords.length > 8 && (
                          <div className="p-2 text-center text-[11px] text-stone-500 bg-stone-50">
                            + {procRecords.length - 8} registros adicionais armazenados na base
                            deste Auto Controle.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
