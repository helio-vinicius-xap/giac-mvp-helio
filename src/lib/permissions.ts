import type { UserRole } from '@/types/agro'

/**
 * Utilitário central de autorizações e hierarquia do GIAC:
 * HIERARQUIA:
 * 1. super_admin: Acesso global irrestrito
 * 2. RE (Responsável pelo Estabelecimento registrado no MAPA):
 *    - Autoridade máxima no cliente
 *    - Possui TODAS as permissões de RT em todos os formulários e registros
 *    - Único que pode assinar como RE, e pode substituir RT e RQ
 * 3. admin_cliente: Gestor administrativo e técnico da própria organização (mesmo poder de RT/RE dentro da org)
 * 4. RT (Responsável Técnico):
 *    - Homologação técnica e assinatura obrigatória em todos os POPs e registros
 * 5. RQ (Responsável pela Qualidade):
 *    - Verificação de qualidade (Assinatura 2) e gestão de BPF
 * 6. Demais perfis (operador, auditor, setor):
 *    - Preenchem e assinam execução de campo
 */

export function canManagePopForms(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase()
  return (
    r === 'super_admin' ||
    r === 'admin_cliente' ||
    r === 'admin' ||
    r === 're' ||
    r === 'rt' ||
    r === 'rq'
  )
}

export function canSignAsRT(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase()
  // RE e admin_cliente possuem plenos poderes do RT
  return r === 'super_admin' || r === 'admin_cliente' || r === 'admin' || r === 're' || r === 'rt'
}

export function canSignAsRE(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase()
  return r === 'super_admin' || r === 'admin_cliente' || r === 're'
}

export function canSignAsRQ(role?: string | null): boolean {
  if (!role) return false
  const r = role.toLowerCase()
  // RE e admin_cliente podem supervisionar/substituir RQ
  return r === 'super_admin' || r === 'admin_cliente' || r === 're' || r === 'rq'
}

export function canSignExecution(role?: string | null): boolean {
  // Qualquer usuário autenticado pode assinar a execução/preenchimento de campo
  return Boolean(role)
}

export function canDeleteRecord(role?: string | null, isComprovado = false): boolean {
  if (isComprovado) {
    // Registros comprovados não podem ser excluídos fisicamente para evitar fraude
    return false
  }
  const r = (role || '').toLowerCase()
  return r === 'super_admin' || r === 'admin_cliente' || r === 're'
}
