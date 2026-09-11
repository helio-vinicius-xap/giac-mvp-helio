import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#2D6A4F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-[#2D6A4F] font-['Sora']">
            Carregando sistema Gestão Agro...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
