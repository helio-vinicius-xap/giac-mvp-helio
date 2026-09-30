import type { UserRole } from '@/types/agro'

/**
 * Utilitário central de autorizações e hierarquia do GIAC:
 * HIERARQUIA DO PRODUTO:
 * 1. super_admin: Acesso global irrestrito em qualquer organização/cliente
 * 2. RE (Responsável pelo Estabelecimento registrado no MAPA):
 *    - Autoridade máxima no cliente
 *    - Possui TODAS as permissões de RT em todos os formulários, POPs e registros
 *    - É o único que pode substituir e retificar o que o RT faz
 *    - Pode assinar como RE, como RT (em substituição) e como RQ (em supervisão)
 * 3. admin_cliente: Gestor administrativo e técnico da própria organização (mesmos poderes plenos de RE/RT no seu tenant)
 * 4. RT (Responsável Técnico habilitado no CRMV/Conselho):
 *    - Homologação técnica e assinatura obrigatória em todos os POPs e registros (Assinatura 1)
 *    - Criação e edição de procedimentos e formulários técnicos
 *    - Não pode assinar como RE
 * 5. RQ (Responsável pela Qualidade):
 *    - Verificação de conformidade e BPF (Assinatura 2 obrigatória da dupla régua RT/RE + RQ)
 *    - Gestão de não conformidades, devoluções e auditorias internas
 * 6. Demais perfis (operador, auditor, setor):
 *    - Apenas preenchimento de formulários de campo e assinatura de execução
 *
 * REGRA PERMANENTE DO PRODUTO:
 * Todo POP e todo Registro tem régua mandatória de dupla assinatura:
 * - Assinatura 1: RT ou RE
 * - Assinatura 2: RQ
 */

export function normalizeRole(role?: string | null): string {
  if (!role) return ''
  return role.toLowerCase().trim()
}

/**
 * Verifica se o usuário tem privilégios de gestão técnica de POPs,
 * construtor de formulários customizados, criação/edição de anexos e auditorias.
 * Permitido: super_admin, RE, admin_cliente, RT e RQ.
 */
export function canManagePopForms(role?: string | null): boolean {
  const r = normalizeRole(role)
  return (
    r === 'super_admin' ||
    r === 'admin_cliente' ||
    r === 'admin' ||
    r === 're' ||
    r === 'rt' ||
    r === 'rq'
  )
}

/**
 * Verifica se o usuário tem privilégios de edição avançada/exclusão de formulários customizados
 * e estruturas normativas: super_admin, admin_cliente, RE e RT.
 */
export function canEditPopStructure(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're' || r === 'rt'
}

/**
 * Assinatura 1: Homologação Técnica obrigatória em POPs e Registros.
 * RE e admin_cliente possuem TODOS os poderes do RT e podem homologar ou substituir formalmente.
 */
export function canSignAsRT(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're' || r === 'rt'
}

/**
 * Assinatura específica do Responsável pelo Estabelecimento (RE registrado no MAPA).
 * Apenas RE, admin_cliente e super_admin possuem essa autoridade.
 */
export function canSignAsRE(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're'
}

/**
 * Assinatura 2: Verificação da Qualidade (RQ).
 * RQ assina a verificação; RE e admin_cliente podem supervisionar/substituir.
 */
export function canSignAsRQ(role?: string | null): boolean {
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're' || r === 'rq'
}

/**
 * Qualquer usuário autenticado (incluindo operador de linha ou setor) pode assinar
 * a execução / preenchimento do formulário.
 */
export function canSignExecution(role?: string | null): boolean {
  return Boolean(role)
}

/**
 * Regra para exclusão física de registros:
 * Se já foi comprovado (com assinaturas RT/RE + RQ), NENHUM usuário pode excluir fisicamente
 * para impedir fraude e atender à IN 04/2007 do MAPA.
 * Se pendente, apenas super_admin, admin_cliente ou RE podem excluir.
 */
export function canDeleteRecord(role?: string | null, isComprovado = false): boolean {
  if (isComprovado) {
    return false
  }
  const r = normalizeRole(role)
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're'
}

/**
 * Quem pode visualizar a Trilha de Auditoria & Integridade do registro/POP:
 * RE, RT, RQ, admin_cliente e super_admin.
 */
export function canViewAuditHistory(role?: string | null): boolean {
  const r = normalizeRole(role)
  return (
    r === 'super_admin' ||
    r === 'admin_cliente' ||
    r === 'admin' ||
    r === 're' ||
    r === 'rt' ||
    r === 'rq'
  )
}

/**
 * Avalia se o registro possui dupla assinatura válida e comprovada:
 * Assinatura 1 = RT ou RE
 * Assinatura 2 = RQ
 */
export function isRecordFullySigned(
  signatures?: {
    rt?: any
    re?: any
    rq?: any
    [key: string]: any
  } | null,
): boolean {
  if (!signatures) return false
  const hasAssinatura1 = Boolean(signatures.rt || signatures.re)
  const hasAssinatura2 = Boolean(signatures.rq)
  return hasAssinatura1 && hasAssinatura2
}

/**
 * Retorna o status descritivo da régua de assinatura
 */
export function getSignatureStatusLabel(
  signatures?: {
    rt?: any
    re?: any
    rq?: any
    [key: string]: any
  } | null,
): {
  isComprovado: boolean
  label: string
  missing: 'nenhum' | 'rt_ou_re' | 'rq' | 'ambos'
} {
  if (!signatures) {
    return { isComprovado: false, label: 'Pendente RT/RE + RQ', missing: 'ambos' }
  }
  const hasAssinatura1 = Boolean(signatures.rt || signatures.re)
  const hasAssinatura2 = Boolean(signatures.rq)

  if (hasAssinatura1 && hasAssinatura2) {
    return { isComprovado: true, label: 'Comprovado (RT/RE + RQ)', missing: 'nenhum' }
  }
  if (hasAssinatura1) {
    return { isComprovado: false, label: 'Pendente RQ (Assinatura 2)', missing: 'rq' }
  }
  if (hasAssinatura2) {
    return { isComprovado: false, label: 'Pendente RT/RE (Assinatura 1)', missing: 'rt_ou_re' }
  }
  return { isComprovado: false, label: 'Pendente RT/RE + RQ', missing: 'ambos' }
}
