import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  FileCheck2,
  ChevronRight,
  Edit3,
  PlusCircle,
  Printer,
  Archive,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Shield,
  UploadCloud,
  FileText,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getProcedureById, updateProcedure, getRecords, createRecord } from '@/services/agroService'
import type { Procedure, MonitoringRecord, RecordShift, RecordStatus } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function ProcedureDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [procedure, setProcedure] = useState<Procedure | null>(null)
  const [records, setRecords] = useState<MonitoringRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Edit mode on Overview
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Procedure>>({})
  const [saveLoading, setSaveLoading] = useState(false)

  // Modal: Novo Registro
  const [openNewRecordModal, setOpenNewRecordModal] = useState(false)
  const [recordLoading, setRecordLoading] = useState(false)
  const [recordForm, setRecordForm] = useState({
    data: new Date().toISOString().split('T')[0],
    turno: 'Manhã' as RecordShift,
    valor_medido: '',
    status: 'Conforme' as RecordStatus,
    responsavel: 'Hélio - Resp. Técnico',
    observacoes: '',
    lote: '',
  })

  const loadAll = async () => {
    if (!id) return
    try {
      const p = await getProcedureById(id)
      setProcedure(p)
      setEditForm(p)

      const recs = await getRecords(`procedure = '${id}'`, '-data')
      setRecords(recs)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar procedimento',
        description: err.message || 'Procedimento não localizado.',
        variant: 'destructive',
      })
      navigate('/procedimentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  useRealtime('records', () => {
    if (id) {
      getRecords(`procedure = '${id}'`, '-data')
        .then(setRecords)
        .catch(() => {})
    }
  })

  const handleSaveOverview = async () => {
    if (!id) return
    setSaveLoading(true)
    try {
      const updated = await updateProcedure(id, editForm)
      setProcedure(updated)
      setIsEditing(false)
      toast({
        title: 'Procedimento atualizado',
        description: 'Alterações salvas com sucesso.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Verifique os dados informados.',
        variant: 'destructive',
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!id || !procedure) return
    try {
      const newStatus = procedure.status === 'Arquivado' ? 'Ativo' : 'Arquivado'
      const updated = await updateProcedure(id, { status: newStatus })
      setProcedure(updated)
      toast({
        title: `Procedimento ${newStatus === 'Arquivado' ? 'arquivado' : 'reativado'}`,
        description: `${procedure.codigo} agora está ${newStatus}.`,
      })
    } catch (err: any) {
      toast({ title: 'Erro ao arquivar', description: err.message, variant: 'destructive' })
    }
  }

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setRecordLoading(true)

    try {
      const created = await createRecord({
        procedure: id,
        data: `${recordForm.data} 08:00:00.000Z`,
        turno: recordForm.turno,
        valor_medido: recordForm.valor_medido,
        status: recordForm.status,
        responsavel: recordForm.responsavel,
        observacoes: recordForm.observacoes,
        lote: recordForm.lote,
      })

      toast({
        title: 'Registro de monitoramento salvo',
        description: `Status: ${created.status}`,
      })

      setOpenNewRecordModal(false)

      // If status is "Não Conforme", redirect to NC creation flow with prefilled reference
      if (recordForm.status === 'Não Conforme') {
        toast({
          title: 'Atenção: Registro Não Conforme',
          description: 'Redirecionando para abertura da Não Conformidade vinculada.',
        })
        navigate(
          `/nao-conformidades?nova=true&origem=Registro&area=${encodeURIComponent(
            procedure?.area_etapa || 'Produção',
          )}&desc=${encodeURIComponent(
            `Desvio detectado no monitoramento do ${procedure?.codigo}: ${recordForm.valor_medido}. Obs: ${recordForm.observacoes}`,
          )}&lote=${encodeURIComponent(recordForm.lote)}&procId=${id}&recId=${created.id}`,
        )
      } else {
        loadAll()
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar registro',
        description: err.message || 'Verifique os campos.',
        variant: 'destructive',
      })
    } finally {
      setRecordLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading || !procedure) {
    return (
      <div className="py-12 text-center text-stone-500 text-xs">
        Carregando detalhes do procedimento...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-2">
        <nav className="flex items-center text-xs text-stone-500 gap-1.5 no-print">
          <Link to="/procedimentos" className="hover:text-[#2D6A4F] transition">
            Procedimentos
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{procedure.codigo}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#2D6A4F] px-2.5 py-0.5 rounded-full">
                {procedure.codigo}
              </span>
              <Badge variant="outline" className="border-emerald-300 text-[#2D6A4F] bg-emerald-50">
                {procedure.categoria}
              </Badge>
              <Badge
                className={
                  procedure.status === 'Ativo'
                    ? 'bg-[#2E8B57] text-white'
                    : procedure.status === 'Revisão'
                      ? 'bg-[#D9A404] text-[#1B4332]'
                      : 'bg-stone-300 text-stone-700'
                }
              >
                {procedure.status}
              </Badge>
              <span className="text-xs text-stone-500 ml-1">
                Frequência: <strong className="text-stone-700">{procedure.frequencia}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
              {procedure.nome}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            {isEditing ? (
              <Button
                size="sm"
                onClick={handleSaveOverview}
                disabled={saveLoading}
                className="bg-[#2E8B57] hover:bg-[#236e44] text-white text-xs gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saveLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs gap-1.5"
              >
                <Edit3 className="h-4 w-4" />
                Editar
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setOpenNewRecordModal(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Registro
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 text-xs"
              title="Alternar arquivamento"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Tabs */}
      <Tabs defaultValue="visao_geral" className="w-full">
        <TabsList className="bg-[#FAF7EF] p-1 border border-[#E2DCCF] rounded-xl no-print">
          <TabsTrigger
            value="visao_geral"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Visão Geral & Requisitos
          </TabsTrigger>
          <TabsTrigger
            value="registros"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Registros Vinculados ({records.length})
          </TabsTrigger>
          <TabsTrigger
            value="anexos"
            className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
          >
            Anexos e Evidências
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISÃO GERAL */}
        <TabsContent value="visao_geral" className="space-y-6 mt-4">
          <div className="agro-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#E2DCCF]">
              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Responsável Técnico
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.responsavel || ''}
                    onChange={(e) => setEditForm({ ...editForm, responsavel: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-bold text-stone-800 mt-1 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-[#2D6A4F]" />
                    {procedure.responsavel || 'Hélio - RT'}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Área / Etapa do Processo
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.area_etapa || ''}
                    onChange={(e) => setEditForm({ ...editForm, area_etapa: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-semibold text-stone-800 mt-1">
                    {procedure.area_etapa || 'Linha Industrial Geral'}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Referência Legal (IN 04/2007)
                </span>
                {isEditing ? (
                  <Input
                    value={editForm.referencia_in || ''}
                    onChange={(e) => setEditForm({ ...editForm, referencia_in: e.target.value })}
                    className="mt-1 h-8 text-xs"
                  />
                ) : (
                  <p className="text-sm font-semibold text-[#2D6A4F] mt-1 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-[#D9A404]" />
                    {procedure.referencia_in || 'IN 04/2007 Seção 7'}
                  </p>
                )}
              </div>
            </div>

            {/* Objetivo */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                1. Objetivo e Aplicação
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.objetivo || ''}
                  onChange={(e) => setEditForm({ ...editForm, objetivo: e.target.value })}
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-xs text-stone-800 leading-relaxed">
                  {procedure.objetivo || 'Não especificado.'}
                </div>
              )}
            </div>

            {/* Perigos APPCC */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#B91C1C] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                2. Perigos Relacionados (APPCC - Princípio 1)
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.perigos_relacionados || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, perigos_relacionados: e.target.value })
                  }
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-red-50/60 rounded-xl border border-red-200 text-xs text-stone-800 leading-relaxed">
                  {procedure.perigos_relacionados ||
                    'Risco microbiológico e desvios de parâmetros toleráveis.'}
                </div>
              )}
            </div>

            {/* Medidas Preventivas */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                3. Medidas Preventivas & Limites Críticos
              </span>
              {isEditing ? (
                <Textarea
                  rows={3}
                  value={editForm.medidas_preventivas || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, medidas_preventivas: e.target.value })
                  }
                  className="text-xs"
                />
              ) : (
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-stone-800 leading-relaxed">
                  {procedure.medidas_preventivas ||
                    'Inspeção visual, registros em planilhas e calibração periódica.'}
                </div>
              )}
            </div>

            {/* Datas */}
            <div className="pt-4 border-t border-[#E2DCCF] flex flex-wrap items-center justify-between text-xs text-stone-500">
              <div>
                Última Revisão:{' '}
                <strong className="text-stone-700">
                  {procedure.data_revisao
                    ? new Date(procedure.data_revisao).toLocaleDateString('pt-BR')
                    : '15/01/2025'}
                </strong>
              </div>
              <div>
                Validade da Versão:{' '}
                <strong className="text-stone-700">
                  {procedure.validade
                    ? new Date(procedure.validade).toLocaleDateString('pt-BR')
                    : '15/01/2026'}
                </strong>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: REGISTROS */}
        <TabsContent value="registros" className="space-y-4 mt-4">
          <div className="agro-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                  Registros de Monitoramento de Campo
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Histórico de apontamentos com valores medidos, turno e conformidade
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setOpenNewRecordModal(true)}
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                Novo Registro
              </Button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="agro-table-header">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Turno</th>
                    <th className="py-2.5 px-3">Lote</th>
                    <th className="py-2.5 px-3">Valor / Parâmetro Medido</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Responsável</th>
                    <th className="py-2.5 px-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500">
                        Nenhum registro de monitoramento realizado para este procedimento ainda.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FAF7EF] transition">
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium text-stone-800">
                          {new Date(r.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-stone-600">
                          {r.turno || 'Geral'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-[#2D6A4F]">
                          {r.lote || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          {r.valor_medido || 'Conforme especificação'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
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
                        <td className="py-2.5 px-3 text-stone-600 truncate max-w-[140px]">
                          {r.responsavel || 'Operador'}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 max-w-[220px] truncate">
                          {r.observacoes || 'Sem ressalvas'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: ANEXOS */}
        <TabsContent value="anexos" className="space-y-4 mt-4">
          <div className="agro-card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                  Documentos Anexos & Evidências
                </h2>
                <p className="text-xs text-[#6B6B6B]">
                  Instruções de trabalho (IT), planilhas em PDF e laudos laboratoriais
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Upload de Anexo',
                    description: 'Selecione o arquivo em PDF ou imagem para anexar.',
                  })
                }
                className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5"
              >
                <UploadCloud className="h-4 w-4" />
                Anexar Arquivo
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF]">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[#2D6A4F]" />
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      {procedure.codigo}_Instrucao_Trabalho_Oficial.pdf
                    </p>
                    <span className="text-[11px] text-stone-500">
                      PDF • 1.4 MB • Versão Aprovada
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#2D6A4F] text-xs gap-1">
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF]">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-[#2D6A4F]" />
                  <div>
                    <p className="text-xs font-bold text-stone-800">
                      Validacao_Limites_Criticos_MAPA.pdf
                    </p>
                    <span className="text-[11px] text-stone-500">PDF • 850 KB • Laudo Técnico</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#2D6A4F] text-xs gap-1">
                  <Download className="h-4 w-4" /> Baixar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: NOVO REGISTRO */}
      <Dialog open={openNewRecordModal} onOpenChange={setOpenNewRecordModal}>
        <DialogContent className="sm:max-w-[540px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#D9A404]" />
              Novo Registro de Monitoramento ({procedure.codigo})
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Apontamento direto de parâmetros de processo com verificação de limites críticos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRecord} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data da Coleta</Label>
                <Input
                  type="date"
                  value={recordForm.data}
                  onChange={(e) => setRecordForm({ ...recordForm, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Turno</Label>
                <Select
                  value={recordForm.turno}
                  onValueChange={(val: any) => setRecordForm({ ...recordForm, turno: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                    <SelectItem value="Noite">Noite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Lote da Produção</Label>
                <Input
                  value={recordForm.lote}
                  onChange={(e) => setRecordForm({ ...recordForm, lote: e.target.value })}
                  placeholder="Ex: LOTE-2025-045"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status da Medição</Label>
                <Select
                  value={recordForm.status}
                  onValueChange={(val: any) => setRecordForm({ ...recordForm, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conforme">Conforme</SelectItem>
                    <SelectItem value="Não Conforme">Não Conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Valor Medido / Parâmetro Encontrado
              </Label>
              <Input
                value={recordForm.valor_medido}
                onChange={(e) => setRecordForm({ ...recordForm, valor_medido: e.target.value })}
                placeholder="Ex: Temp. 81,4°C / pH 6,8 / Sem presença de pragas"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Responsável pelo Registro
              </Label>
              <Input
                value={recordForm.responsavel}
                onChange={(e) => setRecordForm({ ...recordForm, responsavel: e.target.value })}
                placeholder="Nome do Operador ou Supervisor"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Observações / Detalhes</Label>
              <Textarea
                rows={2}
                value={recordForm.observacoes}
                onChange={(e) => setRecordForm({ ...recordForm, observacoes: e.target.value })}
                placeholder="Descreva eventuais ocorrências operacionais..."
                className="text-xs resize-none"
              />
            </div>

            {recordForm.status === 'Não Conforme' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Ao salvar como <strong>Não Conforme</strong>, você será automaticamente
                  direcionado para preencher o plano de ação e abertura da Não Conformidade.
                </span>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewRecordModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={recordLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold"
              >
                {recordLoading ? 'Gravando...' : 'Salvar Registro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
