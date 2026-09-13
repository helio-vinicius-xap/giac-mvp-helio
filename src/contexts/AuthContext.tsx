import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UserProfile } from '@/types/agro'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  register: (
    name: string,
    email: string,
    pass: string,
    cargo?: string,
    role?: string,
    conselho?: string,
    cpf?: string,
  ) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
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
      }
    }
    return null
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const updateUserState = () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      setUser({
        id: rec.id,
        email: rec.email || '',
        name: rec.get ? rec.get('name') : rec['name'] || 'Usuário Agro',
        cargo: rec.get ? rec.get('cargo') : rec['cargo'] || 'Responsável Técnico',
        role: (rec.get ? rec.get('role') : rec['role']) || 'RT',
        conselho_classe: rec.get ? rec.get('conselho_classe') : rec['conselho_classe'],
        cpf: rec.get ? rec.get('cpf') : rec['cpf'],
        telefone: rec.get ? rec.get('telefone') : rec['telefone'],
        avatar: rec.get ? rec.get('avatar') : rec['avatar'],
      })
    } else {
      setUser(null)
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

  const register = async (
    name: string,
    email: string,
    pass: string,
    cargo?: string,
    role?: string,
    conselho?: string,
    cpf?: string,
  ) => {
    const created = await pb.collection('users').create({
      email,
      password: pass,
      passwordConfirm: pass,
      name,
      cargo: cargo || 'Responsável Técnico',
      role: role || 'RT',
      conselho_classe: conselho || '',
      cpf: cpf || '',
    })

    await pb.collection('users').authWithPassword(email, pass)
    await pb.collection('users').update(created.id, {
      name,
      cargo: cargo || 'Responsável Técnico',
      role: role || 'RT',
      conselho_classe: conselho || '',
      cpf: cpf || '',
    })
    updateUserState()
  }

  const logout = () => {
    pb.authStore.clear()
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
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
