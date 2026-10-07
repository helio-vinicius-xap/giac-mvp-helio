import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Building,
  Factory,
  FlaskConical,
  Wrench,
  CheckCircle2,
  Clock,
  PenTool,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  getLimpezaSetores,
  createLimpezaSetor,
  deleteLimpezaSetor,
  getLimpezaProdutos,
  createLimpezaProduto,
  deleteLimpezaProduto,
  getLimpezaEquipamentos,
  createLimpezaEquipamento,
  deleteLimpezaEquipamento,
  getLimpezaProcedimentosMatriz,
  createLimpezaProcedimentoMatriz,
  deleteLimpezaProcedimentoMatriz,
  type LimpezaSetor,
  type LimpezaProduto,
  type LimpezaEquipamento,
  type LimpezaProcedimentoMatriz,
} from '@/services/limpezaDbService'
import { createRecord } from '@/services/agroService'
import { canSignExecution, canSignAsRQ, canSignAsRT, canSignAsRE } from '@/lib/permissions'
import type { Procedure, MonitoringRecord } from '@/types/agro'

interface Pop02LimpezaBancoViewProps {
  procedure: Procedure
  records: MonitoringRecord[]
  onRecordCreated: () => void
}

export function Pop02LimpezaBancoView({
  procedure,
  records,
  onRecordCreated,
}: Pop02LimpezaBancoViewProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'registro_limpeza' | 'banco_dados'>('registro_limpeza')
  const [loading, setLoading] = useState(true)

  // Dados do banco
  const [setores, setSetores] = useState<LimpezaSetor[]>([])
  const [produtos, setProdutos] = useState<LimpezaProduto[]>([])
  const [equipamentos, setEquipamentos] = useState<LimpezaEquipamento[]>([])
  const [matriz, setMatriz] = useState<LimpezaProcedimentoMatriz[]>([])

  // Modais de Cadastro do Banco
  const [openModalSetor, setOpenModalSetor] = useState(false)
  const [openModalProduto, setOpenModalProduto] = useState(false)
  const [openModalEquipamento, setOpenModalEquipamento] = useState(false)
  const [openModalMatriz, setOpenModalMatriz] = useState(false)

  // Forms de Cadastro do Banco
  const [formSetor, setFormSetor] = useState({
    codigo: '',
    nome: '',
    tipo_area: 'Seca',
    responsavel_setor: '',
  })
  const [formProduto, setFormProduto] = useState({
    nome_comercial: '',
    principio_ativo: '',
    categoria: 'Sanitizante' as const,
    concentracao_recomendada: '',
    superficies_aplicacao: 'Inox, Pisos, Balanças',
    tempo_contato_minutos: 15,
  })
  const [formEquip, setFormEquip] = useState({
    tag: '',
    nome: '',
    setor_nome: '',
    tipo_superficie: 'Inox 304',
    metodos_limpeza_permitidos: 'Aspiração, Álcool 70%',
    cuidados_especiais: '',
  })
  const [formMatriz, setFormMatriz] = useState({
    codigo_procedimento: '',
    setor: '',
    equipamento_ou_area: '',
    tipo_superficie: 'Aço Inox',
    tipo_limpeza: 'Limpeza a Seco / Aspiração',
    produto_utilizado: '',
    dosagem_diluicao: 'Pronto Uso',
    frequencia: 'Diário',
    criterio_aprovacao: 'Ausência visual de resíduos e poeira',
  })

  // Formulário Oficial de Registro de Limpeza que consome o Banco
  const [openRegistroModal, setOpenRegistroModal] = useState(false)
  const [regData, setRegData] = useState(new Date().toISOString().split('T')[0])
  const [regTurno, setRegTurno] = useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã')
  const [regSetorId, setRegSetorId] = useState('')
  const [regEquipTag, setRegEquipTag] = useState('')
  const [regTipoLimpeza, setRegTipoLimpeza] = useState('Limpeza a Seco / Aspiração')
  const [regProdutoNome, setRegProdutoNome] = useState('')
  const [regLote, setRegLote] = useState(`LIMP-${Date.now().toString().slice(-6)}`)
  const [regInspecaoVisual, setRegInspecaoVisual] = useState<'Conforme' | 'Não Conforme'>(
    'Conforme',
  )
  const [regAtpRlu, setRegAtpRlu] = useState('')
  const [regObs, setRegObs] = useState('')
  const [salvandoRegistro, setSalvandoRegistro] = useState(false)

  const loadBanco = async () => {
    setLoading(true)
    try {
      const [sets, prods, equips, mat] = await Promise.all([
        getLimpezaSetores(),
        getLimpezaProdutos(),
        getLimpezaEquipamentos(),
        getLimpezaProcedimentosMatriz(),
      ])
      setSetores(sets)
      setProdutos(prods)
      setEquipamentos(equips)
      setMatriz(mat)

      if (sets.length > 0 && !regSetorId) setRegSetorId(sets[0].nome)
      if (equips.length > 0 && !regEquipTag) setRegEquipTag(equips[0].nome)
      if (prods.length > 0 && !regProdutoNome) setRegProdutoNome(prods[0].nome_comercial)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanco()
  }, [])

  // Submissão de novo registro de limpeza com consumo direto do banco estruturado
  const handleCriarRegistroLimpeza = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvandoRegistro(true)
    try {
      const isConforme = regInspecaoVisual === 'Conforme'
      const recordPayload: any = {
        procedure: procedure.id,
        formulario_codigo: 'F-LIMPEZA-01',
        data: `${regData} 08:00:00.000Z`,
        turno: regTurno,
        lote: regLote,
        status: isConforme ? 'Conforme' : 'Não Conforme',
        valor_medido: `Inspeção: ${regInspecaoVisual} | ATP: ${regAtpRlu || 'N/A'} RLU | Tipo: ${regTipoLimpeza}`,
        responsavel: user?.name || user?.email || 'Responsável do Setor',
        observacoes: regObs,
        dados_formulario: {
          setor_selecionado: regSetorId,
          equipamento_selecionado: regEquipTag,
          tipo_limpeza: regTipoLimpeza,
          produto_quimico_utilizado: regProdutoNome,
          inspecao_visual: regInspecaoVisual,
          atp_bioluminescencia_rlu: regAtpRlu,
          executor_setor_nome: user?.name,
          executor_setor_cpf: user?.cpf,
          executor_setor_data: new Date().toISOString(),
          status_aprovacao_qualidade: 'Pendente RQ',
        },
        status_assinatura: 'Pendente Assinatura',
        status_execucao: 'Preenchido',
        origem_registro: 'banco_limpeza_pop02',
      }

      await createRecord(recordPayload)
      toast({
        title: 'Registro de Limpeza Salvo com Sucesso',
        description:
          'Dados registrados a partir do banco estruturado e aguardando verificação da Qualidade (RQ).',
      })
      setOpenRegistroModal(false)
      onRecordCreated()
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar limpeza',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvandoRegistro(false)
    }
  }

  // Filtrar registros do POP 02 de limpeza
  const registrosLimpeza = records.filter(
    (r) => r.formulario_codigo === 'F-LIMPEZA-01' || r.origem_registro === 'banco_limpeza_pop02',
  )

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo do Auto Controle 02 */}
      <div className="bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white p-5 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#D9A404]" />
              <h2 className="text-lg sm:text-xl font-bold font-['Sora']">
                Auto Controle 02 – Limpeza e Higienização Estrutural & Funcional
              </h2>
            </div>
            <p className="text-xs text-emerald-100 max-w-3xl">
              Banco de dados integrado relacionando <strong>Setores</strong>,{' '}
              <strong>Tipos de Limpeza</strong>, <strong>Produtos e Superfícies</strong> e{' '}
              <strong>Equipamentos Fabris</strong>. Preenchimento rápido e padronizado com
              assinaturas do responsável do setor e aprovação da Qualidade (RQ e RT/RE).
            </p>
          </div>

          <Badge className="bg-[#D9A404] text-[#1B4332] font-bold text-xs uppercase self-start sm:self-auto">
            IN 04/2007 Item 07 Subitem 7.2
          </Badge>
        </div>
      </div>

      {/* 2. Navegação entre Preenchimento de Registros e Alimentação do Banco de Dados */}
      <div className="flex items-center gap-2 bg-[#FAF7EF] p-1.5 rounded-xl border border-[#E2DCCF]">
        <Button
          size="sm"
          variant={activeTab === 'registro_limpeza' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('registro_limpeza')}
          className={`h-8 text-xs font-semibold gap-1.5 ${
            activeTab === 'registro_limpeza' ? 'bg-[#1B4332] text-white' : 'text-stone-700'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Registros Operacionais de Limpeza ({registrosLimpeza.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'banco_dados' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('banco_dados')}
          className={`h-8 text-xs font-semibold gap-1.5 ${
            activeTab === 'banco_dados' ? 'bg-[#1B4332] text-white' : 'text-stone-700'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-[#D9A404]" />
          Alimentar Banco de Dados Estrutural (Setores, Produtos, Equipamentos & Matriz)
        </Button>
      </div>

      {/* TAB 1: REGISTROS OPERACIONAIS DE LIMPEZA (CONSUMO DO BANCO) */}
      {activeTab === 'registro_limpeza' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-xs">
            <div>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                Histórico de Execuções e Validações de Limpeza
              </h3>
              <p className="text-xs text-stone-500">
                Formulários gerados com dados consumidos do banco de sanitização e aprovados pela
                garantia da qualidade.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setOpenRegistroModal(true)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs h-9 gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Novo Registro de Limpeza (F-LIMPEZA-01)
            </Button>
          </div>

          {registrosLimpeza.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E2DCCF] space-y-3">
              <Sparkles className="h-10 w-10 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-600 font-semibold">
                Nenhum registro de limpeza preenchido até o momento.
              </p>
              <Button
                size="sm"
                onClick={() => setOpenRegistroModal(true)}
                className="bg-[#2D6A4F] text-white text-xs h-8"
              >
                Preencher Primeiro Registro com Dados do Banco
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2DCCF] overflow-hidden divide-y divide-[#E2DCCF]">
              {registrosLimpeza.map((rec) => {
                const dados = rec.dados_formulario || {}
                const isConforme = rec.status === 'Conforme'
                const isAssinadoRQ = rec.assinaturas_registro?.rq
                const isAssinadoRT = rec.assinaturas_registro?.rt || rec.assinaturas_registro?.re

                return (
                  <div key={rec.id} className="p-4 hover:bg-stone-50 transition space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#1B4332] text-white font-mono text-[10px]">
                          F-LIMPEZA-01
                        </Badge>
                        <span className="text-xs font-bold text-stone-900">
                          {dados.setor_selecionado || 'Setor Fabril'} •{' '}
                          {dados.equipamento_selecionado || 'Equipamento'}
                        </span>
                        <Badge
                          className={
                            isConforme
                              ? 'bg-emerald-600 text-white text-[10px]'
                              : 'bg-red-600 text-white text-[10px]'
                          }
                        >
                          {rec.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <span>
                          Data: <strong>{new Date(rec.data).toLocaleDateString('pt-BR')}</strong>
                        </span>
                        <span>
                          Turno: <strong>{rec.turno || '1º'}</strong>
                        </span>
                        <span className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded">
                          Lote: {rec.lote}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                      <div>
                        <span className="text-stone-400 block uppercase text-[9px] font-bold">
                          Tipo de Limpeza
                        </span>
                        <strong className="text-stone-800">{dados.tipo_limpeza || 'Geral'}</strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block uppercase text-[9px] font-bold">
                          Produto Sanitizante
                        </span>
                        <strong className="text-stone-800">
                          {dados.produto_quimico_utilizado || 'Sem produto'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400 block uppercase text-[9px] font-bold">
                          Executado por (Setor)
                        </span>
                        <strong className="text-stone-800">{rec.responsavel}</strong>
                      </div>
                    </div>

                    {/* Status de Validação da Hierarquia */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Execução do Setor Confirmada
                        </span>
                        <span
                          className={`flex items-center gap-1 text-[11px] font-semibold ${isAssinadoRQ ? 'text-emerald-800' : 'text-amber-700'}`}
                        >
                          {isAssinadoRQ ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          Aprovação da Qualidade (RQ): {isAssinadoRQ ? 'Aprovado' : 'Aguardando'}
                        </span>
                      </div>

                      <Badge variant="outline" className="text-[10px] text-stone-600">
                        {rec.status_assinatura || 'Pendente Assinatura'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALIMENTAÇÃO DO BANCO DE DADOS ESTRUTURAL */}
      {activeTab === 'banco_dados' && (
        <div className="space-y-6">
          {/* Seção 1: Setores e Áreas Fabris */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-[#D9A404]" />
                  1. Setores e Áreas Fabris a Serem Limpos ({setores.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Divisões físicas e estruturais do estabelecimento alimentadas no banco.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenModalSetor(true)}
                className="bg-[#2D6A4F] text-white text-xs h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Setor
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {setores.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex justify-between items-start"
                >
                  <div>
                    <Badge className="bg-[#1B4332] text-white text-[9px] font-mono">
                      {s.codigo}
                    </Badge>
                    <h4 className="text-xs font-bold text-stone-900 mt-1">{s.nome}</h4>
                    <span className="text-[10px] text-stone-500 block">
                      Tipo: {s.tipo_area || 'Seca'} • Resp: {s.responsavel_setor || 'Supervisor'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`Remover setor ${s.nome}?`)) {
                        await deleteLimpezaSetor(s.id)
                        loadBanco()
                      }
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Produtos e Sanitizantes por Superfície */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
                  <FlaskConical className="h-4 w-4 text-[#D9A404]" />
                  2. Produtos Químicos e Sanitizantes Homologados ({produtos.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Produtos químicos permitidos por tipo de superfície (Inox, Epóxi, Borracha,
                  Balanças).
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenModalProduto(true)}
                className="bg-[#2D6A4F] text-white text-xs h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Produto
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {produtos.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex justify-between items-start"
                >
                  <div>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px]">
                      {p.categoria}
                    </Badge>
                    <h4 className="text-xs font-bold text-stone-900 mt-1">{p.nome_comercial}</h4>
                    <p className="text-[10px] text-stone-500">{p.principio_ativo}</p>
                    <span className="text-[10px] text-[#2D6A4F] font-semibold block mt-0.5">
                      Superfícies:{' '}
                      {Array.isArray(p.superficies_aplicacao)
                        ? p.superficies_aplicacao.join(', ')
                        : p.superficies_aplicacao}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`Remover produto ${p.nome_comercial}?`)) {
                        await deleteLimpezaProduto(p.id)
                        loadBanco()
                      }
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Equipamentos e Maquinários Fabris */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
                  <Factory className="h-4 w-4 text-[#D9A404]" />
                  3. Equipamentos Fabris a Serem Limpos ({equipamentos.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Misturadores, ensacadeiras, moegas, elevadores e maquinários do processo.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenModalEquipamento(true)}
                className="bg-[#2D6A4F] text-white text-xs h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Equipamento
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {equipamentos.map((eq) => (
                <div
                  key={eq.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex justify-between items-start"
                >
                  <div>
                    <Badge className="bg-stone-800 text-white text-[9px] font-mono">{eq.tag}</Badge>
                    <h4 className="text-xs font-bold text-stone-900 mt-1">{eq.nome}</h4>
                    <span className="text-[10px] text-stone-500 block">
                      Setor: {eq.setor_nome || 'Geral'}
                    </span>
                    <span className="text-[10px] text-stone-600 block">
                      Superfície: {eq.tipo_superficie || 'Aço'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(`Remover equipamento ${eq.tag}?`)) {
                        await deleteLimpezaEquipamento(eq.id)
                        loadBanco()
                      }
                    }}
                    className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 4: Matriz Estrutural e Funcional (Relação Setor × Superfície × Produto × Tipo de Limpeza) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-[#D9A404]" />
                  4. Relação Estrutural & Funcional (Matriz Procedimental) ({matriz.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Cruzamento obrigatório Setor × Equipamento × Superfície × Produto Homologado ×
                  Método.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setOpenModalMatriz(true)}
                className="bg-[#2D6A4F] text-white text-xs h-8 gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Relação na Matriz
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Setor</th>
                    <th className="p-2.5">Equipamento / Área</th>
                    <th className="p-2.5">Tipo de Limpeza</th>
                    <th className="p-2.5">Produto Utilizado</th>
                    <th className="p-2.5">Critério de Aprovação</th>
                    <th className="p-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {matriz.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-mono font-bold text-[#2D6A4F]">
                        {m.codigo_procedimento}
                      </td>
                      <td className="p-2.5 font-semibold text-stone-800">{m.setor}</td>
                      <td className="p-2.5 text-stone-700">{m.equipamento_ou_area}</td>
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-[10px] bg-white">
                          {m.tipo_limpeza}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-stone-600">{m.produto_utilizado || '—'}</td>
                      <td className="p-2.5 text-stone-500 text-[11px]">{m.criterio_aprovacao}</td>
                      <td className="p-2.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (confirm(`Remover procedimento ${m.codigo_procedimento}?`)) {
                              await deleteLimpezaProcedimentoMatriz(m.id)
                              loadBanco()
                            }
                          }}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO REGISTRO DE LIMPEZA COM CONSUMO DO BANCO */}
      <Dialog open={openRegistroModal} onOpenChange={setOpenRegistroModal}>
        <DialogContent className="max-w-xl bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D9A404]" />
              Registro de Limpeza e Higienização (POP 02)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Formulário que consome o banco de dados de setores, superfícies, produtos e
              equipamentos homologados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriarRegistroLimpeza} className="space-y-3.5 pt-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Data da Higienização *
                </Label>
                <Input
                  type="date"
                  value={regData}
                  onChange={(e) => setRegData(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Turno de Execução *</Label>
                <select
                  value={regTurno}
                  onChange={(e) => setRegTurno(e.target.value as any)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white"
                >
                  <option value="Manhã">1º Turno (Manhã)</option>
                  <option value="Tarde">2º Turno (Tarde)</option>
                  <option value="Noite">3º Turno (Noite)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Identificação do Lote
                </Label>
                <Input
                  value={regLote}
                  onChange={(e) => setRegLote(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
            </div>

            {/* SELEÇÕES DINÂMICAS DO BANCO DE DADOS */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <span className="text-[10px] font-bold uppercase text-stone-500 block">
                Seleção com Dados do Banco de Autocontrole:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Setor a Ser Limpo *
                  </Label>
                  <select
                    value={regSetorId}
                    onChange={(e) => setRegSetorId(e.target.value)}
                    className="w-full h-9 text-xs px-2 rounded-md border border-stone-300 bg-white"
                    required
                  >
                    {setores.map((s) => (
                      <option key={s.id} value={s.nome}>
                        [{s.codigo}] {s.nome} ({s.tipo_area})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Equipamento a Ser Limpo *
                  </Label>
                  <select
                    value={regEquipTag}
                    onChange={(e) => setRegEquipTag(e.target.value)}
                    className="w-full h-9 text-xs px-2 rounded-md border border-stone-300 bg-white"
                    required
                  >
                    {equipamentos.map((eq) => (
                      <option key={eq.id} value={eq.nome}>
                        [{eq.tag}] {eq.nome} ({eq.tipo_superficie})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Tipo de Limpeza / Método *
                  </Label>
                  <select
                    value={regTipoLimpeza}
                    onChange={(e) => setRegTipoLimpeza(e.target.value)}
                    className="w-full h-9 text-xs px-2 rounded-md border border-stone-300 bg-white"
                  >
                    <option value="Limpeza a Seco / Aspiração">Limpeza a Seco / Aspiração</option>
                    <option value="Lavagem Úmida Sanitizante">Lavagem Úmida Sanitizante</option>
                    <option value="Flushing Mecânico">Flushing Mecânico (Arrasto Inerte)</option>
                    <option value="CIP (Clean-in-Place)">CIP (Clean-in-Place)</option>
                    <option value="Desincrustação Química">Desincrustação Química</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Produto Sanitizante Homologado
                  </Label>
                  <select
                    value={regProdutoNome}
                    onChange={(e) => setRegProdutoNome(e.target.value)}
                    className="w-full h-9 text-xs px-2 rounded-md border border-stone-300 bg-white"
                  >
                    <option value="Sem produto químico (apenas mecânico)">
                      Sem produto químico (apenas mecânico)
                    </option>
                    {produtos.map((p) => (
                      <option key={p.id} value={p.nome_comercial}>
                        {p.nome_comercial} ({p.categoria} - {p.concentracao_recomendada})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Verificação e Critérios de Aprovação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Inspeção Visual de Limpeza *
                </Label>
                <select
                  value={regInspecaoVisual}
                  onChange={(e) => setRegInspecaoVisual(e.target.value as any)}
                  className="w-full h-9 text-xs px-2 rounded-md border border-stone-300 bg-white font-bold"
                >
                  <option value="Conforme">Conforme (Zero Resíduos Visíveis)</option>
                  <option value="Não Conforme">Não Conforme (Resíduos Aderidos / Repetir)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  ATP Bioluminescência (RLU - Opcional)
                </Label>
                <Input
                  value={regAtpRlu}
                  onChange={(e) => setRegAtpRlu(e.target.value)}
                  placeholder="Ex: 18 RLU (Meta < 30)"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Observações Operacionais
              </Label>
              <Input
                value={regObs}
                onChange={(e) => setRegObs(e.target.value)}
                placeholder="Ex: Limpeza realizada após batelada de premix mineral."
                className="h-9 text-xs"
              />
            </div>

            {/* Aviso da Hierarquia de Assinatura */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-[11px] space-y-1">
              <strong>Hierarquia de Assinatura GIAC:</strong>
              <p>
                Ao salvar, será gerada a assinatura de execução do responsável do setor (
                <strong>{user?.name || 'Operador'}</strong>). O registro será encaminhado
                automaticamente para verificação e aprovação da Qualidade (RQ e RT/RE).
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenRegistroModal(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={salvandoRegistro}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs"
              >
                {salvandoRegistro ? 'Salvando...' : 'Salvar e Assinar Execução'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVO SETOR */}
      <Dialog open={openModalSetor} onOpenChange={setOpenModalSetor}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332]">
              Cadastrar Novo Setor Fabril
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Código do Setor (ex: SET-MOEGA)</Label>
              <Input
                value={formSetor.codigo}
                onChange={(e) => setFormSetor({ ...formSetor, codigo: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label>Nome do Setor</Label>
              <Input
                value={formSetor.nome}
                onChange={(e) => setFormSetor({ ...formSetor, nome: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Área</Label>
              <select
                value={formSetor.tipo_area}
                onChange={(e) => setFormSetor({ ...formSetor, tipo_area: e.target.value })}
                className="w-full h-8 text-xs px-2 border rounded"
              >
                <option value="Seca">Seca</option>
                <option value="Úmida">Úmida</option>
                <option value="Externa">Externa</option>
                <option value="Depósito">Depósito</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                size="sm"
                onClick={async () => {
                  if (!formSetor.codigo || !formSetor.nome) return
                  await createLimpezaSetor(formSetor)
                  setOpenModalSetor(false)
                  loadBanco()
                }}
                className="bg-[#2D6A4F] text-white text-xs"
              >
                Salvar Setor
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVO PRODUTO */}
      <Dialog open={openModalProduto} onOpenChange={setOpenModalProduto}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332]">
              Cadastrar Produto / Sanitizante
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Nome Comercial do Produto</Label>
              <Input
                value={formProduto.nome_comercial}
                onChange={(e) => setFormProduto({ ...formProduto, nome_comercial: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Princípio Ativo</Label>
              <Input
                value={formProduto.principio_ativo}
                onChange={(e) =>
                  setFormProduto({ ...formProduto, principio_ativo: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Superfícies de Aplicação Recomendadas</Label>
              <Input
                value={formProduto.superficies_aplicacao}
                onChange={(e) =>
                  setFormProduto({ ...formProduto, superficies_aplicacao: e.target.value })
                }
                placeholder="Ex: Inox 304, Pisos Epóxi, Balanças"
                className="h-8 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                size="sm"
                onClick={async () => {
                  if (!formProduto.nome_comercial) return
                  await createLimpezaProduto({
                    ...formProduto,
                    superficies_aplicacao: formProduto.superficies_aplicacao
                      .split(',')
                      .map((s) => s.trim()),
                  })
                  setOpenModalProduto(false)
                  loadBanco()
                }}
                className="bg-[#2D6A4F] text-white text-xs"
              >
                Salvar Produto
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVO EQUIPAMENTO */}
      <Dialog open={openModalEquipamento} onOpenChange={setOpenModalEquipamento}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332]">
              Cadastrar Equipamento Fabril
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>TAG / Código (ex: EQ-MIST-01)</Label>
              <Input
                value={formEquip.tag}
                onChange={(e) => setFormEquip({ ...formEquip, tag: e.target.value })}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label>Nome do Equipamento</Label>
              <Input
                value={formEquip.nome}
                onChange={(e) => setFormEquip({ ...formEquip, nome: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Tipo de Superfície de Contato</Label>
              <Input
                value={formEquip.tipo_superficie}
                onChange={(e) => setFormEquip({ ...formEquip, tipo_superficie: e.target.value })}
                placeholder="Ex: Aço Inox 304"
                className="h-8 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                size="sm"
                onClick={async () => {
                  if (!formEquip.tag || !formEquip.nome) return
                  await createLimpezaEquipamento(formEquip)
                  setOpenModalEquipamento(false)
                  loadBanco()
                }}
                className="bg-[#2D6A4F] text-white text-xs"
              >
                Salvar Equipamento
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVA MATRIZ PROCEDIMENTAL */}
      <Dialog open={openModalMatriz} onOpenChange={setOpenModalMatriz}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332]">
              Vincular Matriz de Limpeza
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label>Código do Procedimento (ex: POP02-PR-04)</Label>
              <Input
                value={formMatriz.codigo_procedimento}
                onChange={(e) =>
                  setFormMatriz({ ...formMatriz, codigo_procedimento: e.target.value })
                }
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label>Setor</Label>
              <Input
                value={formMatriz.setor}
                onChange={(e) => setFormMatriz({ ...formMatriz, setor: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label>Equipamento / Área</Label>
              <Input
                value={formMatriz.equipamento_ou_area}
                onChange={(e) =>
                  setFormMatriz({ ...formMatriz, equipamento_ou_area: e.target.value })
                }
                className="h-8 text-xs"
              />
            </div>
            <DialogFooter>
              <Button
                size="sm"
                onClick={async () => {
                  if (!formMatriz.codigo_procedimento) return
                  await createLimpezaProcedimentoMatriz(formMatriz)
                  setOpenModalMatriz(false)
                  loadBanco()
                }}
                className="bg-[#2D6A4F] text-white text-xs"
              >
                Salvar Matriz
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
