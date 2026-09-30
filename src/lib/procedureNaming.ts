/**
 * Utilitário central para formatação e nomenclatura de procedimentos (POPs -> Auto Controles).
 *
 * Regras:
 * - O prefixo "POP" passa a ser "Auto Controle" na exibição.
 *   Ex.: "POP 01" / "POP-001" -> "Auto Controle 01"
 * - Onde aparece o identificador com o nome, exibe:
 *   "Auto Controle 01 – Qualificação de Fornecedores"
 * - Códigos internos (IDs, coleções, campo `code`/`codigo`) NÃO mudam.
 * - Outras siglas (RE, RT, RQ, RNC, BPF) NÃO são alteradas.
 */

// Títulos resumidos padronizados dos 9 Auto Controles oficiais (MAPA IN 04/2007)
export const OFFICIAL_PROCEDURE_SHORT_NAMES: Record<string, string> = {
  '01': 'Qualificação de Fornecedores',
  '02': 'Limpeza e Higienização',
  '03': 'Higiene e Saúde do Pessoal',
  '04': 'Potabilidade da Água',
  '05': 'Prevenção de Contaminação Cruzada',
  '06': 'Manutenção e Calibração',
  '07': 'Controle Integrado de Pragas',
  '08': 'Controle de Resíduos e Efluentes',
  '09': 'Rastreabilidade e Recolhimento',
}

/**
 * Extrai o número do procedimento (formatado em 2 dígitos quando <= 99)
 * Exemplos:
 * "POP-01" -> "01"
 * "POP-001" -> "01"
 * "POP 01" -> "01"
 * "POP-1" -> "01"
 * "POP-010" -> "10"
 */
export function extractProcedureNumber(codeOrText?: string | null): string | null {
  if (!codeOrText) return null
  const clean = String(codeOrText).trim()
  const match = clean.match(/POP[-_\s]?0*([0-9]+)/i)
  if (match && match[1]) {
    const num = parseInt(match[1], 10)
    if (!isNaN(num)) {
      return num < 100 ? String(num).padStart(2, '0') : String(num)
    }
  }
  return null
}

/**
 * Retorna o label de exibição do código:
 * "Auto Controle 01" em vez de "POP 01" ou "POP-001"
 * Se não for um POP reconhecido, preserva o código original de forma graciosa.
 */
export function formatProcedureCode(codigo?: string | null): string {
  if (!codigo) return 'Auto Controle'
  const num = extractProcedureNumber(codigo)
  if (num) {
    return `Auto Controle ${num}`
  }
  // Se for algo customizado como "AC-01" ou texto genérico
  return String(codigo).replace(/^POP[-_\s]*/i, 'Auto Controle ')
}

/**
 * Resume um título de procedimento se ele for muito longo ou retorna o título cadastrado/resumido.
 */
export function getProcedureShortTitle(
  codigo?: string | null,
  fullName?: string | null,
  maxLength = 45,
): string {
  const num = extractProcedureNumber(codigo)
  if (num && OFFICIAL_PROCEDURE_SHORT_NAMES[num]) {
    return OFFICIAL_PROCEDURE_SHORT_NAMES[num]
  }

  if (!fullName) return ''

  // Limpar prefixos duplicados do nome se houver
  let cleaned = fullName
    .replace(/^Auto\s*Controle\s*\d+\s*[–-]\s*/i, '')
    .replace(/^POP[-_\s]*\d+\s*[–-]\s*/i, '')
    .trim()

  if (cleaned.length <= maxLength) {
    return cleaned
  }

  // Corta elegantemente sem quebrar palavra
  const truncated = cleaned.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > 20) {
    return `${truncated.slice(0, lastSpace)}...`
  }
  return `${truncated}...`
}

/**
 * Formata o label completo de exibição:
 * "Auto Controle 01 – Qualificação de Fornecedores"
 *
 * @param procedure Objeto com { codigo, nome } ou parâmetros individuais
 */
export function formatProcedureDisplayName(
  procedureOrCode?: { codigo?: string | null; nome?: string | null } | string | null,
  possibleName?: string | null,
): string {
  let codigo: string | null = null
  let nome: string | null = null

  if (typeof procedureOrCode === 'object' && procedureOrCode !== null) {
    codigo = procedureOrCode.codigo || null
    nome = procedureOrCode.nome || null
  } else if (typeof procedureOrCode === 'string') {
    codigo = procedureOrCode
    nome = possibleName || null
  }

  const codeLabel = formatProcedureCode(codigo)
  const shortTitle = getProcedureShortTitle(codigo, nome)

  if (shortTitle) {
    return `${codeLabel} – ${shortTitle}`
  }

  return codeLabel
}

/**
 * Substitui ocorrências em textos estáticos/dinâmicos de padrões como:
 * "POP 01", "POP-01", "POP-001", "POPs 01 a 09", "POPs 1 a 9", "POP XX"
 * por "Auto Controle XX"
 */
export function replacePopReferences(text: string): string {
  if (!text) return ''
  return (
    text
      // "POPs 1 a 9" / "POPs 1-9" / "POPs 01 a 09"
      .replace(/POPs?\s*(?:1|01)\s*(?:a|-)\s*(?:9|09)/gi, 'Auto Controles 01 a 09')
      // "POP-001" / "POP-01" / "POP 01" / "POP 1"
      .replace(/\bPOP[-_\s]?0*([1-9])\b/gi, (_, n) => `Auto Controle ${String(n).padStart(2, '0')}`)
      // "POP-010" / "POP 10" etc
      .replace(/\bPOP[-_\s]?([0-9]{2,3})\b/gi, (_, n) => `Auto Controle ${n}`)
      // "o POP" / "do POP" / "no POP" / "ao POP"
      .replace(/\b([Dd]o|[Nn]o|[Aa]o|[Ee]m|[Uu]m|[Ee]ste|[Ee]sse)\s+POP\b/g, '$1 Auto Controle')
      .replace(/\b([Oo]s|[Dd]os|[Nn]os|[Aa]os)\s+POPs\b/g, '$1 Auto Controles')
      // "POP" isolado precedido por artigo ou contexto de procedimento
      .replace(/\bO\s+POP\b/g, 'O Auto Controle')
      .replace(/\bo\s+POP\b/g, 'o Auto Controle')
  )
}
