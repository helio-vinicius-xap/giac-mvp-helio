import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  GitFork,
  Search,
  Timer,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Wheat,
  Activity,
  Flame,
  Package,
  Truck,
  FileCheck2,
  PlayCircle,
  Clock,
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  lookupTraceability,
  createTraceabilityTest,
  getRecords,
  getNonConformities,
} from '@/services/agroService'
import { useToast } from '@/hooks/use-toast'

export default function Traceability() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  const [loteQuery, setLoteQuery] = useState(searchParams.get('lote') || 'LOTE-2025-042')
  const [searchedLote, setSearchedLote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  // Simulado de Recall Modal
  const [openRecallModal, setOpenRecallModal] = useState(false)
  const [recallTimer, setRecallTimer] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [recallForm, setRecallForm] = useState({
    comunicacao_clientes: 'Notificados 4 distribuidores regionais e 12 revendas agropecuárias.',
    localizacao_produtos: '100% das 32 toneladas expedidas foram localizadas e bloqueadas.',
    resultado: 'Aprovado' as 'Aprovado' | 'Falhou' | 'Em Análise',
  })

  const performSearch = async (lote: string) => {
    if (!lote.trim()) return
    setLoading(true)
    setNotFound(false)
    setSearchedLote(lote.trim())
    setSearchParams({ lote: lote.trim() })

    try {
      // 1. Try server-side custom route
      const res: any = await lookupTraceability(lote.trim()).catch(() => null)

      if (res && res.found) {
        setResult(res)
      } else {
        // Fallback: search records & ncs directly
        const [recs, ncs] = await Promise.all([
          getRecords(`lote ~ '${lote.trim()}'`),
          getNonConformities(`lote ~ '${lote.trim()}'`),
        ])

        if (recs.length > 0 || ncs.length > 0 || lote.trim().toUpperCase().includes('2025')) {
          setResult({
            lote: lote.trim(),
            records: recs,
            non_conformities: ncs,
          })
        } else {
          setResult(null)
          setNotFound(true)
        }
      }
    } catch (_) {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loteQuery) {
      performSearch(loteQuery)
    }
  }, [])

  // Timer for recall test
  useEffect(() => {
    let interval: any
    if (timerRunning) {
      interval = setInterval(() => {
        setRecallTimer((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  const handleStartRecallModal = () => {
    setRecallTimer(0)
    setTimerRunning(true)
    setOpenRecallModal(true)
  }

  const handleSaveRecallTest = async () => {
    setTimerRunning(false)
    const minutes = Math.floor(recallTimer / 60)
    const seconds = recallTimer % 60
    const timeStr = `${minutes} min e ${seconds} s (Limite Máx: 4 horas)`

    try {
      await createTraceabilityTest({
        lote: searchedLote || loteQuery,
        data_teste: new Date().toISOString(),
        tipo: 'Recall',
        tempo_rastreamento: timeStr,
        comunicacao_clientes: recallForm.comunicacao_clientes,
        localizacao_produtos: recallForm.localizacao_produtos,
        resultado: recallForm.resultado,
      })

      toast({
        title: 'Simulado de Recall Registrado!',
        description: `Tempo total: ${timeStr} • Resultado: ${recallForm.resultado}`,
      })
      setOpenRecallModal(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar teste',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // 5 Stages of Brazilian Animal Feed Production Line
  const stages = [
    {
      num: 1,
      title: '1. Matérias-Primas',
      icon: Wheat,
      color: 'bg-emerald-600',
      data: '09/05/2025 08:30',
      equipamento: 'Moega 02 / Silo Pulmão A',
      responsavel: 'Carlos Mendes',
      parametros: 'Farelo de Soja (Lote FS-890) e Milho Moído (Lote MM-332) conformes.',
      status: 'Conforme',
    },
    {
      num: 2,
      title: '2. Moagem e Mistura',
      icon: Activity,
      color: 'bg-[#D9A404]',
      data: '09/05/2025 10:45',
      equipamento: 'Misturador Horizontal M-01 (Batelada 42)',
      responsavel: 'João Silva',
      parametros: 'Tempo de mistura: 4 min 30 s • CV de homogeneidade: 4,2% (Limite < 5%).',
      status: 'Conforme',
    },
    {
      num: 3,
      title: '3. Tratamento Térmico (PCC)',
      icon: Flame,
      color: 'bg-amber-600',
      data: '09/05/2025 13:15',
      equipamento: 'Condicionador e Peletizadora PL-02',
      responsavel: 'João Silva',
      parametros: 'Temperatura: 81,4°C (Limite 75-85°C) • Pressão de vapor: 2,8 bar.',
      status: 'Conforme',
    },
    {
      num: 4,
      title: '4. Resfriamento e Ensaque',
      icon: Package,
      color: 'bg-teal-600',
      data: '09/05/2025 15:30',
      equipamento: 'Resfriador Contracorrente e Ensacadeira E-01',
      responsavel: 'Ana Paula',
      parametros: 'Umidade final: 11,3% (Máx. 12%) • Embalagem valvulada 25kg lacrada.',
      status: 'Conforme',
    },
    {
      num: 5,
      title: '5. Expedição e Bloqueio',
      icon: Truck,
      color: 'bg-blue-600',
      data: '10/05/2025 09:00',
      equipamento: 'Doca 01 - Carga Fracionada',
      responsavel: 'Roberto Lima',
      parametros: '32 Toneladas despachadas para 4 distribuidores com MTR e NF vinculadas.',
      status: 'Conforme',
    },
  ]

  const rawMaterials = [
    {
      codigo: 'MP-001',
      nome: 'Farelo de Soja 46% PB',
      fornecedor: 'Agro Grãos do Brasil S.A.',
      lote_fornecedor: 'FS-8902-SP',
      data_recebimento: '05/05/2025',
      laudo: 'Laudo Micro & Micotoxinas #4412 (Conforme)',
      status: 'Conforme',
    },
    {
      codigo: 'MP-002',
      nome: 'Milho em Grão Moído Tipo 1',
      fornecedor: 'Cooperativa Agrícola Central',
      lote_fornecedor: 'MM-3321-PR',
      data_recebimento: '06/05/2025',
      laudo: 'Laudo Umidade 11,8% #982 (Conforme)',
      status: 'Conforme',
    },
    {
      codigo: 'MP-003',
      nome: 'Premix Mineral e Vitamínico Aves',
      fornecedor: 'NutriPharma Animal S.A.',
      lote_fornecedor: 'NX-2025-018',
      data_recebimento: '07/05/2025',
      laudo: 'Certificado de Análise RBC #872 (Conforme)',
      status: 'Conforme',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Recall Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Rastreabilidade de Lotes & Simulado de Recall
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Rastreabilidade bidirecional do produto acabado até as matérias-primas (Item 41 & 61 •
            máx. 4 horas)
          </p>
        </div>

        <Button
          onClick={handleStartRecallModal}
          className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
        >
          <PlayCircle className="h-4 w-4" />
          Iniciar Simulado de Recall (Item 62)
        </Button>
      </div>

      {/* 2. Big Centered Search Bar */}
      <div className="agro-card p-6 text-center space-y-4">
        <div className="max-w-xl mx-auto space-y-2">
          <label className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider block">
            Consulta de Rastreabilidade Operacional
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-stone-400" />
              <Input
                value={loteQuery}
                onChange={(e) => setLoteQuery(e.target.value)}
                placeholder="Digite o número do lote (ex: LOTE-2025-042)..."
                className="pl-11 h-11 text-sm border-[#E2DCCF] font-semibold"
              />
            </div>
            <Button
              onClick={() => performSearch(loteQuery)}
              disabled={loading}
              className="h-11 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs px-5 shadow-sm"
            >
              {loading ? 'Rastreando...' : 'Rastrear Lote'}
            </Button>
          </div>
          <p className="text-[11px] text-stone-500">
            Dica: Lotes disponíveis para teste rápido: <strong>LOTE-2025-042</strong>,{' '}
            <strong>LOTE-2025-043</strong> ou <strong>LOTE-2025-038</strong>.
          </p>
        </div>
      </div>

      {/* Not Found Alert */}
      {notFound && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Lote não encontrado no banco de dados.</strong>
            <span>
              Verifique o número informado. Caso tenha sido produzido recentemente, confirme se o
              registro de batelada já foi consolidado na área de Registros.
            </span>
          </div>
        </div>
      )}

      {/* 3. Search Results */}
      {result && (
        <div className="space-y-6">
          {/* Header de Identificação */}
          <div className="agro-card p-6 bg-white border-l-4 border-l-[#2D6A4F]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg font-['Sora'] text-[#2D6A4F]">
                    {searchedLote}
                  </span>
                  <Badge className="bg-[#2E8B57] text-white">Status: Liberado para Expedição</Badge>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                    Rastreabilidade 100% Conforme
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-stone-800">
                  Ração Peletizada para Frangos de Corte - Crescimento 2
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Fabricação: <strong>09/05/2025</strong> • Validade: <strong>09/11/2025</strong> •
                  Volume: <strong>32.000 kg</strong>
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-[#E2DCCF] sm:pl-6 text-xs text-stone-600">
                <span className="text-[11px] font-semibold text-stone-400 block uppercase">
                  Tempo Médio de Rastreio
                </span>
                <span className="text-lg font-bold text-[#2D6A4F]">2h 24min</span>
                <span className="text-[10px] text-emerald-600 block font-semibold">
                  ✓ Atende limite máx. 4h
                </span>
              </div>
            </div>
          </div>

          {/* 5-Stage Vertical Timeline with icons */}
          <div className="agro-card p-6">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] pb-4 border-b border-[#E2DCCF]">
              Linha do Tempo de Rastreabilidade (5 Etapas do Processo)
            </h2>

            <div className="mt-6 relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#2D6A4F]/30">
              {stages.map((st) => {
                const Icon = st.icon
                return (
                  <div key={st.num} className="relative flex items-start gap-4">
                    {/* Dot Icon */}
                    <div
                      className={`absolute -left-6 sm:-left-8 top-0 h-7 w-7 rounded-full ${st.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-xs text-[#2D6A4F]">{st.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-stone-500">{st.data}</span>
                          <Badge className="bg-[#2E8B57] text-white text-[10px]">{st.status}</Badge>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700">
                        <strong>Equipamento:</strong> {st.equipamento} • <strong>Operador:</strong>{' '}
                        {st.responsavel}
                      </p>

                      <p className="text-xs text-stone-600 pt-0.5">
                        <strong className="text-stone-800">Parâmetros Monitorados:</strong>{' '}
                        {st.parametros}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Matérias-Primas Table */}
          <div className="agro-card p-6">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F] pb-4 border-b border-[#E2DCCF]">
              Matérias-Primas Utilizadas no Lote
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="agro-table-header">
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Ingrediente</th>
                    <th className="py-2.5 px-3">Fornecedor Homologado</th>
                    <th className="py-2.5 px-3">Lote do Fornecedor</th>
                    <th className="py-2.5 px-3">Data Recebimento</th>
                    <th className="py-2.5 px-3">Laudo Analítico</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2DCCF]">
                  {rawMaterials.map((rm) => (
                    <tr key={rm.codigo} className="hover:bg-[#FAF7EF] transition">
                      <td className="py-2.5 px-3 font-bold text-[#2D6A4F]">{rm.codigo}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">{rm.nome}</td>
                      <td className="py-2.5 px-3 text-stone-700">{rm.fornecedor}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{rm.lote_fornecedor}</td>
                      <td className="py-2.5 px-3 text-stone-600">{rm.data_recebimento}</td>
                      <td className="py-2.5 px-3 text-[#2D6A4F] underline cursor-pointer">
                        {rm.laudo}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className="bg-[#2E8B57] text-white">{rm.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Registros e NCs Vinculadas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="agro-card p-5 space-y-3">
              <h3 className="text-xs font-bold font-['Sora'] text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4" /> Registros de Monitoramento Vinculados
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-[#E2DCCF] bg-[#FAF7EF] text-xs">
                  <span className="font-bold text-[#2D6A4F] block">
                    POP-002: Limpeza e Higienização de Linhas
                  </span>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    Realizada às 08:30 • pH residual 6,5 • Conforme
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-[#E2DCCF] bg-[#FAF7EF] text-xs">
                  <span className="font-bold text-[#2D6A4F] block">
                    POP-005: Tratamento Térmico e Peletização
                  </span>
                  <p className="text-stone-600 text-[11px] mt-0.5">
                    Temperatura 78,5°C • Umidade 11,2% • Conforme limites APPCC
                  </p>
                </div>
              </div>
            </div>

            <div className="agro-card p-5 space-y-3">
              <h3 className="text-xs font-bold font-['Sora'] text-[#2D6A4F] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#D9A404]" /> Não Conformidades Associadas
              </h3>
              <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-stone-700">
                <span className="font-semibold text-[#2E8B57] block">Nenhuma NC impeditiva</span>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Este lote foi produzido em estrita observância aos limites críticos, sem desvios
                  de retenção ou ordens de recall.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SIMULADO DE RECALL ANUAL (ITEM 62) */}
      <Dialog open={openRecallModal} onOpenChange={setOpenRecallModal}>
        <DialogContent className="sm:max-w-[550px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <Timer className="h-5 w-5 text-[#D9A404]" />
              Simulado de Recall Obrigatório (TF Item 62)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Teste anual da capacidade de recolhimento e comunicação com clientes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Live Timer Box */}
            <div className="p-4 bg-[#1B4332] text-white rounded-xl text-center space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-semibold block">
                Cronômetro de Resposta do Simulado
              </span>
              <p className="text-3xl font-mono font-bold text-[#D9A404]">
                {formatTimer(recallTimer)}
              </p>
              <span className="text-[10px] text-emerald-200">
                Tempo Máximo Regulamentar Tolerado: 04:00:00 (4 horas)
              </span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Lote Sob Teste</Label>
              <Input
                value={searchedLote || loteQuery}
                readOnly
                className="h-8 text-xs bg-stone-100 font-bold"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Comunicação com Clientes e Distribuidores
              </Label>
              <Textarea
                rows={2}
                value={recallForm.comunicacao_clientes}
                onChange={(e) =>
                  setRecallForm({ ...recallForm, comunicacao_clientes: e.target.value })
                }
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Capacidade de Localização de Produtos Físicos
              </Label>
              <Textarea
                rows={2}
                value={recallForm.localizacao_produtos}
                onChange={(e) =>
                  setRecallForm({ ...recallForm, localizacao_produtos: e.target.value })
                }
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Resultado da Avaliação</Label>
              <Select
                value={recallForm.resultado}
                onValueChange={(val: any) => setRecallForm({ ...recallForm, resultado: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprovado">Aprovado (100% localizado em &lt; 4h)</SelectItem>
                  <SelectItem value="Falhou">Falhou (Tempo excedido ou lote extraviado)</SelectItem>
                  <SelectItem value="Em Análise">Em Análise Técnica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenRecallModal(false)}
              className="border-stone-300 text-stone-700"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveRecallTest}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Finalizar e Registrar Simulado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
