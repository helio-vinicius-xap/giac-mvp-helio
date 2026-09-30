// Motor de Cruzamento Automático de Fornecedor com a base SIPEAGRO (7 Verificações)
// Especificação PAASO Iteração 1

import type {
  SipeagroItem,
  DadosDeclaradosQualificacao,
  ResultadoCruzamento,
  ResultadoQualificacao,
  StatusVigencia,
} from '@/types/paaso'

/**
 * Remove acentos, pontuação, múltiplos espaços e converte para minúsculas
 */
export function normalizarTexto(txt: string | undefined | null): string {
  if (!txt) return ''
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Normaliza CNPJ para 14 dígitos numéricos
 */
export function normalizarCNPJ(cnpj: string | undefined | null): string {
  if (!cnpj) return ''
  return cnpj.replace(/\D/g, '').padStart(14, '0').slice(-14)
}

/**
 * Similaridade baseada em Levenshtein Distance (0 a 100%)
 */
export function calcularSimilaridade(s1: string, s2: string): number {
  const norm1 = normalizarTexto(s1)
  const norm2 = normalizarTexto(s2)

  if (norm1 === norm2) return 100
  if (!norm1 || !norm2) return 0

  const len1 = norm1.length
  const len2 = norm2.length
  const d: number[][] = []

  for (let i = 0; i <= len1; i++) {
    d[i] = [i]
  }
  for (let j = 0; j <= len2; j++) {
    d[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = norm1[i - 1] === norm2[j - 1] ? 0 : 1
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deleção
        d[i][j - 1] + 1, // inserção
        d[i - 1][j - 1] + cost, // substituição
      )
    }
  }

  const maxLen = Math.max(len1, len2)
  const distance = d[len1][len2]
  const similarity = ((maxLen - distance) / maxLen) * 100
  return Math.round(similarity * 10) / 10
}

/**
 * Adiciona 12 meses à data da qualificação (ISO date string YYYY-MM-DD)
 */
export function calcularValidade12Meses(dataFormulario: string): string {
  const d = new Date(dataFormulario.includes('T') ? dataFormulario : `${dataFormulario}T00:00:00`)
  if (isNaN(d.getTime())) {
    const fallback = new Date()
    fallback.setFullYear(fallback.getFullYear() + 1)
    return fallback.toISOString().split('T')[0]
  }
  const nextYear = new Date(d)
  nextYear.setFullYear(d.getFullYear() + 1)
  return nextYear.toISOString().split('T')[0]
}

/**
 * Determina se a validade está vigente ou vencida em relação a hoje
 */
export function verificarStatusVigencia(validadeStr: string): StatusVigencia {
  if (!validadeStr) return 'VENCIDA'
  const today = new Date().toISOString().split('T')[0]
  const valOnly = validadeStr.split('T')[0]
  return valOnly >= today ? 'VIGENTE' : 'VENCIDA'
}

/**
 * Normaliza nomes de categoria do SIPEAGRO
 */
export function normalizarCategoria(cat: string | undefined | null): string {
  const norm = normalizarTexto(cat)
  if (norm.includes('fabric')) return 'fabricante'
  if (norm.includes('fracion')) return 'fracionador'
  if (norm.includes('import')) return 'importador'
  if (norm.includes('armazen')) return 'armazenador'
  return norm
}

/**
 * Normaliza tipos de produto para comparação
 */
export function normalizarTipoProduto(tipo: string): string {
  return normalizarTexto(tipo)
}

/**
 * MOTOR DE CRUZAMENTO AUTOMÁTICO — 7 VERIFICAÇÕES
 *
 * 1. CNPJ existe na base SIPEAGRO importada
 * 2. Situação ATIVO
 * 3. Razão social confere (similaridade ≥ 90% após normalizar maiúsculas, acentos e pontuação)
 * 4. Categoria declarada = categoria da base
 * 5. Todo tipo de produto declarado consta nos tipos_produto da base (valor 1, 2 ou 3)
 * 6. Registro SIPEAGRO declarado = registro da base
 * 7. UF e município conferem (divergência gera ressalva, não reprovação)
 *
 * Regras de resultado:
 * - Falha em 1, 2, 4 ou 5 → REPROVADO
 * - Divergência apenas em 3, 6 ou 7 → APROVADO COM RESSALVA (listar divergências)
 * - Tudo conforme → APROVADO
 * - CNPJ não encontrado ou base SIPEAGRO vazia → PENDENTE DE REVISÃO
 *
 * Score:
 * - Base 100
 * - −25 se razão social divergir (< 90%)
 * - −15 se registro SIPEAGRO divergir
 * - −10 se localização (UF ou município) divergir
 * - Reprovação zera o score (score = 0)
 */
