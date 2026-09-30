// Parser SIPEAGRO com SheetJS (carregado dinamicamente via CDN oficial do SheetJS)
// Tolerante a cabeçalhos variáveis, acentos, maiúsculas/minúsculas e pontuação
// Processamento em blocos com callback de progresso

import { TIPOS_PRODUTO_MAPA, type SipeagroItem, type CategoriaSipeagro } from '@/types/paaso'
import { normalizarCNPJ, normalizarTexto, normalizarCategoria } from './cruzamentoEngine'

declare global {
  interface Window {
    XLSX?: any
  }
}

/**
 * Garante que a biblioteca SheetJS (XLSX) está disponível no navegador
 */
export async function carregarSheetJs(): Promise<any> {
  if (window.XLSX) return window.XLSX

  return new Promise((resolve, reject) => {
    // Verificar se já existe a tag script
    const existing = document.querySelector('script[data-sheetjs="true"]') as HTMLScriptElement
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX))
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar SheetJS')))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    script.setAttribute('data-sheetjs', 'true')
    script.async = true
    script.onload = () => {
      if (window.XLSX) {
        resolve(window.XLSX)
      } else {
        reject(new Error('SheetJS carregou mas objeto XLSX não está disponível no window'))
      }
    }
    script.onerror = () => {
      // Fallback secundário unpkg
      const fallbackScript = document.createElement('script')
      fallbackScript.src = 'https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js'
      fallbackScript.onload = () => resolve(window.XLSX)
      fallbackScript.onerror = () =>
        reject(new Error('Não foi possível carregar a biblioteca de leitura de Excel'))
      document.head.appendChild(fallbackScript)
    }
    document.head.appendChild(script)
  })
}

export interface ParseSipeagroResult {
  sucesso: boolean
  totalLinhas: number
  totalAtivos: number
  estabelecimentos: SipeagroItem[]
  dataArquivo?: string
  mensagem?: string
}

export interface ParseOptions {
  nomeArquivo?: string
  onProgress?: (porcentagem: number, etapa: string) => void
}

/**
 * Extrai a data do arquivo pelo nome se seguir o padrão MAPA:
 * ListadeEstabelecimentosSIPEAGRODD.MM.AAAA.xlsx ou variações
 */
export function extrairDataNomeArquivo(nomeArquivo?: string): string {
  if (!nomeArquivo) return new Date().toLocaleDateString('pt-BR')
  const match = nomeArquivo.match(/(\d{2})[._-](\d{2})[._-](\d{4})/)
  if (match) {
    return `${match[1]}/${match[2]}/${match[3]}`
  }
  return new Date().toLocaleDateString('pt-BR')
}

/**
 * Analisa e processa um buffer ArrayBuffer ou Uint8Array de uma planilha Excel .xlsx do MAPA
 */
