import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileCheck2,
  Plus,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  User,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getProcedures, createProcedure, getCompany } from '@/services/agroService'
import type {
  Procedure,
  ProcedureCategory,
  ProcedureFrequency,
  ProcedureStatus,
  Company,
} from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { PopDocumentPdfModal } from '@/components/PopDocumentPdfModal'
import { Printer } from 'lucide-react'

export default function Procedures() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('busca') || '')
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('categoria') || 'Todos',
  )

  // Modals
  const [openNewModal, setOpenNewModal] = useState(searchParams.get('novo') === 'true')
  const [openAppccModal, setOpenAppccModal] = useState(false)
  const [openPdfModal, setOpenPdfModal] = useState(false)
  const [selectedPopForPdf, setSelectedPopForPdf] = useState<Procedure | null>(null)

  // New procedure form
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    categoria: 'BPF' as ProcedureCategory,
    frequencia: 'Diário' as ProcedureFrequency,
    responsavel: 'Hélio - Resp. Técnico',
    status: 'Ativo' as ProcedureStatus,
    area_etapa: 'Linha Geral de Produção',
    objetivo: '',
    perigos_relacionados: '',
    medidas_preventivas: '',
    referencia_in: 'IN 04/2007 Seção 7',
  })

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

  const loadData = async () => {
    try {
      const [data, comp] = await Promise.all([getProcedures(), getCompany().catch(() => null)])
      setProcedures(data)
      setCompany(comp)

      // Auto suggest next code
      let maxNum = 0
      data.forEach((p) => {
        if (p.codigo.startsWith('POP-')) {
          const num = parseInt(p.codigo.replace('POP-', ''), 10)
          if (!isNaN(num) && num > maxNum) maxNum = num
        }
      })
      const nextCode = `POP-${String(maxNum + 1).padStart(3, '0')}`
      setForm((prev) => ({ ...prev, codigo: nextCode }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('procedures', () => {
    loadData()
  })

  const handleCreateProcedure = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const created = await createProcedure({
        codigo: form.codigo,
        nome: form.nome,
        categoria: form.categoria,
        frequencia: form.frequencia,
        responsavel: form.responsavel,
        status: form.status,
        area_etapa: form.area_etapa,
        objetivo: form.objetivo,
        perigos_relacionados: form.perigos_relacionados,
        medidas_preventivas: form.medidas_preventivas,
        referencia_in: form.referencia_in,
        data_revisao: new Date().toISOString(),
        validade: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
      toast({
        title: 'Procedimento criado',
        description: `${created.codigo} cadastrado com sucesso.`,
      })
      setOpenNewModal(false)
      navigate(`/procedimentos/${created.id}`)
    } catch (err: any) {
      toast({
        title: 'Erro ao criar procedimento',
        description: err.message || 'Verifique os dados.',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleApplyAppccTemplate = (principle: {
    nome: string
    desc: string
    cat: ProcedureCategory
  }) => {
    setForm((prev) => ({
      ...prev,
      nome: principle.nome,
      categoria: principle.cat,
      objetivo: principle.desc,
      perigos_relacionados:
        'Perigos biológicos, químicos e físicos conforme diretrizes do Codex Alimentarius e MAPA.',
      medidas_preventivas: 'Monitoramento contínuo em limites críticos validados.',
    }))
    setOpenAppccModal(false)
    setOpenNewModal(true)
  }

  const filteredProcedures = procedures.filter((p) => {
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory
    const matchesSearch =
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.responsavel && p.responsavel.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const appccPrinciples = [
    {
      num: 1,
      nome: 'Análise de Perigos e Avaliação de Riscos (APPCC)',
      cat: 'APPCC' as ProcedureCategory,
      desc: 'Mapeamento e classificação sistemática de perigos biológicos, químicos e físicos em todas as matérias-primas e etapas produtivas (IN 04/2007 Seção 6.1).',
    },
    {
      num: 2,
      nome: 'Determinação de Pontos Críticos de Controle (PCC)',
      cat: 'APPCC' as ProcedureCategory,
      desc: 'Aplicação da árvore decisória do APPCC para identificar as etapas essenciais de eliminação ou redução de perigos na fabricação.',
    },
    {
      num: 3,
      nome: 'Estabelecimento de Limites Críticos de Controle',
      cat: 'Qualidade' as ProcedureCategory,
      desc: 'Definição de parâmetros mensuráveis obrigatórios (Ex: Peletização 75-85°C, Umidade <= 12%, Cloro Residual 0.5-2.0 ppm).',
    },
    {
      num: 4,
      nome: 'Procedimentos de Monitoramento Contínuo de PCC',
      cat: 'BPF' as ProcedureCategory,
      desc: 'Sistemática de verificação programada com checklists por turno, instrumentos aferidos e apontamento em planilhas auditáveis.',
    },
    {
      num: 5,
      nome: 'Ações Corretivas para Desvios de Limites',
      cat: 'Qualidade' as ProcedureCategory,
      desc: 'Protocolo de intervenção imediata, segregação de bateladas suspeitas, investigação de causa raiz e reprocessamento controlado.',
    },
    {
      num: 6,
      nome: 'Procedimentos de Verificação e Auditoria do Sistema',
      cat: 'Qualidade' as ProcedureCategory,
      desc: 'Validação semestral com análises laboratoriais confirmatórias, calibrações de sensores e auditorias internas do TF-Autocontroles.',
    },
    {
      num: 7,
      nome: 'Documentação, Registros e Arquivamento Regulatório',
      cat: 'BPF' as ProcedureCategory,
      desc: 'Rastreabilidade integral documental mantida por período mínimo de 2 anos conforme exigido pelo artigo 8º da IN 04/2007.',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Procedimentos Operacionais Padrão (POPs)
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Gestão dos 9 POPs obrigatórios e requisitos do Sistema APPCC conforme a IN 04/2007 do
            MAPA
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setOpenAppccModal(true)}
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs gap-1.5 h-9"
          >
            <BookOpen className="h-4 w-4" />
            Modelo APPCC (7 Princípios)
          </Button>

          <Button
            onClick={() => setOpenNewModal(true)}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Procedimento
          </Button>
        </div>
      </div>

      {/* 2. Filter Bar & Search */}
      <div className="agro-card p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, título ou responsável..."
            className="pl-9 h-9 text-xs border-[#E2DCCF]"
          />
        </div>

        {/* Horizontal pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-stone-500 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="h-3 w-3" /> Categorias:
          </span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? 'bg-[#D9A404] text-[#1B4332] shadow-xs'
                    : 'bg-white text-stone-600 border border-[#E2DCCF] hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Procedures Table */}
      <div className="agro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="agro-table-header">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Nome do Procedimento</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Assinatura RT / RE</th>
                <th className="py-3 px-4">Responsável</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Última Revisão</th>
                <th className="py-3 px-4 text-right">Ações / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Carregando procedimentos cadastrados...
                  </td>
                </tr>
              ) : filteredProcedures.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Nenhum procedimento encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredProcedures.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/procedimentos/${p.id}`)}
                    className="hover:bg-[#FAF7EF] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-bold text-[#2D6A4F] whitespace-nowrap">
                      {p.codigo}
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900 max-w-[280px]">{p.nome}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className="bg-emerald-50 text-[#2D6A4F] border border-emerald-200 font-semibold"
                      >
                        {p.categoria}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.assinaturas_pop?.rt && p.assinaturas_pop?.re ? (
                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Assinado RT & RE
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                        >
                          <Clock className="h-3 w-3" />
                          {p.assinaturas_pop?.rt
                            ? 'Falta RE'
                            : p.assinaturas_pop?.re
                              ? 'Falta RT'
                              : 'Pendente RT/RE'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-700 max-w-[160px] truncate">
                      {p.responsavel || 'Hélio - RT'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        className={
                          p.status === 'Ativo'
                            ? 'bg-[#2E8B57] text-white'
                            : p.status === 'Revisão'
                              ? 'bg-[#D9A404] text-[#1B4332]'
                              : 'bg-stone-300 text-stone-700'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {p.data_revisao
                        ? new Date(p.data_revisao).toLocaleDateString('pt-BR')
                        : 'Recente'}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPopForPdf(p)
                            setOpenPdfModal(true)
                          }}
                          className="text-[#2D6A4F] border-[#2D6A4F]/40 hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold gap-1"
                        >
                          <Printer className="h-3.5 w-3.5" /> PDF / Assinar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#2D6A4F] hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold"
                        >
                          Detalhe <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POP DOCUMENT PDF & ASSINATURA MODAL */}
      {selectedPopForPdf && (
        <PopDocumentPdfModal
          open={openPdfModal}
          onOpenChange={setOpenPdfModal}
          procedure={selectedPopForPdf}
          company={company}
          onSignatureSaved={loadData}
        />
      )}

      {/* MODAL: NOVO PROCEDIMENTO */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-[600px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-[#D9A404]" />
              Cadastrar Novo Procedimento (POP)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Estruturado conforme os 9 POPs obrigatórios da IN 04/2007 e Boas Práticas
              Agroindustriais.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProcedure} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Código</Label>
                <Input
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  placeholder="POP-010"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Nome do Procedimento</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Controle de Resíduos Sólidos"
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Categoria</Label>
                <Select
                  value={form.categoria}
                  onValueChange={(val: any) => setForm({ ...form, categoria: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((c) => c !== 'Todos')
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Frequência</Label>
                <Select
                  value={form.frequencia}
                  onValueChange={(val: any) => setForm({ ...form, frequencia: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contínuo">Contínuo</SelectItem>
                    <SelectItem value="Diário">Diário</SelectItem>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Por lote">Por lote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Responsável</Label>
                <Input
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  placeholder="Nome do Responsável Técnico"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Área / Etapa</Label>
                <Input
                  value={form.area_etapa}
                  onChange={(e) => setForm({ ...form, area_etapa: e.target.value })}
                  placeholder="Ex: Moagem e Misturadores"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Objetivo do POP</Label>
              <Textarea
                rows={2}
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                placeholder="Descreva o propósito operacional e sanitário..."
                className="text-xs resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold"
              >
                {formLoading ? 'Salvando...' : 'Salvar e Abrir Detalhe'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: MODELO APPCC (7 PRINCÍPIOS) */}
      <Dialog open={openAppccModal} onOpenChange={setOpenAppccModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#D9A404]" />
              Os 7 Princípios do Sistema APPCC (Alimentação Animal)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Mapeamento integrado com a IN 04/2007 (MAPA). Selecione um princípio para gerar um
              novo procedimento padrão estruturado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            {appccPrinciples.map((p) => (
              <div
                key={p.num}
                className="p-3.5 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] hover:border-[#2D6A4F] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#2D6A4F] text-white text-[11px] font-bold flex items-center justify-center">
                      {p.num}
                    </span>
                    <h3 className="text-xs font-bold text-[#2D6A4F]">{p.nome}</h3>
                    <Badge variant="outline" className="text-[10px] bg-white border-emerald-300">
                      {p.cat}
                    </Badge>
                  </div>
                  <p className="text-xs text-stone-600 pl-7">{p.desc}</p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleApplyAppccTemplate(p)}
                  className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs shrink-0 self-start sm:self-center"
                >
                  Criar a partir deste modelo
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenAppccModal(false)}
              className="border-stone-300 text-stone-700"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
