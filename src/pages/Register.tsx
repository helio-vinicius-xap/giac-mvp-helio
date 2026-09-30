import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  Wheat,
  User,
  Mail,
  Lock,
  Building2,
  FileText,
  Phone,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react'
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
  const { registerWithOrg } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Dados da Empresa / Organização
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [telefone, setTelefone] = useState('')

  // Dados do Administrador Master do Cliente
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('Administrador do Estabelecimento')
  const [conselhoClasse, setConselhoClasse] = useState('')
  const [cpf, setCpf] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
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

    if (!cnpj.trim()) {
      setError('Informe o CNPJ da empresa para vincular a assinatura.')
      return
    }

    setLoading(true)
    try {
      await registerWithOrg({
        name,
        email,
        pass: password,
        razao_social: razaoSocial,
        cnpj,
        nome_fantasia: nomeFantasia,
        telefone,
        cargo,
        conselho: conselhoClasse,
        cpf,
      })
      toast({
        title: 'Empresa cadastrada com sucesso!',
        description: 'Trial de 14 dias iniciado para seu CNPJ.',
      })
      setShowFirstRunModal(true)
    } catch (err: any) {
      setError(
        err.message ||
          'Falha ao registrar empresa e usuário. Verifique se o CNPJ ou e-mail já estão em uso.',
      )
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
      <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332] via-[#1B4332]/85 to-transparent" />

      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E2DCCF] overflow-hidden my-6">
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] p-6 text-center text-white">
          <div className="mx-auto mb-2 h-12 w-12 rounded-xl bg-[#D9A404] flex items-center justify-center text-[#1B4332] shadow-md">
            <Wheat className="h-6 w-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl font-bold font-['Sora'] tracking-tight">
            Criar Conta Empresarial no Sistema GIAC
          </h1>
          <p className="text-xs text-emerald-100/90 mt-1">
            Gestão Integrada de Autocontroles e BPF (IN 04/2007) • SaaS por CNPJ
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/80 text-[11px] text-[#D9A404] font-semibold border border-[#D9A404]/30">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Período de Avaliação Gratuita: 14 dias de Trial Inclusos</span>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SEÇÃO 1: DADOS DA EMPRESA (CNPJ) */}
            <div className="space-y-3 pb-3 border-b border-[#E2DCCF]">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#2D6A4F]" />
                <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  1. Dados da Organização / Fábrica
                </h2>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Razão Social *</Label>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Ex: NutriAgro Nutrição Animal Ltda."
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CNPJ *</Label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    required
                    className="h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Nome Fantasia</Label>
                  <Input
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: NutriAgro"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Telefone da Empresa</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 0000-0000"
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: DADOS DO ADMINISTRADOR DO CLIENTE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
                <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  2. Usuário Administrador da Empresa
                </h2>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dra. Mariana Siqueira"
                    required
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Cargo / Função</Label>
                  <Input
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ex: Coordenadora da Qualidade"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CRMV / CRQ (se RT)</Label>
                  <div className="relative">
                    <Award className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input
                      value={conselhoClasse}
                      onChange={(e) => setConselhoClasse(e.target.value)}
                      placeholder="CRMV-SP 00.000"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CPF</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">E-mail de Acesso *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com.br"
                      required
                      className="pl-9 h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Senha (min 8) *</Label>
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
                  <Label className="text-xs font-semibold text-stone-700">Confirmar Senha *</Label>
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
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-sm tracking-wide shadow-md mt-4 gap-2"
            >
              {loading ? 'Cadastrando Organização...' : 'Criar Empresa & Iniciar Trial Gratuito'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-stone-500">Sua fábrica já possui acesso? </span>
            <Link to="/login" className="text-xs font-bold text-[#2D6A4F] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de Primeiro Acesso */}
      <Dialog open={showFirstRunModal} onOpenChange={setShowFirstRunModal}>
        <DialogContent className="sm:max-w-[460px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <Wheat className="h-6 w-6 text-[#D9A404]" />
              Organização Cadastrada com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 pt-2 leading-relaxed">
              Sua empresa foi provisionada no sistema GIAC com isolamento exclusivo por CNPJ. Você
              já pode cadastrar seus responsáveis técnicos (RT, RQ, RE) e preencher seus dados no
              SIPEAGRO/MAPA.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <Button
              onClick={() => {
                setShowFirstRunModal(false)
                navigate('/empresa')
              }}
              className="w-full sm:w-auto bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Completar Dados SIPEAGRO
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowFirstRunModal(false)
                navigate('/')
              }}
              className="w-full sm:w-auto text-xs border-stone-300 text-stone-700"
            >
              Ir para o Painel Geral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