export async function parseSipeagroXlsx(
  buffer: ArrayBuffer | Uint8Array,
  options?: ParseOptions,
): Promise<ParseSipeagroResult> {
  const onProgress = options?.onProgress || (() => {})
  onProgress(5, 'Carregando biblioteca do parser...')

  const XLSX = await carregarSheetJs()

  onProgress(15, 'Lendo estrutura da planilha...')
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('A planilha fornecida está vazia ou não contém abas válidas.')
  }

  // Utilizar a primeira aba
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]

  onProgress(25, 'Convertendo linhas da planilha...')
  // Converter para matriz de dados brutos
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!rawData || rawData.length === 0) {
    throw new Error('Nenhuma linha legível encontrada na planilha.')
  }

  onProgress(35, 'Localizando linha de cabeçalho...')
  // Detecção automática da linha de cabeçalho
  let headerRowIndex = -1
  let colIndices: {
    cnpj: number
    razao: number
    registro: number
    situacao: number
    uf: number
    municipio: number
    categoria: number
    tipos: { [tipo: string]: number }
  } = {
    cnpj: -1,
    razao: -1,
    registro: -1,
    situacao: -1,
    uf: -1,
    municipio: -1,
    categoria: -1,
    tipos: {},
  }

  for (let r = 0; r < Math.min(rawData.length, 30); r++) {
    const row = rawData[r]
    if (!Array.isArray(row)) continue

    const rowTexts = row.map((c) => normalizarTexto(String(c)))
    const cnpjIdx = rowTexts.findIndex(
      (t) => t.includes('cnpj') || t.includes('cgc') || t === 'cpf cnpj',
    )
    const razaoIdx = rowTexts.findIndex(
      (t) =>
        t.includes('razao social') ||
        t.includes('nome empresarial') ||
        t.includes('estabelecimento') ||
        t === 'nome' ||
        t.includes('razao'),
    )

    if (cnpjIdx !== -1 && razaoIdx !== -1) {
      headerRowIndex = r
      colIndices.cnpj = cnpjIdx
      colIndices.razao = razaoIdx

      // Mapear demais colunas com tolerância
      colIndices.registro = rowTexts.findIndex(
        (t) =>
          t.includes('registro') ||
          t.includes('sipeagro') ||
          t.includes('num reg') ||
          t.includes('n reg'),
      )
      colIndices.situacao = rowTexts.findIndex(
        (t) => t.includes('situacao') || t.includes('status') || t.includes('sit cadastral'),
      )
      colIndices.uf = rowTexts.findIndex(
        (t) => t === 'uf' || t.includes('estado') || t === 'sigla uf',
      )
      colIndices.municipio = rowTexts.findIndex(
        (t) => t.includes('municipio') || t.includes('cidade'),
      )
      colIndices.categoria = rowTexts.findIndex(
        (t) => t.includes('categoria') || t.includes('tipo estab') || t.includes('atividade'),
      )

      // Identificar os 10 tipos de produto fixos
      for (const tipo of TIPOS_PRODUTO_MAPA) {
        const normTipo = normalizarTexto(tipo)
        const tIdx = rowTexts.findIndex((t) => {
          if (normTipo === 'produto mastigavel') {
            return t.includes('mastig')
          }
          if (normTipo === 'racao') {
            return t.includes('racao') || t.includes('racoes')
          }
          return t.includes(normTipo)
        })
        if (tIdx !== -1) {
          colIndices.tipos[tipo] = tIdx
        }
      }

      break
    }
  }

  if (headerRowIndex === -1 || colIndices.cnpj === -1 || colIndices.razao === -1) {
    throw new Error(
      'Cabeçalho esperado não encontrado. A planilha deve conter colunas de CNPJ e Razão Social (padrão SIPEAGRO/MAPA). Operação abortada sem alterar a base.',
    )
  }

  onProgress(50, 'Processando e filtrando estabelecimentos...')
  const totalLinhas = rawData.length - (headerRowIndex + 1)
  const dataArquivo = extrairDataNomeArquivo(options?.nomeArquivo)
  const agoraIso = new Date().toISOString()

  // Dicionário por CNPJ para garantir que se houver duplicata, mantém a ÚLTIMA ocorrência
  const estabelecimentosPorCnpj = new Map<string, SipeagroItem>()
  let totalAtivosCount = 0

  const batchSize = 1000
  const rows = rawData.slice(headerRowIndex + 1)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const rawCnpj = String(row[colIndices.cnpj] || '').trim()
    const rawRazao = String(row[colIndices.razao] || '').trim()

    if (!rawCnpj || !rawRazao) continue

    const cnpj14 = normalizarCNPJ(rawCnpj)
    if (cnpj14.length !== 14 || cnpj14 === '00000000000000') continue

    // Situação: se não houver coluna de situação, assume ATIVO; se houver, somente ATIVO é importado
    let situacao = 'ATIVO'
    if (colIndices.situacao !== -1) {
      situacao = String(row[colIndices.situacao] || '').trim()
    }
    const situacaoNorm = normalizarTexto(situacao)

    // A especificação diz: somente "ATIVO" é importado
    if (situacaoNorm !== 'ativo') {
      continue
    }

    totalAtivosCount++

    // Registro
    const registro =
      colIndices.registro !== -1 ? String(row[colIndices.registro] || '').trim() : undefined

    // UF e Município
    const uf =
      colIndices.uf !== -1
        ? String(row[colIndices.uf] || '')
            .trim()
            .toUpperCase()
            .slice(0, 2)
        : undefined
    const municipio =
      colIndices.municipio !== -1 ? String(row[colIndices.municipio] || '').trim() : undefined

    // Categoria
    let categoria: CategoriaSipeagro | undefined = undefined
    if (colIndices.categoria !== -1) {
      const catText = String(row[colIndices.categoria] || '').trim()
      categoria = normalizarCategoria(catText) as CategoriaSipeagro
    }

    // Tipos de produto: somente colunas com valor 1, 2 ou 3 na linha
    const tiposAtivos: string[] = []
    for (const [tipoNome, cIdx] of Object.entries(colIndices.tipos)) {
      const cellVal = String(row[cIdx] || '').trim()
      if (cellVal === '1' || cellVal === '2' || cellVal === '3') {
        tiposAtivos.push(tipoNome)
      }
    }

    const item: SipeagroItem = {
      cnpj: cnpj14,
      razao_social: rawRazao,
      registro_sipeagro: registro,
      situacao: 'ATIVO',
      uf,
      municipio,
      categoria,
      tipos_produto: tiposAtivos,
      arquivo_origem: dataArquivo,
      importado_em: agoraIso,
    }

    // CNPJ duplicado no arquivo: Map sobrescreve mantendo a última ocorrência
    estabelecimentosPorCnpj.set(cnpj14, item)

    if (i % batchSize === 0) {
      const perc = Math.min(90, Math.round(50 + (i / rows.length) * 40))
      onProgress(perc, `Processando linha ${i} de ${rows.length}...`)
      // Cede a thread para a UI não congelar
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  onProgress(95, 'Finalizando estruturação da base...')
  const estabelecimentos = Array.from(estabelecimentosPorCnpj.values())

  onProgress(100, 'Importação e parsing concluídos com sucesso!')

  return {
    sucesso: true,
    totalLinhas,
    totalAtivos: totalAtivosCount,
    estabelecimentos,
    dataArquivo,
    mensagem: `Foram processadas ${totalLinhas} linhas da planilha oficial. Identificados ${estabelecimentos.length} estabelecimentos ATIVOS únicos.`,
  }
}

/**
 * Tenta buscar online um arquivo a partir da URL fornecida
 */
export async function fetchSipeagroOnline(
  url: string,
  options?: ParseOptions,
): Promise<ParseSipeagroResult> {
  options?.onProgress?.(5, 'Conectando ao servidor do MAPA...')

  let res: Response
  try {
    res = await fetch(url, { method: 'GET' })
  } catch (err: any) {
    throw new Error(
      `Falha na requisição online (possível bloqueio de CORS do domínio do MAPA): ${err.message}. Por favor, baixe o arquivo diretamente pelo link do MAPA e use a opção 'Importar planilha do MAPA' (.xlsx).`,
    )
  }

  if (!res.ok) {
    throw new Error(`Servidor respondeu com status HTTP ${res.status}: ${res.statusText}`)
  }

  options?.onProgress?.(20, 'Download concluído. Processando arquivo baixado...')
  const arrayBuffer = await res.arrayBuffer()
  const fileName = url.split('/').pop() || 'ListadeEstabelecimentosSIPEAGRO.xlsx'
  return parseSipeagroXlsx(arrayBuffer, { ...options, nomeArquivo: fileName })
}
