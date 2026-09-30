import React, { useState } from 'react'
import {
  Users,
  PlusCircle,
  Search,
  FileCheck,
  Mail,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { formatarCNPJ, validarCNPJ } from '@/lib/pop01Validators'
import { useToast } from '@/hooks/use-toast'
import { criarOuAtualizarFornecedor } from '@/services/paasoService'
import type { FornecedorItem, QualificacaoItem } from '@/types/paaso'

interface FornecedoresViewProps {
  fornecedores: FornecedorItem[]
  onDataChanged: () => void
  onAbrirQualificacao: (fornecedor: FornecedorItem) => void
  onAbrirBancoValidados?: () => void
}

export function FornecedoresView({
  fornecedores,
  onDataChanged,
  onAbrirQualificacao,
  onAbrirBancoValidados,
}: FornecedoresViewProps) {
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroUf, setFiltroUf] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  // Modal Novo/Editar Fornecedor
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formFornecedor, setFormFornecedor] = useState<Partial<FornecedorItem>>({
    cnpj: '',
    razao_social: '',
    contato_nome: '',
    email: '',
    telefone: '',
    uf: '',
    municipio: '',
    observacoes: '',
  })

  // Cálculos de Revalidação em 1 ano (≤ 60 dias e expirados)
  const hoje = new Date().toISOString().split('T')[0]
  const fornecedoresParaRevalidar = React.useMemo(() => {
    return fornecedores
      .filter((f) => {
        if (!f.qualificacao_vigente?.validade) return false
        const valOnly = f.qualificacao_vigente.validade.split('T')[0]
        const diffMs = new Date(valOnly).getTime() - new Date(hoje).getTime()
        const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
        // Vencidas (< 0) ou a vencer em até 60 dias
        return dias <= 60
      })
      .map((f) => {
        const valOnly = f.qualificacao_vigente!.validade.split('T')[0]
        const diffMs = new Date(valOnly).getTime() - new Date(hoje).getTime()
        const dias = Math.round(diffMs / (1000 * 60 * 60 * 24))
        return {
          fornecedor: f,
          diasRestantes: dias,
          isExpirado: dias <= 0 || f.qualificacao_vigente?.status_vigencia === 'VENCIDA',
        }
      })
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
  }, [fornecedores, hoje])

  // Lista única de UFs para o filtro
  const ufsDisponiveis = Array.from(new Set(fornecedores.map((f) => f.uf).filter(Boolean))).sort()

  const filtrados = fornecedores.filter((f) => {
    const termo = busca.toLowerCase()
    const matchBusca =
      !termo ||
      f.cnpj.includes(termo) ||
      formatarCNPJ(f.cnpj).includes(termo) ||
      f.razao_social.toLowerCase().includes(termo) ||
      (f.municipio && f.municipio.toLowerCase().includes(termo))

    const matchUf = !filtroUf || f.uf?.toUpperCase() === filtroUf.toUpperCase()

    let matchStatus = true
    if (filtroStatus === 'VIGENTE') {
      matchStatus = f.qualificacao_vigente?.status_vigencia === 'VIGENTE'
    } else if (filtroStatus === 'VENCIDA') {
      matchStatus = f.qualificacao_vigente?.status_vigencia === 'VENCIDA'
    } else if (filtroStatus === 'SEM_QUALIFICACAO') {
      matchStatus = !f.qualificacao_vigente
    }

    return matchBusca && matchUf && matchStatus
  })

  const handleSalvarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formFornecedor.cnpj) {
      toast({ title: 'CNPJ obrigatório', variant: 'destructive' })
      return
    }

    if (!validarCNPJ(formFornecedor.cnpj)) {
      toast({
        title: 'CNPJ inválido',
        description: 'Os dígitos verificadores do CNPJ informado não conferem.',
        variant: 'destructive',
      })
      return
    }

    if (!formFornecedor.razao_social?.trim()) {
      toast({ title: 'Razão social obrigatória', variant: 'destructive' })
      return
    }

    setSalvando(true)
    try {
      await criarOuAtualizarFornecedor(formFornecedor)
      toast({
        title: 'Fornecedor cadastrado com sucesso',
        description: `${formFornecedor.razao_social} registrado no sistema.`,
      })
      setModalOpen(false)
      setFormFornecedor({
        cnpj: '',
        razao_social: '',
        contato_nome: '',
        email: '',
        telefone: '',
        uf: '',
        municipio: '',
        observacoes: '',
      })
      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar fornecedor',
        description: err.message || 'Verifique as informações fornecidas.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Gera link mailto para enviar link ao fornecedor
  const gerarMailtoLink = (f: FornecedorItem) => {
    const subject = encodeURIComponent(
      `PAASO / GIAC - Formulário de Qualificação de Fornecedor: ${f.razao_social}`,
    )
    const body = encodeURIComponent(
      `Prezado(a) ${f.contato_nome || 'Responsável'},\n\n` +
        `Solicitamos o preenchimento e confirmação dos dados cadastrais e registro oficial no SIPEAGRO/MAPA para o processo anual de qualificação de fornecedores do nosso estabelecimento.\n\n` +
        `Dados cadastrados:\n` +
        `CNPJ: ${formatarCNPJ(f.cnpj)}\n` +
        `Razão Social: ${f.razao_social}\n\n` +
        `Por favor, envie o número de registro oficial no SIPEAGRO e a relação de produtos fornecidos para conclusão da homologação técnica.\n\n` +
        `Atenciosamente,\n` +
        `Garantia da Qualidade / Responsável Técnico`,
    )
    return `mailto:${f.email || ''}?subject=${subject}&body=${body}`
  }

  // Render do badge de status de qualificação
  const renderStatusBadge = (q?: QualificacaoItem) => {
    if (!q) {
      return (
        <Badge variant="outline" className="border-stone-300 text-stone-500 text-[10px]">
          Sem Qualificação
        </Badge>
      )
    }

    if (q.status_vigencia === 'VENCIDA') {
      return (
        <Badge className="bg-red-700 text-white text-[10px] gap-1">
          <Clock className="h-3 w-3" /> VENCIDA
        </Badge>
      )
    }

    if (q.resultado === 'APROVADO') {
      return (
        <Badge className="bg-emerald-700 text-white text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> APROVADO
        </Badge>
      )
    }

    if (q.resultado === 'APROVADO_COM_RESSALVA') {
      return (
        <Badge className="bg-amber-600 text-white text-[10px] gap-1">
          <AlertTriangle className="h-3 w-3" /> COM RESSALVA
        </Badge>
      )
    }

    if (q.resultado === 'REPROVADO') {
      return (
        <Badge className="bg-red-700 text-white text-[10px] gap-1">
          <XCircle className="h-3 w-3" /> REPROVADO
        </Badge>
      )
    }

    return <Badge className="bg-stone-500 text-white text-[10px] gap-1">PENDENTE</Badge>
  }

  return (
    <div className="space-y-6">
      {/* 1. Header com Busca e Novo Fornecedor */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <Users className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
              Fornecedores Homologados e Cadastrados
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Gestão de fornecedores de matérias-primas e insumos com monitoramento de vigência da
            qualificação, devoluções e não conformidades.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onAbrirBancoValidados && (
            <Button
              variant="outline"
              onClick={onAbrirBancoValidados}
              className="border-[#D9A404] text-[#1B4332] hover:bg-[#FAF7EF] font-semibold text-xs h-9 gap-2 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#D9A404]" />
              Banco Fornecedor Validado
            </Button>
          )}

          <Button
            onClick={() => {
              setFormFornecedor({
                cnpj: '',
                razao_social: '',
                contato_nome: '',
                email: '',
                telefone: '',
                uf: '',
                municipio: '',
                observacoes: '',
              })
              setModalOpen(true)
            }}
            className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs h-9 gap-2 shadow-sm shrink-0"
          >
            <PlusCircle className="h-4 w-4 text-[#D9A404]" />
            Cadastrar Fornecedor
          </Button>
        </div>
      </div>

      {/* SEÇÃO / ALERTA: FORNECEDORES A REVALIDAR (VENCIDOS OU VENCENDO EM ≤ 60 DIAS) */}
      {fornecedoresParaRevalidar.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="h-5 w-5 text-[#D9A404] shrink-0" />
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                  Fornecedores a Revalidar (Prazo de 1 Ano Expirado ou Próximo)
                </h3>
                <p className="text-xs text-stone-600">
                  Todo fornecedor deve ser revalidado em 1 ano. Abaixo constam fornecedores que
                  expiram em ≤ 60 dias ou já expirados.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
              {fornecedoresParaRevalidar.length} pendência
              {fornecedoresParaRevalidar.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {fornecedoresParaRevalidar.map(({ fornecedor, diasRestantes, isExpirado }) => (
              <div
                key={fornecedor.cnpj}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 bg-white ${
                  isExpirado ? 'border-red-300 shadow-xs' : 'border-amber-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-bold text-xs text-[#1B4332] truncate"
                      title={fornecedor.razao_social}
                    >
                      {fornecedor.razao_social}
                    </span>
                    {isExpirado ? (
                      <Badge className="bg-red-700 text-white text-[9px] shrink-0">EXPIRADO</Badge>
                    ) : (
                      <Badge className="bg-amber-600 text-white text-[9px] shrink-0">
                        {diasRestantes} DIAS
                      </Badge>
                    )}
                  </div>
                  <p className="font-mono text-[10px] text-stone-500 mt-0.5">
                    {formatarCNPJ(fornecedor.cnpj)} • {fornecedor.uf || 'UF'}
                  </p>
                  <p className="text-[11px] text-stone-600 mt-1">
                    Validade:{' '}
                    {new Date(fornecedor.qualificacao_vigente!.validade).toLocaleDateString(
                      'pt-BR',
                    )}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500">
                    Score atual: {fornecedor.qualificacao_vigente?.score || 0} pts
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onAbrirQualificacao(fornecedor)}
                    className="h-7 text-[11px] bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold gap-1"
                  >
                    <FileCheck className="h-3 w-3 text-[#D9A404]" />
                    Revalidar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Filtros e Lista */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#2D6A4F]" />
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              Fornecedores ({filtrados.length} de {fornecedores.length})
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[220px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por CNPJ, Razão ou Cidade..."
                className="h-8 text-xs pl-8 bg-[#FAF7EF]"
              />
            </div>

            {ufsDisponiveis.length > 0 && (
              <select
                value={filtroUf}
                onChange={(e) => setFiltroUf(e.target.value)}
                className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
              >
                <option value="">Todas as UFs</option>
                {ufsDisponiveis.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Status da Qualificação</option>
              <option value="VIGENTE">Qualificação Vigente</option>
              <option value="VENCIDA">Qualificação Vencida</option>
              <option value="SEM_QUALIFICACAO">Sem Qualificação</option>
            </select>
          </div>
        </div>

        {/* Tabela de Fornecedores */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">CNPJ</th>
                <th className="py-2.5 px-3">Razão Social</th>
                <th className="py-2.5 px-3">Localização</th>
                <th className="py-2.5 px-3">Qualificação Vigente</th>
                <th className="py-2.5 px-3 text-center">Devoluções</th>
                <th className="py-2.5 px-3 text-center">NCs Abertas</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-500">
                    Nenhum fornecedor cadastrado corresponde aos filtros.
                  </td>
                </tr>
              ) : (
                filtrados.map((f) => (
                  <tr key={f.cnpj} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-semibold text-[#1B4332] whitespace-nowrap">
                      {formatarCNPJ(f.cnpj)}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-stone-900">{f.razao_social}</p>
                      {f.contato_nome && (
                        <span className="text-[10px] text-stone-500 block">
                          Contato: {f.contato_nome} {f.telefone ? `• ${f.telefone}` : ''}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                      {[f.municipio, f.uf].filter(Boolean).join('/') || '—'}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {renderStatusBadge(f.qualificacao_vigente)}
                        {f.qualificacao_vigente?.score !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-stone-600">
                            ({f.qualificacao_vigente.score} pts)
                          </span>
                        )}
                      </div>
                      {f.qualificacao_vigente?.validade && (
                        <span className="text-[10px] text-stone-400 block mt-0.5">
                          Val:{' '}
                          {new Date(f.qualificacao_vigente.validade).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {(f.total_devolucoes || 0) > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-300 bg-amber-50 text-amber-900 font-bold text-[10px]"
                        >
                          {f.total_devolucoes}
                        </Badge>
                      ) : (
                        <span className="text-stone-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {(f.total_ncs_abertas || 0) > 0 ? (
                        <Badge className="bg-red-700 text-white font-bold text-[10px]">
                          {f.total_ncs_abertas}
                        </Badge>
                      ) : (
                        <span className="text-stone-400 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        onClick={() => onAbrirQualificacao(f)}
                        className="h-7 text-[11px] bg-[#2D6A4F] hover:bg-[#1B4332] text-white gap-1 font-semibold"
                      >
                        <FileCheck className="h-3 w-3 text-[#D9A404]" />
                        {f.qualificacao_vigente ? 'Revalidar' : 'Qualificar'}
                      </Button>

                      {f.email && (
                        <a
                          href={gerarMailtoLink(f)}
                          className="inline-flex items-center justify-center h-7 px-2 rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50 text-[11px] transition"
                          title="Enviar formulário por e-mail"
                        >
                          <Mail className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO DE FORNECEDOR */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D9A404]" />
              Cadastrar Novo Fornecedor
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Informe os dados da empresa fornecedora de insumos/alimentos para alimentação animal.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarFornecedor} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">CNPJ (Obrigatório)</Label>
              <Input
                value={formFornecedor.cnpj || ''}
                onChange={(e) => setFormFornecedor({ ...formFornecedor, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Razão Social (Obrigatório)
              </Label>
              <Input
                value={formFornecedor.razao_social || ''}
                onChange={(e) =>
                  setFormFornecedor({ ...formFornecedor, razao_social: e.target.value })
                }
                placeholder="Nome empresarial conforme cartão CNPJ"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Município</Label>
                <Input
                  value={formFornecedor.municipio || ''}
                  onChange={(e) =>
                    setFormFornecedor({ ...formFornecedor, municipio: e.target.value })
                  }
                  placeholder="Ex: Ribeirão Preto"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">UF</Label>
                <Input
                  value={formFornecedor.uf || ''}
                  onChange={(e) =>
                    setFormFornecedor({
                      ...formFornecedor,
                      uf: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                  placeholder="SP"
                  maxLength={2}
                  className="h-9 text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Contato / Representante
                </Label>
                <Input
                  value={formFornecedor.contato_nome || ''}
                  onChange={(e) =>
                    setFormFornecedor({ ...formFornecedor, contato_nome: e.target.value })
                  }
                  placeholder="Nome do contato"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Telefone</Label>
                <Input
                  value={formFornecedor.telefone || ''}
                  onChange={(e) =>
                    setFormFornecedor({ ...formFornecedor, telefone: e.target.value })
                  }
                  placeholder="(00) 0000-0000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                E-mail Comercial / Qualidade
              </Label>
              <Input
                type="email"
                value={formFornecedor.email || ''}
                onChange={(e) => setFormFornecedor({ ...formFornecedor, email: e.target.value })}
                placeholder="contato@fornecedor.com.br"
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvando}
                size="sm"
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold"
              >
                {salvando ? 'Gravando...' : 'Salvar Fornecedor'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
