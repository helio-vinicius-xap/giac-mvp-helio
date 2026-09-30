import React, { useState, useEffect } from 'react'
import {
  FileSpreadsheet,
  Users,
  FileCheck,
  RotateCcw,
  AlertOctagon,
  BarChart3,
  Sparkles,
  Trash2,
  RefreshCw,
  Building,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import {
  getSipeagroList,
  getFornecedoresList,
  getQualificacoesList,
  getDevolucoesList,
  getNcFornecedorList,
  getAuditoriasImportacao,
} from '@/services/paasoService'
import { carregarDadosExemploPaaso, removerDadosExemploPaaso } from '@/services/paasoSeedService'
import { SipeagroBaseView } from './SipeagroBaseView'
import { FornecedoresView } from './FornecedoresView'
import { QualificacaoView } from './QualificacaoView'
import { DevolucoesView } from './DevolucoesView'
import { NaoConformidadesView } from './NaoConformidadesView'
import { PainelIndicadoresView } from './PainelIndicadoresView'
import { FornecedoresValidadosView } from './FornecedoresValidadosView'
import { Globe2 } from 'lucide-react'
import type {
  SipeagroItem,
  FornecedorItem,
  QualificacaoItem,
  DevolucaoItem,
  NaoConformidadeFornecedorItem,
  AuditoriaImportacaoItem,
  FornecedorValidadoItem,
} from '@/types/paaso'

export function PaasoContainer() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>('painel')

  // Estados dos dados centrais
  const [loading, setLoading] = useState(true)
  const [estabelecimentos, setEstabelecimentos] = useState<SipeagroItem[]>([])
  const [fornecedores, setFornecedores] = useState<FornecedorItem[]>([])
  const [qualificacoes, setQualificacoes] = useState<QualificacaoItem[]>([])
  const [devolucoes, setDevolucoes] = useState<DevolucaoItem[]>([])
  const [ncs, setNcs] = useState<NaoConformidadeFornecedorItem[]>([])
  const [auditorias, setAuditorias] = useState<AuditoriaImportacaoItem[]>([])

  // Fornecedor selecionado para qualificar a partir da lista
  const [fornecedorParaQualificar, setFornecedorParaQualificar] = useState<FornecedorItem | null>(
    null,
  )

  // Seed / Demo loader
  const [executandoSeed, setExecutandoSeed] = useState(false)
  const [seedTexto, setSeedTexto] = useState('')

  // Banco global compartilhado de Fornecedores Validados
  const [validados, setValidados] = useState<FornecedorValidadoItem[]>([])

  // Carrega todas as coleções
  const carregarDados = async () => {
    setLoading(true)
    try {
      const [sipes, forns, quals, devs, ncsList, audits, valids] = await Promise.all([
        getSipeagroList(),
        getFornecedoresList(),
        getQualificacoesList(),
        getDevolucoesList(),
        getNcFornecedorList(),
        getAuditoriasImportacao(),
        import('@/services/paasoService')
          .then((m) => m.getFornecedoresValidadosList())
          .catch(() => []),
      ])

      setEstabelecimentos(sipes)
      setFornecedores(forns)
      setQualificacoes(quals)
      setDevolucoes(devs)
      setNcs(ncsList)
      setAuditorias(audits)
      setValidados(valids)
    } catch (err: any) {
      console.error('Erro ao carregar dados do PAASO:', err)
      toast({
        title: 'Erro ao carregar dados do PAASO',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Carregar dados de exemplo (Seed)
  const handleCarregarExemplo = async () => {
    const confirmou = confirm(
      'Deseja carregar os dados de demonstração da Iteração 1?\n\nSerão inseridos ~20 estabelecimentos SIPEAGRO fictícios, 5 fornecedores, qualificações com cruzamento automático, devoluções e não conformidades (todos identificados como exemplo).',
    )
    if (!confirmou) return

    setExecutandoSeed(true)
    setSeedTexto('Carregando estabelecimentos e fornecedores...')
    try {
      await carregarDadosExemploPaaso((_pct, msg) => {
        setSeedTexto(msg)
      })
      toast({
        title: 'Dados de demonstração carregados com sucesso',
        description: 'Foram incluídos estabelecimentos, fornecedores, qualificações e ocorrências.',
      })
      await carregarDados()
      setActiveTab('painel')
    } catch (err: any) {
      toast({
        title: 'Falha ao carregar demonstração',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExecutandoSeed(false)
      setSeedTexto('')
    }
  }

  // Remover dados de exemplo
  const handleLimparExemplo = async () => {
    const confirmou = confirm(
      'Deseja remover todos os dados marcados como demonstração/exemplo desta organização?',
    )
    if (!confirmou) return

    setExecutandoSeed(true)
    setSeedTexto('Removendo registros de exemplo...')
    try {
      await removerDadosExemploPaaso((_pct, msg) => {
        setSeedTexto(msg)
      })
      toast({
        title: 'Dados de demonstração removidos',
      })
      await carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao remover demonstração',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExecutandoSeed(false)
      setSeedTexto('')
    }
  }

  // Atalho para abrir formulário de qualificação a partir do fornecedor
  const handleAbrirQualificacaoFornecedor = (f: FornecedorItem) => {
    setFornecedorParaQualificar(f)
    setActiveTab('qualificacao')
  }

  // Conta registros de exemplo
  const temExemplos =
    estabelecimentos.some((e) => e.is_exemplo) ||
    fornecedores.some((f) => f.is_exemplo) ||
    qualificacoes.some((q) => q.is_exemplo)

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior do Núcleo PAASO */}
      <div className="bg-[#FAF7EF] p-4 sm:p-5 rounded-2xl border border-[#E2DCCF] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#2D6A4F] text-white tracking-wide uppercase">
              PAASO • Iteração 1
            </span>
            <h1 className="text-base sm:text-xl font-bold font-['Sora'] text-[#1B4332]">
              Núcleo de Qualificação de Fornecedores & SIPEAGRO
            </h1>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Módulo oficial para homologação de fornecedores de alimentação animal com cruzamento
            automático via SIPEAGRO/MAPA, devoluções, não conformidades e painel analítico.
          </p>
        </div>

        {/* Botões de Apoio & Seed */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={loading || executandoSeed}
            className="border-stone-300 text-stone-700 hover:bg-stone-100 text-xs h-9 gap-1.5"
            title="Atualizar dados"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleCarregarExemplo}
            disabled={executandoSeed || loading}
            className="bg-[#D9A404] hover:bg-[#b88a03] text-stone-900 font-bold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {executandoSeed ? seedTexto || 'Carregando...' : 'Carregar dados de exemplo'}
          </Button>

          {temExemplos && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimparExemplo}
              disabled={executandoSeed || loading}
              className="border-red-200 text-red-700 hover:bg-red-50 text-xs h-9 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpar exemplos
            </Button>
          )}
        </div>
      </div>

      {/* Navegação por Abas do PAASO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="bg-[#FAF7EF] p-1 rounded-xl border border-[#E2DCCF] flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="painel"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Painel de Indicadores
          </TabsTrigger>

          <TabsTrigger
            value="validados"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <Globe2 className="h-3.5 w-3.5 text-[#D9A404]" />
            Fornecedores Validados ({validados.length})
          </TabsTrigger>

          <TabsTrigger
            value="sipeagro"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Base SIPEAGRO ({estabelecimentos.length})
          </TabsTrigger>

          <TabsTrigger
            value="fornecedores"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <Users className="h-3.5 w-3.5" />
            Fornecedores ({fornecedores.length})
          </TabsTrigger>

          <TabsTrigger
            value="qualificacao"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <FileCheck className="h-3.5 w-3.5" />
            Qualificação & Cruzamento
          </TabsTrigger>

          <TabsTrigger
            value="devolucoes"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Devoluções ({devolucoes.length})
          </TabsTrigger>

          <TabsTrigger
            value="ncs"
            className="text-xs data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white font-semibold py-2 px-3 gap-1.5 rounded-lg transition"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            Não Conformidades ({ncs.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. Painel de Indicadores */}
        <TabsContent value="painel" className="m-0 focus-visible:outline-none">
          <PainelIndicadoresView
            fornecedores={fornecedores}
            qualificacoes={qualificacoes}
            devolucoes={devolucoes}
            ncs={ncs}
            validados={validados}
            onAbrirRevalidacao={handleAbrirQualificacaoFornecedor}
          />
        </TabsContent>

        {/* 2. Fornecedores Validados (Banco Compartilhado) */}
        <TabsContent value="validados" className="m-0 focus-visible:outline-none">
          <FornecedoresValidadosView
            validados={validados}
            fornecedoresLocais={fornecedores}
            onDataChanged={carregarDados}
            onAbrirQualificacao={handleAbrirQualificacaoFornecedor}
          />
        </TabsContent>

        {/* 3. Base SIPEAGRO */}
        <TabsContent value="sipeagro" className="m-0 focus-visible:outline-none">
          <SipeagroBaseView
            estabelecimentos={estabelecimentos}
            auditorias={auditorias}
            onDataChanged={carregarDados}
          />
        </TabsContent>

        {/* 3. Fornecedores */}
        <TabsContent value="fornecedores" className="m-0 focus-visible:outline-none">
          <FornecedoresView
            fornecedores={fornecedores}
            onDataChanged={carregarDados}
            onAbrirQualificacao={handleAbrirQualificacaoFornecedor}
            onAbrirBancoValidados={() => setActiveTab('validados')}
          />
        </TabsContent>

        {/* 4. Qualificação e Cruzamento */}
        <TabsContent value="qualificacao" className="m-0 focus-visible:outline-none">
          <QualificacaoView
            fornecedores={fornecedores}
            estabelecimentosSipeagro={estabelecimentos}
            fornecedorPreSelecionado={fornecedorParaQualificar}
            onDataChanged={carregarDados}
          />
        </TabsContent>

        {/* 5. Devoluções */}
        <TabsContent value="devolucoes" className="m-0 focus-visible:outline-none">
          <DevolucoesView
            devolucoes={devolucoes}
            fornecedores={fornecedores}
            onDataChanged={carregarDados}
          />
        </TabsContent>

        {/* 6. Não Conformidades */}
        <TabsContent value="ncs" className="m-0 focus-visible:outline-none">
          <NaoConformidadesView
            ncs={ncs}
            fornecedores={fornecedores}
            onDataChanged={carregarDados}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
