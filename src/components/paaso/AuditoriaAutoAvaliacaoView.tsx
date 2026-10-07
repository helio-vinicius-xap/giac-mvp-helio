import React, { useState, useEffect, useRef } from 'react'
import {
  ClipboardCheck,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  Building,
  HelpCircle,
  FileText,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { canSignAsRT, canSignAsRE, canSignAsRQ, canManagePopForms } from '@/lib/permissions'
import { formatarCNPJ, validarCNPJ } from '@/lib/pop01Validators'
import { sincronizarAutoAvaliacaoNoAnexoII } from '@/services/pop01IntegrationService'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import {
  getQuestionarioAtivo,
  importarQuestionarioXlsxRuntime,
  getAutoAvaliacoesList,
  salvarAutoAvaliacao,
  gerarProximoNumeroAutoAvaliacao,
} from '@/services/autoAvaliacaoService'
import { criarOuAtualizarFornecedor, salvarNcFornecedor } from '@/services/paasoService'
import {
  gerarConvitePortal,
  getConvitesPortalList,
  type ConvitePortalFornecedor,
} from '@/services/portalFornecedorService'
import {
  calcularNotaFinalAutoAvaliacao,
  avaliarAprovacaoFinal,
  type QuestionarioFornecedorDef,
  type AutoAvaliacaoFornecedorItem,
  type TipoFornecedorOpcao,
  type AreaAtuacaoOpcao,
  type CategoriaInsumoOpcao,
  type ProgramaQualidadeOpcao,
  type RespostaConformidade,
  type RespostaItemQuestionario,
} from '@/types/autoAvaliacaoFornecedor'
import type { SipeagroItem, FornecedorItem } from '@/types/paaso'
import { AutoAvaliacaoPdfModal } from './AutoAvaliacaoPdfModal'

const TIPOS_FORNECEDOR_OPCOES: TipoFornecedorOpcao[] = [
  'Fabricante',
  'Fabricante Estrangeiro',
  'Fabricante Anvisa',
  'Outro Fabricante',
  'Distribuidor',
  'Fracionador',
  'Produtor Rural',
  'Outra',
]

const AREAS_ATUACAO_OPCOES: AreaAtuacaoOpcao[] = [
  'ANVISA',
  'MAPA',
  'MAPA+ANVISA',
  'OUTRO',
  'PRODUTOR RURAL',
]

const CATEGORIAS_INSUMO_OPCOES: CategoriaInsumoOpcao[] = [
  'Aditivo',
  'Ingrediente',
  'Material de Embalagem',
  'Núcleo',
  'Premix',
]

const PROGRAMAS_QUALIDADE_OPCOES: ProgramaQualidadeOpcao[] = ['BPF/GMP', 'APPCC', 'GMP+', 'FAMIQS']

const CATEGORIAS_ESTABELECIMENTO_MAPA = [
  'Fabricante (1)',
  'Fracionador (2)',
  'Importador (3)',
  'Armazenador (4)',
]

interface AuditoriaAutoAvaliacaoViewProps {
  estabelecimentosSipeagro: SipeagroItem[]
  fornecedores: FornecedorItem[]
  onDataChanged: () => void
  onAbrirNaoConformidade?: (cnpj: string, descricao: string) => void
}

export function AuditoriaAutoAvaliacaoView({
  estabelecimentosSipeagro,
  fornecedores,
  onDataChanged,
  onAbrirNaoConformidade,
}: AuditoriaAutoAvaliacaoViewProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Questionário ativo carregado do banco
  const [questionario, setQuestionario] = useState<QuestionarioFornecedorDef | null>(null)
  const [loadingQuestionario, setLoadingQuestionario] = useState(true)
  const [importandoXlsx, setImportandoXlsx] = useState(false)

  // Lista de avaliações salvas
  const [avaliacoes, setAvaliacoes] = useState<AutoAvaliacaoFornecedorItem[]>([])
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(true)

  // Convites do Portal do Fornecedor
  const [convitesPortal, setConvitesPortal] = useState<ConvitePortalFornecedor[]>([])
  const [openModalConvite, setOpenModalConvite] = useState(false)
  const [conviteCnpj, setConviteCnpj] = useState('')
  const [conviteNome, setConviteNome] = useState('')
  const [conviteEmail, setConviteEmail] = useState('')
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [gerandoConvite, setGerandoConvite] = useState(false)

  // Modal de visualização / impressão PDF
  const [avaliacaoParaImprimir, setAvaliacaoParaImprimir] =
    useState<AutoAvaliacaoFornecedorItem | null>(null)
  const [pdfModalOpen, setPdfModalOpen] = useState(false)

  // Dialog para abrir NC automática em caso de reprovação
  const [dialogNcOpen, setDialogNcOpen] = useState(false)
  const [ncReprovadaCnpj, setNcReprovadaCnpj] = useState('')
  const [ncReprovadaDescricao, setNcReprovadaDescricao] = useState('')

  // Estado do formulário em preenchimento
  const [modoEdicao, setModoEdicao] = useState<'novo' | 'editando'>('novo')
  const [idAvaliacaoAtual, setIdAvaliacaoAtual] = useState<string | undefined>(undefined)
  const [numeroRegistro, setNumeroRegistro] = useState('PAC-01_R0001')

  // Seção 1: Cabeçalho
  const [codigoDoc, setCodigoDoc] = useState('POP 01-AC01')
  const [dataElaboracao, setDataElaboracao] = useState('2026-08-08')
  const [dataEdicao, setDataEdicao] = useState('2026-10-07')
  const [revisaoDoc, setRevisaoDoc] = useState('Rev.01')

  // Seção 2: Dados Cadastrais
  const [dataAvaliacao, setDataAvaliacao] = useState(() => new Date().toISOString().split('T')[0])
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [endereco, setEndereco] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cep, setCep] = useState('')
  const [contato, setContato] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')

  // SIPEAGRO feedback e confirmação
  const [sipeagroEncontrado, setSipeagroEncontrado] = useState<SipeagroItem | null>(null)
  const [sipeagroCategoriasConfirmadas, setSipeagroCategoriasConfirmadas] = useState<string[]>([])
  const [sipeagroTiposConfirmados, setSipeagroTiposConfirmados] = useState<string[]>([])

  // Seção 3: Tipo de Fornecedor
  const [tipoFornecedor, setTipoFornecedor] = useState<TipoFornecedorOpcao | string>('Fabricante')
  const [tipoOutroEspecificar, setTipoOutroEspecificar] = useState('')
  const [areaAtuacao, setAreaAtuacao] = useState<AreaAtuacaoOpcao | string>('MAPA')
  const [numeroRegistroMapa, setNumeroRegistroMapa] = useState('')
  const [isentoRegistroEspecificar, setIsentoRegistroEspecificar] = useState('')
  const [categoriasInsumo, setCategoriasInsumo] = useState<CategoriaInsumoOpcao[]>(['Aditivo'])
  const [programasQualidade, setProgramasQualidade] = useState<ProgramaQualidadeOpcao[]>([
    'BPF/GMP',
  ])
  const [programasOutroEspecificar, setProgramasOutroEspecificar] = useState('')

  // Seção 4: Questionário de Respostas
  const [respostas, setRespostas] = useState<{
    [num: number]: { resposta: RespostaConformidade; arquivo?: string }
  }>({})

  // Avaliação Final & Observações
  const [limiarCorte, setLimiarCorte] = useState(70)
  const [observacoes, setObservacoes] = useState('')

  // Assinaturas
  const [respPreenchimentoNome, setRespPreenchimentoNome] = useState(user?.name || '')
  const [respPreenchimentoFuncao, setRespPreenchimentoFuncao] = useState(
    user?.cargo || 'Execução do Preenchimento',
  )
  const [respAprovacaoNome, setRespAprovacaoNome] = useState('')
  const [respAprovacaoFuncao, setRespAprovacaoFuncao] = useState('Responsável Técnico (RT / CRMV)')
  const [respRqNome, setRespRqNome] = useState('')
  const [respRqFuncao, setRespRqFuncao] = useState('Responsável pela Qualidade (RQ)')

  const [salvando, setSalvando] = useState(false)

  // Permissões conforme a hierarquia GIAC
  const podeAprovarRTouRE = canSignAsRT(user?.role) || canSignAsRE(user?.role)
  const podeVerificarRQ = canSignAsRQ(user?.role)
  const podeAprovar = podeAprovarRTouRE
  const podeGerenciarConfig = canManagePopForms(user?.role)

  // Carregar questionário e lista de avaliações
  const carregarDadosIniciais = async () => {
    setLoadingQuestionario(true)
    setLoadingAvaliacoes(true)
    try {
      const q = await getQuestionarioAtivo()
      setQuestionario(q)
      if (q?.limiar_aprovacao) {
        setLimiarCorte(q.limiar_aprovacao)
      }

      const [list, convs] = await Promise.all([getAutoAvaliacoesList(), getConvitesPortalList()])
      setAvaliacoes(list)
      setConvitesPortal(convs)

      const proxNum = await gerarProximoNumeroAutoAvaliacao()
      setNumeroRegistro(proxNum)
    } catch (err: any) {
      console.warn('Erro ao carregar dados da aba Auditoria:', err)
    } finally {
      setLoadingQuestionario(false)
      setLoadingAvaliacoes(false)
    }
  }

  useEffect(() => {
    carregarDadosIniciais()
  }, [])

  // Atualiza nome e cargo inicial do usuário logado
  useEffect(() => {
    if (user?.name && !respPreenchimentoNome) {
      setRespPreenchimentoNome(user.name)
    }
    if (user?.cargo && !respPreenchimentoFuncao) {
      setRespPreenchimentoFuncao(user.cargo)
    }
  }, [user])

  // Iniciar respostas padrão quando o questionário for carregado
  useEffect(() => {
    if (questionario?.perguntas && Object.keys(respostas).length === 0) {
      const initial: { [num: number]: { resposta: RespostaConformidade; arquivo?: string } } = {}
      questionario.perguntas.forEach((p) => {
        initial[p.numero] = { resposta: '', arquivo: '' }
      })
      setRespostas(initial)
    }
  }, [questionario])

  // Importar questionário (.xlsx) em RUNTIME
  const handleSelecionarArquivoXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportandoXlsx(true)
    try {
      const res = await importarQuestionarioXlsxRuntime(file)
      setQuestionario(res.questionario)
      if (res.cabecalhoExtraido?.codigo) setCodigoDoc(res.cabecalhoExtraido.codigo)
      if (res.cabecalhoExtraido?.elaboracao) setDataElaboracao(res.cabecalhoExtraido.elaboracao)
      if (res.cabecalhoExtraido?.edicao) setDataEdicao(res.cabecalhoExtraido.edicao)
      if (res.cabecalhoExtraido?.revisao) setRevisaoDoc(res.cabecalhoExtraido.revisao)

      // Atualizar respostas com os novos itens
      const initial: { [num: number]: { resposta: RespostaConformidade; arquivo?: string } } = {}
      res.questionario.perguntas.forEach((p) => {
        initial[p.numero] = { resposta: '', arquivo: '' }
      })
      setRespostas(initial)

      toast({
        title: 'Questionário importado com sucesso!',
        description: `${res.perguntasCount} perguntas extraídas dinamicamente e salvas no banco da organização. Registrado na trilha de auditoria.`,
      })
    } catch (err: any) {
      console.error('Falha na importação do .xlsx:', err)
      toast({
        title: 'Erro ao importar questionário',
        description: err.message || 'Verifique se o arquivo é a planilha oficial do POP 01-AC01.',
        variant: 'destructive',
      })
    } finally {
      setImportandoXlsx(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Autofill via SIPEAGRO no CNPJ
  const buscarEPreencherSipeagro = (cnpjDigitado: string) => {
    const norm = normalizarCNPJ(cnpjDigitado)
    if (!norm) {
      setSipeagroEncontrado(null)
      return
    }

    if (estabelecimentosSipeagro.length === 0) {
      toast({
        title: 'Base SIPEAGRO vazia',
        description:
          'Importe ou atualize a planilha oficial do MAPA na aba "Base SIPEAGRO" para habilitar o preenchimento automático oficial.',
        variant: 'destructive',
      })
      return
    }

    const estab = estabelecimentosSipeagro.find((s) => normalizarCNPJ(s.cnpj) === norm)

    if (estab) {
      setSipeagroEncontrado(estab)
      setRazaoSocial(estab.razao_social)
      if (estab.uf) setEstado(estab.uf)
      if (estab.municipio) setCidade(estab.municipio)
      if (estab.registro_sipeagro) {
        setNumeroRegistroMapa(estab.registro_sipeagro)
      }

      // Mapear categoria para o padrão do formulário
      if (estab.categoria === 'fabricante') {
        setTipoFornecedor('Fabricante')
        setAreaAtuacao('MAPA')
        setSipeagroCategoriasConfirmadas(['Fabricante (1)'])
      } else if (estab.categoria === 'fracionador') {
        setTipoFornecedor('Fracionador')
        setAreaAtuacao('MAPA')
        setSipeagroCategoriasConfirmadas(['Fracionador (2)'])
      } else if (estab.categoria === 'importador') {
        setTipoFornecedor('Fabricante Estrangeiro')
        setAreaAtuacao('MAPA')
        setSipeagroCategoriasConfirmadas(['Importador (3)'])
      } else if (estab.categoria === 'armazenador') {
        setTipoFornecedor('Distribuidor')
        setAreaAtuacao('MAPA')
        setSipeagroCategoriasConfirmadas(['Armazenador (4)'])
      }

      // Tipos de produtos habilitados (células 1, 2 ou 3)
      if (estab.tipos_produto && Array.isArray(estab.tipos_produto)) {
        setSipeagroTiposConfirmados(estab.tipos_produto)

        // Se algum tipo bater com Aditivo, Núcleo, Premix, Ingrediente...
        const catsNovas: CategoriaInsumoOpcao[] = []
        estab.tipos_produto.forEach((t) => {
          const tLower = t.toLowerCase()
          if (tLower.includes('aditivo') && !catsNovas.includes('Aditivo'))
            catsNovas.push('Aditivo')
          if (tLower.includes('ingrediente') && !catsNovas.includes('Ingrediente'))
            catsNovas.push('Ingrediente')
          if (tLower.includes('núcleo') && !catsNovas.includes('Núcleo')) catsNovas.push('Núcleo')
          if (tLower.includes('premix') && !catsNovas.includes('Premix')) catsNovas.push('Premix')
        })
        if (catsNovas.length > 0) {
          setCategoriasInsumo(catsNovas)
        }
      }

      toast({
        title: 'Estabelecimento localizado no SIPEAGRO!',
        description: `Razão: ${estab.razao_social} | Situação: ${estab.situacao}. Dados preenchidos automaticamente.`,
      })
    } else {
      setSipeagroEncontrado(null)
      toast({
        title: 'CNPJ não encontrado na base SIPEAGRO',
        description:
          'Este fornecedor não consta na lista importada do MAPA. Verifique o número digitado ou atualize a planilha do MAPA na aba "Base SIPEAGRO".',
        variant: 'destructive',
      })
    }
  }

  // Preencher a partir de um Fornecedor já cadastrado localmente
  const handleSelecionarFornecedorExistente = (cnpjForn: string) => {
    const f = fornecedores.find((item) => normalizarCNPJ(item.cnpj) === normalizarCNPJ(cnpjForn))
    if (!f) return

    setCnpj(f.cnpj)
    setRazaoSocial(f.razao_social)
    if (f.contato_nome) setContato(f.contato_nome)
    if (f.email) setEmail(f.email)
    if (f.telefone) setTelefone(f.telefone)
    if (f.uf) setEstado(f.uf)
    if (f.municipio) setCidade(f.municipio)

    // Cruzar com SIPEAGRO
    buscarEPreencherSipeagro(f.cnpj)
  }

  // Cálculos Automáticos de Totais e Nota
  const totalPerguntas = questionario?.perguntas?.length || 20

  let totalC = 0
  let totalNC = 0
  let totalNA = 0

  Object.values(respostas).forEach((item) => {
    if (item.resposta === 'C') totalC += 1
    else if (item.resposta === 'NC') totalNC += 1
    else if (item.resposta === 'NA') totalNA += 1
  })

  const notaFinal = calcularNotaFinalAutoAvaliacao(totalC, totalNA, totalPerguntas)
  const resultadoAvaliacao = avaliarAprovacaoFinal(notaFinal, limiarCorte)

  // Manipulação de respostas
  const handleAlterarResposta = (num: number, resp: RespostaConformidade) => {
    setRespostas((prev) => ({
      ...prev,
      [num]: {
        resposta: resp,
        arquivo: prev[num]?.arquivo || '',
      },
    }))
  }

  const handleAlterarArquivo = (num: number, arq: string) => {
    setRespostas((prev) => ({
      ...prev,
      [num]: {
        resposta: prev[num]?.resposta || '',
        arquivo: arq,
      },
    }))
  }

  // Multi-seleção de categorias de insumo
  const toggleCategoriaInsumo = (cat: CategoriaInsumoOpcao) => {
    setCategoriasInsumo((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  // Multi-seleção de programas de qualidade
  const toggleProgramaQualidade = (prog: ProgramaQualidadeOpcao) => {
    setProgramasQualidade((prev) =>
      prev.includes(prog) ? prev.filter((p) => p !== prog) : [...prev, prog],
    )
  }

  // Limpar formulário
  const handleLimparFormulario = async () => {
    setModoEdicao('novo')
    setIdAvaliacaoAtual(undefined)
    const proxNum = await gerarProximoNumeroAutoAvaliacao()
    setNumeroRegistro(proxNum)
    setCnpj('')
    setRazaoSocial('')
    setNomeFantasia('')
    setEndereco('')
    setCidade('')
    setEstado('')
    setCep('')
    setContato('')
    setEmail('')
    setTelefone('')
    setSipeagroEncontrado(null)
    setSipeagroCategoriasConfirmadas([])
    setSipeagroTiposConfirmados([])
    setObservacoes('')
    setRespAprovacaoNome('')
    setRespAprovacaoFuncao('Responsável Técnico (RT / CRMV)')
    setRespRqNome('')
    setRespRqFuncao('Responsável pela Qualidade (RQ)')

    if (questionario?.perguntas) {
      const initial: { [num: number]: { resposta: RespostaConformidade; arquivo?: string } } = {}
      questionario.perguntas.forEach((p) => {
        initial[p.numero] = { resposta: '', arquivo: '' }
      })
      setRespostas(initial)
    }
  }

  // Carregar avaliação para edição / revisão
  const handleEditarAvaliacao = (item: AutoAvaliacaoFornecedorItem) => {
    setModoEdicao('editando')
    setIdAvaliacaoAtual(item.id)
    setNumeroRegistro(item.numero_registro)
    setCodigoDoc(item.codigo_doc || 'POP 01-AC01')
    setDataElaboracao(item.data_elaboracao || '2026-08-08')
    setDataEdicao(item.data_edicao || '2026-10-07')
    setRevisaoDoc(item.revisao_doc || 'Rev.01')

    setDataAvaliacao(item.data_avaliacao)
    const c = item.dados_cadastrais || ({} as any)
    setCnpj(c.cnpj || item.fornecedor_cnpj)
    setRazaoSocial(c.razao_social || item.razao_social)
    setNomeFantasia(c.nome_fantasia || item.nome_fantasia || '')
    setEndereco(c.endereco || '')
    setCidade(c.cidade || '')
    setEstado(c.estado || '')
    setCep(c.cep || '')
    setContato(c.contato || '')
    setEmail(c.email || '')
    setTelefone(c.telefone || '')

    const tf = item.tipo_fornecedor || ({} as any)
    setTipoFornecedor(tf.tipo || 'Fabricante')
    setTipoOutroEspecificar(tf.tipo_outro_especificar || '')
    setAreaAtuacao(tf.area_atuacao || 'MAPA')
    setNumeroRegistroMapa(tf.numero_registro || '')
    setIsentoRegistroEspecificar(tf.isento_registro_especificar || '')
    setCategoriasInsumo(tf.categorias || [])
    setProgramasQualidade(tf.programas_qualidade || [])
    setProgramasOutroEspecificar(tf.programas_outro_especificar || '')
    setSipeagroCategoriasConfirmadas(tf.sipeagro_categorias_estabelecimento || [])
    setSipeagroTiposConfirmados(tf.sipeagro_tipos_produto || [])

    // Respostas
    const respsMap: { [num: number]: { resposta: RespostaConformidade; arquivo?: string } } = {}
    if (Array.isArray(item.respostas)) {
      item.respostas.forEach((r) => {
        respsMap[r.numero] = {
          resposta: r.resposta,
          arquivo: r.nome_arquivo || '',
        }
      })
    }
    setRespostas(respsMap)

    setObservacoes(item.observacoes || '')
    setRespPreenchimentoNome(item.assinaturas?.preenchimento?.nome || user?.name || '')
    setRespPreenchimentoFuncao(
      item.assinaturas?.preenchimento?.funcao || user?.cargo || 'Execução do Preenchimento',
    )
    setRespAprovacaoNome(item.assinaturas?.aprovacao?.nome || '')
    setRespAprovacaoFuncao(item.assinaturas?.aprovacao?.funcao || 'Responsável Técnico (RT / CRMV)')
    setRespRqNome(item.assinaturas?.verificacao_rq?.nome || '')
    setRespRqFuncao(item.assinaturas?.verificacao_rq?.funcao || 'Responsável pela Qualidade (RQ)')

    // Tentar localizar no SIPEAGRO
    const estab = estabelecimentosSipeagro.find(
      (s) => normalizarCNPJ(s.cnpj) === normalizarCNPJ(item.fornecedor_cnpj),
    )
    setSipeagroEncontrado(estab || null)

    window.scrollTo({ top: 400, behavior: 'smooth' })
  }

  // Submeter / Salvar Avaliação
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()

    const cnpjNorm = normalizarCNPJ(cnpj)
    if (!cnpjNorm || cnpjNorm.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'Informe um CNPJ válido com 14 dígitos.',
        variant: 'destructive',
      })
      return
    }

    if (!razaoSocial.trim()) {
      toast({
        title: 'Razão Social obrigatória',
        description: 'Preencha a Razão Social do fornecedor.',
        variant: 'destructive',
      })
      return
    }

    if (!respPreenchimentoNome.trim()) {
      toast({
        title: 'Responsável pelo preenchimento obrigatório',
        description: 'Informe o nome do responsável pelo preenchimento.',
        variant: 'destructive',
      })
      return
    }

    setSalvando(true)
    try {
      // Formatar lista de respostas
      const listaRespostas: RespostaItemQuestionario[] = Object.entries(respostas).map(
        ([numStr, val]) => {
          const num = parseInt(numStr, 10)
          const perg = questionario?.perguntas.find((p) => p.numero === num)
          return {
            numero: num,
            texto: perg?.texto,
            resposta: val.resposta,
            nome_arquivo: val.arquivo,
          }
        },
      )

      // Montar assinaturas
      const assinaturasObj: any = {
        preenchimento: {
          nome: respPreenchimentoNome.trim() || user?.name || 'Operador',
          funcao: respPreenchimentoFuncao.trim() || 'Execução',
          usuario_id: user?.id,
          user_role: user?.role,
          data_assinatura: new Date().toISOString(),
          assinatura_imagem: user?.assinatura_imagem,
        },
      }

      let hasAssinaturaRTRE = false
      let hasAssinaturaRQ = false

      if (respAprovacaoNome.trim()) {
        if (!podeAprovarRTouRE) {
          toast({
            title: 'Assinatura de Aprovação requer RT ou RE',
            description:
              'A hierarquia GIAC exige perfil técnico homologado (RT ou RE) para a Assinatura 1 de Aprovação.',
            variant: 'destructive',
          })
        } else {
          assinaturasObj.aprovacao = {
            nome: respAprovacaoNome.trim(),
            funcao: respAprovacaoFuncao.trim(),
            usuario_id: user?.id,
            user_role: user?.role,
            data_assinatura: new Date().toISOString(),
            assinatura_imagem: user?.assinatura_imagem,
          }
          hasAssinaturaRTRE = true
        }
      }

      if (respRqNome.trim()) {
        if (!podeVerificarRQ) {
          toast({
            title: 'Assinatura de Verificação requer RQ',
            description:
              'A hierarquia GIAC exige perfil de Responsável pela Qualidade (RQ) para a Assinatura 2.',
            variant: 'destructive',
          })
        } else {
          assinaturasObj.verificacao_rq = {
            nome: respRqNome.trim(),
            funcao: respRqFuncao.trim(),
            usuario_id: user?.id,
            user_role: user?.role,
            data_assinatura: new Date().toISOString(),
            assinatura_imagem: user?.assinatura_imagem,
          }
          hasAssinaturaRQ = true
        }
      }

      let statusAssinatura = 'Pendente Assinatura'
      if (hasAssinaturaRTRE && hasAssinaturaRQ) {
        statusAssinatura = 'Homologado (RT/RE + RQ)'
      } else if (hasAssinaturaRTRE) {
        statusAssinatura = 'Pendente Assinatura RQ'
      } else if (hasAssinaturaRQ) {
        statusAssinatura = 'Pendente Assinatura RT/RE'
      } else {
        statusAssinatura = 'Preenchido (Aguardando RT/RE + RQ)'
      }

      const payload: Partial<AutoAvaliacaoFornecedorItem> = {
        id: idAvaliacaoAtual,
        numero_registro: numeroRegistro,
        fornecedor_cnpj: cnpjNorm,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim(),
        data_avaliacao: dataAvaliacao,
        codigo_doc: codigoDoc,
        data_elaboracao: dataElaboracao,
        data_edicao: dataEdicao,
        revisao_doc: revisaoDoc,
        dados_cadastrais: {
          data_avaliacao: dataAvaliacao,
          cnpj: cnpjNorm,
          razao_social: razaoSocial.trim(),
          nome_fantasia: nomeFantasia.trim(),
          endereco: endereco.trim(),
          cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(),
          cep: cep.trim(),
          contato: contato.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
        },
        tipo_fornecedor: {
          tipo: tipoFornecedor,
          tipo_outro_especificar: tipoOutroEspecificar.trim(),
          area_atuacao: areaAtuacao,
          numero_registro: numeroRegistroMapa.trim(),
          isento_registro_especificar: isentoRegistroEspecificar.trim(),
          categorias: categoriasInsumo,
          programas_qualidade: programasQualidade,
          programas_outro_especificar: programasOutroEspecificar.trim(),
          sipeagro_situacao: sipeagroEncontrado?.situacao,
          sipeagro_categorias_estabelecimento: sipeagroCategoriasConfirmadas,
          sipeagro_tipos_produto: sipeagroTiposConfirmados,
        },
        respostas: listaRespostas,
        total_c: totalC,
        total_nc: totalNC,
        total_na: totalNA,
        nota_final: notaFinal,
        avaliacao_final: resultadoAvaliacao,
        observacoes: observacoes.trim(),
        assinaturas: assinaturasObj,
        status_assinatura: statusAssinatura,
      }

      const salva = await salvarAutoAvaliacao(payload)

      // Garantir também cadastro na coleção fornecedores
      await criarOuAtualizarFornecedor({
        cnpj: cnpjNorm,
        razao_social: razaoSocial.trim(),
        contato_nome: contato.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        uf: estado.trim().toUpperCase(),
        municipio: cidade.trim(),
      })

      // Sincronizar na Lista de Fornecedores Qualificados (Anexo II / FR 14) do POP 01
      try {
        await sincronizarAutoAvaliacaoNoAnexoII(
          '', // procedureId dinâmico resolvido pelo serviço
          {
            id: salva.id || '',
            numero_registro: salva.numero_registro,
            fornecedor_cnpj: salva.fornecedor_cnpj,
            razao_social: salva.razao_social,
            data_avaliacao: salva.data_avaliacao,
            nota_final: salva.nota_final,
            avaliacao_final: salva.avaliacao_final,
            status_assinatura: salva.status_assinatura,
          },
          respAprovacaoNome.trim() || user?.name || 'Responsável Técnico',
        )
      } catch (errSync) {
        console.warn('Sincronização com Anexo II informacional:', errSync)
      }

      toast({
        title: `Auto Avaliação ${salva.numero_registro} salva!`,
        description: `Resultado: ${resultadoAvaliacao} (Nota: ${notaFinal}%). Registrado no banco oficial da organização.`,
      })

      // Se foi REPROVADA, abrir diálogo sugerindo Ação Corretiva
      if (resultadoAvaliacao === 'REPROVADO') {
        setNcReprovadaCnpj(cnpjNorm)
        setNcReprovadaDescricao(
          `Fornecedor reprovado na Auto Avaliação ${salva.numero_registro} com nota ${notaFinal}% (abaixo do limiar de ${limiarCorte}%). Não conformidades identificadas no questionário POP 01-AC01.`,
        )
        setDialogNcOpen(true)
      }

      // Atualizar lista e limpar formulário
      await carregarDadosIniciais()
      onDataChanged()
      handleLimparFormulario()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar auto avaliação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  // Abrir Ação Corretiva após reprovação
  const handleConfirmarAbrirNc = async () => {
    try {
      await salvarNcFornecedor({
        data: new Date().toISOString().split('T')[0],
        fornecedor_cnpj: ncReprovadaCnpj,
        descricao: ncReprovadaDescricao,
        severidade: 'ALTA',
        acao_corretiva: 'Auditoria extraordinária e plano de adequação conforme POP 01.',
        status: 'ABERTA',
      })
      toast({
        title: 'Ação Corretiva / Não Conformidade registrada no PAASO',
        description:
          'Ocorrência aberta na aba "Não Conformidades" para acompanhamento da equipe técnica.',
      })
      setDialogNcOpen(false)
      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Erro ao criar Não Conformidade',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Barra de Ações e Estado do Questionário */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <ClipboardCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
                Formulário de Auto Avaliação do Fornecedor (POP 01-AC01)
              </h2>
              <span className="text-xs text-stone-500">
                Cadastro e Auto Avaliação do Fornecedor com 4 seções, validação de nota e
                conformidade com a IN 04/2007 MAPA.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Input oculto para carregar planilha .xlsx */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleSelecionarArquivoXlsx}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importandoXlsx}
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 text-xs h-9 gap-1.5 font-semibold"
            title="Importar perguntas do arquivo .xlsx oficial em runtime"
          >
            <UploadCloud className="h-4 w-4" />
            {importandoXlsx ? 'Importando questionário...' : 'Importar questionário (.xlsx)'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLinkGerado(null)
              setConviteCnpj('')
              setConviteNome('')
              setConviteEmail('')
              setOpenModalConvite(true)
            }}
            className="border-[#2D6A4F] text-[#2D6A4F] hover:bg-emerald-50 text-xs h-9 gap-1.5 font-bold"
          >
            <ExternalLink className="h-4 w-4 text-[#D9A404]" />
            Gerar Link do Portal do Fornecedor
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={carregarDadosIniciais}
            className="h-9 text-xs text-stone-600 gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingQuestionario ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
        </div>
      </div>

      {/* Bloco de Links Gerados do Portal do Fornecedor */}
      {convitesPortal.length > 0 && (
        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <ExternalLink className="h-4 w-4 text-[#D9A404]" />
              Links Enviados ao Portal do Fornecedor ({convitesPortal.length})
            </span>
            <span className="text-[11px] text-amber-800">
              O fornecedor externo preenche via link online; ao receber, valide os dados e aprove
              com RT/RE + RQ.
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {convitesPortal.map((cv) => (
              <div
                key={cv.id}
                className="p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-stone-900 truncate max-w-[170px]">
                    {cv.fornecedor_nome || 'Fornecedor Externo'}
                  </strong>
                  <Badge
                    className={
                      cv.status === 'PREENCHIDO'
                        ? 'bg-emerald-700 text-white text-[9px]'
                        : 'bg-amber-600 text-white text-[9px]'
                    }
                  >
                    {cv.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-stone-500 font-mono">
                  {cv.fornecedor_cnpj ? formatarCNPJ(cv.fornecedor_cnpj) : 'CNPJ a preencher'}
                </p>
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/portal-fornecedor/${cv.token}`
                      navigator.clipboard.writeText(url)
                      toast({ title: 'Link do portal copiado para a área de transferência!' })
                    }}
                    className="text-[#2D6A4F] hover:underline font-bold"
                  >
                    Copiar Link
                  </button>
                  <span className="text-stone-400">
                    {new Date(cv.created || '').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de Estado Vazio se questionário ainda não foi importado no banco */}
      {!loadingQuestionario && (!questionario || questionario.perguntas.length === 0) && (
        <div className="bg-amber-50/80 p-6 rounded-2xl border border-amber-200 text-stone-800 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold font-['Sora'] text-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Nenhum questionário oficial carregado no banco de dados da sua organização
          </div>
          <p className="text-xs text-stone-700 leading-relaxed">
            Conforme as diretrizes de segurança da informação e auditoria regulatória do MAPA, o
            texto das 20 perguntas avaliadas <strong>não fica gravado no código</strong>. Ele é
            importado em tempo de execução a partir da planilha oficial fornecida (ex:{' '}
            <code>POP 01_AC_001_Avaliacao_fornecedor_v2026.xlsx</code>) e armazenado dinamicamente
            na coleção <code>questionarios_fornecedor</code> do seu tenant.
          </p>
          <div className="pt-1">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-9 font-semibold gap-2 shadow-sm"
            >
              <FileSpreadsheet className="h-4 w-4 text-[#D9A404]" />
              Selecionar planilha POP 01-AC01 (.xlsx) para importar perguntas
            </Button>
          </div>
        </div>
      )}

      {/* Formulário Principal: 4 Seções Replicando a Planilha */}
      <form onSubmit={handleSalvar} className="space-y-6">
        {/* SEÇÃO 1: CABEÇALHO EDITÁVEL */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DCCF]/60 pb-3">
            <div>
              <span className="text-[11px] font-bold text-[#D9A404] uppercase tracking-wider block">
                Seção 1
              </span>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                Cabeçalho Documental (Editável pelo Cliente)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#1B4332] text-white text-[11px] font-mono">
                {numeroRegistro}
              </Badge>
              {modoEdicao === 'editando' && (
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-800 bg-amber-50 text-[10px]"
                >
                  Modo Edição
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Código</Label>
              <Input
                value={codigoDoc}
                onChange={(e) => setCodigoDoc(e.target.value)}
                placeholder="POP 01-AC01"
                required
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Elaboração</Label>
              <Input
                type="date"
                value={dataElaboracao}
                onChange={(e) => setDataElaboracao(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Edição</Label>
              <Input
                type="date"
                value={dataEdicao}
                onChange={(e) => setDataEdicao(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Revisão</Label>
              <Input
                value={revisaoDoc}
                onChange={(e) => setRevisaoDoc(e.target.value)}
                placeholder="Rev.01"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: DADOS CADASTRAIS (COM AUTOFILL VIA SIPEAGRO) */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DCCF]/60 pb-3">
            <div>
              <span className="text-[11px] font-bold text-[#D9A404] uppercase tracking-wider block">
                Seção 2
              </span>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                1 - Dados Cadastrais do Fornecedor
              </h3>
            </div>

            {/* Seletor rápido de fornecedor pré-cadastrado */}
            {fornecedores.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => handleSelecionarFornecedorExistente(e.target.value)}
                  className="h-8 text-xs px-2.5 rounded-lg border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Puxar de fornecedor cadastrado...
                  </option>
                  {fornecedores.map((f) => (
                    <option key={f.cnpj} value={f.cnpj}>
                      {f.razao_social} ({formatarCNPJ(f.cnpj)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Data da Avaliação</Label>
              <Input
                type="date"
                value={dataAvaliacao}
                onChange={(e) => setDataAvaliacao(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-stone-700">
                  CNPJ (com busca automática no SIPEAGRO) *
                </Label>
                {sipeagroEncontrado && (
                  <Badge className="bg-emerald-700 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    SIPEAGRO: {sipeagroEncontrado.situacao}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={cnpj}
                  onChange={(e) => {
                    const val = e.target.value
                    setCnpj(val)
                    if (normalizarCNPJ(val).length === 14) {
                      buscarEPreencherSipeagro(val)
                    }
                  }}
                  onBlur={() => {
                    if (cnpj) buscarEPreencherSipeagro(cnpj)
                  }}
                  placeholder="00.000.000/0000-00"
                  required
                  className="h-9 text-xs font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => buscarEPreencherSipeagro(cnpj)}
                  className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-9 px-3 shrink-0"
                >
                  <Search className="h-3.5 w-3.5 text-stone-500 mr-1" />
                  Buscar SIPEAGRO
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Razão Social *</Label>
              <Input
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Razão Social completa"
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Nome Fantasia</Label>
              <Input
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Nome Fantasia (se houver)"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Endereço</Label>
              <Input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, Av, Número, Bairro"
                className="h-9 text-xs"
              />
            </div>
            <div className="sm:col-span-3 space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Cidade</Label>
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Município"
                className="h-9 text-xs"
              />
            </div>
            <div className="sm:col-span-1 space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Estado</Label>
              <Input
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="UF"
                maxLength={2}
                className="h-9 text-xs uppercase"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs font-semibold text-stone-700">CEP</Label>
              <Input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Contato</Label>
              <Input
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                placeholder="Nome da pessoa de contato"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@fornecedor.com.br"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Telefone</Label>
              <Input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: TIPO DE FORNECEDOR */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
          <div className="border-b border-[#E2DCCF]/60 pb-3">
            <span className="text-[11px] font-bold text-[#D9A404] uppercase tracking-wider block">
              Seção 3
            </span>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              2 - Tipo de Fornecedor & Programas de Qualidade
            </h3>
          </div>

          {/* 1 - Tipo */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-stone-700 block">1 - TIPO</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIPOS_FORNECEDOR_OPCOES.map((t) => (
                <label
                  key={t}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    tipoFornecedor === t
                      ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] text-[#1B4332] font-semibold'
                      : 'bg-[#FAF7EF] border-[#E2DCCF] text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="tipoFornecedor"
                    checked={tipoFornecedor === t}
                    onChange={() => setTipoFornecedor(t)}
                    className="accent-[#2D6A4F]"
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
            {tipoFornecedor === 'Outra' && (
              <div className="pt-1">
                <Input
                  value={tipoOutroEspecificar}
                  onChange={(e) => setTipoOutroEspecificar(e.target.value)}
                  placeholder="Se a resposta for outra, especificar..."
                  className="h-8 text-xs bg-[#FAF7EF]"
                />
              </div>
            )}
          </div>

          {/* 2 - Área de Atuação & Número de Registro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-stone-700 block">
                2 - ÁREA DE ATUAÇÃO
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AREAS_ATUACAO_OPCOES.map((area) => (
                  <label
                    key={area}
                    className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                      areaAtuacao === area
                        ? 'bg-[#2D6A4F]/10 border-[#2D6A4F] text-[#1B4332] font-semibold'
                        : 'bg-[#FAF7EF] border-[#E2DCCF] text-stone-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="areaAtuacao"
                      checked={areaAtuacao === area}
                      onChange={() => setAreaAtuacao(area)}
                      className="accent-[#2D6A4F]"
                    />
                    <span className="text-[11px]">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-stone-700 block">
                NÚMERO DE REGISTRO (MAPA / ANVISA)
              </Label>
              <div className="space-y-1.5">
                <Input
                  value={numeroRegistroMapa}
                  onChange={(e) => setNumeroRegistroMapa(e.target.value)}
                  placeholder="Inserir número (ex: MG 001574-1)"
                  className="h-9 text-xs font-mono"
                />
                <Input
                  value={isentoRegistroEspecificar}
                  onChange={(e) => setIsentoRegistroEspecificar(e.target.value)}
                  placeholder="Se isento, especificar justificativa legal..."
                  className="h-8 text-xs text-stone-600 bg-[#FAF7EF]"
                />
              </div>
            </div>
          </div>

          {/* Confirmação de Categorias de Estabelecimento e Tipos de Produto SIPEAGRO */}
          {sipeagroEncontrado && (
            <div className="bg-[#FAF7EF] p-3.5 rounded-xl border border-[#E2DCCF] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-[#2D6A4F]" />
                  Confirmação de Categorias de Estabelecimento (Mesma linha no SIPEAGRO):
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  Valores oficiais do MAPA
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIAS_ESTABELECIMENTO_MAPA.map((catEst) => {
                  const checked = sipeagroCategoriasConfirmadas.includes(catEst)
                  return (
                    <label
                      key={catEst}
                      className="flex items-center gap-2 text-xs bg-white p-2 rounded-lg border border-[#E2DCCF] cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => {
                          setSipeagroCategoriasConfirmadas((prev) =>
                            prev.includes(catEst)
                              ? prev.filter((c) => c !== catEst)
                              : [...prev, catEst],
                          )
                        }}
                      />
                      <span className="text-[11px] font-medium text-stone-800">{catEst}</span>
                    </label>
                  )
                })}
              </div>

              {sipeagroTiposConfirmados.length > 0 && (
                <div className="pt-2 border-t border-[#E2DCCF]/60">
                  <span className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Tipos de Produto Habilitados no MAPA (células 1, 2 ou 3):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sipeagroTiposConfirmados.map((tipo) => (
                      <Badge
                        key={tipo}
                        variant="secondary"
                        className="bg-emerald-100 text-[#1B4332] border border-emerald-300 text-[10px] uppercase font-bold"
                      >
                        {tipo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3 - Categoria (Multi-seleção) */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-stone-700 block">
              3 - CATEGORIA (Multi-seleção)
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {CATEGORIAS_INSUMO_OPCOES.map((cat) => {
                const isSelected = categoriasInsumo.includes(cat)
                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] font-semibold shadow-xs'
                        : 'bg-[#FAF7EF] border-[#E2DCCF] text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleCategoriaInsumo(cat)}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#2D6A4F]"
                    />
                    <span>{cat}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* 4 - Programas de Qualidade Implementados */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold text-stone-700 block">
              4 - PROGRAMAS DE QUALIDADE IMPLEMENTADOS
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROGRAMAS_QUALIDADE_OPCOES.map((prog) => {
                const isSelected = programasQualidade.includes(prog)
                return (
                  <label
                    key={prog}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#1B4332] text-white border-[#1B4332] font-semibold'
                        : 'bg-[#FAF7EF] border-[#E2DCCF] text-stone-800 hover:bg-stone-50'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleProgramaQualidade(prog)}
                      className="border-white data-[state=checked]:bg-white data-[state=checked]:text-[#1B4332]"
                    />
                    <span>{prog}</span>
                  </label>
                )
              })}
            </div>
            <div className="pt-1">
              <Input
                value={programasOutroEspecificar}
                onChange={(e) => setProgramasOutroEspecificar(e.target.value)}
                placeholder="OUTRO: ESPECIFICAR PROGRAMAS ADICIONAIS (ex: ISO 22000, FSSC 22000)..."
                className="h-8 text-xs bg-[#FAF7EF]"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: QUESTIONÁRIO DE ITENS AVALIADOS */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DCCF]/60 pb-3">
            <div>
              <span className="text-[11px] font-bold text-[#D9A404] uppercase tracking-wider block">
                Seção 4
              </span>
              <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                Questionário de Itens Avaliados (POP 01-AC01)
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-600 block">
                Regra: <strong>C = 1</strong> | <strong>NC = 0</strong> | <strong>NA = 1</strong>{' '}
                (para manter a soma correta)
              </span>
              <span className="text-[10px] text-stone-500">
                Itens 3–9 e 20: Fabricante MP/Embalagem | Demais: Todos os fornecedores
              </span>
            </div>
          </div>

          {questionario && questionario.perguntas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2DCCF] text-stone-600 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                    <th className="py-2.5 px-3 w-12 text-center">Nº</th>
                    <th className="py-2.5 px-3">Pergunta / Critério de Avaliação</th>
                    <th className="py-2.5 px-2 text-center w-14">C (1)</th>
                    <th className="py-2.5 px-2 text-center w-14">NC (0)</th>
                    <th className="py-2.5 px-2 text-center w-14">NA (1)</th>
                    <th className="py-2.5 px-3 w-48">Nome do Arquivo (se solicitado)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {questionario.perguntas.map((p) => {
                    const respAtual = respostas[p.numero]?.resposta || ''
                    const arqAtual = respostas[p.numero]?.arquivo || ''
                    const isMateriaPrima = (p.numero >= 3 && p.numero <= 9) || p.numero === 20

                    return (
                      <tr
                        key={p.numero}
                        className={`hover:bg-stone-50/60 transition ${
                          isMateriaPrima ? 'bg-emerald-50/25' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-700">
                          {p.numero}
                        </td>
                        <td className="py-2.5 px-3 text-stone-800 leading-snug">
                          {p.texto}
                          {isMateriaPrima && (
                            <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5">
                              • Fabricante da Matéria-Prima / Embalagem
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleAlterarResposta(p.numero, 'C')}
                            className={`h-7 w-7 rounded-md font-bold text-xs transition ${
                              respAtual === 'C'
                                ? 'bg-[#2D6A4F] text-white shadow-xs'
                                : 'bg-[#FAF7EF] border border-[#E2DCCF] text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            C
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleAlterarResposta(p.numero, 'NC')}
                            className={`h-7 w-7 rounded-md font-bold text-xs transition ${
                              respAtual === 'NC'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-[#FAF7EF] border border-[#E2DCCF] text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            NC
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleAlterarResposta(p.numero, 'NA')}
                            className={`h-7 w-7 rounded-md font-bold text-xs transition ${
                              respAtual === 'NA'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-[#FAF7EF] border border-[#E2DCCF] text-stone-600 hover:bg-stone-100'
                            }`}
                          >
                            NA
                          </button>
                        </td>
                        <td className="py-2.5 px-3">
                          <Input
                            value={arqAtual}
                            onChange={(e) => handleAlterarArquivo(p.numero, e.target.value)}
                            placeholder="Anexo / Laudo / Doc..."
                            className="h-8 text-xs bg-white"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-stone-500 text-xs">
              Importe a planilha para carregar os itens do questionário.
            </div>
          )}

          {/* Painel de Totais e NOTA FINAL */}
          <div className="bg-[#FAF7EF] p-4 rounded-xl border border-[#E2DCCF] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-6 flex-wrap text-xs">
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">
                  Total C
                </span>
                <span className="text-base font-bold text-[#2D6A4F]">{totalC}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">
                  Total NC
                </span>
                <span className="text-base font-bold text-red-600">{totalNC}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px] uppercase font-bold">
                  Total NA
                </span>
                <span className="text-base font-bold text-amber-700">{totalNA}</span>
              </div>
              <div className="border-l border-[#E2DCCF] pl-4">
                <span className="text-stone-500 block text-[10px] uppercase font-bold">
                  Soma Pontuada (C + NA)
                </span>
                <span className="text-base font-bold text-stone-800">
                  {totalC + totalNA} de {totalPerguntas}
                </span>
              </div>
            </div>

            {/* NOTA FINAL e AVALIAÇÃO FINAL */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-right">
                <span className="text-[11px] font-bold text-[#1B4332] block">
                  NOTA FINAL = ({totalC} + {totalNA}) / {totalPerguntas} × 100
                </span>
                <div className="text-xl sm:text-2xl font-black font-['Sora'] text-[#1B4332]">
                  {notaFinal.toFixed(1)}%
                </div>
              </div>

              <div className="pl-4 border-l border-[#E2DCCF]">
                <span className="text-[10px] text-stone-500 block uppercase font-bold mb-1">
                  Avaliação Final (Limiar ≥ {limiarCorte}%)
                </span>
                {resultadoAvaliacao === 'APROVADO' ? (
                  <Badge className="bg-emerald-700 text-white font-bold text-xs py-1 px-3 gap-1.5 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" /> APROVADO
                  </Badge>
                ) : (
                  <Badge className="bg-red-700 text-white font-bold text-xs py-1 px-3 gap-1.5 shadow-sm animate-pulse">
                    <XCircle className="h-4 w-4" /> REPROVADO
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Configuração do Limiar pelo Admin */}
          {podeGerenciarConfig && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#2D6A4F]" />
                <span>
                  <strong>Limiar de Aprovação Configurável:</strong> Mínimo percentual para
                  aprovação do fornecedor.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={limiarCorte}
                  onChange={(e) => setLimiarCorte(Number(e.target.value) || 0)}
                  className="w-20 h-7 text-xs font-bold text-center bg-white"
                />
                <span className="font-semibold">%</span>
              </div>
            </div>
          )}

          {/* Campo OBSERVAÇÕES */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-stone-700 block">
              OBSERVAÇÕES: (Caso seja necessário algum ajuste ou algo que não esteja descrito neste
              formulário)
            </Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva detalhes técnicos, justificativas para respostas NA ou histórico da avaliação cadastral..."
              rows={3}
              className="text-xs bg-[#FAF7EF]"
            />
          </div>

          {/* BLOCO DE ASSINATURAS HIERÁRQUICAS GIAC: RT/RE (Assinatura 1) + RQ (Assinatura 2) + Setor (Execução) */}
          <div className="border-t border-[#E2DCCF] pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B4332] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                Assinaturas Hierárquicas GIAC (IN 04/2007)
              </h4>
              <span className="text-[10px] text-stone-500">
                Regra: RE substitui RT • Assinatura 1 = RT/RE • Assinatura 2 = RQ • Setor = Execução
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Responsável pelo Preenchimento / Execução */}
              <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-2.5">
                <div>
                  <span className="text-[11px] font-bold text-[#1B4332] uppercase block">
                    Execução / Preenchimento
                  </span>
                  <span className="text-[10px] text-stone-500">Usuário do setor / operador</span>
                </div>
                <div className="space-y-2">
                  <Input
                    value={respPreenchimentoNome}
                    onChange={(e) => setRespPreenchimentoNome(e.target.value)}
                    placeholder="Nome completo do responsável"
                    required
                    className="h-8 text-xs bg-white"
                  />
                  <Input
                    value={respPreenchimentoFuncao}
                    onChange={(e) => setRespPreenchimentoFuncao(e.target.value)}
                    placeholder="Função (ex: Analista de Qualidade)"
                    required
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>

              {/* 2. Assinatura 1 = RT ou RE (RE substitui o RT) */}
              <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#1B4332] uppercase block">
                      Assinatura 1: RT ou RE
                    </span>
                    <span className="text-[10px] text-stone-500">
                      Aprovação Técnica (RE substitui RT)
                    </span>
                  </div>
                  {podeAprovarRTouRE ? (
                    <Badge className="bg-emerald-700 text-white text-[9px]">Habilitado</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 text-[9px]">
                      Apenas RT/RE
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    value={respAprovacaoNome}
                    onChange={(e) => setRespAprovacaoNome(e.target.value)}
                    placeholder={
                      podeAprovarRTouRE
                        ? 'Nome do RT ou RE homologador'
                        : 'Pendente de assinatura RT/RE'
                    }
                    disabled={!podeAprovarRTouRE}
                    className="h-8 text-xs bg-white disabled:opacity-60"
                  />
                  <Input
                    value={respAprovacaoFuncao}
                    onChange={(e) => setRespAprovacaoFuncao(e.target.value)}
                    placeholder="Função: RT (CRMV) ou RE (MAPA)"
                    disabled={!podeAprovarRTouRE}
                    className="h-8 text-xs bg-white disabled:opacity-60"
                  />
                </div>
              </div>

              {/* 3. Assinatura 2 = RQ (Verificação da Qualidade) */}
              <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#1B4332] uppercase block">
                      Assinatura 2: RQ
                    </span>
                    <span className="text-[10px] text-stone-500">Verificação da Qualidade</span>
                  </div>
                  {podeVerificarRQ ? (
                    <Badge className="bg-emerald-700 text-white text-[9px]">Habilitado</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-400 text-amber-700 text-[9px]">
                      Apenas RQ
                    </Badge>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    value={respRqNome}
                    onChange={(e) => setRespRqNome(e.target.value)}
                    placeholder={
                      podeVerificarRQ
                        ? 'Nome do Responsável pela Qualidade'
                        : 'Pendente de verificação RQ'
                    }
                    disabled={!podeVerificarRQ}
                    className="h-8 text-xs bg-white disabled:opacity-60"
                  />
                  <Input
                    value={respRqFuncao}
                    onChange={(e) => setRespRqFuncao(e.target.value)}
                    placeholder="Função: Responsável pela Qualidade (RQ)"
                    disabled={!podeVerificarRQ}
                    className="h-8 text-xs bg-white disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação do Formulário */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={salvando || (!questionario && avaliacoes.length === 0)}
              className="flex-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs h-10 gap-2 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4 text-[#D9A404]" />
              {salvando
                ? 'Gravando Auto Avaliação...'
                : modoEdicao === 'editando'
                  ? `Atualizar Auto Avaliação (${numeroRegistro})`
                  : `Salvar e Registrar Auto Avaliação (${numeroRegistro})`}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleLimparFormulario}
              disabled={salvando}
              className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-10 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar / Novo
            </Button>
          </div>
        </div>
      </form>

      {/* 5. HISTÓRICO DE AUTO AVALIAÇÕES SALVAS NA ORGANIZAÇÃO */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2DCCF]/60 pb-3">
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
              Histórico de Auto Avaliações do Fornecedor ({avaliacoes.length})
            </h3>
            <p className="text-xs text-stone-500">
              Registros homologados pela organização com numeração sequencial PAC-01_R...
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Registro</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Fornecedor</th>
                <th className="py-2.5 px-3">Tipo & Área</th>
                <th className="py-2.5 px-3 text-center">Score / Nota</th>
                <th className="py-2.5 px-3 text-center">Avaliação</th>
                <th className="py-2.5 px-3">Assinaturas</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {avaliacoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500 text-xs">
                    Nenhuma auto avaliação registrada ainda. Preencha o formulário acima para
                    registrar.
                  </td>
                </tr>
              ) : (
                avaliacoes.map((av) => (
                  <tr key={av.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1B4332] whitespace-nowrap">
                      {av.numero_registro}
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                      {new Date(av.data_avaliacao).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-stone-900 block truncate max-w-[200px]">
                        {av.razao_social}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        {formatarCNPJ(av.fornecedor_cnpj)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-stone-700 text-[11px]">
                      {av.tipo_fornecedor?.tipo || '—'}
                      <span className="block text-[10px] text-stone-400">
                        {av.tipo_fornecedor?.area_atuacao || 'MAPA'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-stone-800">
                      {av.nota_final}%
                      <span className="block text-[10px] text-stone-500 font-normal">
                        C: {av.total_c} | NA: {av.total_na}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {av.avaliacao_final === 'APROVADO' ? (
                        <Badge className="bg-emerald-700 text-white text-[10px]">APROVADO</Badge>
                      ) : av.avaliacao_final === 'REPROVADO' ? (
                        <Badge className="bg-red-700 text-white text-[10px]">REPROVADO</Badge>
                      ) : (
                        <Badge className="bg-amber-600 text-white text-[10px]">PENDENTE</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 text-[10px]">
                      <span>{av.status_assinatura || 'Pendente RT/RE'}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAvaliacaoParaImprimir(av)
                          setPdfModalOpen(true)
                        }}
                        className="h-7 text-[11px] px-2.5 border-stone-300 text-stone-700 gap-1"
                        title="Imprimir / Exportar PDF oficial"
                      >
                        <Printer className="h-3 w-3" />
                        PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditarAvaliacao(av)}
                        className="h-7 text-[11px] px-2 text-[#2D6A4F] hover:bg-[#2D6A4F]/10 font-medium"
                      >
                        Revisar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de PDF / Impressão */}
      <AutoAvaliacaoPdfModal
        open={pdfModalOpen}
        onOpenChange={setPdfModalOpen}
        avaliacao={avaliacaoParaImprimir}
      />

      {/* Dialog para Gerar Convite / Link do Portal do Fornecedor */}
      <Dialog open={openModalConvite} onOpenChange={setOpenModalConvite}>
        <DialogContent className="max-w-md bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1B4332] flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[#D9A404]" />
              Gerar Link do Portal do Fornecedor
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              O fornecedor receberá este link copiável para preencher remotamente seu pré-cadastro
              (CNPJ, contatos) e as seções 2, 3 e 4 do POP 01-AC01.
            </DialogDescription>
          </DialogHeader>

          {linkGerado ? (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-2">
                <strong className="block">Link de acesso externo gerado:</strong>
                <div className="p-2 bg-white rounded border border-emerald-300 font-mono text-[11px] break-all select-all">
                  {linkGerado}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(linkGerado)
                    toast({ title: 'Link copiado com sucesso!' })
                  }}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs flex-1"
                >
                  Copiar Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenModalConvite(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setGerandoConvite(true)
                try {
                  const conv = await gerarConvitePortal({
                    fornecedor_cnpj: conviteCnpj,
                    fornecedor_nome: conviteNome,
                    fornecedor_email: conviteEmail,
                  })
                  const url = `${window.location.origin}/portal-fornecedor/${conv.token}`
                  setLinkGerado(url)
                  carregarDadosIniciais()
                  toast({ title: 'Link gerado com sucesso!' })
                } catch (err: any) {
                  toast({
                    title: 'Erro ao gerar convite',
                    description: err.message,
                    variant: 'destructive',
                  })
                } finally {
                  setGerandoConvite(false)
                }
              }}
              className="space-y-3 pt-2 text-xs"
            >
              <div className="space-y-1">
                <Label>CNPJ do Fornecedor (Opcional se ainda desconhecido)</Label>
                <Input
                  value={conviteCnpj}
                  onChange={(e) => setConviteCnpj(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label>Razão Social / Nome do Fornecedor (Opcional)</Label>
                <Input
                  value={conviteNome}
                  onChange={(e) => setConviteNome(e.target.value)}
                  placeholder="Ex: Indústria de Alimentos do Vale Ltda"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label>E-mail do Fornecedor</Label>
                <Input
                  type="email"
                  value={conviteEmail}
                  onChange={(e) => setConviteEmail(e.target.value)}
                  placeholder="qualidade@fornecedor.com.br"
                  className="h-8 text-xs"
                />
              </div>

              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-[11px] text-stone-600">
                O envio do formulário online chega automaticamente como pendente de validação
                interna nesta tela, aguardando parecer do SIPEAGRO e as assinaturas de RT/RE e RQ.
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenModalConvite(false)}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={gerandoConvite}
                  className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold"
                >
                  {gerandoConvite ? 'Gerando Link...' : 'Gerar Link do Portal'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para Ação Corretiva em caso de reprovação */}
      <Dialog open={dialogNcOpen} onOpenChange={dialogNcOpen ? setDialogNcOpen : () => {}}>
        <DialogContent className="max-w-md bg-[#FAF7EF] border-[#E2DCCF]">
          <DialogHeader>
            <div className="flex items-center gap-2 text-red-700 font-bold font-['Sora'] text-sm">
              <AlertOctagon className="h-5 w-5" />
              Fornecedor Reprovado na Auto Avaliação
            </div>
            <DialogTitle className="text-base text-stone-900 font-bold pt-1">
              Deseja abrir Ação Corretiva no fluxo do PAASO?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              O fornecedor CNPJ <strong>{formatarCNPJ(ncReprovadaCnpj)}</strong> não atingiu a
              pontuação mínima de {limiarCorte}%. Abrir uma Não Conformidade / Ação Corretiva aciona
              o plano de adequação conforme as exigências da IN 04/2007 MAPA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold text-stone-700">
              Descrição do Desvio Técnico
            </Label>
            <Textarea
              value={ncReprovadaDescricao}
              onChange={(e) => setNcReprovadaDescricao(e.target.value)}
              rows={3}
              className="text-xs bg-white"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogNcOpen(false)}
              className="text-xs border-stone-300"
            >
              Agora não
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmarAbrirNc}
              className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs gap-1.5"
            >
              <AlertOctagon className="h-3.5 w-3.5" />
              Abrir Ação Corretiva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
