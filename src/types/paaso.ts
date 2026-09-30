// Tipos de dados específicos do PAASO — Núcleo de Qualificação de Fornecedores + Painel (Iteração 1)

export const TIPOS_PRODUTO_MAPA = [
  'aditivo',
  'alimento',
  'concentrado',
  'coproduto',
  'ingrediente',
  'núcleo',
  'premix',
  'produto mastigável',
  'ração',
  'suplemento',
] as const

export type TipoProdutoMapa = (typeof TIPOS_PRODUTO_MAPA)[number]

export type CategoriaSipeagro = 'fabricante' | 'fracionador' | 'importador' | 'armazenador'

export interface SipeagroItem {
  id?: string
  organization?: string
  cnpj: string // 14 dígitos sem máscara
  razao_social: string
  registro_sipeagro?: string
  situacao: string // 'ATIVO'
  uf?: string
  municipio?: string
  categoria?: CategoriaSipeagro
  tipos_produto: string[] // tipos com 1, 2 ou 3 na linha
  arquivo_origem?: string
  importado_em?: string
  is_exemplo?: boolean
  created?: string
  updated?: string
}

export interface FornecedorItem {
  id?: string
  organization?: string
  cnpj: string
  razao_social: string
  contato_nome?: string
  email?: string
  telefone?: string
  uf?: string
  municipio?: string
  criado_em?: string
  observacoes?: string
  is_exemplo?: boolean
  created?: string
  updated?: string
  // Dados agregados dinâmicos
  qualificacao_vigente?: QualificacaoItem
  total_devolucoes?: number
  total_ncs_abertas?: number
}

export type ResultadoQualificacao =
  | 'APROVADO'
  | 'APROVADO_COM_RESSALVA'
  | 'REPROVADO'
  | 'PENDENTE_REVISAO'

export type StatusVigencia = 'VIGENTE' | 'VENCIDA'

export interface DadosDeclaradosQualificacao {
  razao_social: string
  registro_sipeagro?: string
  categoria?: CategoriaSipeagro | string
  tipos_produto: string[]
  uf?: string
  municipio?: string
  contato_nome?: string
  email?: string
  telefone?: string
}

export interface QualificacaoItem {
  id?: string
  organization?: string
  fornecedor_cnpj: string
  data_formulario: string
  dados_declarados: DadosDeclaradosQualificacao
  resultado: ResultadoQualificacao
  score: number // 0-100
  divergencias: string[]
  validade: string // data_formulario + 12 meses
  status_vigencia: StatusVigencia
  is_exemplo?: boolean
  created?: string
  updated?: string
}

export interface DevolucaoItem {
  id?: string
  organization?: string
  data: string
  fornecedor_cnpj: string
  produto: string
  lote?: string
  motivo: string
  quantidade?: number
  valor?: number
  status?: string
  is_exemplo?: boolean
  created?: string
  updated?: string
  // Relacionado
  fornecedor_nome?: string
}

export type SeveridadeNC = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
export type StatusNCFornecedor = 'ABERTA' | 'EM_TRATAMENTO' | 'ENCERRADA'

export interface NaoConformidadeFornecedorItem {
  id?: string
  organization?: string
  data: string
  fornecedor_cnpj: string
  descricao: string
  severidade: SeveridadeNC
  acao_corretiva?: string
  prazo?: string
  status: StatusNCFornecedor
  is_exemplo?: boolean
  created?: string
  updated?: string
  // Relacionado
  fornecedor_nome?: string
  dias_restantes?: number
  estourado?: boolean
}

export interface AuditoriaImportacaoItem {
  id?: string
  organization?: string
  data_hora: string
  arquivo_origem?: string
  total_linhas: number
  total_ativos: number
  novos_cnpj: number
  inativados_cnpj: string[]
  status: 'SUCESSO' | 'ERRO'
  mensagem?: string
  created?: string
}

export type StatusFornecedorValidado = 'VALIDADO' | 'EXPIRADO'

export interface FornecedorValidadoItem {
  id?: string
  cnpj: string
  razao_social: string
  registro_sipeagro?: string
  situacao?: string
  uf?: string
  municipio?: string
  categoria?: CategoriaSipeagro
  tipos_produto: string[]
  categoria_de_risco?: string
  status: StatusFornecedorValidado
  data_aprovacao?: string
  validade_aprovacao?: string
  score_aprovacao?: number
  origem_organizacao?: string
  origem_organizacao_nome?: string
  origem_qualificacao?: string
  total_utilizacoes?: number
  created?: string
  updated?: string
  // Calculados em runtime
  dias_restantes?: number
  ja_adicionado_local?: boolean
}

export interface ResultadoCruzamento {
  resultado: ResultadoQualificacao
  score: number
  divergencias: string[]
  validade: string
  status_vigencia: StatusVigencia
  detalhes: {
    cnpj_encontrado: boolean
    situacao_ativo: boolean
    razao_social_confere: boolean
    similaridade_razao: number
    categoria_confere: boolean
    tipos_produto_conferem: boolean
    tipos_faltantes: string[]
    registro_confere: boolean
    localizacao_confere: boolean
  }
}