export function executarCruzamentoSipeagro(
  dados: DadosDeclaradosQualificacao,
  cnpjFornecedor: string,
  estabelecimentoSipeagro: SipeagroItem | null | undefined,
  baseSipeagroVazia: boolean = false,
  dataFormulario: string = new Date().toISOString().split('T')[0],
): ResultadoCruzamento {
  const validade = calcularValidade12Meses(dataFormulario)
  const status_vigencia = verificarStatusVigencia(validade)

  // Caso especial: Base SIPEAGRO vazia ou CNPJ não encontrado
  if (baseSipeagroVazia || !estabelecimentoSipeagro) {
    return {
      resultado: 'PENDENTE_REVISAO',
      score: 50,
      divergencias: [
        baseSipeagroVazia
          ? 'Base oficial SIPEAGRO não possui dados importados na organização. Importe a planilha do MAPA.'
          : `CNPJ ${cnpjFornecedor} não localizado na base oficial de estabelecimentos registrados no SIPEAGRO/MAPA.`,
      ],
      validade,
      status_vigencia,
      detalhes: {
        cnpj_encontrado: false,
        situacao_ativo: false,
        razao_social_confere: false,
        similaridade_razao: 0,
        categoria_confere: false,
        tipos_produto_conferem: false,
        tipos_faltantes: dados.tipos_produto || [],
        registro_confere: false,
        localizacao_confere: false,
      },
    }
  }

  const divergencias: string[] = []
  let score = 100
  let isReprovado = false

  // 1. CNPJ existe na base SIPEAGRO
  const cnpjOk = Boolean(estabelecimentoSipeagro)

  // 2. Situação ATIVO
  const situacaoNormalizada = normalizarTexto(estabelecimentoSipeagro.situacao)
  const situacaoOk = situacaoNormalizada === 'ativo'
  if (!situacaoOk) {
    isReprovado = true
    divergencias.push(
      `Situação cadastral no SIPEAGRO está '${estabelecimentoSipeagro.situacao || 'INATIVO'}' (exige-se ATIVO).`,
    )
  }

  // 3. Razão social confere (similaridade ≥ 90%)
  const simRazao = calcularSimilaridade(
    dados.razao_social,
    estabelecimentoSipeagro.razao_social || '',
  )
  const razaoOk = simRazao >= 90
  if (!razaoOk) {
    score -= 25
    divergencias.push(
      `Razão social declarada ('${dados.razao_social}') difere da base oficial MAPA ('${estabelecimentoSipeagro.razao_social}'). Similaridade: ${simRazao.toFixed(1)}% (mínimo exigido 90%).`,
    )
  }

  // 4. Categoria declarada = categoria da base
  const catDeclarada = normalizarCategoria(dados.categoria)
  const catBase = normalizarCategoria(estabelecimentoSipeagro.categoria)
  const categoriaOk = !catDeclarada || !catBase || catDeclarada === catBase
  if (!categoriaOk) {
    isReprovado = true
    divergencias.push(
      `Categoria de estabelecimento divergente: declarado '${dados.categoria}', no MAPA consta '${estabelecimentoSipeagro.categoria}'.`,
    )
  }

  // 5. Todo tipo de produto declarado consta nos tipos_produto da base
  const tiposBaseNormalizados = (estabelecimentoSipeagro.tipos_produto || []).map(
    normalizarTipoProduto,
  )
  const tiposFaltantes: string[] = []
  for (const t of dados.tipos_produto || []) {
    const tNorm = normalizarTipoProduto(t)
    if (
      !tiposBaseNormalizados.some((tb) => tb === tNorm || tb.includes(tNorm) || tNorm.includes(tb))
    ) {
      tiposFaltantes.push(t)
    }
  }
  const tiposOk = tiposFaltantes.length === 0
  if (!tiposOk) {
    isReprovado = true
    divergencias.push(
      `Incompatibilidade de produtos: o fornecedor declarou produto(s) não autorizado(s) na linha do SIPEAGRO: [${tiposFaltantes.join(', ')}].`,
    )
  }

  // 6. Registro SIPEAGRO declarado = registro da base
  const regDeclarado = normalizarTexto(dados.registro_sipeagro)
  const regBase = normalizarTexto(estabelecimentoSipeagro.registro_sipeagro)
  const registroOk = !regDeclarado || !regBase || regDeclarado === regBase
  if (!registroOk) {
    score -= 15
    divergencias.push(
      `Registro SIPEAGRO declarado ('${dados.registro_sipeagro}') diverge do registro oficial no MAPA ('${estabelecimentoSipeagro.registro_sipeagro}').`,
    )
  }

  // 7. UF e município conferem
  const ufDeclarada = normalizarTexto(dados.uf)
  const ufBase = normalizarTexto(estabelecimentoSipeagro.uf)
  const munDeclarado = normalizarTexto(dados.municipio)
  const munBase = normalizarTexto(estabelecimentoSipeagro.municipio)

  const ufOk = !ufDeclarada || !ufBase || ufDeclarada === ufBase
  const munOk = !munDeclarado || !munBase || munDeclarado === munBase
  const localizacaoOk = ufOk && munOk

  if (!localizacaoOk) {
    score -= 10
    const localBase = [estabelecimentoSipeagro.municipio, estabelecimentoSipeagro.uf]
      .filter(Boolean)
      .join('/')
    const localDecl = [dados.municipio, dados.uf].filter(Boolean).join('/')
    divergencias.push(
      `Localização diverge: declarada '${localDecl}', na base oficial MAPA consta '${localBase}'.`,
    )
  }

  // Determinar resultado
  let resultado: ResultadoQualificacao
  if (isReprovado) {
    resultado = 'REPROVADO'
    score = 0
  } else if (divergencias.length > 0) {
    resultado = 'APROVADO_COM_RESSALVA'
    score = Math.max(0, Math.min(100, score))
  } else {
    resultado = 'APROVADO'
    score = 100
  }

  return {
    resultado,
    score,
    divergencias,
    validade,
    status_vigencia,
    detalhes: {
      cnpj_encontrado: cnpjOk,
      situacao_ativo: situacaoOk,
      razao_social_confere: razaoOk,
      similaridade_razao: simRazao,
      categoria_confere: categoriaOk,
      tipos_produto_conferem: tiposOk,
      tipos_faltantes: tiposFaltantes,
      registro_confere: registroOk,
      localizacao_confere: localizacaoOk,
    },
  }
}
