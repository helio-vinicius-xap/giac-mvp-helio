import React, { useState, useMemo } from 'react'
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertOctagon,
  RotateCcw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building,
  Filter,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatarCNPJ } from '@/lib/pop01Validators'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import type {
  FornecedorItem,
  QualificacaoItem,
  DevolucaoItem,
  NaoConformidadeFornecedorItem,
} from '@/types/paaso'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts'

import { Globe2 } from 'lucide-react'
import type { FornecedorValidadoItem } from '@/types/paaso'

interface PainelIndicadoresViewProps {
  fornecedores: FornecedorItem[]
  qualificacoes: QualificacaoItem[]
  devolucoes: DevolucaoItem[]
  ncs: NaoConformidadeFornecedorItem[]
  validados?: FornecedorValidadoItem[]
  onAbrirRevalidacao?: (fornecedor: FornecedorItem) => void
}

const CORES_STATUS_QUALIFICACAO = {
  APROVADO: '#10B981', // Verde esmeralda
  APROVADO_COM_RESSALVA: '#F59E0B', // Âmbar
  REPROVADO: '#EF4444', // Vermelho
  PENDENTE_REVISAO: '#6B7280', // Cinza
}

export function PainelIndicadoresView({
  fornecedores,
  qualificacoes,
  devolucoes,
  ncs,
  validados = [],
  onAbrirRevalidacao,
}: PainelIndicadoresViewProps) {
  // Filtros do Painel
  const [filtroUf, setFiltroUf] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Map de Razão Social do fornecedor
  const fornecedoresMap = useMemo(() => {
    const map = new Map<string, FornecedorItem>()
    for (const f of fornecedores) {
      map.set(normalizarCNPJ(f.cnpj), f)
    }
    return map
  }, [fornecedores])

  // UFs disponíveis
  const ufsDisponiveis = useMemo(() => {
    return Array.from(new Set(fornecedores.map((f) => f.uf).filter(Boolean))).sort()
  }, [fornecedores])

  // 1. Filtragem das Coleções pelos Filtros Ativos
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores.filter((f) => {
      if (filtroUf && f.uf?.toUpperCase() !== filtroUf.toUpperCase()) return false
      return true
    })
  }, [fornecedores, filtroUf])

  const devolucoesFiltradas = useMemo(() => {
    return devolucoes.filter((d) => {
      if (dataInicio && d.data < dataInicio) return false
      if (dataFim && d.data > dataFim) return false
      if (filtroUf) {
        const forn = fornecedoresMap.get(normalizarCNPJ(d.fornecedor_cnpj))
        if (forn?.uf?.toUpperCase() !== filtroUf.toUpperCase()) return false
      }
      return true
    })
  }, [devolucoes, dataInicio, dataFim, filtroUf, fornecedoresMap])

  const ncsFiltradas = useMemo(() => {
    return ncs.filter((n) => {
      if (dataInicio && n.data < dataInicio) return false
      if (dataFim && n.data > dataFim) return false
      if (filtroUf) {
        const forn = fornecedoresMap.get(normalizarCNPJ(n.fornecedor_cnpj))
        if (forn?.uf?.toUpperCase() !== filtroUf.toUpperCase()) return false
      }
      return true
    })
  }, [ncs, dataInicio, dataFim, filtroUf, fornecedoresMap])

  // Indexar a última qualificação de cada fornecedor
  const ultimasQualificacoes = useMemo(() => {
    const map = new Map<string, QualificacaoItem>()
    for (const q of qualificacoes) {
      const cnpj = normalizarCNPJ(q.fornecedor_cnpj)
      if (!map.has(cnpj)) {
        map.set(cnpj, q)
      }
    }
    return map
  }, [qualificacoes])

  // 2. Cálculos dos Cards de Topo
  const totalFornecedores = fornecedoresFiltrados.length

  let totalVigentes = 0
  let totalVencidas = 0
  let totalReprovadas = 0

  for (const f of fornecedoresFiltrados) {
    const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))
    if (q) {
      if (q.status_vigencia === 'VENCIDA') {
        totalVencidas++
      } else {
        totalVigentes++
      }
      if (q.resultado === 'REPROVADO') {
        totalReprovadas++
      }
    }
  }

  const totalNcsAbertas = ncsFiltradas.filter(
    (n) => n.status === 'ABERTA' || n.status === 'EM_TRATAMENTO',
  ).length
  const totalDevolucoesPeriodo = devolucoesFiltradas.length

  // Métricas do Banco Compartilhado de Fornecedores Validados
  const hojeStr = new Date().toISOString().split('T')[0]
  const metricasValidados = useMemo(() => {
    const totalGlobal = validados.length
    const ativos = validados.filter((v) => v.status === 'VALIDADO').length
    const expirados = validados.filter((v) => v.status === 'EXPIRADO').length

    // Fornecedores da organização atual que já constam no banco compartilhado
    const cnpjsValidadosSet = new Set(validados.map((v) => normalizarCNPJ(v.cnpj)))
    const locaisDoBanco = fornecedores.filter((f) =>
      cnpjsValidadosSet.has(normalizarCNPJ(f.cnpj)),
    ).length

    const percLocaisDoBanco =
      fornecedores.length > 0 ? Math.round((locaisDoBanco / fornecedores.length) * 100) : 0

    return {
      totalGlobal,
      ativos,
      expirados,
      locaisDoBanco,
      percLocaisDoBanco,
    }
  }, [validados, fornecedores])

  // Fornecedores a revalidar em ≤ 60 dias ou já expirados
  const fornecedoresParaRevalidar = useMemo(() => {
    return fornecedores
      .filter((f) => {
        const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))
        if (!q?.validade) return false
        const valOnly = q.validade.split('T')[0]
        const diffMs = new Date(valOnly).getTime() - new Date(hojeStr).getTime()
        const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
        return dias <= 60
      })
      .map((f) => {
        const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))!
        const valOnly = q.validade.split('T')[0]
        const diffMs = new Date(valOnly).getTime() - new Date(hojeStr).getTime()
        const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
        return {
          fornecedor: f,
          qualif: q,
          diasRestantes: dias,
          isExpirado: dias <= 0 || q.status_vigencia === 'VENCIDA',
        }
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  }, [fornecedores, ultimasQualificacoes, hojeStr])

  // 3. Gráfico Donut: Status das Qualificações
  const dadosDonut = useMemo(() => {
    let aprovados = 0
    let ressalvas = 0
    let reprovados = 0
    let pendentes = 0

    for (const f of fornecedoresFiltrados) {
      const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))
      if (!q || q.resultado === 'PENDENTE_REVISAO') {
        pendentes++
      } else if (q.resultado === 'APROVADO') {
        aprovados++
      } else if (q.resultado === 'APROVADO_COM_RESSALVA') {
        ressalvas++
      } else if (q.resultado === 'REPROVADO') {
        reprovados++
      }
    }

    return [
      { name: 'Aprovados', value: aprovados, color: CORES_STATUS_QUALIFICACAO.APROVADO },
      {
        name: 'Com Ressalva',
        value: ressalvas,
        color: CORES_STATUS_QUALIFICACAO.APROVADO_COM_RESSALVA,
      },
      { name: 'Reprovados', value: reprovados, color: CORES_STATUS_QUALIFICACAO.REPROVADO },
      {
        name: 'Pendente Revisão',
        value: pendentes,
        color: CORES_STATUS_QUALIFICACAO.PENDENTE_REVISAO,
      },
    ].filter((d) => d.value > 0)
  }, [fornecedoresFiltrados, ultimasQualificacoes])

  // 4. Gráfico Barras: Fornecedores por UF
  const dadosBarrasUf = useMemo(() => {
    const contagemPorUf: { [uf: string]: number } = {}
    for (const f of fornecedoresFiltrados) {
      const uf = f.uf?.toUpperCase() || 'S/ UF'
      contagemPorUf[uf] = (contagemPorUf[uf] || 0) + 1
    }
    return Object.entries(contagemPorUf)
      .map(([uf, total]) => ({ uf, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [fornecedoresFiltrados])

  // 5. Gráfico Barras: Fornecedores por Categoria Declarada
  const dadosBarrasCategoria = useMemo(() => {
    const contagem: { [cat: string]: number } = {
      fabricante: 0,
      fracionador: 0,
      importador: 0,
      armazenador: 0,
    }

    for (const f of fornecedoresFiltrados) {
      const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))
      const cat = q?.dados_declarados?.categoria?.toLowerCase() || 'fabricante'
      if (contagem[cat] !== undefined) {
        contagem[cat]++
      } else {
        contagem[cat] = 1
      }
    }

    return Object.entries(contagem).map(([categoria, total]) => ({
      categoria: categoria.charAt(0).toUpperCase() + categoria.slice(1),
      total,
    }))
  }, [fornecedoresFiltrados, ultimasQualificacoes])

  // 6. Gráfico de Linha: Evolução Mensal (Últimos 12 meses) de Devoluções e NCs
  const dadosEvolucaoMensal = useMemo(() => {
    const mesesMap: { [mes: string]: { mes: string; devolucoes: number; ncs: number } } = {}

    // Inicializar os últimos 12 meses
    const hoje = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      mesesMap[key] = { mes: label, devolucoes: 0, ncs: 0 }
    }

    for (const d of devolucoesFiltradas) {
      const mesKey = d.data.slice(0, 7)
      if (mesesMap[mesKey]) {
        mesesMap[mesKey].devolucoes++
      }
    }

    for (const n of ncsFiltradas) {
      const mesKey = n.data.slice(0, 7)
      if (mesesMap[mesKey]) {
        mesesMap[mesKey].ncs++
      }
    }

    return Object.values(mesesMap)
  }, [devolucoesFiltradas, ncsFiltradas])

  // 7. Top 5 Fornecedores por Devoluções
  const topDevolucoes = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of devolucoesFiltradas) {
      const cnpj = normalizarCNPJ(d.fornecedor_cnpj)
      map.set(cnpj, (map.get(cnpj) || 0) + 1)
    }

    return Array.from(map.entries())
      .map(([cnpj, total]) => {
        const forn = fornecedoresMap.get(cnpj)
        return {
          nome: forn ? forn.razao_social.slice(0, 20) : formatarCNPJ(cnpj),
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [devolucoesFiltradas, fornecedoresMap])

  // 8. Top 5 Fornecedores por NCs Abertas
  const topNcs = useMemo(() => {
    const map = new Map<string, number>()
    for (const n of ncsFiltradas) {
      if (n.status === 'ABERTA' || n.status === 'EM_TRATAMENTO') {
        const cnpj = normalizarCNPJ(n.fornecedor_cnpj)
        map.set(cnpj, (map.get(cnpj) || 0) + 1)
      }
    }

    return Array.from(map.entries())
      .map(([cnpj, total]) => {
        const forn = fornecedoresMap.get(cnpj)
        return {
          nome: forn ? forn.razao_social.slice(0, 20) : formatarCNPJ(cnpj),
          total,
        }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [ncsFiltradas, fornecedoresMap])

  // 9. Tabelas de Atenção: Qualificações Vencidas & NCs com Prazo Estourado
  const fornecedoresVencidos = useMemo(() => {
    const list: { fornecedor: FornecedorItem; qualif: QualificacaoItem }[] = []
    for (const f of fornecedoresFiltrados) {
      const q = ultimasQualificacoes.get(normalizarCNPJ(f.cnpj))
      if (q && q.status_vigencia === 'VENCIDA') {
        list.push({ fornecedor: f, qualif: q })
      }
    }
    return list
  }, [fornecedoresFiltrados, ultimasQualificacoes])

  const ncsEstouradas = useMemo(() => {
    return ncsFiltradas.filter((n) => n.estourado)
  }, [ncsFiltradas])

  return (
    <div className="space-y-6">
      {/* 1. Header do Painel com Filtros */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
              Painel de Indicadores de Qualificação & Desempenho
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Métricas em tempo real calculadas a partir dos cadastros, auditorias SIPEAGRO,
            ocorrências de não conformidade e devoluções registradas.
          </p>
        </div>

        {/* Filtros em Linha */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-stone-600 bg-[#FAF7EF] px-2.5 py-1.5 rounded-lg border border-[#E2DCCF]">
            <Filter className="h-3.5 w-3.5 text-[#D9A404]" />
            <span className="font-semibold text-stone-700">Filtros:</span>
          </div>

          {ufsDisponiveis.length > 0 && (
            <select
              value={filtroUf}
              onChange={(e) => setFiltroUf(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todas as UFs</option>
              {ufsDisponiveis.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="h-8 text-xs w-[125px] bg-[#FAF7EF]"
              title="Data inicial"
            />
            <span className="text-stone-400">até</span>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="h-8 text-xs w-[125px] bg-[#FAF7EF]"
              title="Data final"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO / CARDS DE REVALIDAÇÃO OBRIGATÓRIA (≤ 60 DIAS E EXPIRADOS) */}
      {fornecedoresParaRevalidar.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900">
              <Clock className="h-5 w-5 text-[#D9A404] shrink-0" />
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                  Fornecedores a Revalidar (Validade Anual em Alerta ou Vencida)
                </h3>
                <p className="text-xs text-stone-600">
                  Todo fornecedor deve ser revalidado em 1 ano. Em amarelo os que vencem em ≤ 60
                  dias e em vermelho os já expirados.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
              {fornecedoresParaRevalidar.length} para revalidação
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {fornecedoresParaRevalidar
              .slice(0, 6)
              .map(({ fornecedor, qualif, diasRestantes, isExpirado }) => (
                <div
                  key={fornecedor.cnpj}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-2 bg-white ${
                    isExpirado ? 'border-red-300 shadow-xs' : 'border-amber-300 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="font-bold text-xs text-[#1B4332] truncate"
                        title={fornecedor.razao_social}
                      >
                        {fornecedor.razao_social}
                      </span>
                      {isExpirado ? (
                        <Badge className="bg-red-700 text-white text-[9px] shrink-0">
                          EXPIRADO
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white text-[9px] shrink-0">
                          VENCE EM {diasRestantes}D
                        </Badge>
                      )}
                    </div>
                    <p className="font-mono text-[10px] text-stone-500 mt-0.5">
                      {formatarCNPJ(fornecedor.cnpj)} • {fornecedor.uf || 'UF'}
                    </p>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Validade: {new Date(qualif.validade).toLocaleDateString('pt-BR')} • Score:{' '}
                      {qualif.score} pts
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500">
                      Status: {qualif.resultado.replace(/_/g, ' ')}
                    </span>
                    {onAbrirRevalidacao && (
                      <button
                        type="button"
                        onClick={() => onAbrirRevalidacao(fornecedor)}
                        className="text-[11px] font-bold text-[#2D6A4F] hover:text-[#1B4332] hover:underline"
                      >
                        Revalidar agora →
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2. Cards de Topo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Fornecedores</span>
            <Users className="h-4 w-4 text-[#2D6A4F]" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-[#1B4332]">{totalFornecedores}</p>
          <span className="text-[10px] text-stone-500 block">Cadastrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vigentes</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-emerald-700">{totalVigentes}</p>
          <span className="text-[10px] text-stone-500 block">Dentro do prazo</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Vencidas</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-amber-700">{totalVencidas}</p>
          <span className="text-[10px] text-stone-500 block">&gt; 12 meses</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Reprovadas</span>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-red-700">{totalReprovadas}</p>
          <span className="text-[10px] text-stone-500 block">Desconformes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-orange-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">NCs Abertas</span>
            <AlertOctagon className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-orange-700">{totalNcsAbertas}</p>
          <span className="text-[10px] text-stone-500 block">Em tratamento</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">Devoluções</span>
            <RotateCcw className="h-4 w-4 text-[#D9A404]" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-stone-800">
            {totalDevolucoesPeriodo}
          </p>
          <span className="text-[10px] text-stone-500 block">No período</span>
        </div>
      </div>

      {/* BANNER / CARDS: BANCO COMPARTILHADO DE FORNECEDORES VALIDADOS */}
      <div className="bg-gradient-to-r from-[#1B4332]/10 via-[#2D6A4F]/10 to-[#FAF7EF] p-5 rounded-2xl border border-[#2D6A4F]/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-[#2D6A4F]" />
            <div>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                Indicadores do Banco Compartilhado (Fornecedores Validados do Sistema)
              </h3>
              <p className="text-xs text-stone-600">
                Informações agregadas da base global de referência homologada no ecossistema GIAC.
              </p>
            </div>
          </div>
          <Badge className="bg-[#2D6A4F] text-white text-xs w-fit">Rede Colaborativa</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-white p-3.5 rounded-xl border border-[#E2DCCF]">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">
              Validados Ativos (Global)
            </span>
            <span className="text-xl font-black font-['Sora'] text-[#2D6A4F] block mt-1">
              {metricasValidados.ativos}
            </span>
            <span className="text-[10px] text-stone-500">Vigência &lt; 1 ano</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E2DCCF]">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">
              Aprovações Expiradas
            </span>
            <span className="text-xl font-black font-['Sora'] text-red-700 block mt-1">
              {metricasValidados.expirados}
            </span>
            <span className="text-[10px] text-stone-500">&gt; 1 ano sem revalidação</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E2DCCF]">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">
              Adoção Local
            </span>
            <span className="text-xl font-black font-['Sora'] text-stone-900 block mt-1">
              {metricasValidados.locaisDoBanco}
            </span>
            <span className="text-[10px] text-stone-500">fornecedores na sua fábrica</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E2DCCF]">
            <span className="text-[10px] font-bold text-stone-500 uppercase block">
              % Vinda do Banco Global
            </span>
            <span className="text-xl font-black font-['Sora'] text-[#D9A404] block mt-1">
              {metricasValidados.percLocaisDoBanco}%
            </span>
            <span className="text-[10px] text-stone-500">do total de fornecedores locais</span>
          </div>
        </div>
      </div>

      {/* 3. Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico Donut de Status das Qualificações */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
            Distribuição de Status das Qualificações
          </h3>
          <div className="h-[230px] w-full flex items-center justify-center">
            {dadosDonut.length === 0 ? (
              <p className="text-xs text-stone-400">Sem dados de qualificações.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {dadosDonut.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} fornecedores`, name]}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[11px] text-stone-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico de Linha: Evolução Mensal */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
            Evolução Mensal: Devoluções vs Não Conformidades (12 Meses)
          </h3>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dadosEvolucaoMensal}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  formatter={(val) => (
                    <span className="text-[11px] text-stone-700 capitalize">{val}</span>
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="devolucoes"
                  name="Devoluções"
                  stroke="#D9A404"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="ncs"
                  name="Não Conformidades"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Barras Secundárias: Fornecedores por UF e Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fornecedores por UF */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
            Concentração de Fornecedores por Estado (Top UFs)
          </h3>
          <div className="h-[200px] w-full">
            {dadosBarrasUf.length === 0 ? (
              <p className="text-xs text-stone-400 py-12 text-center">Nenhum dado por estado.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosBarrasUf}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="uf" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Bar dataKey="total" name="Fornecedores" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fornecedores por Categoria */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
            Fornecedores por Categoria de Estabelecimento
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dadosBarrasCategoria}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="categoria" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="total" name="Fornecedores" fill="#D9A404" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Tabelas de Atenção e Top 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabela de Atenção 1: Qualificações Vencidas */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-['Sora']">
              Atenção: Qualificações Vencidas ({fornecedoresVencidos.length})
            </h3>
          </div>

          <div className="overflow-x-auto max-h-[220px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase text-[9px] bg-[#FAF7EF]">
                  <th className="py-2 px-2.5">Fornecedor</th>
                  <th className="py-2 px-2.5">CNPJ</th>
                  <th className="py-2 px-2.5">Validade Expirada</th>
                  <th className="py-2 px-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {fornecedoresVencidos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-500 text-[11px]">
                      Nenhuma qualificação com prazo de vigência vencido.
                    </td>
                  </tr>
                ) : (
                  fornecedoresVencidos.map(({ fornecedor, qualif }) => (
                    <tr key={fornecedor.cnpj} className="hover:bg-amber-50/40">
                      <td className="py-2 px-2.5 font-semibold text-stone-900 max-w-[160px] truncate">
                        {fornecedor.razao_social}
                      </td>
                      <td className="py-2 px-2.5 font-mono text-[10px] text-stone-600">
                        {formatarCNPJ(fornecedor.cnpj)}
                      </td>
                      <td className="py-2 px-2.5 text-red-700 font-bold text-[11px]">
                        {new Date(qualif.validade).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        {onAbrirRevalidacao ? (
                          <button
                            type="button"
                            onClick={() => onAbrirRevalidacao(fornecedor)}
                            className="text-[10px] font-bold text-red-700 hover:underline"
                          >
                            Revalidar →
                          </button>
                        ) : (
                          <Badge className="bg-red-700 text-white text-[9px]">Requalificar</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Atenção 2: Não Conformidades com Prazo Estourado */}
        <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-['Sora']">
              Atenção: NCs com Prazo Estourado ({ncsEstouradas.length})
            </h3>
          </div>

          <div className="overflow-x-auto max-h-[220px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase text-[9px] bg-[#FAF7EF]">
                  <th className="py-2 px-2.5">Fornecedor</th>
                  <th className="py-2 px-2.5">Descrição</th>
                  <th className="py-2 px-2.5">Prazo Limite</th>
                  <th className="py-2 px-2.5 text-right">Severidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {ncsEstouradas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-stone-500 text-[11px]">
                      Nenhuma não conformidade com prazo de tratamento estourado.
                    </td>
                  </tr>
                ) : (
                  ncsEstouradas.map((n) => {
                    const forn = fornecedoresMap.get(normalizarCNPJ(n.fornecedor_cnpj))
                    return (
                      <tr key={n.id} className="hover:bg-red-50/50">
                        <td className="py-2 px-2.5 font-semibold text-stone-900 max-w-[140px] truncate">
                          {forn?.razao_social || formatarCNPJ(n.fornecedor_cnpj)}
                        </td>
                        <td
                          className="py-2 px-2.5 text-stone-700 max-w-[160px] truncate"
                          title={n.descricao}
                        >
                          {n.descricao}
                        </td>
                        <td className="py-2 px-2.5 text-red-700 font-bold text-[11px]">
                          {n.prazo ? new Date(n.prazo).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-2 px-2.5 text-right">
                          <Badge className="bg-red-800 text-white text-[9px]">{n.severidade}</Badge>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
