import React, { useState, useMemo } from 'react'
import {
  Globe2,
  Search,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Tag,
  Info,
  Filter,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatarCNPJ } from '@/lib/pop01Validators'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import { useToast } from '@/hooks/use-toast'
import { importarFornecedorValidadoParaOrganizacao } from '@/services/paasoService'
import { TIPOS_PRODUTO_MAPA, type FornecedorValidadoItem, type FornecedorItem } from '@/types/paaso'

interface FornecedoresValidadosViewProps {
  validados: FornecedorValidadoItem[]
  fornecedoresLocais: FornecedorItem[]
  onDataChanged: () => void
  onAbrirQualificacao?: (fornecedor: FornecedorItem) => void
}

export function FornecedoresValidadosView({
  validados,
  fornecedoresLocais,
  onDataChanged,
  onAbrirQualificacao,
}: FornecedoresValidadosViewProps) {
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('')
  const [filtroTipoProduto, setFiltroTipoProduto] = useState<string>('')
  const [filtroUf, setFiltroUf] = useState<string>('')
  const [importandoCnpj, setImportandoCnpj] = useState<string | null>(null)

  // Map de CNPJs locais cadastrados na organização atual
  const cnpjsLocaisSet = useMemo(() => {
    const set = new Set<string>()
    for (const f of fornecedoresLocais) {
      set.add(normalizarCNPJ(f.cnpj))
    }
    return set
  }, [fornecedoresLocais])

  // UFs disponíveis na base global
  const ufsDisponiveis = useMemo(() => {
    return Array.from(new Set(validados.map((v) => v.uf).filter(Boolean))).sort()
  }, [validados])

  // Filtros aplicados
  const filtrados = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    return validados.filter((item) => {
      // Busca texto
      if (termo) {
        const matchCnpj = item.cnpj.includes(termo) || formatarCNPJ(item.cnpj).includes(termo)
        const matchRazao = item.razao_social.toLowerCase().includes(termo)
        const matchRegistro = item.registro_sipeagro?.toLowerCase().includes(termo)
        const matchMunicipio = item.municipio?.toLowerCase().includes(termo)
        if (!matchCnpj && !matchRazao && !matchRegistro && !matchMunicipio) {
          return false
        }
      }

      // Filtro Status
      if (filtroStatus && item.status !== filtroStatus) {
        return false
      }

      // Filtro Categoria
      if (filtroCategoria && item.categoria !== filtroCategoria) {
        return false
      }

      // Filtro Tipo de Produto
      if (filtroTipoProduto) {
        const tipos = item.tipos_produto || []
        if (!tipos.some((t) => t.toLowerCase().includes(filtroTipoProduto.toLowerCase()))) {
          return false
        }
      }

      // Filtro UF
      if (filtroUf && item.uf?.toUpperCase() !== filtroUf.toUpperCase()) {
        return false
      }

      return true
    })
  }, [validados, busca, filtroStatus, filtroCategoria, filtroTipoProduto, filtroUf])

  // Contadores de resumo
  const totalValidadosAtivos = validados.filter((v) => v.status === 'VALIDADO').length
  const totalExpirados = validados.filter((v) => v.status === 'EXPIRADO').length
  const totalJaUtilizados = validados.filter((v) =>
    cnpjsLocaisSet.has(normalizarCNPJ(v.cnpj)),
  ).length

  // Copiar fornecedor validado para a organização atual
  const handleUsarFornecedor = async (item: FornecedorValidadoItem) => {
    setImportandoCnpj(item.cnpj)
    try {
      const fornCriado = await importarFornecedorValidadoParaOrganizacao(item)
      toast({
        title: 'Fornecedor adicionado à sua organização',
        description: `${item.razao_social} pronto para operações e qualificação local.`,
      })
      onDataChanged()
      if (onAbrirQualificacao) {
        onAbrirQualificacao(fornCriado)
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao associar fornecedor',
        description: err.message || 'Falha ao copiar fornecedor.',
        variant: 'destructive',
      })
    } finally {
      setImportandoCnpj(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header do Banco Global Compartilhado */}
      <div className="bg-gradient-to-r from-[#173a2b] via-[#1B4332] to-[#2D6A4F] text-white p-6 rounded-2xl shadow-sm border border-[#D9A404]/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-8 pointer-events-none">
          <Globe2 className="h-56 w-56 text-[#D9A404]" />
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#D9A404] text-[#1B4332]">
              Base de Referência Compartilhada
            </span>
            <span className="text-xs text-emerald-200">
              Ecossistema GIAC • Validade de 1 Ano por Homologação
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black font-['Sora'] tracking-tight">
            Banco de Dados: Fornecedor Validado
          </h2>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-3xl">
            Repositório de inteligência compartilhada entre todas as indústrias cadastradas no
            sistema. Fornecedores aprovados com rigor técnico nas 7 verificações do MAPA ficam
            disponíveis para consulta e adoção direta. Cada aprovação possui prazo improrrogável de
            1 ano, exigindo revalidação periódica.
          </p>
        </div>
      </div>

      {/* 2. Cards de Métricas do Banco Compartilhado */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Total Homologados
            </span>
            <Globe2 className="h-4 w-4 text-[#2D6A4F]" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-[#1B4332]">{validados.length}</p>
          <span className="text-[10px] text-stone-500 block">No ecossistema</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">Validados Ativos</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-emerald-700">
            {totalValidadosAtivos}
          </p>
          <span className="text-[10px] text-stone-500 block">Aprovação vigente (≤ 1 ano)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-red-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Aprovação Expirada
            </span>
            <Clock className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-red-700">{totalExpirados}</p>
          <span className="text-[10px] text-stone-500 block">Requerem revalidação</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#D9A404]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Na Sua Fábrica</span>
            <Building2 className="h-4 w-4 text-[#D9A404]" />
          </div>
          <p className="text-2xl font-bold font-['Sora'] text-stone-900">{totalJaUtilizados}</p>
          <span className="text-[10px] text-stone-500 block">
            {validados.length > 0
              ? `${Math.round((totalJaUtilizados / validados.length) * 100)}% da base global`
              : '0%'}
          </span>
        </div>
      </div>

      {/* 3. Filtros e Busca */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#2D6A4F]" />
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              Fornecedores Validados ({filtrados.length} encontrados)
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por CNPJ, Razão ou SIPEAGRO..."
                className="h-8 text-xs pl-8 bg-[#FAF7EF]"
              />
            </div>

            {/* Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todos os Status</option>
              <option value="VALIDADO">VALIDADO (Vigente)</option>
              <option value="EXPIRADO">EXPIRADO (Vencido)</option>
            </select>

            {/* Categoria */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todas as Categorias</option>
              <option value="fabricante">Fabricante</option>
              <option value="fracionador">Fracionador</option>
              <option value="importador">Importador</option>
              <option value="armazenador">Armazenador</option>
            </select>

            {/* Tipo de Produto */}
            <select
              value={filtroTipoProduto}
              onChange={(e) => setFiltroTipoProduto(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todos os Tipos de Produto</option>
              {TIPOS_PRODUTO_MAPA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                </option>
              ))}
            </select>

            {/* UF */}
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
          </div>
        </div>

        {/* Aviso de Transparência e Compartilhamento */}
        <div className="flex items-start gap-2 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 text-xs text-amber-900">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-[#D9A404]" />
          <span>
            <strong>Informação Colaborativa do Setor:</strong> Estes fornecedores foram qualificados
            e auditados tecnicamente por empresas do ecossistema GIAC com base nas normas do
            MAPA/SIPEAGRO. Ao clicar em <em>&quot;Usar este fornecedor&quot;</em>, ele será copiado
            para sua fábrica com todos os dados prontos para homologação interna.
          </span>
        </div>

        {/* Tabela de Fornecedores Validados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Fornecedor / CNPJ</th>
                <th className="py-2.5 px-3">SIPEAGRO / Categoria</th>
                <th className="py-2.5 px-3">Classificação de Risco & Produtos</th>
                <th className="py-2.5 px-3">Status & Validade (1 Ano)</th>
                <th className="py-2.5 px-3">Origem da Aprovação</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <Globe2 className="h-8 w-8 text-stone-300 mx-auto mb-2" />
                    <p className="font-semibold text-stone-700">
                      Nenhum fornecedor validado corresponde aos critérios selecionados.
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Quando qualquer organização homologar um fornecedor no PAASO, ele aparecerá
                      aqui automaticamente.
                    </p>
                  </td>
                </tr>
              ) : (
                filtrados.map((item) => {
                  const jaUtilizado = cnpjsLocaisSet.has(normalizarCNPJ(item.cnpj))
                  const isExp = item.status === 'EXPIRADO' || (item.dias_restantes ?? 0) <= 0
                  const isAlertaAmarelo = !isExp && (item.dias_restantes ?? 0) <= 60

                  return (
                    <tr key={item.cnpj} className="hover:bg-amber-50/30 transition">
                      {/* Fornecedor / CNPJ */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#1B4332] text-xs sm:text-sm">
                          {item.razao_social}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-stone-600">
                            {formatarCNPJ(item.cnpj)}
                          </span>
                          {[item.municipio, item.uf].filter(Boolean).length > 0 && (
                            <span className="text-[10px] text-stone-400">
                              • {[item.municipio, item.uf].filter(Boolean).join('/')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SIPEAGRO / Categoria */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-semibold text-stone-800 text-[11px] block">
                          {item.registro_sipeagro || '—'}
                        </span>
                        {item.categoria && (
                          <Badge
                            variant="outline"
                            className="text-[10px] capitalize border-stone-300 text-stone-700 mt-1"
                          >
                            {item.categoria}
                          </Badge>
                        )}
                      </td>

                      {/* Risco & Tipos de Produto */}
                      <td className="py-3 px-3 max-w-[240px]">
                        {item.categoria_de_risco && (
                          <Badge
                            className={`text-[9px] font-bold block w-fit mb-1 ${
                              item.categoria_de_risco.includes('Alto')
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : item.categoria_de_risco.includes('Médio')
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {item.categoria_de_risco}
                          </Badge>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {(item.tipos_produto || []).slice(0, 4).map((tipo) => (
                            <span
                              key={tipo}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF7EF] border border-[#E2DCCF] text-stone-700 capitalize"
                            >
                              {tipo}
                            </span>
                          ))}
                          {(item.tipos_produto || []).length > 4 && (
                            <span className="text-[9px] text-stone-400">
                              +{(item.tipos_produto || []).length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status & Validade de 1 Ano */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isExp ? (
                            <Badge className="bg-red-700 text-white text-[10px] gap-1">
                              <Clock className="h-3 w-3" /> EXPIRADO
                            </Badge>
                          ) : isAlertaAmarelo ? (
                            <Badge className="bg-amber-600 text-white text-[10px] gap-1">
                              <AlertTriangle className="h-3 w-3" /> VENCE EM {item.dias_restantes}D
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-700 text-white text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> VALIDADO
                            </Badge>
                          )}

                          {item.score_aprovacao !== undefined && item.score_aprovacao > 0 && (
                            <span className="font-mono text-[10px] font-bold text-stone-700">
                              ({item.score_aprovacao} pts)
                            </span>
                          )}
                        </div>

                        {item.validade_aprovacao && (
                          <span className="text-[10px] text-stone-500 block mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-stone-400" />
                            Expira: {new Date(item.validade_aprovacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </td>

                      {/* Origem da Aprovação */}
                      <td className="py-3 px-3 text-[11px] text-stone-600">
                        {item.origem_organizacao_nome ? (
                          <span className="font-semibold text-stone-800 block">
                            {item.origem_organizacao_nome}
                          </span>
                        ) : (
                          <span className="text-stone-400 italic block">Rede GIAC</span>
                        )}
                        {item.data_aprovacao && (
                          <span className="text-[10px] text-stone-400 block">
                            Aprovado em {new Date(item.data_aprovacao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {(item.total_utilizacoes || 0) > 1 && (
                          <span className="text-[9px] text-[#2D6A4F] font-semibold block mt-0.5">
                            Adotado por {item.total_utilizacoes} fábricas
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {jaUtilizado ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Na Sua Base
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={importandoCnpj === item.cnpj}
                            onClick={() => handleUsarFornecedor(item)}
                            className="h-8 text-xs bg-[#2D6A4F] hover:bg-[#1B4332] text-white gap-1.5 font-semibold shadow-xs"
                          >
                            <PlusCircle className="h-3.5 w-3.5 text-[#D9A404]" />
                            {importandoCnpj === item.cnpj
                              ? 'Adicionando...'
                              : 'Usar este fornecedor'}
                          </Button>
                        )}
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
  )
}
