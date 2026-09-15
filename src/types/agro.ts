export type ProcedureCategory =
  | 'BPF'
  | 'Limpeza'
  | 'Qualidade'
  | 'APPCC'
  | 'Higiene'
  | 'Manutenção'
  | 'Pragas'
  | 'Água'
  | 'Rastreabilidade'

export type ProcedureFrequency = 'Contínuo' | 'Diário' | 'Semanal' | 'Mensal' | 'Por lote'

export type ProcedureStatus = 'Ativo' | 'Revisão' | 'Arquivado'

export type UserRole = 'RT' | 'RQ' | 'RE' | 'admin' | 'operador' | 'auditor'

export interface DigitalSignatureRecord {
  papel: 'RT' | 'RQ' | 'RE' | string
  metodo: 'pfx' | 'gov_br' | string
  responsavel_nome: string
  responsavel_identificacao?: string
  data_assinatura: string
  hash_documento?: string
  observacao?: string
  autenticidade_mapa?: string
}

export interface Company {
  id: string
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  numero_registro_mapa: string // SIPEAGRO / MAPA
  tipo_estabelecimento?: string
  atividades_autorizadas?: string
  produtos_fabricados?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  telefone?: string
  email?: string
  rt_nome?: string
  rt_registro_conselho?: string // CRMV / CRQ
  rt_cpf?: string
  rq_nome?: string
  rq_cpf?: string
  re_nome?: string // RE = Responsável pelo Estabelecimento no MAPA
  re_cpf?: string
  re_cargo_mapa?: string
  logo?: string
  created: string
  updated: string
}

export interface PopSaaSMetadata {
  document_code: string
  title: string
  revision: string
  effective_date: string
  creation_date: string
  company: string
  cnpj: string
  mapa_registration: string
  address: string
  responsible_technician: string
  professional_registration: string
  prepared_by: string
  approved_by_direction: string
  approved_by_qc: string
  status: string
  risk_classification: string
  legal_basis: string[]
  annexes: string[]
  fields: string[]
}

export interface Procedure {
  id: string
  codigo: string
  nome: string
  categoria: ProcedureCategory
  descricao?: string
  frequencia?: ProcedureFrequency
  responsavel?: string
  status: ProcedureStatus
  area_etapa?: string
  objetivo?: string
  perigos_relacionados?: string
  medidas_preventivas?: string
  referencia_in?: string
  data_revisao?: string
  validade?: string
  versao?: string
  campos_execucao?: Record<string, any>
  formularios_item07?: any[]
  metadados_saas?: PopSaaSMetadata | Record<string, any>
  secoes_normativas?: Record<string, any>
  assinaturas_pop?: {
    rt?: DigitalSignatureRecord & { imagem_url?: string }
    re?: DigitalSignatureRecord & { imagem_url?: string }
    direcao?: DigitalSignatureRecord & { imagem_nome?: string }
    cq?: DigitalSignatureRecord & { imagem_nome?: string }
  }
  arquivo_pdf_assinado?: string
  created: string
  updated: string
}

export type RecordShift = 'Manhã' | 'Tarde' | 'Noite'
export type RecordStatus = 'Conforme' | 'Não Conforme'
export type RecordSignatureStatus =
  | 'Pendente Assinatura'
  | 'Assinado Parcial (RQ)'
  | 'Assinado Parcial (RE)'
  | 'Comprovado (Assinado RQ/RE)'

export interface MonitoringRecord {
  id: string
  procedure: string
  expand?: {
    procedure?: Procedure
  }
  data: string
  turno?: RecordShift
  valor_medido?: string
  status: RecordStatus
  responsavel?: string
  observacoes?: string
  lote?: string
  anexos?: string[]
  formulario_codigo?: string
  dados_formulario?: Record<string, any>
  assinaturas_registro?: {
    rq?: DigitalSignatureRecord
    re?: DigitalSignatureRecord
  }
  status_assinatura?: RecordSignatureStatus
  arquivo_pdf_assinado?: string
  created: string
  updated: string
}

export type AuditType = 'Interna' | 'Externa'
export type AuditStatus = 'Programada' | 'Em Andamento' | 'Concluída'
export type AuditConclusion = 'Conforme' | 'Conforme com Ressalvas' | 'Não Conforme'

export interface Audit {
  id: string
  codigo: string
  data?: string
  tipo?: AuditType
  area_processo?: string
  auditor?: string
  status: AuditStatus
  escopo?: string
  checklist?: Record<string, any>
  conclusao?: AuditConclusion
  relatorio_achados?: string
  assinaturas?: Record<string, any>
  plano_anual?: Record<string, any>
  created: string
  updated: string
}

export interface AuditEvidence {
  id: string
  audit: string
  item_numero?: string
  descricao?: string
  arquivo?: string
  created: string
  updated: string
}

export type NCClassification = 'Crítica' | 'Maior' | 'Menor'
export type NCOrigin = 'Auditoria' | 'Registro' | 'Reclamação' | 'Recall'
export type NCStatus = 'Aberta' | 'Em Andamento' | 'Fechada'
export type NCEfficacy = 'Eficaz' | 'Não Eficaz'

export interface NonConformity {
  id: string
  codigo: string
  descricao: string
  classificacao?: NCClassification
  origem?: NCOrigin
  area?: string
  data_identificacao: string
  prazo?: string
  status: NCStatus
  responsavel?: string
  plano_acao?: string
  prazo_acao?: string
  responsavel_acao?: string
  recursos?: string
  medidas_preventivas?: string
  indicador_eficacia?: string
  causa_raiz?: {
    cinco_porques?: string[]
    ishikawa?: {
      maquina?: string
      metodo?: string
      material?: string
      mao_de_obra?: string
      meio_ambiente?: string
      medicao?: string
    }
  }
  execucao_evidencias?: string[]
  data_execucao?: string
  verificacao_responsavel?: string
  data_verificacao?: string
  eficaz?: NCEfficacy
  resultado_verificacao?: string
  lote?: string
  audit?: string
  procedure?: string
  record?: string
  expand?: {
    audit?: Audit
    procedure?: Procedure
    record?: MonitoringRecord
  }
  created: string
  updated: string
}

export interface TraceabilityTest {
  id: string
  lote: string
  data_teste?: string
  tipo?: 'Rastreabilidade' | 'Recall'
  tempo_rastreamento?: string
  comunicacao_clientes?: string
  localizacao_produtos?: string
  resultado?: 'Aprovado' | 'Falhou' | 'Em Análise'
  created: string
  updated: string
}

export interface Training {
  id: string
  codigo?: string
  tema: string
  data?: string
  instrutor?: string
  participantes?: any
  carga_horaria?: string
  status?: 'Concluído' | 'Agendado'
  eficacia_verificada?: boolean
  evidencia?: string
  created: string
  updated: string
}

export interface DocumentItem {
  id: string
  nome: string
  tipo_arquivo?: string
  categoria?: 'Plano APPCC' | 'Manual BPF' | 'POP' | 'Registro' | 'Ação Corretiva' | 'Verificação'
  referencia_pop?: string
  created: string
  updated: string
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  cargo?: string
  role?: UserRole
  conselho_classe?: string
  cpf?: string
  telefone?: string
  avatar?: string
  assinatura_imagem?: string // Arquivo de imagem da assinatura digitalizada do RT (JPG/PNG)
}
