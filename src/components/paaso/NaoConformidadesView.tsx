import React, { useState } from 'react'
import {
  AlertOctagon,
  PlusCircle,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  Flame,
  ShieldAlert,
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
import { useToast } from '@/hooks/use-toast'
import { formatarCNPJ, validarCNPJ } from '@/lib/pop01Validators'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import { salvarNcFornecedor, excluirNcFornecedor } from '@/services/paasoService'
import type {
  NaoConformidadeFornecedorItem,
  FornecedorItem,
  SeveridadeNC,
  StatusNCFornecedor,
} from '@/types/paaso'

interface NaoConformidadesViewProps {
  ncs: NaoConformidadeFornecedorItem[]
  fornecedores: FornecedorItem[]
  onDataChanged: () => void
}

export function NaoConformidadesView({
  ncs,
  fornecedores,
  onDataChanged,
}: NaoConformidadesViewProps) {
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroSeveridade, setFiltroSeveridade] = useState('')

  // Modal Novo / Edição
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formNc, setFormNc] = useState<Partial<NaoConformidadeFornecedorItem>>({
    data: new Date().toISOString().split('T')[0],
    fornecedor_cnpj: '',
    descricao: '',
    severidade: 'MEDIA',
    acao_corretiva: '',
    prazo: '',
    status: 'ABERTA',
  })

  // Lookup de Fornecedores por CNPJ
  const fornecedoresMap = new Map<string, string>()
  for (const f of fornecedores) {
    fornecedoresMap.set(normalizarCNPJ(f.cnpj), f.razao_social)
  }

  // Filtragem
  const filtradas = ncs.filter((n) => {
    const nCnpj = normalizarCNPJ(n.fornecedor_cnpj)
    const termo = busca.toLowerCase()
    const fNome = fornecedoresMap.get(nCnpj) || ''

    const matchBusca =
      !termo ||
      n.fornecedor_cnpj.includes(termo) ||
      formatarCNPJ(n.fornecedor_cnpj).includes(termo) ||
      n.descricao.toLowerCase().includes(termo) ||
      (n.acao_corretiva && n.acao_corretiva.toLowerCase().includes(termo)) ||
      fNome.toLowerCase().includes(termo)

    const matchStatus = !filtroStatus || n.status === filtroStatus
    const matchSeveridade = !filtroSeveridade || n.severidade === filtroSeveridade

    return matchBusca && matchStatus && matchSeveridade
  })

  // Salvar NC
  const handleSalvarNc = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawCnpj = normalizarCNPJ(formNc.fornecedor_cnpj)

    if (!rawCnpj) {
      toast({ title: 'CNPJ do fornecedor obrigatório', variant: 'destructive' })
      return
    }

    if (!formNc.descricao?.trim()) {
      toast({ title: 'Descrição da Não Conformidade obrigatória', variant: 'destructive' })
      return
    }

    setSalvando(true)
    try {
      await salvarNcFornecedor(formNc)
      toast({
        title: 'Não Conformidade registrada',
        description: 'Registro vinculado ao fornecedor e monitorado no painel.',
      })
      setModalOpen(false)
      setFormNc({
        data: new Date().toISOString().split('T')[0],
        fornecedor_cnpj: '',
        descricao: '',
        severidade: 'MEDIA',
        acao_corretiva: '',
        prazo: '',
        status: 'ABERTA',
      })
      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar Não Conformidade',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Atualizar rápido de status (ABERTA -> EM_TRATAMENTO -> ENCERRADA)
  const handleMudarStatus = async (
    item: NaoConformidadeFornecedorItem,
    novoStatus: StatusNCFornecedor,
  ) => {
    try {
      await salvarNcFornecedor({ ...item, status: novoStatus })
      toast({
        title: `Status alterado para ${novoStatus.replace('_', ' ')}`,
      })
      onDataChanged()
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar status', description: err.message, variant: 'destructive' })
    }
  }

  // Excluir
  const handleExcluir = async (id?: string) => {
    if (!id) return
    if (!confirm('Deseja realmente remover esta Não Conformidade?')) return
    try {
      await excluirNcFornecedor(id)
      toast({ title: 'Registro excluído' })
      onDataChanged()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  const renderSeveridadeBadge = (sev: SeveridadeNC) => {
    switch (sev) {
      case 'CRITICA':
        return (
          <Badge className="bg-red-800 text-white font-bold text-[10px] gap-1">
            <Flame className="h-3 w-3" /> CRÍTICA
          </Badge>
        )
      case 'ALTA':
        return <Badge className="bg-orange-700 text-white font-bold text-[10px]">ALTA</Badge>
      case 'MEDIA':
        return <Badge className="bg-amber-600 text-white text-[10px]">MÉDIA</Badge>
      case 'BAIXA':
        return (
          <Badge variant="outline" className="border-stone-400 text-stone-700 text-[10px]">
            BAIXA
          </Badge>
        )
    }
  }

  const renderStatusBadge = (item: NaoConformidadeFornecedorItem) => {
    if (item.status === 'ENCERRADA') {
      return (
        <Badge className="bg-emerald-700 text-white text-[10px] gap-1">
          <CheckCircle2 className="h-3 w-3" /> ENCERRADA
        </Badge>
      )
    }

    if (item.estourado) {
      return (
        <Badge className="bg-red-700 text-white font-bold text-[10px] gap-1 animate-pulse">
          <AlertTriangle className="h-3 w-3" /> PRAZO ESTOURADO
        </Badge>
      )
    }

    if (item.status === 'EM_TRATAMENTO') {
      return (
        <Badge className="bg-blue-700 text-white text-[10px] gap-1">
          <Clock className="h-3 w-3" /> EM TRATAMENTO
        </Badge>
      )
    }

    return <Badge className="bg-amber-600 text-white text-[10px] gap-1">ABERTA</Badge>
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <AlertOctagon className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
              Não Conformidades de Fornecedores
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Fluxo de tratamento: <strong>ABERTA</strong> → <strong>EM TRATAMENTO</strong> →{' '}
            <strong>ENCERRADA</strong>, com alerta preventivo para prazos estourados de ações
            corretivas.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormNc({
              data: new Date().toISOString().split('T')[0],
              fornecedor_cnpj: '',
              descricao: '',
              severidade: 'MEDIA',
              acao_corretiva: '',
              prazo: '',
              status: 'ABERTA',
            })
            setModalOpen(true)
          }}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs h-9 gap-2 shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4 text-[#D9A404]" />
          Abrir Não Conformidade
        </Button>
      </div>

      {/* 2. Filtros e Lista */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
            Ocorrências ({filtradas.length} de {ncs.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar descrição ou fornecedor..."
                className="h-8 text-xs pl-8 bg-[#FAF7EF]"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todos os Status</option>
              <option value="ABERTA">Aberta</option>
              <option value="EM_TRATAMENTO">Em Tratamento</option>
              <option value="ENCERRADA">Encerrada</option>
            </select>

            <select
              value={filtroSeveridade}
              onChange={(e) => setFiltroSeveridade(e.target.value)}
              className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
            >
              <option value="">Todas as Severidades</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
              <option value="CRITICA">Crítica</option>
            </select>
          </div>
        </div>

        {/* Tabela de Não Conformidades */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Severidade</th>
                <th className="py-2.5 px-3">Descrição da Não Conformidade</th>
                <th className="py-2.5 px-3">Ação Corretiva & Prazo</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500">
                    Nenhuma não conformidade encontrada.
                  </td>
                </tr>
              ) : (
                filtradas.map((n) => {
                  const fornNome =
                    fornecedoresMap.get(normalizarCNPJ(n.fornecedor_cnpj)) ||
                    formatarCNPJ(n.fornecedor_cnpj)
                  return (
                    <tr
                      key={n.id}
                      className={`hover:bg-stone-50/70 ${n.estourado ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-medium text-stone-800 whitespace-nowrap">
                        {new Date(n.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td
                        className="py-2.5 px-3 font-semibold text-[#1B4332] max-w-[180px] truncate"
                        title={fornNome}
                      >
                        {fornNome}
                        <span className="text-[10px] text-stone-400 block font-normal font-mono">
                          {formatarCNPJ(n.fornecedor_cnpj)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {renderSeveridadeBadge(n.severidade)}
                      </td>
                      <td className="py-2.5 px-3 text-stone-800 max-w-[280px]">
                        <p className="line-clamp-2">{n.descricao}</p>
                      </td>
                      <td className="py-2.5 px-3 text-stone-700 max-w-[240px]">
                        <p className="line-clamp-1">
                          {n.acao_corretiva || 'Pendente de definição'}
                        </p>
                        {n.prazo && (
                          <span
                            className={`text-[10px] block font-medium ${
                              n.estourado ? 'text-red-700 font-bold' : 'text-stone-500'
                            }`}
                          >
                            Prazo: {new Date(n.prazo).toLocaleDateString('pt-BR')}
                            {n.estourado && ' (Vencido!)'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {renderStatusBadge(n)}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                        {/* Seletor rápido de status */}
                        {n.status !== 'ENCERRADA' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMudarStatus(
                                n,
                                n.status === 'ABERTA' ? 'EM_TRATAMENTO' : 'ENCERRADA',
                              )
                            }
                            className="h-6 text-[10px] px-2 border-stone-300 text-stone-700"
                            title="Avançar status"
                          >
                            {n.status === 'ABERTA' ? 'Tratar' : 'Encerrar'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(n.id)}
                          className="h-6 w-6 p-0 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ABRIR NÃO CONFORMIDADE */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-[#D9A404]" />
              Registrar Não Conformidade de Fornecedor
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Registre a ocorrência para monitoramento do plano de ação corretiva e prazos.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarNc} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data da Ocorrência</Label>
                <Input
                  type="date"
                  value={formNc.data || ''}
                  onChange={(e) => setFormNc({ ...formNc, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Severidade</Label>
                <select
                  value={formNc.severidade || 'MEDIA'}
                  onChange={(e) =>
                    setFormNc({ ...formNc, severidade: e.target.value as SeveridadeNC })
                  }
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white text-stone-800"
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                  <option value="CRITICA">Crítica</option>
                </select>
              </div>
            </div>

            {/* Seleção de Fornecedor */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Fornecedor</Label>
              {fornecedores.length > 0 && (
                <select
                  onChange={(e) =>
                    setFormNc((prev) => ({ ...prev, fornecedor_cnpj: e.target.value }))
                  }
                  className="w-full h-9 text-xs px-2.5 mb-1.5 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione o fornecedor...
                  </option>
                  {fornecedores.map((f) => (
                    <option key={f.cnpj} value={f.cnpj}>
                      {f.razao_social} ({formatarCNPJ(f.cnpj)})
                    </option>
                  ))}
                </select>
              )}
              <Input
                value={formNc.fornecedor_cnpj || ''}
                onChange={(e) => setFormNc({ ...formNc, fornecedor_cnpj: e.target.value })}
                placeholder="CNPJ do Fornecedor"
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Descrição do Desvio</Label>
              <textarea
                value={formNc.descricao || ''}
                onChange={(e) => setFormNc({ ...formNc, descricao: e.target.value })}
                placeholder="Descreva detalhadamente a não conformidade identificada..."
                required
                rows={3}
                className="w-full text-xs p-2 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Ação Corretiva Exigida</Label>
              <textarea
                value={formNc.acao_corretiva || ''}
                onChange={(e) => setFormNc({ ...formNc, acao_corretiva: e.target.value })}
                placeholder="Medida preventiva ou corretiva a ser adotada pelo fornecedor..."
                rows={2}
                className="w-full text-xs p-2 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Prazo Limite da Resposta
                </Label>
                <Input
                  type="date"
                  value={formNc.prazo || ''}
                  onChange={(e) => setFormNc({ ...formNc, prazo: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status</Label>
                <select
                  value={formNc.status || 'ABERTA'}
                  onChange={(e) =>
                    setFormNc({ ...formNc, status: e.target.value as StatusNCFornecedor })
                  }
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white text-stone-800"
                >
                  <option value="ABERTA">Aberta</option>
                  <option value="EM_TRATAMENTO">Em Tratamento</option>
                  <option value="ENCERRADA">Encerrada</option>
                </select>
              </div>
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
                {salvando ? 'Gravando...' : 'Salvar Ocorrência'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
