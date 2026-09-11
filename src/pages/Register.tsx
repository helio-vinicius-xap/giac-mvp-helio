import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Wheat, User, Mail, Lock, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('Responsável Técnico')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // First-run modal state
  const [showFirstRunModal, setShowFirstRunModal] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password, cargo)
      toast({
        title: 'Conta criada com sucesso',
        description: 'Bem-vindo ao sistema de Gestão Agro APPCC.',
      })
      setShowFirstRunModal(true)
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar conta. Verifique os dados informados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-stone-900 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105"
        style={{
          backgroundImage: `url('https://img.usecurling.com/p/1920/1080?q=farmland%20corn%20plantation&color=green')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332] via-[#1B4332]/80 to-transparent" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E2DCCF] overflow-hidden">
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] p-6 text-center text-white">
          <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-[#D9A404] flex items-center justify-center text-[#1B4332] shadow-md">
            <Wheat className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-bold font-['Sora'] tracking-tight">Criar Conta no Sistema</h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Gestão Integrada de Autocontroles e BPF (IN 04/2007)
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Hélio Silva"
                  required
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Cargo / Função</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Responsável Técnico, Auditor, Gestor"
                  required
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">E-mail Corporativo</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@agro.com.br"
                  required
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Senha (min 8)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-sm tracking-wide shadow-md mt-2"
            >
              {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-stone-500">Já possui uma conta ativa? </span>
            <Link to="/login" className="text-xs font-bold text-[#2D6A4F] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      {/* First-Run Modal */}
      <Dialog open={showFirstRunModal} onOpenChange={setShowFirstRunModal}>
        <DialogContent className="sm:max-w-[450px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <Wheat className="h-6 w-6 text-[#D9A404]" />
              Configuração Inicial Concluída!
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 pt-2 leading-relaxed">
              Sua conta foi criada no sistema de Gestão Agro Documental. Você pode começar
              cadastrando um novo procedimento operacional (POP) ou navegando diretamente pela Visão
              Geral do sistema.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFirstRunModal(false)
                navigate('/')
              }}
              className="w-full sm:w-auto text-xs border-stone-300 text-stone-700"
            >
              Explorar visão geral
            </Button>
            <Button
              onClick={() => {
                setShowFirstRunModal(false)
                navigate('/procedimentos?novo=true')
              }}
              className="w-full sm:w-auto bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Criar procedimento inicial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
