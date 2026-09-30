import React, { useState, useRef } from 'react'
import {
  Upload,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Search,
  Download,
  Building,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { formatarCNPJ } from '@/lib/pop01Validators'
import { parseSipeagroXlsx, fetchSipeagroOnline } from '@/lib/sipeagroParser'
import { salvarImportacaoSipeagro } from '@/services/paasoService'
import type { SipeagroItem, AuditoriaImportacaoItem } from '@/types/paaso'

interface SipeagroBaseViewProps {
  estabelecimentos: SipeagroItem[]
  auditorias: AuditoriaImportacaoItem[]
  onDataChanged: () => void
}

export function SipeagroBaseView({
  estabelecimentos,
  auditorias,
  onDataChanged,
}: SipeagroBaseViewProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [busca, setBusca] = useState('')
  const [filtroUf, setFiltroUf] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  // Estados de upload / importação
  const [importando, setImportando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [etapaTexto, setEtapaTexto] = useState('')

  // Busca online por URL
  const [urlOnline, setUrlOnline] = useState('')
  const [buscandoOnline, setBuscandoOnline] = useState(false)

  // Resumo da última importação
  const [resumoUltima, setResumoUltima] = useState<{
    totalLinhas: number
    totalAtivos: number
    novos: number
    atualizados: number
    inativados: number
    dataArquivo: string
  } | null>(null)

  // Filtragem local dos estabelecimentos
  const filtrados = estabelecimentos.filter((item) => {
    const termo = busca.toLowerCase()
    const matchBusca =
      !termo ||
      item.cnpj.includes(termo) ||
      formatarCNPJ(item.cnpj).includes(termo) ||
      item.razao_social.toLowerCase().includes(termo) ||
      (item.registro_sipeagro && item.registro_sipeagro.toLowerCase().includes(termo)) ||
      (item.municipio && item.municipio.toLowerCase().includes(termo))

    const matchUf = !filtroUf || item.uf?.toUpperCase() === filtroUf.toUpperCase()
    const matchCat =
      !filtroCategoria || item.categoria?.toLowerCase() === filtroCategoria.toLowerCase()

    return matchBusca && matchUf && matchCat
  })

  // Lista única de UFs e Categorias
  const ufsDisponiveis = Array.from(
    new Set(estabelecimentos.map((e) => e.uf).filter(Boolean)),
  ).sort()

  const categoriasDisponiveis = Array.from(
    new Set(estabelecimentos.map((e) => e.categoria).filter(Boolean)),
  ).sort()

  // Processa arquivo .xlsx carregado
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportando(true)
    setProgresso(5)
    setEtapaTexto('Lendo arquivo .xlsx selecionado...')

    try {
      const buffer = await file.arrayBuffer()
      const parseResult = await parseSipeagroXlsx(buffer, {
        nomeArquivo: file.name,
        onProgress: (pct, msg) => {
          setProgresso(pct)
          setEtapaTexto(msg)
        },
      })

      setEtapaTexto('Salvando estabelecimentos na base de dados...')
      const saveResult = await salvarImportacaoSipeagro(
        parseResult.estabelecimentos,
        parseResult.totalLinhas,
        parseResult.totalAtivos,
        parseResult.dataArquivo,
        (pct, msg) => {
          setProgresso(pct)
          setEtapaTexto(msg)
        },
      )

      setResumoUltima({
        totalLinhas: parseResult.totalLinhas,
        totalAtivos: parseResult.totalAtivos,
        novos: saveResult.totalNovos,
        atualizados: saveResult.totalAtualizados,
        inativados: saveResult.totalInativados,
        dataArquivo: parseResult.dataArquivo || new Date().toLocaleDateString('pt-BR'),
      })

      toast({
        title: 'Planilha SIPEAGRO importada com sucesso',
        description: `${saveResult.totalNovos} novos CNPJs inseridos, ${saveResult.totalAtualizados} atualizados.`,
      })

      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Falha na importação',
        description: err.message || 'Verifique se o arquivo é um .xlsx válido do MAPA.',
        variant: 'destructive',
      })
    } finally {
      setImportando(false)
      setProgresso(0)
      setEtapaTexto('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Busca direta por URL
  const handleBuscarOnline = async () => {
    if (!urlOnline.trim()) {
      toast({
        title: 'Informe a URL',
        description: 'Digite o link direto para o arquivo .xlsx do MAPA.',
        variant: 'destructive',
      })
      return
    }

    setBuscandoOnline(true)
    setImportando(true)
    setProgresso(10)
    setEtapaTexto('Conectando ao portal do MAPA...')

    try {
      const parseResult = await fetchSipeagroOnline(urlOnline, {
        onProgress: (pct, msg) => {
          setProgresso(pct)
          setEtapaTexto(msg)
        },
      })

      const saveResult = await salvarImportacaoSipeagro(
        parseResult.estabelecimentos,
        parseResult.totalLinhas,
        parseResult.totalAtivos,
        parseResult.dataArquivo,
        (pct, msg) => {
          setProgresso(pct)
          setEtapaTexto(msg)
        },
      )

      setResumoUltima({
        totalLinhas: parseResult.totalLinhas,
        totalAtivos: parseResult.totalAtivos,
        novos: saveResult.totalNovos,
        atualizados: saveResult.totalAtualizados,
        inativados: saveResult.totalInativados,
        dataArquivo: parseResult.dataArquivo || new Date().toLocaleDateString('pt-BR'),
      })

      toast({
        title: 'Importação online concluída',
        description: `${saveResult.totalNovos} novos CNPJs e ${saveResult.totalAtualizados} atualizados.`,
      })

      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Não foi possível baixar automaticamente',
        description:
          err.message ||
          'Devido a restrições de CORS do portal oficial do MAPA, baixe o arquivo pelo navegador e faça o upload direto.',
        variant: 'destructive',
      })
    } finally {
      setBuscandoOnline(false)
      setImportando(false)
      setProgresso(0)
      setEtapaTexto('')
    }
  }

  // Exportar base atual em JSON
  const handleExportarJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(estabelecimentos, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `sipeagro_estabelecimentos_${new Date().toISOString().split('T')[0]}.json`,
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    toast({
      title: 'Exportação concluída',
      description: 'Arquivo JSON da base SIPEAGRO gerado com sucesso.',
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Header de Ações de Importação */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
                Base Oficial de Estabelecimentos SIPEAGRO (MAPA)
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-2xl">
              Lista oficial publicada semanalmente pelo Ministério da Agricultura e Pecuária (MAPA).
              Somente estabelecimentos com situação cadastral <strong>ATIVO</strong> são mantidos no
              cruzamento de qualificação.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileSelected}
              disabled={importando}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importando}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs h-9 gap-2 shadow-sm"
            >
              <Upload className="h-4 w-4 text-[#D9A404]" />
              {importando ? 'Processando...' : 'Importar planilha do MAPA (.xlsx)'}
            </Button>

            {estabelecimentos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarJson}
                className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-9 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar JSON
              </Button>
            )}
          </div>
        </div>

        {/* Barra de Progresso quando estiver importando */}
        {importando && (
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-[#1B4332]">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#2D6A4F]" />
                {etapaTexto || 'Processando base SIPEAGRO...'}
              </span>
              <span>{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-2 bg-emerald-200" />
          </div>
        )}

        {/* Resumo da Última Importação Realizada */}
        {resumoUltima && (
          <div className="p-4 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-xs space-y-2 animate-fade-in">
            <div className="flex items-center gap-2 text-[#2D6A4F] font-bold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resumo da Importação (Data do arquivo: {resumoUltima.dataArquivo})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 uppercase block font-medium">
                  Total de Linhas
                </span>
                <span className="text-sm font-bold text-stone-800">
                  {resumoUltima.totalLinhas.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 uppercase block font-medium">
                  Ativos no Arquivo
                </span>
                <span className="text-sm font-bold text-[#2D6A4F]">
                  {resumoUltima.totalAtivos.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 uppercase block font-medium">
                  Novos CNPJs
                </span>
                <span className="text-sm font-bold text-emerald-700">{resumoUltima.novos}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 uppercase block font-medium">
                  Atualizados
                </span>
                <span className="text-sm font-bold text-blue-700">{resumoUltima.atualizados}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 uppercase block font-medium">
                  Inativados
                </span>
                <span className="text-sm font-bold text-amber-700">{resumoUltima.inativados}</span>
              </div>
            </div>
          </div>
        )}

        {/* Opção secundária: Link online e orientação */}
        <div className="pt-3 border-t border-[#E2DCCF]/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <Globe className="h-4 w-4 text-[#D9A404] shrink-0" />
            <span>Página oficial de publicação MAPA:</span>
            <a
              href="https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/alimentacao-animal"
              target="_blank"
              rel="noreferrer"
              className="text-[#2D6A4F] hover:underline font-semibold flex items-center gap-1"
            >
              Alimentação Animal (gov.br)
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={urlOnline}
              onChange={(e) => setUrlOnline(e.target.value)}
              placeholder="https://.../ListadeEstabelecimentosSIPEAGRO.xlsx"
              className="h-8 text-xs max-w-xs bg-[#FAF7EF]"
              disabled={importando || buscandoOnline}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuscarOnline}
              disabled={importando || buscandoOnline || !urlOnline.trim()}
              className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-8 shrink-0"
            >
              Buscar online
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Filtros e Lista de Estabelecimentos */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-[#2D6A4F]" />
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              Estabelecimentos Ativos ({filtrados.length} de {estabelecimentos.length})
            </h3>
          </div>

          {/* Barra de Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por CNPJ, Razão ou Cidade..."
                className="h-8 text-xs pl-8 bg-[#FAF7EF]"
              />
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

            {categoriasDisponiveis.length > 0 && (
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800 capitalize"
              >
                <option value="">Todas as Categorias</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Tabela de Estabelecimentos */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">CNPJ</th>
                <th className="py-2.5 px-3">Razão Social</th>
                <th className="py-2.5 px-3">Registro MAPA</th>
                <th className="py-2.5 px-3">Localização</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Tipos Autorizados</th>
                <th className="py-2.5 px-3 text-right">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    {estabelecimentos.length === 0 ? (
                      <div className="space-y-2">
                        <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto" />
                        <p className="font-semibold text-stone-700">
                          Nenhum estabelecimento na base SIPEAGRO desta organização.
                        </p>
                        <p className="text-[11px] text-stone-500">
                          Clique em &quot;Importar planilha do MAPA&quot; acima para carregar o
                          arquivo .xlsx oficial ou utilize o botão &quot;Carregar dados de
                          exemplo&quot;.
                        </p>
                      </div>
                    ) : (
                      'Nenhum estabelecimento corresponde aos filtros informados.'
                    )}
                  </td>
                </tr>
              ) : (
                filtrados.slice(0, 50).map((item) => (
                  <tr key={item.cnpj} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1B4332] whitespace-nowrap">
                      {formatarCNPJ(item.cnpj)}
                    </td>
                    <td
                      className="py-2.5 px-3 font-medium text-stone-900 max-w-[240px] truncate"
                      title={item.razao_social}
                    >
                      {item.razao_social}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-700 whitespace-nowrap">
                      {item.registro_sipeagro || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                      {[item.municipio, item.uf].filter(Boolean).join('/') || '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {item.categoria ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-50 text-[#1B4332] text-[10px] capitalize"
                        >
                          {item.categoria}
                        </Badge>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="flex flex-wrap gap-1">
                        {item.tipos_produto && item.tipos_produto.length > 0 ? (
                          item.tipos_produto.map((tipo) => (
                            <span
                              key={tipo}
                              className="text-[9px] bg-stone-100 text-stone-700 px-1.5 py-0.2 rounded font-medium"
                            >
                              {tipo}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-400 text-[10px]">Nenhum tipo</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-400 text-[10px] whitespace-nowrap">
                      {item.arquivo_origem || 'MAPA'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtrados.length > 50 && (
          <p className="text-[11px] text-stone-500 text-center pt-2">
            Mostrando os 50 primeiros registros de {filtrados.length}. Utilize a busca para
            localizar um CNPJ ou município específico.
          </p>
        )}
      </div>

      {/* 3. Histórico de Auditoria de Importações */}
      {auditorias.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
          <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
            Histórico de Auditoria de Importações SIPEAGRO
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                  <th className="py-2 px-3">Data e Hora</th>
                  <th className="py-2 px-3">Arquivo / Origem</th>
                  <th className="py-2 px-3">Linhas Lidas</th>
                  <th className="py-2 px-3">Ativos</th>
                  <th className="py-2 px-3">Novos</th>
                  <th className="py-2 px-3">Inativados</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {auditorias.slice(0, 5).map((aud) => (
                  <tr key={aud.id || aud.data_hora} className="hover:bg-stone-50/70">
                    <td className="py-2 px-3 font-medium text-stone-800 whitespace-nowrap">
                      {new Date(aud.data_hora).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-stone-700">{aud.arquivo_origem || '—'}</td>
                    <td className="py-2 px-3 font-mono">
                      {aud.total_linhas.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono text-emerald-800">
                      {aud.total_ativos.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                      {aud.novos_cnpj}
                    </td>
                    <td className="py-2 px-3 font-mono text-amber-700">
                      {aud.inativados_cnpj?.length || 0}
                    </td>
                    <td className="py-2 px-3">
                      <Badge
                        className={
                          aud.status === 'SUCESSO'
                            ? 'bg-emerald-700 text-white text-[10px]'
                            : 'bg-red-700 text-white text-[10px]'
                        }
                      >
                        {aud.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
