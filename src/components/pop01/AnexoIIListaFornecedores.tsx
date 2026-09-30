import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
  Edit2,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import type { AnexoIIFornecedorItem, FornecedorStatus } from '@/types/pop01Forms'
import { calcularDiasAteVencimento } from '@/lib/pop01Validators'

interface AnexoIITableProps {
  fornecedores: AnexoIIFornecedorItem[]
  onAddNew: () => void
  onEdit: (item: AnexoIIFornecedorItem) => void
  onView: (item: AnexoIIFornecedorItem) => void
  onDesqualificar: (item: AnexoIIFornecedorItem, motivo: string) => Promise<void>
  onExportPdf?: () => void
  canManage: boolean
}

export function AnexoIIListaFornecedores({
  fornecedores,
  onAddNew,
  onEdit,
  onView,
  onDesqualificar,
  onExportPdf,
  canManage,
}: AnexoIITableProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [validadeFilter, setValidadeFilter] = useState<string>('todos')
  const [produtoFilter, setProdutoFilter] = useState<string>('todos')
  const [sortField, setSortField] = useState<keyof AnexoIIFornecedorItem>('razao_social')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Estado para modal de desqualificação
  const [desqItem, setDesqItem] = useState<AnexoIIFornecedorItem | null>(null)
  const [desqMotivo, setDesqMotivo] = useState('')
  const [desqLoading, setDesqLoading] = useState(false)

  // Extrair lista de produtos distintos para filtro
  const produtosDisponiveis = useMemo(() => {
    const set = new Set<string>()
    for (const f of fornecedores) {
      if (f.produtos_fornecidos) {
        f.produtos_fornecidos.split(/[,;\n]/).forEach((p) => {
          const t = p.trim()
          if (t) set.add(t)
        })
      }
    }
    return Array.from(set).sort()
  }, [fornecedores])

  // Filtragem e busca em tempo real
  const filtered = useMemo(() => {
    return fornecedores.filter((f) => {
      // Busca por Razão Social ou CNPJ
      const term = searchTerm.toLowerCase()
      const matchSearch =
        !term ||
        f.razao_social.toLowerCase().includes(term) ||
        f.cnpj.includes(term) ||
        (f.id_fornecedor && f.id_fornecedor.toLowerCase().includes(term))

      if (!matchSearch) return false

      // Filtro Status
      if (statusFilter !== 'todos' && f.status !== statusFilter) return false

      // Filtro Validade
      if (validadeFilter !== 'todos' && f.data_validade) {
        const dias = calcularDiasAteVencimento(f.data_validade)
        if (validadeFilter === 'vencido' && dias >= 0) return false
        if (validadeFilter === 'vencendo30' && (dias < 0 || dias > 30)) return false
        if (validadeFilter === 'valido' && dias < 0) return false
      }

      // Filtro Tipo de Produto
      if (produtoFilter !== 'todos') {
        if (!f.produtos_fornecidos?.toLowerCase().includes(produtoFilter.toLowerCase()))
          return false
      }

      return true
    })
  }, [fornecedores, searchTerm, statusFilter, validadeFilter, produtoFilter])

  // Ordenação
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase()
      const vb = (b[sortField] || '').toString().toLowerCase()
      if (va < vb) return sortOrder === 'asc' ? -1 : 1
      if (va > vb) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortField, sortOrder])

  // Paginação
  const totalPages = Math.ceil(sorted.length / pageSize) || 1
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

  const toggleSort = (field: keyof AnexoIIFornecedorItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Exportar Excel (.csv compatível com Excel .xlsx)
  const handleExportExcel = () => {
    const headers = [
      'ID',
      'Razão Social',
      'CNPJ',
      'Produtos Fornecidos',
      'Data Qualificação',
      'Data Validade',
      'Status',
      'Responsável Técnico',
      'Telefone',
      'E-mail',
      'Última Revisão',
    ]

    const rows = sorted.map((f) => [
      f.id_fornecedor || f.id,
      `"${f.razao_social.replace(/"/g, '""')}"`,
      f.cnpj,
      `"${(f.produtos_fornecidos || '').replace(/"/g, '""')}"`,
      f.data_qualificacao,
      f.data_validade,
      f.status,
      `"${(f.responsavel_tecnico || '').replace(/"/g, '""')}"`,
      f.telefone,
      f.email,
      f.ultima_revisao,
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `fornecedores_qualificados_pop01_${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({ title: 'Planilha exportada com sucesso' })
  }

  const handleConfirmDesqualificar = async () => {
    if (!desqItem) return
    if (!desqMotivo || desqMotivo.trim().length === 0) {
      toast({
        title: 'Motivo é obrigatório',
        description: 'Justifique a desqualificação do fornecedor.',
        variant: 'destructive',
      })
      return
    }
    setDesqLoading(true)
    try {
      await onDesqualificar(desqItem, desqMotivo)
      toast({
        title: 'Fornecedor desqualificado',
        description: 'Status atualizado no cadastro do Auto Controle 01.',
      })
      setDesqItem(null)
      setDesqMotivo('')
    } catch (err: any) {
      toast({ title: 'Erro ao desqualificar', description: err.message, variant: 'destructive' })
    } finally {
      setDesqLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Barra Superior de Ações e Filtros */}
      <div className="p-4 bg-white rounded-xl border border-[#E2DCCF] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                ANEXO II
              </span>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                Lista de Fornecedores Qualificados (IN 04/2007)
              </h3>
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Alimentada automaticamente pelo Anexo I. Base obrigatória para o Recebimento (Anexo
              III).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" />
              Exportar Excel
            </Button>
            {onExportPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExportPdf}
                className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-red-700" />
                Relatório PDF
              </Button>
            )}
            {canManage && (
              <Button
                size="sm"
                onClick={onAddNew}
                className="h-8 text-xs bg-[#1B4332] hover:bg-[#122e22] text-white font-semibold gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5 text-[#D9A404]" />
                Adicionar Novo Fornecedor
              </Button>
            )}
          </div>
        </div>

        {/* Filtros em linha */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-100">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por Razão Social ou CNPJ..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
                <SelectItem value="Desqualificado">Desqualificado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={validadeFilter}
              onValueChange={(val) => {
                setValidadeFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Validade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Validades</SelectItem>
                <SelectItem value="valido">Válido</SelectItem>
                <SelectItem value="vencendo30">Vencendo em 30 dias (Alerta)</SelectItem>
                <SelectItem value="vencido">Vencido (Bloqueado)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={produtoFilter}
              onValueChange={(val) => {
                setProdutoFilter(val)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo de Insumo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Insumos</SelectItem>
                {produtosDisponiveis.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela Interativa */}
      <div className="bg-white rounded-xl border border-[#E2DCCF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#FAF7EF] border-b border-[#E2DCCF] text-stone-700 text-left font-semibold select-none">
                <th
                  onClick={() => toggleSort('id_fornecedor')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#1B4332]"
                >
                  ID {sortField === 'id_fornecedor' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('razao_social')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#1B4332]"
                >
                  Razão Social{' '}
                  {sortField === 'razao_social' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-2.5 px-3">CNPJ</th>
                <th className="py-2.5 px-3">Produtos Fornecidos</th>
                <th
                  onClick={() => toggleSort('data_validade')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#1B4332]"
                >
                  Validade Qualificação{' '}
                  {sortField === 'data_validade' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-2.5 px-3 cursor-pointer hover:text-[#1B4332]"
                >
                  Status {sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="py-2.5 px-3">Resp. Técnico</th>
                <th className="py-2.5 px-3">Contato</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-400">
                    Nenhum fornecedor encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const dias = calcularDiasAteVencimento(item.data_validade)
                  const isVencido = dias < 0
                  const isVencendo30 = dias >= 0 && dias <= 30

                  return (
                    <tr
                      key={item.id || idx}
                      className={`hover:bg-emerald-50/40 transition-colors ${
                        idx % 2 === 1 ? 'bg-[#FCFBF8]' : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-stone-600">
                        {item.id_fornecedor || `FOR-${idx + 1}`}
                      </td>
                      <td
                        className="py-2.5 px-3 font-medium text-stone-900 max-w-[180px] truncate"
                        title={item.razao_social}
                      >
                        {item.razao_social}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{item.cnpj}</td>
                      <td
                        className="py-2.5 px-3 text-stone-600 max-w-[160px] truncate"
                        title={item.produtos_fornecidos}
                      >
                        {item.produtos_fornecidos || '—'}
                      </td>

                      {/* Validade com Alertas Visuais */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {isVencido ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                              <XCircle className="h-3 w-3 text-red-600" />
                              {item.data_validade
                                ? new Date(item.data_validade).toLocaleDateString('pt-BR')
                                : 'Vencida'}
                            </span>
                          ) : isVencendo30 ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              <AlertTriangle className="h-3 w-3 text-amber-600" />
                              {item.data_validade
                                ? new Date(item.data_validade).toLocaleDateString('pt-BR')
                                : 'Vencendo'}{' '}
                              ({dias}d)
                            </span>
                          ) : (
                            <span className="text-stone-700">
                              {item.data_validade
                                ? new Date(item.data_validade).toLocaleDateString('pt-BR')
                                : '—'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {item.status === 'Ativo' && (
                          <Badge className="bg-[#1B4332] text-white hover:bg-[#1B4332] text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                            Ativo
                          </Badge>
                        )}
                        {item.status === 'Desqualificado' && (
                          <Badge className="bg-red-700 text-white hover:bg-red-700 text-[10px] gap-1">
                            <XCircle className="h-3 w-3" />
                            Desqualificado
                          </Badge>
                        )}
                        {item.status === 'Suspenso' && (
                          <Badge className="bg-[#D9A404] text-stone-900 hover:bg-[#D9A404] text-[10px] gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Suspenso
                          </Badge>
                        )}
                        {item.status === 'Inativo' && (
                          <Badge variant="outline" className="text-stone-500 text-[10px]">
                            Inativo
                          </Badge>
                        )}
                      </td>

                      <td
                        className="py-2.5 px-3 text-stone-600 truncate max-w-[120px]"
                        title={item.responsavel_tecnico}
                      >
                        {item.responsavel_tecnico || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 text-[10px]">
                        <div>{item.telefone || '—'}</div>
                        <div className="truncate max-w-[120px]">{item.email || ''}</div>
                      </td>

                      {/* Ações */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(item)}
                            className="h-7 w-7 p-0 text-stone-500 hover:text-stone-900"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(item)}
                                className="h-7 w-7 p-0 text-stone-500 hover:text-[#1B4332]"
                                title="Editar / Revisar"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>

                              {item.status !== 'Desqualificado' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setDesqItem(item)
                                    setDesqMotivo('')
                                  }}
                                  className="h-7 w-7 p-0 text-stone-400 hover:text-red-700"
                                  title="Desqualificar Fornecedor"
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Paginação */}
        <div className="p-3 bg-[#FAF7EF] border-t border-[#E2DCCF] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-stone-500 text-[11px]">
            <span>
              Exibindo {paginated.length} de {sorted.length} fornecedores
            </span>
            <span>•</span>
            <span>Por página:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-7 w-16 text-[11px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="h-7 w-7 p-0 bg-white"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-stone-600 text-[11px] px-2 font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="h-7 w-7 p-0 bg-white"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de confirmação de Desqualificação (com motivo obrigatório) */}
      <Dialog open={Boolean(desqItem)} onOpenChange={(open) => !open && setDesqItem(null)}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-700 flex items-center gap-2 font-['Sora']">
              <Ban className="h-5 w-5" />
              Desqualificar Fornecedor
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Esta ação bloqueará o recebimento de matérias-primas deste fornecedor (Anexo III) até
              nova reavaliação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p>
                <strong>Fornecedor:</strong> {desqItem?.razao_social}
              </p>
              <p>
                <strong>CNPJ:</strong> {desqItem?.cnpj}
              </p>
            </div>

            <div>
              <label className="font-bold text-stone-800 block mb-1">
                Motivo da Desqualificação (máx 500 caracteres){' '}
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                maxLength={500}
                rows={3}
                value={desqMotivo}
                onChange={(e) => setDesqMotivo(e.target.value)}
                placeholder="Informe detalhadamente as reincidências de não conformidades, laudos reprovados ou descumprimento de BPF..."
                className="text-xs border-red-300"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDesqItem(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={desqLoading}
              onClick={handleConfirmDesqualificar}
              className="text-xs bg-red-700 hover:bg-red-800 text-white font-semibold"
            >
              {desqLoading ? 'Processando...' : 'Confirmar Desqualificação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
