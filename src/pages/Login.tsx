import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Wheat, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [email, setEmail] = useState('helio@dpharma.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)
    setLoading(true)

    try {
      await login(email, password)
      toast({
        title: 'Acesso autorizado',
        description: 'Bem-vindo ao sistema Gestão Agro APPCC.',
      })
      navigate('/')
    } catch (err: any) {
      setServerError(err.message || 'Falha na autenticação. Verifique suas credenciais de acesso.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    toast({
      title: 'Acesso Google (OAuth)',
      description: 'Use o acesso rápido pré-configurado com as credenciais abaixo.',
    })
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-stone-900 overflow-hidden">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition duration-1000"
        style={{
          backgroundImage: `url('https://img.usecurling.com/p/1920/1080?q=farmland%20soybean%20field&color=green')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332] via-[#1B4332]/80 to-transparent" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2DCCF] overflow-hidden">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] p-6 text-center text-white">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-[#D9A404] flex items-center justify-center text-[#1B4332] shadow-lg">
            <Wheat className="h-8 w-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold font-['Sora'] tracking-tight">Gestão Agro APPCC</h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Autocontrole e Qualidade na Alimentação Animal • IN 04/2007
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Server Error Alert */}
          {serverError && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-stone-700">
                E-mail Profissional
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@empresa.com.br"
                  required
                  className="pl-9 h-10 text-sm border-[#E2DCCF] focus-visible:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-stone-700">
                  Senha de Acesso
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-9 h-10 text-sm border-[#E2DCCF] focus-visible:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-sm tracking-wide shadow-md transition-all active:scale-[0.98]"
            >
              {loading ? 'Validando acesso...' : 'Entrar no Sistema'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          {/* Social login */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-stone-400 font-medium">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full h-10 border-stone-300 text-stone-700 font-medium text-xs hover:bg-stone-50 gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Acessar com Google
          </Button>

          {/* Hint credential box */}
          <div className="bg-[#FAF7EF] border border-[#E2DCCF] rounded-lg p-3 text-xs text-stone-700">
            <span className="font-semibold text-[#2D6A4F] block mb-0.5">Dica de Acesso:</span>
            <code className="text-stone-800 bg-stone-200/60 px-1 py-0.5 rounded text-[11px]">
              helio@dpharma.com.br
            </code>{' '}
            /{' '}
            <code className="text-stone-800 bg-stone-200/60 px-1 py-0.5 rounded text-[11px]">
              Skip@Pass
            </code>
          </div>

          <div className="text-center pt-2">
            <span className="text-xs text-stone-500">Não possui uma conta? </span>
            <Link to="/register" className="text-xs font-bold text-[#2D6A4F] hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
