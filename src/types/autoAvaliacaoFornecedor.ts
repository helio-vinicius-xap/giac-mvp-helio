// Tipos de dados para o Formulário de Auto Avaliação do Fornecedor (POP 01-AC01)
// Conforme especificação estrutural da planilha POP 01_AC_001_Avaliacao_fornecedor_v2026

export interface PerguntaQuestionarioItem {
  id?: string | number
  numero: number
  texto: string
  grupo?: 'geral' | 'fabricante_mp' | 'todos'
  obrigatorio?: boolean
  peso?: number
}

export interface QuestionarioFornecedorDef {
  id?: string
  organization?: string
  codigo: string // ex: POP 01-AC01
  titulo: string
  versao_revisao?: string
  versao?: string
  arquivo_origem?: string
  perguntas: PerguntaQuestionarioItem[]
  limiar_aprovacao?: number // padrão 70 (%)
  is_ativo?: boolean
  created?: string
  updated?: string
}

export type TipoFornecedorOpcao =
  | 'Fabricante'
  | 'Fabricante Estrangeiro'
  | 'Fabricante Anvisa'
  | 'Outro Fabricante'
  | 'Distribuidor'
  | 'Fracionador'
  | 'Produtor Rural'
  | 'Outra'

export type AreaAtuacaoOpcao = 'ANVISA' | 'MAPA' | 'MAPA+ANVISA' | 'OUTRO' | 'PRODUTOR RURAL'

export type CategoriaInsumoOpcao =
  | 'Aditivo'
  | 'Ingrediente'
  | 'Material de Embalagem'
  | 'Núcleo'
  | 'Premix'

export type ProgramaQualidadeOpcao = 'BPF/GMP' | 'APPCC' | 'GMP+' | 'FAMIQS'

export type RespostaConformidade = 'C' | 'NC' | 'NA' | ''

export interface RespostaItemQuestionario {
  numero: number
  texto?: string
  resposta: RespostaConformidade
  nome_arquivo?: string
}

export interface CabecalhoAutoAvaliacao {
  codigo: string // POP 01-AC01
  elaboracao: string // data
  edicao: string // data
  revisao: string // Rev.01
}

export interface DadosCadastraisAutoAvaliacao {
  data_avaliacao: string
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
  email?: string
  telefone?: string
}

export interface TipoFornecedorSecao {
  tipo: TipoFornecedorOpcao | string
  tipo_outro_especificar?: string
  area_atuacao: AreaAtuacaoOpcao | string
  numero_registro?: string
  isento_registro_especificar?: string
  categorias: CategoriaInsumoOpcao[]
  programas_qualidade: ProgramaQualidadeOpcao[]
  programas_outro_especificar?: string
  // Dados trazidos da linha do SIPEAGRO para confirmação
  sipeagro_situacao?: string
  sipeagro_categorias_estabelecimento?: string[] // Fabricante (1), Fracionador (2), Importador (3), Armazenador (4)
  sipeagro_tipos_produto?: string[]
}

export interface AssinaturaAutoAvaliacaoItem {
  nome: string
  funcao: string
  usuario_id?: string
  user_role?: string
  data_assinatura?: string
  assinatura_imagem?: string
  hash?: string
}

export interface AssinaturasAutoAvaliacao {
  preenchimento: AssinaturaAutoAvaliacaoItem
  aprovacao?: AssinaturaAutoAvaliacaoItem
  verificacao_rq?: AssinaturaAutoAvaliacaoItem
}

export type AutoAvaliacaoFornecedorCompleta = AutoAvaliacaoFornecedorItem

export interface AutoAvaliacaoFornecedorItem {
  id?: string
  organization?: string
  numero_registro: string // ex: PAC-01_R0001
  fornecedor_cnpj: string
  razao_social: string
  nome_fantasia?: string
  data_avaliacao: string
  // Seção 1
  codigo_doc?: string
  data_elaboracao?: string
  data_edicao?: string
  revisao_doc?: string
  // Seção 2
  dados_cadastrais: DadosCadastraisAutoAvaliacao
  // Seção 3
  tipo_fornecedor: TipoFornecedorSecao
  // Seção 4
  respostas: RespostaItemQuestionario[]
  total_c: number
  total_nc: number
  total_na: number
  nota_final: number // (%) ex 60.0
  avaliacao_final: 'APROVADO' | 'REPROVADO' | 'PENDENTE'
  observacoes?: string
  // Assinaturas
  assinaturas: AssinaturasAutoAvaliacao
  status_assinatura?: string
  acao_corretiva_vinculada?: string
  created?: string
  updated?: string
}

/**
 * Calcula a nota final da auto avaliação conforme especificação:
 * NOTA = ((Total C + Total NA) / totalPerguntas) * 100
 * onde totalPerguntas é normalmente 20 (ou a quantidade de perguntas avaliadas)
 */
export function calcularNotaFinalAutoAvaliacao(
  totalC: number,
  totalNA: number,
  totalPerguntas = 20,
): number {
  if (totalPerguntas <= 0) return 0
  const nota = ((totalC + totalNA) / totalPerguntas) * 100
  return Math.round(nota * 100) / 100
}

/**
 * Avalia se foi aprovado ou reprovado conforme o limiar configurado (sugestão padrão: >= 70%)
 */
export function avaliarAprovacaoFinal(
  notaFinal: number,
  limiarAprovacao = 70,
): 'APROVADO' | 'REPROVADO' {
  return notaFinal >= limiarAprovacao ? 'APROVADO' : 'REPROVADO'
}
