import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  Building,
  Mail,
  Phone,
  User,
  FileCheck2,
  AlertTriangle,
  Send,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  getConvitePorToken,
  submeterPreCadastroPortal,
  type ConvitePortalFornecedor,
} from '@/services/portalFornecedorService'
import { getQuestionarioAtivo } from '@/services/autoAvaliacaoService'
import { validarCNPJ, formatarCNPJ, formatarTelefone, validarEmail } from '@/lib/pop01Validators'
import type { QuestionarioFornecedorDef } from '@/types/autoAvaliacaoFornecedor'

export default function PortalFornecedorPublicoPage() {
  const { token } = useParams<{ token: string }>()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [convite, setConvite] = useState<ConvitePortalFornecedor | null>(null)
  const [questionario, setQuestionario] = useState<QuestionarioFornecedorDef | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [submetendo, setSubmetendo] = useState(false)

  // Pré-Cadastro (Dados de Contato)
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [contatoNome, setContatoNome] = useState('')
  const [cargoContato, setCargoContato] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')

  // Seção 2: Tipo de Fornecedor & Categorias
  const [categoriaInsumo, setCategoriaInsumo] = useState('Matéria-Prima Vegetal')
  const [tipoFornecedor, setTipoFornecedor] = useState('Fabricante')
  const [produtosFornecidos, setProdutosFornecidos] = useState('')

  // Seção 3: Programas de Qualidade Declarados
  const [temBpf, setTemBpf] = useState(true)
  const [temAppcc, setTemAppcc] = useState(false)
  const [temIso, setTemIso] = useState(false)
  const [temRastreabilidade, setTemRastreabilidade] = useState(true)
  const [certificacoesOutras, setCertificacoesOutras] = useState('')

  // Seção 4: Respostas do Questionário de Avaliação (1 a 10)
  const [respostas, setRespostas] = useState<Record<string, string>>({})

  useEffect(() => {
    async function carregar() {
      if (!token) return
      setLoading(true)
      try {
        const [c, q] = await Promise.all([getConvitePorToken(token), getQuestionarioAtivo()])
        setConvite(c)
        setQuestionario(q)

        if (c) {
          if (c.fornecedor_cnpj) setCnpj(c.fornecedor_cnpj)
          if (c.fornecedor_nome) setRazaoSocial(c.fornecedor_nome)
          if (c.fornecedor_email) setEmail(c.fornecedor_email)
          if (c.status === 'PREENCHIDO' || c.status === 'VALIDADO_INTERNO') {
            setSucesso(true)
          }
        }

        // Inicializar respostas padrão (Conforme)
        const initialResps: Record<string, string> = {}
        if (q && Array.isArray(q.perguntas)) {
          q.perguntas.forEach((p) => {
            const key = String(p.id ?? p.numero)
            initialResps[key] = 'C'
          })
        }
        setRespostas(initialResps)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [token])

  const handleCnpjChange = (v: string) => {
    setCnpj(formatarCNPJ(v))
  }

  const handleTelefoneChange = (v: string) => {
    setTelefone(formatarTelefone(v))
  }

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    if (!validarCNPJ(cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Informe um CNPJ válido com 14 dígitos.',
        variant: 'destructive',
      })
      return
    }
    if (!validarEmail(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail corporativo válido.',
        variant: 'destructive',
      })
      return
    }
    if (!contatoNome || !razaoSocial || !telefone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os dados de contato do fornecedor.',
        variant: 'destructive',
      })
      return
    }

    setSubmetendo(true)
    try {
      // Calcular nota preliminar das respostas da seção 4
      let pontos = 0
      let totalMax = 0
      questionario?.perguntas?.forEach((p) => {
        const peso = p.peso ?? 1
        const key = String(p.id ?? p.numero)
        totalMax += peso
        const r = respostas[key]
        if (r === 'C') pontos += peso
        else if (r === 'PARC') pontos += peso * 0.5
      })
      const notaFinal = totalMax > 0 ? Math.round((pontos / totalMax) * 100) : 100

      await submeterPreCadastroPortal({
        token,
        dados_pre_cadastro: {
          cnpj,
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          contato_nome: contatoNome,
          cargo_contato: cargoContato,
          telefone,
          email,
        },
        respostas_questionario: {
          secao2_tipo_fornecedor: {
            categoria_insumo: categoriaInsumo,
            tipo_estabelecimento: tipoFornecedor,
            produtos_fornecidos: produtosFornecidos,
          },
          secao3_programas_qualidade: {
            tem_bpf: temBpf,
            tem_appcc: temAppcc,
            tem_iso: temIso,
            tem_rastreabilidade: temRastreabilidade,
            certificacoes_adicionais: certificacoesOutras,
          },
          secao4_respostas: respostas,
          nota_final_calculada: notaFinal,
        },
      })

      setSucesso(true)
      toast({
        title: 'Pré-Cadastro Enviado com Sucesso',
        description:
          'Seus dados e auto avaliação foram transmitidos para a equipe de Garantia da Qualidade.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' })
    } finally {
      setSubmetendo(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7EF] flex items-center justify-center p-4">
        <div className="text-center space-y-2 text-stone-600 text-xs">
          <ShieldCheck className="h-8 w-8 text-[#2D6A4F] animate-spin mx-auto" />
          <p>Carregando formulário do Portal do Fornecedor...</p>
        </div>
      </div>
    )
  }

  if (!convite) {
    return (
      <div className="min-h-screen bg-[#FAF7EF] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-stone-200 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
          <h2 className="text-base font-bold text-stone-800">Convite Inválido ou Expirado</h2>
          <p className="text-xs text-stone-600">
            O link de acesso ao formulário de pré-cadastro não foi localizado ou foi desativado.
            Entre em contato com a empresa compradora.
          </p>
        </div>
      </div>
    )
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#FAF7EF] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-emerald-200 text-center space-y-4 shadow-sm animate-fade-in-up">
          <CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-['Sora'] text-[#1B4332]">
              Pré-Cadastro & Auto Avaliação Enviados!
            </h2>
            <p className="text-xs text-stone-600">
              Obrigado pelo preenchimento. As informações e o questionário do{' '}
              <strong>POP 01-AC01</strong> foram recebidos com sucesso e estão em processo de
              validação interna pelo Responsável Técnico e Garantia da Qualidade.
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 text-left space-y-1">
            <div>
              <strong>Razão Social:</strong> {razaoSocial || convite.fornecedor_nome}
            </div>
            <div>
              <strong>CNPJ:</strong> {cnpj || convite.fornecedor_cnpj}
            </div>
            <div>
              <strong>Contato:</strong> {contatoNome} ({email})
            </div>
            <div className="text-[11px] text-emerald-800 pt-1">
              Status atual: <strong>Aguardando Validação e Homologação Interna</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF7EF] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header do Portal */}
        <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-6 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-[#D9A404]" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                Portal do Fornecedor • Autocontrole IN 04/2007
              </span>
              <h1 className="text-lg sm:text-xl font-bold font-['Sora']">
                Pré-Cadastro & Formulário de Auto Avaliação (POP 01-AC01)
              </h1>
            </div>
          </div>
          <p className="text-xs text-emerald-100 leading-relaxed pt-1">
            Preencha os dados cadastrais da sua empresa e responda às seções de qualificação
            sanitária e boas práticas de fabricação (BPF). Ao final, a equipe da Garantia da
            Qualidade validará os dados junto ao SIPEAGRO e emitirá o parecer de homologação.
          </p>
        </div>

        <form onSubmit={handleSubmeter} className="space-y-6">
          {/* SEÇÃO 1: PRÉ-CADASTRO DO FORNECEDOR */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Building className="h-5 w-5 text-[#2D6A4F]" />
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                1. Dados de Pré-Cadastro e Contato
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">CNPJ do Fornecedor *</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Razão Social Completa *
                </Label>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Nome empresarial conforme Receita/MAPA"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Nome Fantasia (Opcional)
                </Label>
                <Input
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Marca ou nome fantasia"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Nome do Contato Responsável *
                </Label>
                <Input
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  placeholder="Nome completo do responsável"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Cargo / Função do Contato
                </Label>
                <Input
                  value={cargoContato}
                  onChange={(e) => setCargoContato(e.target.value)}
                  placeholder="Ex: Gerente de Qualidade, Diretor"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Telefone / WhatsApp Comercial *
                </Label>
                <Input
                  value={telefone}
                  onChange={(e) => handleTelefoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  E-mail Corporativo de Contato *
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: TIPO DE FORNECEDOR E CATEGORIAS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <FileCheck2 className="h-5 w-5 text-[#2D6A4F]" />
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                2. Tipo de Fornecedor & Categoria de Produtos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Categoria de Insumos *
                </Label>
                <select
                  value={categoriaInsumo}
                  onChange={(e) => setCategoriaInsumo(e.target.value)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="Matéria-Prima Vegetal">
                    Matéria-Prima Vegetal (Grãos, Farelos, Óleos)
                  </option>
                  <option value="Matéria-Prima Mineral">
                    Matéria-Prima Mineral (Fosfatos, Calcários, Sal)
                  </option>
                  <option value="Premix / Núcleos">Premix / Núcleos / Concentrados</option>
                  <option value="Aditivos Nutricionais e Zootécnicos">
                    Aditivos Nutricionais e Zootécnicos
                  </option>
                  <option value="Embalagens e Sacarias">Embalagens, Sacarias e Rótulos</option>
                  <option value="Prestador de Serviço">
                    Prestador de Serviço (Transporte, Pragas, Calibração)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Tipo de Estabelecimento *
                </Label>
                <select
                  value={tipoFornecedor}
                  onChange={(e) => setTipoFornecedor(e.target.value)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="Fabricante">Fabricante / Indústria</option>
                  <option value="Distribuidor / Fracionador">Distribuidor / Fracionador</option>
                  <option value="Armazém Geral / Moega">Armazém Geral / Moega / Silo</option>
                  <option value="Importador">Importador</option>
                  <option value="Cooperativa Agropecuária">Cooperativa Agropecuária</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Produtos ou Insumos Fornecidos
                </Label>
                <Input
                  value={produtosFornecidos}
                  onChange={(e) => setProdutosFornecidos(e.target.value)}
                  placeholder="Ex: Farelo de Soja 46%, Milho Moído, Lisina HCL"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: PROGRAMAS DE QUALIDADE DECLARADOS */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <ShieldCheck className="h-5 w-5 text-[#2D6A4F]" />
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                3. Programas de Qualidade & Certificações Implantadas
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={temBpf}
                  onChange={(e) => setTemBpf(e.target.checked)}
                  className="rounded text-[#2D6A4F]"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Manual de Boas Práticas (BPF) Implementado
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={temAppcc}
                  onChange={(e) => setTemAppcc(e.target.checked)}
                  className="rounded text-[#2D6A4F]"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Plano APPCC / HACCP Validado
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={temRastreabilidade}
                  onChange={(e) => setTemRastreabilidade(e.target.checked)}
                  className="rounded text-[#2D6A4F]"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Sistema de Rastreabilidade e Lotes Auditável
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={temIso}
                  onChange={(e) => setTemIso(e.target.checked)}
                  className="rounded text-[#2D6A4F]"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Certificação ISO 9001 / FSSC 22000 / GMP+
                </span>
              </label>
            </div>

            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold text-stone-700">
                Outras Certificações / Selos de Qualidade
              </Label>
              <Input
                value={certificacoesOutras}
                onChange={(e) => setCertificacoesOutras(e.target.value)}
                placeholder="Ex: Certificado Orgânico, Não-OGM, Selo MAPA"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* SEÇÃO 4: QUESTIONÁRIO DE AUTO AVALIAÇÃO (POP 01-AC01) */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#D9A404]" />
                <div>
                  <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                    4. Questionário de Auto Avaliação Técnica
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Responda com veracidade aos 10 critérios da Instrução Normativa 04/2007.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                {questionario?.perguntas.length || 10} itens
              </Badge>
            </div>

            <div className="space-y-3 divide-y divide-stone-100">
              {questionario?.perguntas.map((p, idx) => {
                const itemKey = String(p.id ?? p.numero)
                const peso = p.peso ?? 1
                return (
                  <div key={itemKey} className="pt-3 space-y-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-stone-900">
                        Item {idx + 1}: {p.texto}
                      </span>
                      <Badge className="bg-stone-100 text-stone-600 text-[9px] shrink-0">
                        Peso {peso}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`resp_${itemKey}`}
                          value="C"
                          checked={respostas[itemKey] === 'C'}
                          onChange={() => setRespostas({ ...respostas, [itemKey]: 'C' })}
                          className="text-emerald-600"
                        />
                        <span className="text-emerald-800 font-semibold">Conforme (Sim)</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`resp_${itemKey}`}
                          value="PARC"
                          checked={respostas[itemKey] === 'PARC'}
                          onChange={() => setRespostas({ ...respostas, [itemKey]: 'PARC' })}
                          className="text-amber-600"
                        />
                        <span className="text-amber-800 font-semibold">Parcial</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name={`resp_${itemKey}`}
                          value="NC"
                          checked={respostas[itemKey] === 'NC'}
                          onChange={() => setRespostas({ ...respostas, [itemKey]: 'NC' })}
                          className="text-red-600"
                        />
                        <span className="text-red-800 font-semibold">Não Conforme (Não)</span>
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-stone-600">
              Ao enviar, você declara que os dados fornecidos representam com fidedignidade os
              processos operacionais e sanitários da empresa.
            </div>

            <Button
              type="submit"
              disabled={submetendo}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white font-bold text-xs h-10 px-6 gap-2 shrink-0 shadow-sm"
            >
              <Send className="h-4 w-4 text-[#D9A404]" />
              {submetendo ? 'Enviando...' : 'Transmitir Auto Avaliação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
