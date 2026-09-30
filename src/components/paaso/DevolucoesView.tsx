import React, { useState } from 'react'
import {
  RotateCcw,
  PlusCircle,
  Search,
  Calendar,
  AlertTriangle,
  Package,
  Trash2,
  DollarSign,
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
import { criarDevolucao, excluirDevolucao } from '@/services/paasoService'
import type { DevolucaoItem, FornecedorItem } from '@/types/paaso'

interface DevolucoesViewProps {
  devolucoes: DevolucaoItem[]
  fornecedores: FornecedorItem[]
  onDataChanged: () => void
}

export function DevolucoesView({ devolucoes, fornecedores, onDataChanged }: DevolucoesViewProps) {
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroFornecedor, setFiltroFornecedor] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [formDevolucao, setFormDevolucao] = useState<Partial<DevolucaoItem>>({
    data: new Date().toISOString().split('T')[0],
    fornecedor_cnpj: '',
    produto: '',
    lote: '',
    motivo: '',
    quantidade: 0,
    valor: 0,
    status: 'Concluída',
  })

  // Dicionário de Fornecedores por CNPJ para lookup rápido
  const fornecedoresMap = new Map<string, string>()
  for (const f of fornecedores) {
    fornecedoresMap.set(normalizarCNPJ(f.cnpj), f.razao_social)
  }

  // Filtragem
  const filtradas = devolucoes.filter((d) => {
    const dCnpj = normalizarCNPJ(d.fornecedor_cnpj)
    const termo = busca.toLowerCase()
    const fNome = fornecedoresMap.get(dCnpj) || ''

    const matchBusca =
      !termo ||
      d.fornecedor_cnpj.includes(termo) ||
      formatarCNPJ(d.fornecedor_cnpj).includes(termo) ||
      d.produto.toLowerCase().includes(termo) ||
      (d.lote && d.lote.toLowerCase().includes(termo)) ||
      d.motivo.toLowerCase().includes(termo) ||
      fNome.toLowerCase().includes(termo)

    const matchFornecedor = !filtroFornecedor || dCnpj === filtroFornecedor

    let matchData = true
    if (dataInicio && d.data < dataInicio) matchData = false
    if (dataFim && d.data > dataFim) matchData = false

    return matchBusca && matchFornecedor && matchData
  })

  // Salvar
  const handleSalvarDevolucao = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawCnpj = normalizarCNPJ(formDevolucao.fornecedor_cnpj)

    if (!rawCnpj) {
      toast({ title: 'Informe o CNPJ do fornecedor', variant: 'destructive' })
      return
    }

    if (!formDevolucao.produto?.trim()) {
      toast({ title: 'Informe o produto', variant: 'destructive' })
      return
    }

    if (!formDevolucao.motivo?.trim()) {
      toast({ title: 'Informe o motivo da devolução', variant: 'destructive' })
      return
    }

    setSalvando(true)
    try {
      await criarDevolucao(formDevolucao)
      toast({
        title: 'Devolução registrada com sucesso',
        description: `Produto ${formDevolucao.produto} adicionado ao registro de devoluções.`,
      })
      setModalOpen(false)
      setFormDevolucao({
        data: new Date().toISOString().split('T')[0],
        fornecedor_cnpj: '',
        produto: '',
        lote: '',
        motivo: '',
        quantidade: 0,
        valor: 0,
        status: 'Concluída',
      })
      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar devolução',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Excluir
  const handleExcluir = async (id?: string) => {
    if (!id) return
    if (!confirm('Deseja realmente excluir este registro de devolução?')) return
    try {
      await excluirDevolucao(id)
      toast({ title: 'Registro excluído' })
      onDataChanged()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' })
    }
  }

  // Preencher CNPJ via seleção do autocomplete
  const handleSelectFornecedorModal = (cnpjSelecionado: string) => {
    setFormDevolucao((prev) => ({
      ...prev,
      fornecedor_cnpj: cnpjSelecionado,
    }))
  }

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <RotateCcw className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
              Registro de Devoluções de Fornecedores
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Controle de cargas, matérias-primas e insumos devolvidos por avaria, inconformidade ou
            rejeição técnica no recebimento.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormDevolucao({
              data: new Date().toISOString().split('T')[0],
              fornecedor_cnpj: '',
              produto: '',
              lote: '',
              motivo: '',
              quantidade: 0,
              valor: 0,
              status: 'Concluída',
            })
            setModalOpen(true)
          }}
          className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs h-9 gap-2 shadow-sm shrink-0"
        >
          <PlusCircle className="h-4 w-4 text-[#D9A404]" />
          Registrar Devolução
        </Button>
      </div>

      {/* 2. Filtros e Lista */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
            Histórico ({filtradas.length} de {devolucoes.length})
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[200px]">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar produto, lote, motivo..."
                className="h-8 text-xs pl-8 bg-[#FAF7EF]"
              />
            </div>

            {fornecedores.length > 0 && (
              <select
                value={filtroFornecedor}
                onChange={(e) => setFiltroFornecedor(e.target.value)}
                className="h-8 text-xs px-2 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800 max-w-[200px] truncate"
              >
                <option value="">Todos os Fornecedores</option>
                {fornecedores.map((f) => (
                  <option key={f.cnpj} value={normalizarCNPJ(f.cnpj)}>
                    {f.razao_social}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 text-xs">
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-8 text-xs w-[130px] bg-[#FAF7EF]"
                title="Data inicial"
              />
              <span className="text-stone-400">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-8 text-xs w-[130px] bg-[#FAF7EF]"
                title="Data final"
              />
            </div>
          </div>
        </div>

        {/* Tabela de Devoluções */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Produto / Lote</th>
                <th className="py-2.5 px-3">Motivo da Devolução</th>
                <th className="py-2.5 px-3 text-right">Qtd</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Nenhum registro de devolução encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtradas.map((d) => {
                  const fornNome =
                    fornecedoresMap.get(normalizarCNPJ(d.fornecedor_cnpj)) ||
                    formatarCNPJ(d.fornecedor_cnpj)
                  return (
                    <tr key={d.id} className="hover:bg-stone-50/70">
                      <td className="py-2.5 px-3 font-medium text-stone-800 whitespace-nowrap">
                        {new Date(d.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td
                        className="py-2.5 px-3 font-semibold text-[#1B4332] max-w-[180px] truncate"
                        title={fornNome}
                      >
                        {fornNome}
                        <span className="text-[10px] text-stone-400 block font-normal font-mono">
                          {formatarCNPJ(d.fornecedor_cnpj)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-stone-900 block">{d.produto}</span>
                        {d.lote && (
                          <span className="text-[10px] text-stone-500 font-mono">
                            Lote: {d.lote}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-stone-700 max-w-[260px]">{d.motivo}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-stone-800">
                        {d.quantidade ? d.quantidade.toLocaleString('pt-BR') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                        {d.valor
                          ? d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-300 text-emerald-800 bg-emerald-50"
                        >
                          {d.status || 'Concluída'}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExcluir(d.id)}
                          className="h-7 w-7 p-0 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* MODAL: REGISTRAR DEVOLUÇÃO */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] font-['Sora'] flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-[#D9A404]" />
              Registrar Devolução de Mercadoria
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Vincule a devolução ao fornecedor por CNPJ com autocomplete da lista de parceiros.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSalvarDevolucao} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data da Ocorrência</Label>
                <Input
                  type="date"
                  value={formDevolucao.data || ''}
                  onChange={(e) => setFormDevolucao({ ...formDevolucao, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status</Label>
                <select
                  value={formDevolucao.status || 'Concluída'}
                  onChange={(e) => setFormDevolucao({ ...formDevolucao, status: e.target.value })}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white text-stone-800"
                >
                  <option value="Concluída">Concluída</option>
                  <option value="Em Trâmite">Em Trâmite</option>
                  <option value="Aguardando Coleta">Aguardando Coleta</option>
                </select>
              </div>
            </div>

            {/* Seleção do Fornecedor com Autocomplete */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Fornecedor (Selecionar parceiro ou digitar CNPJ)
              </Label>
              {fornecedores.length > 0 && (
                <select
                  onChange={(e) => handleSelectFornecedorModal(e.target.value)}
                  className="w-full h-9 text-xs px-2.5 mb-1.5 rounded-md border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione um fornecedor cadastrado...
                  </option>
                  {fornecedores.map((f) => (
                    <option key={f.cnpj} value={f.cnpj}>
                      {f.razao_social} ({formatarCNPJ(f.cnpj)})
                    </option>
                  ))}
                </select>
              )}
              <Input
                value={formDevolucao.fornecedor_cnpj || ''}
                onChange={(e) =>
                  setFormDevolucao({ ...formDevolucao, fornecedor_cnpj: e.target.value })
                }
                placeholder="CNPJ do Fornecedor (00.000.000/0000-00)"
                required
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Produto Devolvido</Label>
                <Input
                  value={formDevolucao.produto || ''}
                  onChange={(e) => setFormDevolucao({ ...formDevolucao, produto: e.target.value })}
                  placeholder="Ex: Farelo de Soja"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Lote</Label>
                <Input
                  value={formDevolucao.lote || ''}
                  onChange={(e) => setFormDevolucao({ ...formDevolucao, lote: e.target.value })}
                  placeholder="Ex: L-2026-001"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Quantidade</Label>
                <Input
                  type="number"
                  step="any"
                  value={formDevolucao.quantidade || ''}
                  onChange={(e) =>
                    setFormDevolucao({
                      ...formDevolucao,
                      quantidade: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Ex: 5000"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Valor Total (R$)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formDevolucao.valor || ''}
                  onChange={(e) =>
                    setFormDevolucao({ ...formDevolucao, valor: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Ex: 12500"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Motivo da Devolução</Label>
              <textarea
                value={formDevolucao.motivo || ''}
                onChange={(e) => setFormDevolucao({ ...formDevolucao, motivo: e.target.value })}
                placeholder="Descreva a razão da devolução (ex: teor de umidade, embalagem violada, ausência de laudo)..."
                required
                rows={3}
                className="w-full text-xs p-2 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
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
                {salvando ? 'Gravando...' : 'Salvar Devolução'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
