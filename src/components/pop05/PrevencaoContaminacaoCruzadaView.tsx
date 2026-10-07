import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileCheck2,
  AlertTriangle,
  PenTool,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Check,
  Building,
  Factory,
  Package,
  Wrench,
  Brush,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { canSignAsRT, canSignAsRE, canSignAsRQ, canEditPopStructure } from '@/lib/permissions'
import {
  getMetodosPrevencao,
  updateMetodoPrevencao,
  assinarMetodoPrevencao,
  type MetodoPrevencaoItem,
  type TemaPrevencaoCruzada,
} from '@/services/prevencaoCruzadaService'

const TEMA_ICONS: Record<TemaPrevencaoCruzada, any> = {
  qualificacao_fornecedores: Truck,
  materias_primas: Package,
  limpeza_materiais_utensilios: Brush,
  equipamentos: Wrench,
  limpeza_linha: Factory,
  producao_ensaque: Building,
}

const TEMA_LABELS: Record<TemaPrevencaoCruzada, { titulo: string; badge: string }> = {
  qualificacao_fornecedores: {
    titulo: 'Qualificação de Fornecedores & Transportadores',
    badge: 'Método 01 / Insumos Seguros',
  },
  materias_primas: {
    titulo: 'Segregação e Armazenamento de Matérias-Primas',
    badge: 'Método 02 / Incompatibilidade Zero',
  },
  limpeza_materiais_utensilios: {
    titulo: 'Limpeza de Materiais e Utensílios de Pesagem',
    badge: 'Método 03 / Código de Cores',
  },
  equipamentos: {
    titulo: 'Desenho Sanitário e Descontaminação de Equipamentos',
    badge: 'Método 04 / Pontos Mortos',
  },
  limpeza_linha: {
    titulo: 'Limpeza de Linha & Flushing de Produção',
    badge: 'Método 05 / Carryover Controlado',
  },
  producao_ensaque: {
    titulo: 'Boas Práticas de Produção, Sacarias e Ensaque',
    badge: 'Método 06 / Produto Acabado',
  },
}

