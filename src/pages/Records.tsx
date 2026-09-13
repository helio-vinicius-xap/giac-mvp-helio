import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { getRecords, getProcedures, getCompany } from '@/services/agroService'
import type { MonitoringRecord, Procedure, Company } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { RecordDocumentPdfModal } from '@/components/RecordDocumentPdfModal'
import { Clock, KeyRound } from 'lucide-react'

export default function Records() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [records, setRecords] = useState<MonitoringRecord[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProcedure, setSelectedProcedure] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedSignatureStatus, setSelectedSignatureStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null)
  const [openPdfModal, setOpenPdfModal] = useState(false)
  const [recordForPdf, setRecordForPdf] = useState<MonitoringRecord | null>(null)

  const categories = [
    'Todos',
    'BPF',
    'Limpeza',
    'Qualidade',
    'APPCC',
    'Higiene',
    'Manutenção',
    'Pragas',
    'Água',
    'Rastreabilidade',
  ]

  const loadAll = async () => {
    try {
      const [recs, procs, comp] = await Promise.all([
        getRecords('', '-data'),
        getProcedures(),
        getCompany().catch(() => null),
      ])
      setRecords(recs)
      setProcedures(procs)
      setCompany(comp)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useRealtime('records', () => {
    loadAll()
  })

  const filteredRecords = records.filter((r) => {
    const proc = r.expand?.procedure

    // Search
    const searchMatch =
      !searchTerm ||
      (r.valor_medido && r.valor_medido.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.lote && r.lote.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.responsavel && r.responsavel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc && proc.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (proc && proc.codigo.toLowerCase().includes(searchTerm.toLowerCase()))

    // Procedure Select
    const procMatch = selectedProcedure === 'all' || r.procedure === selectedProcedure

    // Status Select
    const statusMatch = selectedStatus === 'all' || r.status === selectedStatus

    // Signature Status Match
    const hasRQ = Boolean(r.assinaturas_registro?.rq)
    const hasRE = Boolean(r.assinaturas_registro?.re)
    const isComprovado = hasRQ && hasRE
    let signatureMatch = true
    if (selectedSignatureStatus === 'comprovado') {
      signatureMatch = isComprovado
    } else if (selectedSignatureStatus === 'pendente') {
      signatureMatch = !isComprovado
    }

    // Category Pill
    const catMatch = selectedCategory === 'Todos' || (proc && proc.categoria === selectedCategory)

    // Date range
    let dateMatch = true
    if (startDate) {
      dateMatch = dateMatch && new Date(r.data) >= new Date(startDate)
    }
    if (endDate) {
      dateMatch = dateMatch && new Date(r.data) <= new Date(`${endDate}T23:59:59`)
    }

    return searchMatch && procMatch && statusMatch && signatureMatch && catMatch && dateMatch
  })

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast({ title: 'Aviso', description: 'Nenhum registro para exportar.' })
      return
    }

    const headers = [
      'Data',
      'Turno',
      'Lote',
      'Procedimento',
      'Valor Medido',
      'Status',
      'Responsavel',
      'Observacoes',
    ]
    const rows = filteredRecords.map((r) => [
      new Date(r.data).toLocaleDateString('pt-BR'),
      r.turno || '',
      r.lote || '',
      r.expand?.procedure ? `${r.expand.procedure.codigo} - ${r.expand.procedure.nome}` : '',
      `"${(r.valor_medido || '').replace(/"/g, '""')}"`,
      r.status,
      r.responsavel || '',
      `"${(r.observacoes || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Registros_Monitoramento_Agro_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Exportação Concluída',
      description: 'Arquivo CSV gerado com sucesso.',
    })
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Export CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Registros de Monitoramento de Campo
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Visão consolidada em tempo real de todas as verificações operacionais e PCCs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5 h-9"
              >
                <Download className="h-4 w-4" />
                Exportar Relatório
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-[#E2DCCF]">
              <DropdownMenuItem onClick={handleExportCSV} className="text-xs cursor-pointer gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Planilha CSV (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="text-xs cursor-pointer gap-2">
                <FileText className="h-4 w-4 text-red-600" /> Relatório Imprimível / PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 2. Filters Card */}
      <div className="agro-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por lote, valor medido, operador..."
              className="pl-9 h-9 text-xs border-[#E2DCCF]"
            />
          </div>

          <div>
            <Select value={selectedProcedure} onValueChange={setSelectedProcedure}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Procedimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Procedimentos</SelectItem>
                {procedures.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.codigo} - {p.nome.slice(0, 24)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Conforme">Conforme</SelectItem>
                <SelectItem value="Não Conforme">Não Conforme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={selectedSignatureStatus} onValueChange={setSelectedSignatureStatus}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Assinatura RQ/RE" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Assinaturas</SelectItem>
                <SelectItem value="comprovado">Comprovado (RQ + RE)</SelectItem>
                <SelectItem value="pendente">Pendente Assinatura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-[11px] px-2"
              title="Data inicial"
            />
            <span className="text-stone-400 text-xs">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-[11px] px-2"
              title="Data final"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Categorias:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#D9A404] text-[#1B4332] shadow-xs'
                  : 'bg-white text-stone-600 border border-[#E2DCCF] hover:bg-stone-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Records Table */}
      <div className="agro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="agro-table-header">
                <th className="py-3 px-3">Data</th>
                <th className="py-3 px-3">Turno</th>
                <th className="py-3 px-3">Procedimento (POP)</th>
                <th className="py-3 px-3">Lote</th>
                <th className="py-3 px-3">Parâmetro / Valor Medido</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Comprovação RQ/RE</th>
                <th className="py-3 px-3">Responsável</th>
                <th className="py-3 px-3 text-right">Ação / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Carregando registros de monitoramento...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Nenhum registro encontrado para os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const proc = r.expand?.procedure
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className="hover:bg-[#FAF7EF] cursor-pointer transition"
                    >
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-stone-800">
                        {new Date(r.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                        {r.turno || 'Geral'}
                      </td>
                      <td className="py-3 px-3">
                        {proc ? (
                          <Link
                            to={`/procedimentos/${proc.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-[#2D6A4F] hover:underline"
                          >
                            {proc.codigo} - {proc.nome.slice(0, 30)}
                          </Link>
                        ) : (
                          <span className="text-stone-400">Desconhecido</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-[#2D6A4F]">
                        {r.lote ? (
                          <Link
                            to={`/rastreabilidade?lote=${encodeURIComponent(r.lote)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline text-[#2D6A4F]"
                          >
                            {r.lote}
                          </Link>
                        ) : (
                          <span className="text-stone-400 font-normal">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-stone-900 max-w-[220px] truncate">
                        {r.valor_medido || 'Conforme'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          className={
                            r.status === 'Conforme'
                              ? 'bg-[#2E8B57] text-white'
                              : 'bg-[#B91C1C] text-white'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.assinaturas_registro?.rq && r.assinaturas_registro?.re ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Comprovado RQ/RE
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {r.assinaturas_registro?.rq
                              ? 'Falta RE'
                              : r.assinaturas_registro?.re
                                ? 'Falta RQ'
                                : 'Pendente RQ/RE'}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-stone-600 truncate max-w-[120px]">
                        {r.responsavel || 'Operador'}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedRecord(r)
                            }}
                            className="text-stone-600 hover:bg-stone-100 h-8 px-2 text-xs font-semibold gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setRecordForPdf(r)
                              setOpenPdfModal(true)
                            }}
                            className="text-[#2D6A4F] border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold gap-1"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF / Assinar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DETALHE DO REGISTRO */}
      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#D9A404]" />
              Apontamento de Monitoramento
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Detalhes consolidados do registro coletado em fábrica.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Data da Coleta
                  </span>
                  <span className="font-bold text-stone-800 text-sm">
                    {new Date(selectedRecord.data).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Turno
                  </span>
                  <span className="font-bold text-stone-800 text-sm">
                    {selectedRecord.turno || 'Geral'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                  Procedimento Vinculado
                </span>
                <span className="font-bold text-[#2D6A4F] text-sm">
                  {selectedRecord.expand?.procedure?.codigo} -{' '}
                  {selectedRecord.expand?.procedure?.nome}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Lote
                  </span>
                  <span className="font-bold text-stone-800">
                    {selectedRecord.lote || 'Não informado'}
                  </span>
                </div>

                <div>
                  <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                    Conformidade
                  </span>
                  <Badge
                    className={
                      selectedRecord.status === 'Conforme'
                        ? 'bg-[#2E8B57] text-white mt-0.5'
                        : 'bg-[#B91C1C] text-white mt-0.5'
                    }
                  >
                    {selectedRecord.status}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                  Valor Medido
                </span>
                <p className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 font-semibold text-stone-900 mt-1">
                  {selectedRecord.valor_medido || 'Conforme especificação'}
                </p>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                  Observações de Campo
                </span>
                <p className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-stone-700 mt-1">
                  {selectedRecord.observacoes || 'Sem observações adicionais.'}
                </p>
              </div>

              <div>
                <span className="text-stone-400 block font-semibold uppercase text-[10px]">
                  Responsável
                </span>
                <span className="font-semibold text-stone-800">
                  {selectedRecord.responsavel || 'Operador'}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 flex justify-between sm:justify-between">
            <Button
              size="sm"
              onClick={() => {
                if (selectedRecord) {
                  setRecordForPdf(selectedRecord)
                  setOpenPdfModal(true)
                  setSelectedRecord(null)
                }
              }}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs gap-1"
            >
              <FileText className="h-3.5 w-3.5" /> Ver PDF / Assinaturas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedRecord(null)}
              className="border-stone-300 text-stone-700 text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL PDF & ASSINATURA */}
      <RecordDocumentPdfModal
        open={openPdfModal}
        onOpenChange={setOpenPdfModal}
        record={recordForPdf}
        procedure={recordForPdf?.expand?.procedure}
        company={company}
        onSignatureSaved={loadAll}
      />
    </div>
  )
}
