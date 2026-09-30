import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  User,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Lock,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAuditLogsList, getOrganizationsList } from '@/services/agroService'
import type { AuditLog, Organization } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'

interface AuditTrailGlobalProps {
  forcedOrganizationId?: string
  title?: string
  subtitle?: string
}

export function AuditTrailGlobal({
  forcedOrganizationId,
  title = 'Trilha de Auditoria & Imutabilidade',
  subtitle = 'Livro imutável anti-falsificação (MAPA IN 04/2007) com rastreamento completo de criação, edições, retificações e assinaturas.',
}: AuditTrailGlobalProps) {
  const { toast } = useToast()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  // Paginação
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Filtros
  const [searchTargetId, setSearchTargetId] = useState('')
  const [selectedOrg, setSelectedOrg] = useState(forcedOrganizationId || 'all')
  const [selectedAction, setSelectedAction] = useState('all')
  const [selectedTargetCollection, setSelectedTargetCollection] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Expandir JSON
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  // Carrega lista de organizações se for modo super_admin (sem forcedOrganizationId)
  useEffect(() => {
    if (!forcedOrganizationId) {
      getOrganizationsList()
        .then((orgs: any) => setOrganizations(orgs))
        .catch(() => {})
    }
  }, [forcedOrganizationId])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const filters: string[] = []

      // Escopo de organização
      const orgFilter = forcedOrganizationId || (selectedOrg !== 'all' ? selectedOrg : null)
      if (orgFilter) {
        filters.push(`organization = "${orgFilter}"`)
      }

      if (selectedAction !== 'all') {
        filters.push(`action = "${selectedAction}"`)
      }

      if (selectedTargetCollection !== 'all') {
        filters.push(`target = "${selectedTargetCollection}"`)
      }

      if (searchTargetId.trim()) {
        const clean = searchTargetId.trim()
        filters.push(
          `(target_id ~ "${clean}" || user_email ~ "${clean}" || user_name ~ "${clean}")`,
        )
      }

      if (startDate) {
        filters.push(`created >= "${startDate} 00:00:00"`)
      }

      if (endDate) {
        filters.push(`created <= "${endDate} 23:59:59"`)
      }

      const filterStr = filters.length > 0 ? filters.join(' && ') : ''

      const res = await getAuditLogsList(page, perPage, filterStr, '-created')
      setLogs(res.items as unknown as AuditLog[])
      setTotalPages(res.totalPages || 1)
      setTotalItems(res.totalItems || 0)
    } catch (err: any) {
      console.error('Erro ao buscar trilha de auditoria:', err)
      toast({
        title: 'Erro ao carregar auditoria',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [page, perPage, selectedOrg, selectedAction, selectedTargetCollection, startDate, endDate])

  const handleApplySearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadLogs()
  }

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id))
  }

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum log para exportar.' })
      return
    }

    const headers = [
      'Data/Hora',
      'Organização',
      'Ação',
      'Coleção Alvo',
      'ID do Alvo',
      'Usuário Executor',
      'Papel',
      'E-mail',
      'Detalhes / Hash',
    ]

    const rows = logs.map((l) => [
      new Date(l.created).toLocaleString('pt-BR'),
      l.expand?.organization?.razao_social || l.organization || 'Global',
      l.action,
      l.target || '',
      l.target_id || '',
      `"${(l.user_name || l.expand?.user?.name || '').replace(/"/g, '""')}"`,
      l.user_role || '',
      l.user_email || '',
      `"${typeof l.details === 'string' ? l.details.replace(/"/g, '""') : JSON.stringify(l.details).replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Trilha_Auditoria_GIAC_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Exportação Concluída',
      description: 'Trilha de auditoria exportada em CSV.',
    })
  }

  return (
    <div className="space-y-4">
      {/* Header com indicador de imutabilidade */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#E2DCCF]">
        <div>
          <h3 className="text-base font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#D9A404]" />
            {title}
          </h3>
          <p className="text-xs text-stone-600 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] gap-1 px-2.5 py-1"
          >
            <Lock className="h-3 w-3" /> Imutável • Update/Delete Bloqueados
          </Badge>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="h-8 text-xs font-semibold gap-1.5 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar CSV
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={loadLogs}
            disabled={loading}
            className="h-8 text-xs text-stone-600 hover:text-stone-900 gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] space-y-3">
        <form
          onSubmit={handleApplySearch}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5"
        >
          {/* Busca por Target ID ou Usuário */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <Input
              value={searchTargetId}
              onChange={(e) => setSearchTargetId(e.target.value)}
              placeholder="Buscar por target_id, nome ou e-mail..."
              className="pl-9 h-8 text-xs border-[#E2DCCF]"
            />
          </div>

          {/* Organização (Apenas se Super Admin) */}
          {!forcedOrganizationId && (
            <div>
              <Select
                value={selectedOrg}
                onValueChange={(val) => {
                  setSelectedOrg(val)
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Organização" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.razao_social.slice(0, 24)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Ação */}
          <div>
            <Select
              value={selectedAction}
              onValueChange={(val) => {
                setSelectedAction(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">CREATE (Criação)</SelectItem>
                <SelectItem value="UPDATE">UPDATE (Edição)</SelectItem>
                <SelectItem value="RECTIFY">RECTIFY (Retificação)</SelectItem>
                <SelectItem value="SIGNATURE_APPLIED">SIGNATURE_APPLIED</SelectItem>
                <SelectItem value="DELETE">DELETE (Exclusão)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coleção / Alvo */}
          <div>
            <Select
              value={selectedTargetCollection}
              onValueChange={(val) => {
                setSelectedTargetCollection(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Coleção Alvo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Coleções</SelectItem>
                <SelectItem value="records">records (Monitoramentos)</SelectItem>
                <SelectItem value="procedures">procedures (Auto Controles)</SelectItem>
                <SelectItem value="audits">audits (Auditorias)</SelectItem>
                <SelectItem value="non_conformities">non_conformities (RNC)</SelectItem>
                <SelectItem value="pop_custom_forms">pop_custom_forms</SelectItem>
                <SelectItem value="qualificacoes">qualificacoes (PAASO)</SelectItem>
                <SelectItem value="devolucoes">devolucoes (PAASO)</SelectItem>
                <SelectItem value="nao_conformidades_fornecedor">nc_fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="h-8 text-[11px] px-2"
              title="Data inicial"
            />
            <span className="text-stone-400 text-xs">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="h-8 text-[11px] px-2"
              title="Data final"
            />
          </div>
        </form>
      </div>

      {/* Tabela de Logs */}
      <div className="bg-white rounded-xl border border-[#E2DCCF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF7EF] border-b border-[#E2DCCF] text-stone-700 font-bold">
                <th className="py-2.5 px-3 whitespace-nowrap">Data / Hora</th>
                <th className="py-2.5 px-3">Ação</th>
                <th className="py-2.5 px-3">Coleção</th>
                <th className="py-2.5 px-3">Target ID</th>
                <th className="py-2.5 px-3">Executor</th>
                <th className="py-2.5 px-3">Papel</th>
                {!forcedOrganizationId && <th className="py-2.5 px-3">Empresa</th>}
                <th className="py-2.5 px-3 text-right">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500">
                    Carregando trilha de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-500">
                    Nenhum registro de auditoria encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isExpanded = expandedLogId === log.id
                  const isCreate = log.action === 'CREATE'
                  const isUpdate = log.action === 'UPDATE' || log.action === 'RECTIFY'
                  const isDelete = log.action === 'DELETE'
                  const isSignature = log.action === 'SIGNATURE_APPLIED'

                  let badgeColor = 'bg-stone-100 text-stone-800'
                  if (isCreate) badgeColor = 'bg-emerald-100 text-emerald-800 font-bold'
                  else if (isUpdate) badgeColor = 'bg-amber-100 text-amber-900 font-bold'
                  else if (isSignature) badgeColor = 'bg-[#1B4332] text-white font-bold'
                  else if (isDelete) badgeColor = 'bg-red-100 text-red-800 font-bold'

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
                    'Sistema'
                  const executorRole = log.user_role || log.expand?.user?.role || '—'

                  return (
                    <React.Fragment key={log.id}>
                      <tr
                        onClick={() => toggleExpand(log.id)}
                        className={`hover:bg-[#FAF7EF] cursor-pointer transition ${
                          isExpanded ? 'bg-stone-50/80' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap text-stone-700 font-mono text-[11px]">
                          {new Date(log.created).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <Badge className={`text-[10px] ${badgeColor}`}>{log.action}</Badge>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-600 text-[11px]">
                          {log.target || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-800 text-[11px] font-semibold">
                          {log.target_id || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-900 font-medium truncate max-w-[150px]">
                          {executorNome}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                            {executorRole}
                          </span>
                        </td>
                        {!forcedOrganizationId && (
                          <td className="py-2.5 px-3 text-stone-600 truncate max-w-[140px]">
                            {log.expand?.organization?.razao_social || 'Global / Super'}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            className="text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 font-semibold text-[11px]"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-stone-50/60">
                          <td
                            colSpan={forcedOrganizationId ? 7 : 8}
                            className="p-3 text-xs space-y-2"
                          >
                            {/* Comparativo de Edição se houver */}
                            {parsedDetails &&
                              (parsedDetails.valor_medido_anterior !== undefined ||
                                parsedDetails.status_anterior !== undefined ||
                                parsedDetails.motivo) && (
                                <div className="p-2.5 bg-white rounded-lg border border-stone-200 space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-stone-500">
                                    Resumo da Modificação:
                                  </span>
                                  {parsedDetails.motivo && (
                                    <p className="text-[11px] text-amber-900 font-medium">
                                      Motivo registrado: &quot;{parsedDetails.motivo}&quot;
                                    </p>
                                  )}
                                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                    {parsedDetails.valor_medido_anterior !== undefined && (
                                      <div>
                                        <span className="text-stone-400 block text-[9px]">
                                          Valor Medido Anterior:
                                        </span>
                                        <span className="line-through text-red-600 font-mono">
                                          {parsedDetails.valor_medido_anterior || '(vazio)'}
                                        </span>{' '}
                                        ➔{' '}
                                        <span className="font-bold text-emerald-800 font-mono">
                                          {parsedDetails.valor_medido_atual || '(vazio)'}
                                        </span>
                                      </div>
                                    )}
                                    {parsedDetails.status_anterior !== undefined && (
                                      <div>
                                        <span className="text-stone-400 block text-[9px]">
                                          Status Anterior:
                                        </span>
                                        <span className="line-through text-stone-500">
                                          {parsedDetails.status_anterior}
                                        </span>{' '}
                                        ➔{' '}
                                        <span className="font-bold text-stone-800">
                                          {parsedDetails.status_atual}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                            <pre className="p-3 bg-stone-900 text-emerald-300 rounded-lg text-[10px] font-mono overflow-x-auto leading-relaxed">
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
                                  ip: log.ip,
                                  organization: log.organization,
                                  created: log.created,
                                  details: parsedDetails,
                                },
                                null,
                                2,
                              )}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="p-3 bg-[#FAF7EF] border-t border-[#E2DCCF] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
          <div>
            Total de registros: <strong>{totalItems}</strong> • Página <strong>{page}</strong> de{' '}
            <strong>{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(perPage)}
              onValueChange={(val) => {
                setPerPage(Number(val))
                setPage(1)
              }}
            >
              <SelectTrigger className="h-7 text-[11px] w-24 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 / pág</SelectItem>
                <SelectItem value="25">25 / pág</SelectItem>
                <SelectItem value="50">50 / pág</SelectItem>
                <SelectItem value="100">100 / pág</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs bg-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs bg-white"
            >
              Próxima <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
