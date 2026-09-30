import React from 'react'
import { ShieldCheck, History } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { canViewAuditHistory } from '@/lib/permissions'
import { AuditTrailGlobal } from '@/components/AuditTrailGlobal'

export default function AuditTrailPage() {
  const { user, isSuperAdmin } = useAuth()

  // Se for super_admin sem organização vinculada fixa, exibe todas; caso contrário, fixa na organização atual
  const orgId = isSuperAdmin ? undefined : user?.organization

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-[#D9A404]" />
            Trilha de Auditoria & Integridade Imutável
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Registro anti-falsificação de todas as inserções, alterações e assinaturas digitais
            conforme a IN MAPA 04/2007.
          </p>
        </div>
      </div>

      {/* Componente de Trilha */}
      <AuditTrailGlobal
        forcedOrganizationId={orgId}
        title={
          isSuperAdmin
            ? 'Trilha Global de Auditoria (Todas as Empresas)'
            : 'Livro de Auditoria da Organização'
        }
        subtitle={
          isSuperAdmin
            ? 'Visão consolidada para super administradores com busca multi-tenant, filtros por coleção, ação e período.'
            : 'Registros imutáveis gerados automaticamente para auditoria fiscal e conformidade da sua fábrica.'
        }
      />
    </div>
  )
}
