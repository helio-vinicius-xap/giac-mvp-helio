// Utilitários de validação (CNPJ, CPF, Email, Datas) e geradores de números automáticos

export function validarCNPJ(cnpjRaw: string): boolean {
  if (!cnpjRaw) return false
  const cnpj = cnpjRaw.replace(/\D/g, '')
  if (cnpj.length !== 14) return false

  // Elimina conhecidos inválidos
  if (/^(\d)\1{13}$/.test(cnpj)) return false

  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  const digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false

  tamanho = tamanho + 1
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1), 10)) return false

  return true
}

export function formatarCNPJ(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 14)
  if (!digits) return ''
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function formatarCPF(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

export function formatarTelefone(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function validarEmail(email: string): boolean {
  if (!email) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// Gerador de códigos: REC-YYYYMMDD-NNNNN, AMS-YYYYMMDD-NNNNN, LAB-YYYYMMDD-NNNNN, DES-YYYYMMDD-NNNNN, AC-YYYYMMDD-NNNNN
export function gerarCodigoRegistro(
  prefixo: 'REC' | 'AMS' | 'LAB' | 'DES' | 'AC',
  seq = 1,
): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const dateStr = `${yyyy}${mm}${dd}`
  const seqStr = String(seq).padStart(5, '0')
  return `${prefixo}-${dateStr}-${seqStr}`
}

export function calcularValidade2Anos(dataIso = new Date()): string {
  const d = new Date(dataIso)
  d.setFullYear(d.getFullYear() + 2)
  return d.toISOString().split('T')[0]
}

export function calcularDiasAteVencimento(dataVenc: string): number {
  if (!dataVenc) return 9999
  const venc = new Date(dataVenc).getTime()
  const hoje = new Date().setHours(0, 0, 0, 0)
  return Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24))
}
