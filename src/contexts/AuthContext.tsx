import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserProfile } from '@/types/agro'

interface AuthContextType {
  user: UserProfile | null
  currentOrg: any | null
  impersonatedOrg: any | null
  isLoading: boolean
  isSuperAdmin: boolean
  isBlocked: boolean
  blockReason: string | null
  trialDaysLeft: number | null
  login: (email: string, pass: string) => Promise<void>
  registerWithOrg: (data: {
    name: string
    email: string
    pass: string
    razao_social: string
    cnpj: string
    nome_fantasia?: string
    telefone?: string
    cargo?: string
    conselho?: string
    cpf?: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  startImpersonation: (org: any) => Promise<void>
  stopImpersonation: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      return {
        id: rec.id,
        email: rec.email || '',
        name: rec.get ? rec.get('name') : rec['name'],
        cargo: rec.get ? rec.get('cargo') : rec['cargo'],
        role: (rec.get ? rec.get('role') : rec['role']) || 'RT',
        conselho_classe: rec.get ? rec.get('conselho_classe') : rec['conselho_classe'],
        cpf: rec.get ? rec.get('cpf') : rec['cpf'],
        telefone: rec.get ? rec.get('telefone') : rec['telefone'],
        avatar: rec.get ? rec.get('avatar') : rec['avatar'],
        organization: rec.get ? rec.get('organization') : rec['organization'],
      }
    }
    return null
  })
  const [currentOrg, setCurrentOrg] = useState<any | null>(null)
  const [impersonatedOrg, setImpersonatedOrg] = useState<any | null>(() => {
    try {
      const stored = localStorage.getItem('giac_impersonated_org')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const isSuperAdmin = user?.role === 'super_admin'

  // Checagem de bloqueio por inadimplência ou trial expirado
  let isBlocked = false
  let blockReason: string | null = null
  let trialDaysLeft: number | null = null

  if (currentOrg && !isSuperAdmin) {
    if (currentOrg.status === 'suspensa' || currentOrg.status === 'cancelada') {
      isBlocked = true
      blockReason =
        currentOrg.suspension_reason || 'Acesso suspenso por pendência financeira na assinatura.'
    } else if (currentOrg.status === 'trial' && currentOrg.trial_ends_at) {
      const end = new Date(currentOrg.trial_ends_at).getTime()
      const now = Date.now()
      const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
      trialDaysLeft = diffDays
      if (diffDays < 0) {
        isBlocked = true
        blockReason =
          'O período de testes (Trial de 14 dias) expirou. Ative sua assinatura para continuar.'
      }
    }
  }

  const loadOrganizationDetails = async (orgId: string) => {
    try {
      const org = await pb.collection('organizations').getOne(orgId, { expand: 'plan' })
      setCurrentOrg(org)
    } catch {
      setCurrentOrg(null)
    }
  }

  const updateUserState = async () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      const orgId = rec.get ? rec.get('organization') : rec['organization']
      const activeUser: UserProfile = {
        id: rec.id,
        email: rec.email || '',
        name: rec.get ? rec.get('name') : rec['name'] || 'Usuário Agro',
        cargo: rec.get ? rec.get('cargo') : rec['cargo'] || 'Responsável Técnico',
        role: (rec.get ? rec.get('role') : rec['role']) || 'RT',
        conselho_classe: rec.get ? rec.get('conselho_classe') : rec['conselho_classe'],
        cpf: rec.get ? rec.get('cpf') : rec['cpf'],
        telefone: rec.get ? rec.get('telefone') : rec['telefone'],
        avatar: rec.get ? rec.get('avatar') : rec['avatar'],
        organization: orgId,
      }
      setUser(activeUser)

      const effectiveOrgId = impersonatedOrg ? impersonatedOrg.id : orgId
      if (effectiveOrgId) {
        await loadOrganizationDetails(effectiveOrgId)
      } else {
        setCurrentOrg(null)
      }
    } else {
      setUser(null)
      setCurrentOrg(null)
    }
  }

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      updateUserState()
    })
    updateUserState()
    setIsLoading(false)
    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    updateUserState()
  }

  const registerWithOrg = async (data: {
    name: string
    email: string
    pass: string
    razao_social: string
    cnpj: string
    nome_fantasia?: string
    telefone?: string
    cargo?: string
    conselho?: string
    cpf?: string
  }) => {
    // 1. Obter plano padrão
    let defaultPlanId = ''
    try {
      const plan = await pb.collection('plans').getFirstListItem('code="plano-padrao"')
      defaultPlanId = plan.id
    } catch {
      /* ignore */
    }

    // 2. Criar organização no backend com Trial de 14 dias
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const newOrg = await pb.collection('organizations').create({
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || data.razao_social,
      cnpj: data.cnpj,
      status: 'trial',
      plan: defaultPlanId || null,
      trial_ends_at: trialEnd,
      billing_email: data.email,
      billing_name: data.name,
      billing_phone: data.telefone || '',
      payment_method_preference: 'BOLETO',
    })

    // 3. Criar usuário admin_cliente vinculado à organização
    const userRole = 'admin_cliente'
    const createdUser = await pb.collection('users').create({
      email: data.email,
      password: data.pass,
      passwordConfirm: data.pass,
      name: data.name,
      cargo: data.cargo || 'Administrador da Organização',
      role: userRole,
      conselho_classe: data.conselho || '',
      cpf: data.cpf || '',
      telefone: data.telefone || '',
      organization: newOrg.id,
    })

    // 4. Autenticar
    await pb.collection('users').authWithPassword(data.email, data.pass)

    // 5. Criar registro inicial da company para os dados do SIPEAGRO
    try {
      await pb.collection('company').create({
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || '',
        cnpj: data.cnpj,
        numero_registro_mapa: '',
        telefone: data.telefone || '',
        email: data.email,
        organization: newOrg.id,
      })
    } catch {
      /* ignore */
    }

    await updateUserState()
  }

  const startImpersonation = async (org: any) => {
    if (!isSuperAdmin) return
    try {
      await pb.send('/backend/v1/admin/support-login', {
        method: 'POST',
        body: { organization_id: org.id, action: 'enter' },
      })
    } catch {
      /* ignore */
    }
    setImpersonatedOrg(org)
    localStorage.setItem('giac_impersonated_org', JSON.stringify(org))
    await loadOrganizationDetails(org.id)
  }

  const stopImpersonation = async () => {
    if (impersonatedOrg) {
      try {
        await pb.send('/backend/v1/admin/support-login', {
          method: 'POST',
          body: { organization_id: impersonatedOrg.id, action: 'exit' },
        })
      } catch {
        /* ignore */
      }
    }
    setImpersonatedOrg(null)
    localStorage.removeItem('giac_impersonated_org')
    if (user?.organization) {
      await loadOrganizationDetails(user.organization)
    } else {
      setCurrentOrg(null)
    }
  }

  const logout = () => {
    pb.authStore.clear()
    localStorage.removeItem('giac_impersonated_org')
    setImpersonatedOrg(null)
    setCurrentOrg(null)
    setUser(null)
  }

  const refreshUser = async () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      try {
        const refreshed = await pb.collection('users').getOne(pb.authStore.record.id)
        setUser({
          id: refreshed.id,
          email: refreshed.email || '',
          name: refreshed.name || 'Usuário Agro',
          cargo: refreshed.cargo || 'Responsável Técnico',
          role: (refreshed.role as any) || 'RT',
          conselho_classe: refreshed.conselho_classe,
          cpf: refreshed.cpf,
          telefone: refreshed.telefone,
          avatar: refreshed.avatar,
        })
      } catch {
        /* intentionally ignored */
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        impersonatedOrg,
        isLoading,
        isSuperAdmin,
        isBlocked,
        blockReason,
        trialDaysLeft,
        login,
        registerWithOrg,
        logout,
        refreshUser,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return ctx
}