export function PrevencaoContaminacaoCruzadaView() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [metodos, setMetodos] = useState<MetodoPrevencaoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [temaAtivo, setTemaAtivo] = useState<TemaPrevencaoCruzada>('qualificacao_fornecedores')

  // Edição
  const [editando, setEditando] = useState(false)
  const [formTitulo, setFormTitulo] = useState('')
  const [formProcedimento, setFormProcedimento] = useState('')
  const [formAcoesCorretivas, setFormAcoesCorretivas] = useState('')
  const [formRefNormativa, setFormRefNormativa] = useState('')
  const [salvando, setSalvando] = useState(false)

  // Permissões
  const isRT = canSignAsRT(user?.role)
  const isRE = canSignAsRE(user?.role)
  const isRQ = canSignAsRQ(user?.role)
  const podeEditar = canEditPopStructure(user?.role)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getMetodosPrevencao()
      setMetodos(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const metodoAtual = metodos.find((m) => m.tema === temaAtivo)

  useEffect(() => {
    if (metodoAtual) {
      setFormTitulo(metodoAtual.titulo)
      setFormProcedimento(metodoAtual.metodo_procedimento)
      setFormAcoesCorretivas(metodoAtual.acoes_corretivas_imediatas || '')
      setFormRefNormativa(metodoAtual.referencia_normativa || '')
      setEditando(false)
    }
  }, [metodoAtual, temaAtivo])

  const handleSalvarEdicao = async () => {
    if (!metodoAtual) return
    setSalvando(true)
    try {
      await updateMetodoPrevencao(metodoAtual.id, {
        titulo: formTitulo,
        metodo_procedimento: formProcedimento,
        acoes_corretivas_imediatas: formAcoesCorretivas,
        referencia_normativa: formRefNormativa,
      })
      toast({ title: 'Método atualizado com sucesso' })
      setEditando(false)
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' })
    } finally {
      setSalvando(false)
    }
  }

  const handleAssinar = async (tipo: 'rt_re' | 'rq') => {
    if (!metodoAtual) return
    try {
      await assinarMetodoPrevencao(
        metodoAtual.id,
        {
          name: user?.name || user?.email,
          role: user?.role,
          cpf: user?.cpf,
        },
        tipo,
      )
      toast({
        title: 'Assinatura Registrada',
        description: `Método ${metodoAtual.titulo} assinado digitalmente com sucesso.`,
      })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao assinar', description: err.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-[#D9A404]" />
              <h2 className="text-lg sm:text-xl font-bold font-['Sora']">
                Prevenção da Contaminação Cruzada (IN 04/2007)
              </h2>
            </div>
            <p className="text-xs text-emerald-100 max-w-3xl">
              Métodos e parâmetros estruturados para garantia da integridade sanitária dos alimentos
              funcionais e rações. Controle por 6 temas críticos: Qualificação de Fornecedores,
              Matérias-Primas, Utensílios, Equipamentos, Limpeza de Linha e Ensaque.
            </p>
          </div>

          <Badge className="bg-[#D9A404] text-[#1B4332] font-bold text-xs uppercase self-start sm:self-auto">
            Auto Controle 05 Oficial
          </Badge>
        </div>
      </div>

      {/* 2. Seleção dos 6 Temas Exigidos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(Object.keys(TEMA_LABELS) as TemaPrevencaoCruzada[]).map((tKey) => {
          const Icon = TEMA_ICONS[tKey]
          const isAtivo = temaAtivo === tKey
          const met = metodos.find((m) => m.tema === tKey)
          const isSigned = Boolean(met?.assinaturas?.rt_re && met?.assinaturas?.rq)

          return (
            <button
              key={tKey}
              onClick={() => setTemaAtivo(tKey)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-2 ${
                isAtivo
                  ? 'bg-[#1B4332] text-white border-[#1B4332] shadow-sm'
                  : 'bg-white hover:bg-stone-50 border-[#E2DCCF] text-stone-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-5 w-5 ${isAtivo ? 'text-[#D9A404]' : 'text-[#2D6A4F]'}`} />
                {isSigned ? (
                  <CheckCircle2
                    className={`h-4 w-4 ${isAtivo ? 'text-emerald-300' : 'text-emerald-600'}`}
                  />
                ) : (
                  <Clock
                    className={`h-3.5 w-3.5 ${isAtivo ? 'text-amber-300' : 'text-amber-500'}`}
                  />
                )}
              </div>
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${isAtivo ? 'text-emerald-200' : 'text-stone-400'}`}
                >
                  {TEMA_LABELS[tKey].badge}
                </span>
                <span className="text-xs font-bold leading-tight line-clamp-2 mt-0.5">
                  {TEMA_LABELS[tKey].titulo}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* 3. Detalhamento e Execução do Método Selecionado */}
      {metodoAtual && (
        <div className="bg-white rounded-2xl border border-[#E2DCCF] shadow-xs overflow-hidden space-y-5 p-5">
          {/* Cabeçalho do Método */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-[#2D6A4F] text-white text-[11px] font-mono">
                  {metodoAtual.versao || 'Rev. 01'}
                </Badge>
                <span className="text-xs text-stone-500 font-mono">
                  Ref: {metodoAtual.referencia_normativa || 'IN 04/2007'}
                </span>
                {metodoAtual.status_assinatura?.includes('Comprovado') ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Aprovado por RT/RE e RQ
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                    <Clock className="h-3 w-3" /> Pendente de Assinaturas da Hierarquia
                  </Badge>
                )}
              </div>

              {editando ? (
                <Input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="font-bold text-sm h-9"
                />
              ) : (
                <h3 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
                  {metodoAtual.titulo}
                </h3>
              )}
            </div>

            {/* Ações de Edição */}
            {podeEditar && (
              <div className="flex items-center gap-2 shrink-0">
                {editando ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditando(false)}
                      className="text-xs h-8"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={salvando}
                      onClick={handleSalvarEdicao}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8 gap-1"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {salvando ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditando(true)}
                    className="border-[#2D6A4F] text-[#2D6A4F] text-xs h-8 font-semibold"
                  >
                    Editar Método
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Conteúdo do Método / Procedimento Técnico */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-stone-800 uppercase tracking-wide">
              Descrição do Método Operacional & Critérios de Prevenção:
            </Label>
            {editando ? (
              <Textarea
                rows={6}
                value={formProcedimento}
                onChange={(e) => setFormProcedimento(e.target.value)}
                className="text-xs leading-relaxed"
              />
            ) : (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-line">
                {metodoAtual.metodo_procedimento}
              </div>
            )}
          </div>

          {/* Parâmetros Críticos e Pontos de Inspeção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-amber-50/40 space-y-3">
              <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Parâmetros Críticos de Controle (PCC/PPRO)
              </h4>
              <div className="space-y-2">
                {metodoAtual.parametros_criticos?.map((pc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-baseline">
                      <strong className="text-stone-900">{pc.parametro}</strong>
                      <span className="text-[10px] text-stone-500 font-mono">{pc.frequencia}</span>
                    </div>
                    <p className="text-[11px] text-amber-900 font-semibold">
                      Limite Crítico: {pc.limite}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-blue-50/40 space-y-3">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-blue-600" />
                Pontos de Inspeção Obrigatórios
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-700">
                {metodoAtual.pontos_inspecao?.map((ponto, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-blue-200"
                  >
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>{ponto}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ações Corretivas Imediatas */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-red-900 uppercase tracking-wide">
              Ações Corretivas Imediatas em Caso de Desvio / Contaminação Cruzada:
            </Label>
            {editando ? (
              <Textarea
                rows={2}
                value={formAcoesCorretivas}
                onChange={(e) => setFormAcoesCorretivas(e.target.value)}
                className="text-xs leading-relaxed"
              />
            ) : (
              <div className="p-3 bg-red-50/60 rounded-xl border border-red-200 text-xs text-red-950 font-medium">
                {metodoAtual.acoes_corretivas_imediatas ||
                  'Paralisação imediata, retenção do lote e notificação à Garantia da Qualidade.'}
              </div>
            )}
          </div>

          {/* Assinaturas da Hierarquia (RT/RE + RQ) */}
          <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-[#D9A404]" />
                  Hierarquia de Validação Oficial (RT/RE + RQ)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Validação do método de prevenção conforme exigência do MAPA para autocontrole 05.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Assinatura 1: RT / RE */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Assinatura 1: Responsável Técnico (RT / RE)
                  </span>
                  {metodoAtual.assinaturas?.rt_re ? (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{metodoAtual.assinaturas.rt_re.nome}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {metodoAtual.assinaturas.rt_re.papel} •{' '}
                        {new Date(metodoAtual.assinaturas.rt_re.data_hora).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 italic mt-1 block">
                      Pendente de Assinatura do RT ou RE
                    </span>
                  )}
                </div>

                {!metodoAtual.assinaturas?.rt_re && (isRT || isRE) && (
                  <Button
                    size="sm"
                    onClick={() => handleAssinar('rt_re')}
                    className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs h-8 gap-1 self-start"
                  >
                    <PenTool className="h-3 w-3" /> Assinar como {isRE ? 'RE' : 'RT'}
                  </Button>
                )}
              </div>

              {/* Assinatura 2: RQ (Verificação) */}
              <div className="p-3 rounded-xl bg-white border border-stone-200 flex flex-col justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-stone-500 block">
                    Assinatura 2: Responsável da Qualidade (RQ - Verificação)
                  </span>
                  {metodoAtual.assinaturas?.rq ? (
                    <div className="mt-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{metodoAtual.assinaturas.rq.nome}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        {metodoAtual.assinaturas.rq.papel} •{' '}
                        {new Date(metodoAtual.assinaturas.rq.data_hora).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 italic mt-1 block">
                      Pendente de Verificação da Qualidade (RQ)
                    </span>
                  )}
                </div>

                {!metodoAtual.assinaturas?.rq && isRQ && (
                  <Button
                    size="sm"
                    onClick={() => handleAssinar('rq')}
                    className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-8 gap-1 self-start"
                  >
                    <PenTool className="h-3 w-3" /> Assinar como RQ
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
