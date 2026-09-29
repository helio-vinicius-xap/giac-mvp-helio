// Types para os 7 Anexos Aprimorados do POP 01 (Qualificação e Controle de Matérias-Primas - IN 04/2007)
// Mantém total compatibilidade com modelos existentes (FR 15, IT 14, A8, A9, A10, FR 01/RNC, Indicadores)

export interface ChangeHistoryItem {
  usuario: string
  data_hora: string
  acao: string
  detalhes?: string
}

// -------------------------------------------------------------
// ANEXO I – Formulário de Qualificação de Fornecedor
// -------------------------------------------------------------
export interface AnexoIQualificacaoData {
  // Cabeçalho
  versao: string
  data_qualificacao: string
  responsavel_qualificacao: string
  status_fluxo:
    | 'Rascunho'
    | 'Enviado para Aprovação'
    | 'Aprovado'
    | 'Reprovado'
    | 'Aprovado Condicionalmente'

  // Seção 1 Dados do Fornecedor
  razao_social: string
  cnpj: string
  cpf?: string
  endereco_completo: string
  telefone: string
  email: string
  responsavel_tecnico: string
  inscricao_profissional?: string

  // Seção 2 Documentação Apresentada (checkboxes)
  doc_cnpj_cpf: boolean
  doc_registro_mapa: boolean
  doc_regularidade_fiscal: boolean
  doc_manual_bpf: boolean
  doc_autocontrole: boolean
  doc_especificacao_tecnica: boolean
  doc_certificado_analise_recente: boolean
  doc_certificado_origem_animal: boolean
  doc_licenca_mapa_medicamentos: boolean
  doc_certificado_conformidade_embalagens: boolean
  documentacao_complementar?: string

  // Seção 3 Critérios de Qualificação
  criterio_registro_mapa: 'Sim' | 'Não' | 'Não Aplicável'
  criterio_bpf: 'Conforme' | 'Não Conforme' | 'Pendente'
  criterio_autocontrole: 'Implementado' | 'Em Implementação' | 'Não Implementado'
  criterio_historico: 'Satisfatório' | 'Insatisfatório' | 'Sem Histórico'
  criterio_capacidade_tecnica: 'Adequada' | 'Inadequada' | 'Pendente Avaliação'
  criterio_origem_animal: 'N/A' | 'Registrado' | 'Não Registrado'
  criterio_medicamentos: 'N/A' | 'Licenciado' | 'Não Licenciado'
  criterio_produtos_importados: 'N/A' | 'Documentação Completa' | 'Documentação Incompleta'

  // Seção 4 Parecer Final
  parecer_final: 'Aprovado' | 'Reprovado' | 'Aprovado Condicionalmente'
  motivo_rejeicao?: string // obrigatório se reprovado
  condicoes_aprovacao_condicional?: string
  observacoes_gerais?: string
  data_validade_qualificacao: string // data + 2 anos

  // Seção 5 Assinaturas
  assinado_rq_nome: string
  assinado_rq_data: string
  assinado_rt_nome: string
  assinado_rt_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO II – Lista de Fornecedores Qualificados
// -------------------------------------------------------------
export type FornecedorStatus = 'Ativo' | 'Inativo' | 'Suspenso' | 'Desqualificado'

export interface AnexoIIFornecedorItem {
  id: string
  id_fornecedor: string // REC-FOR-XXXXX ou similar
  razao_social: string
  cnpj: string
  produtos_fornecidos: string
  data_qualificacao: string
  data_validade: string
  status: FornecedorStatus
  responsavel_tecnico: string
  telefone: string
  email: string
  ultima_revisao: string
  motivo_desqualificacao?: string
  historico_alteracoes?: ChangeHistoryItem[]
}

export interface AnexoIIListaData {
  versao: string
  data_atualizacao: string
  responsavel: string
  fornecedores: AnexoIIFornecedorItem[]
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO III – Formulário de Recebimento de Matérias-Primas e Ingredientes
// -------------------------------------------------------------
export interface AnexoIIIRecebimentoData {
  // Cabeçalho
  numero_recebimento: string // REC-YYYYMMDD-NNNNN
  data_recebimento: string
  responsavel_recebimento: string
  versao: string
  status_fluxo:
    | 'Rascunho'
    | 'Aguardando Análise'
    | 'Aprovado'
    | 'Reprovado'
    | 'Aprovado Condicionalmente'

  // Seção 1 Fornecedor
  fornecedor_id?: string
  fornecedor_razao_social: string
  fornecedor_cnpj: string
  fornecedor_contato?: string
  fornecedor_telefone?: string

  // Seção 2 Identificação do Produto
  produto_nome: string
  especificacao_tecnica?: string
  lote_partida: string
  data_fabricacao: string
  data_validade: string
  dias_ate_vencimento?: number
  quantidade_recebida: number | string
  unidade: 'kg' | 'L' | 'unidade' | 'saco' | 'tonelada' | string
  numero_nota_fiscal: string

  // Seção 3 Inspeção Visual (Sim / Não)
  insp_embalagem_integra: boolean
  insp_rotulo_legivel: boolean
  insp_sem_contaminacao: boolean
  insp_sem_vazamento: boolean
  insp_sem_infestacao: boolean
  insp_temperatura_adequada: boolean
  observacoes_inspecao_visual?: string

  // Seção 4 Documentação
  doc_nota_fiscal: boolean
  doc_certificado_analise: boolean
  doc_certificado_origem: boolean
  doc_registro_mapa: boolean
  documentacao_complementar?: string

  // Seção 5 Coleta de Amostra
  coleta_amostra: boolean
  amostra_numero?: string // AMS-YYYYMMDD-NNNNN
  amostra_data?: string
  amostra_quantidade?: number | string
  amostra_triplicata?: boolean
  amostra_local_armazenamento?: string
  amostra_temperatura_c?: number | string
  amostra_responsavel?: string

  // Seção 6 Resultado da Inspeção
  resultado: 'Aprovado' | 'Reprovado' | 'Aprovado Condicionalmente'
  motivo_rejeicao?:
    | 'Validade Expirada'
    | 'Embalagem Danificada'
    | 'Contaminação'
    | 'Fornecedor Não Qualificado'
    | 'Outro'
    | string
  descricao_motivo_rejeicao?: string
  condicoes_aprovacao_condicional?: string

  // Seção 7 Armazenamento
  local_armazenamento: string
  posicao_armazem?: string
  data_entrada_armazem: string
  responsavel_armazenamento: string

  // Seção 8 Assinatura
  assinado_por_nome: string
  assinado_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO IV – Formulário de Coleta de Amostra
// -------------------------------------------------------------
export interface AmostraTriplicataItem {
  identificacao: string
  quantidade: number | string
  destino: 'Análise' | 'Contra-Prova' | 'Retenção'
}

export interface AnexoIVColetaAmostraData {
  // Cabeçalho
  numero_amostra: string // AMS-YYYYMMDD-NNNNN
  data_coleta: string
  hora_coleta: string
  responsavel_coleta: string
  versao: string
  status_fluxo: 'Rascunho' | 'Enviado para Análise' | 'Em Análise' | 'Concluída'

  // Seção 1 Identificação do Recebimento (Vinculado)
  recebimento_numero: string // REC-YYYYMMDD-NNNNN
  fornecedor_razao_social: string
  produto_nome: string
  lote_partida: string
  data_fabricacao: string
  data_validade: string

  // Seção 2 Coleta
  quantidade_total_recebida: number | string
  quantidade_coletada: number | string
  unidade: string
  metodo_coleta:
    | 'Amostragem Aleatória'
    | 'Amostragem Sistemática'
    | 'Amostragem Estratificada'
    | 'Amostragem Intencional'
    | string

  // Seção 3 Triplicata
  amostra_em_triplicata: boolean
  amostras: AmostraTriplicataItem[]

  // Seção 4 Acondicionamento e Armazenamento
  tipo_embalagem: 'Frasco de Vidro' | 'Saco Plástico' | 'Caixa de Papelão' | 'Outro' | string
  identificacao_embalagem?: string
  lacre_selo: boolean
  numero_lacre?: string
  temperatura_armazenamento_c: number | string
  local_armazenamento: 'Câmara Fria' | 'Temperatura Ambiente' | 'Congelador' | 'Outro' | string
  data_armazenamento: string
  responsavel_armazenamento: string

  // Seção 5 Análises Solicitadas
  analises: {
    micro_mesofilos: boolean
    micro_coliformes: boolean
    micro_salmonella: boolean
    micro_listeria: boolean
    fq_umidade: boolean
    fq_proteina: boolean
    fq_gordura: boolean
    microscopica_contaminantes: boolean
    residuos_pesticidas: boolean
    residuos_metais: boolean
    molecular_ogm: boolean
    outras_analises?: string
  }

  // Seção 6 Observações
  observacoes_gerais?: string
  condicoes_transporte?: string

  // Seção 7 Assinatura
  assinado_por_nome: string
  assinado_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO V – Relatório de Análise Laboratorial
// -------------------------------------------------------------
export interface EnsaioLaboratorialItem {
  id: string
  grupo: 'Microbiológica' | 'Físico-Química' | 'Complementar'
  analise: string
  resultado: string | number
  unidade: string
  limite_especificacao: string
  status: 'Conforme' | 'Não Conforme' | 'Não Realizado'
  observacoes?: string
}

export interface AnexoVAnaliseLaboratorialData {
  // Cabeçalho
  numero_relatorio: string // LAB-YYYYMMDD-NNNNN
  data_emissao: string
  responsavel_emissao: string
  versao: string
  status_fluxo:
    | 'Rascunho'
    | 'Pendente Aprovação'
    | 'Aprovado'
    | 'Reprovado'
    | 'Aprovado Condicionalmente'

  // Seção 1 Identificação da Amostra (Vinculada)
  numero_amostra: string // AMS-YYYYMMDD-NNNNN
  numero_recebimento: string // REC-YYYYMMDD-NNNNN
  fornecedor_razao_social: string
  produto_nome: string
  lote_partida: string
  data_coleta: string
  data_recebimento_laboratorio: string

  // Seção 2 Informações do Laboratório
  laboratorio_nome: string
  responsavel_tecnico_laboratorio: string
  acreditacao: string
  data_inicio_analise: string
  data_conclusao_analise: string

  // Seções 3-5 Resultados dos Ensaios
  ensaios: EnsaioLaboratorialItem[]

  // Seção 6 Resumo de Conformidade
  total_analises: number
  analises_conformes: number
  analises_nao_conformes: number
  percentual_conformidade: number
  resultado_geral: 'Aprovado' | 'Reprovado' | 'Aprovado Condicionalmente'
  motivo_rejeicao_relatorio?: string

  // Seção 7 Parecer Técnico
  parecer_laboratorio: string
  recomendacoes?: string
  observacoes_gerais?: string

  // Seção 8 Assinaturas
  assinado_rt_laboratorio_nome: string
  assinado_rt_laboratorio_data: string
  assinado_rq_empresa_nome: string
  assinado_rq_empresa_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO VI – Registro de Destinação de Produtos Não Aprovados
// -------------------------------------------------------------
export type TipoDestinacaoFinal =
  | 'Devolução ao Fornecedor'
  | 'Destruição/Inutilização'
  | 'Aproveitamento Condicional'
  | 'Doação'
  | 'Outro'

export interface AnexoVIDestinacaoData {
  // Cabeçalho
  numero_registro: string // DES-YYYYMMDD-NNNNN
  data_registro: string
  responsavel_registro: string
  versao: string
  status_fluxo: 'Rascunho' | 'Pendente Aprovação' | 'Concluído' | 'Cancelado'

  // Seção 1 Identificação do Produto Não Aprovado (Vinculado)
  numero_recebimento: string // REC-YYYYMMDD-NNNNN
  fornecedor_razao_social: string
  produto_nome: string
  lote_partida: string
  quantidade: number | string
  unidade: string
  data_rejeicao: string

  // Seção 2 Motivo da Rejeição
  motivo_rejeicao:
    | 'Validade Expirada'
    | 'Embalagem Danificada'
    | 'Contaminação Microbiológica'
    | 'Contaminação Química'
    | 'Contaminação Física'
    | 'Fornecedor Não Qualificado'
    | 'Análise Reprovada'
    | 'Outro'
    | string
  descricao_motivo: string
  numero_relatorio_analise?: string

  // Seção 3 Armazenamento Provisório
  local_armazenamento: string // "Área de Produtos Não Aprovados"
  data_armazenamento: string
  responsavel_armazenamento: string
  condicoes_armazenamento?: string

  // Seção 4 Destinação Final
  tipo_destinacao: TipoDestinacaoFinal

  // Campos específicos de Devolução
  devolucao_data?: string
  devolucao_transportadora?: string
  devolucao_rastreamento?: string
  devolucao_responsavel?: string

  // Campos de Destruição/Inutilização
  destruicao_data?: string
  destruicao_metodo?: 'Incineração' | 'Aterro' | 'Compostagem' | 'Outro' | string
  destruicao_local?: string
  destruicao_responsavel?: string
  destruicao_comprovante_nome?: string

  // Campos de Aproveitamento Condicional
  aproveitamento_acao_corretiva?: string
  aproveitamento_data_reprocessamento?: string
  aproveitamento_responsavel?: string
  aproveitamento_resultado?: 'Aprovado' | 'Reprovado'

  // Campos de Doação
  doacao_destinatario?: string
  doacao_data?: string
  doacao_transportadora?: string
  doacao_rastreamento?: string
  doacao_responsavel?: string
  doacao_comprovante_nome?: string

  // Campos de Outro
  outro_descricao?: string
  outro_data_conclusao?: string
  outro_responsavel?: string
  outro_comprovante_nome?: string

  // Seção 5 Conformidade Ambiental
  conformidade_ambiental: boolean
  referencia_legislacao?: string
  orgao_ambiental_notificado: 'Sim' | 'Não' | 'Não Aplicável'
  numero_protocolo_ambiental?: string

  // Seção 6 Observações
  observacoes_gerais?: string
  licoes_aprendidas?: string

  // Seção 7 Assinaturas
  assinado_rq_nome: string
  assinado_rq_data: string
  assinado_rt_nome: string
  assinado_rt_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// ANEXO VII – Formulário de Ação Corretiva
// -------------------------------------------------------------
export interface AcaoCorretivaItem {
  id: string
  descricao: string
  responsavel: string
  data_inicio: string
  data_conclusao_prevista: string
  status: 'Planejada' | 'Em Execução' | 'Concluída' | 'Atrasada'
  resultado?: string
  data_conclusao_real?: string
}

export interface AcompanhamentoHistoricoItem {
  id: string
  data: string
  responsavel: string
  status: string
  observacoes: string
}

export interface AnexoVIIAcaoCorretivaData {
  // Cabeçalho
  numero_acao_corretiva: string // AC-YYYYMMDD-NNNNN
  data_abertura: string
  responsavel_abertura: string
  versao: string
  status_geral: 'Aberta' | 'Em Andamento' | 'Concluída' | 'Fechada' | 'Reaberta'

  // Seção 1 Identificação da Não Conformidade
  tipo_nc: 'Recebimento' | 'Análise Laboratorial' | 'Armazenamento' | 'Fornecedor' | 'Outro'
  numero_recebimento?: string
  numero_relatorio_analise?: string
  fornecedor_razao_social: string
  produto_nome: string
  lote_partida: string
  data_identificacao: string

  // Seção 2 Descrição da Não Conformidade
  descricao_detalhada: string
  impacto_potencial: 'Baixo' | 'Médio' | 'Alto'
  justificativa_impacto: string
  evidencias_anexo?: string

  // Seção 3 Análise de Causa Raiz
  causa_raiz_identificada: string
  metodo_analise: '5 Porquês' | 'Diagrama de Ishikawa' | 'Análise de Falhas' | 'Outro' | string
  responsavel_analise: string
  data_analise: string

  // Seção 4 Ações Corretivas
  acoes_corretivas: AcaoCorretivaItem[]

  // Seção 5 Ações Preventivas (opcional)
  acoes_preventivas_necessarias: boolean
  acoes_preventivas?: AcaoCorretivaItem[]

  // Seção 6 Acompanhamento
  frequencia_acompanhamento: 'Diária' | 'Semanal' | 'Quinzenal' | 'Mensal'
  responsavel_acompanhamento: string
  data_proximo_acompanhamento: string
  historico_acompanhamento: AcompanhamentoHistoricoItem[]

  // Seção 7 Verificação de Efetividade
  acao_efetiva: 'Sim' | 'Não' | 'Pendente Verificação'
  motivo_inefetividade?: string
  acoes_adicionais?: string
  data_reabertura?: string
  evidencias_efetividade?: string
  data_fechamento?: string

  // Seção 8 Impacto na Qualificação de Fornecedor
  impacto_qualificacao_fornecedor: boolean
  acao_recomendada_fornecedor?: 'Manutenção' | 'Revisão Especial' | 'Desqualificação'
  justificativa_impacto_fornecedor?: string
  ncs_anteriores_contagem?: number

  // Seção 9 Observações
  observacoes_gerais?: string
  licoes_aprendidas?: string

  // Seção 10 Assinaturas
  assinado_rq_nome: string
  assinado_rq_data: string
  assinado_rt_nome: string
  assinado_rt_data: string
  rt_assinatura_imagem?: string

  // Histórico
  historico_alteracoes?: ChangeHistoryItem[]
}

// -------------------------------------------------------------
// MODELOS NORMATIVOS MANTIDOS (FR 15, IT 14, A8, A9, A10, FR 01)
// -------------------------------------------------------------
export interface CheckItemState {
  item: number | string
  descricao: string
  avaliacao?: 'C' | 'NC' | 'NA' | 'SIM' | 'NÃO' | ''
  observacoes?: string
}

export interface FR15MedicaoLinha {
  dia: number
  hora: string
  temp_atual: number | string
  temp_min: number | string
  temp_max: number | string
  ur_atual: number | string
  ur_min: number | string
  ur_max: number | string
  conforme: boolean | 'Sim' | 'Não'
  visto_responsavel: string
}

export interface FR15TempUmidadeData {
  mes_ano_referencia: string
  local_monitorado: 'Sala de Medicamentos' | 'Armazém MP' | 'Armazém PA' | string
  limites_normativos: string
  medicoes: FR15MedicaoLinha[]
  verificacao_mensal: {
    data_verificacao: string
    parecer: 'Conforme' | 'Não Conforme' | string
    coordenador_cq_nome: string
    rt_assinatura_imagem?: string
  }
}

export interface IT14ParametroCategoria {
  categoria: string
  parametros_recebimento: string
  parametros_rotina: string
  frequencia: string
}

export interface IT14AnaliseData {
  objetivo_operacional: string
  fluxo_operacional: {
    passo_1_recepcao: string
    passo_2_moagem: string
    passo_3_ensaios_imediatos: string
    passo_4_bromatologia: string
    passo_5_contraprovas: string
  }
  parametros_por_categoria: IT14ParametroCategoria[]
  responsavel_laboratorio?: string
  rt_assinatura_imagem?: string
}

export interface A8RequisitoItem {
  id: string
  item: string
  titulo: string
  descricao: string
  avaliacao: 'C' | 'NC' | 'NA'
  evidencias_observacoes?: string
}

export interface A8AuditoriaData {
  fornecedor_razao_social: string
  data_auditoria: string
  registro_mapa: string
  auditor_lider: string
  requisitos: A8RequisitoItem[]
  pontuacao_final_percent: number | string
  classificacao: 'Aprovado (>85%)' | 'Aprovado com Ressalvas (70–84%)' | 'Reprovado (<70%)' | string
  plano_acao?: string
  rt_assinatura_imagem?: string
}

export interface A9MatrizRiscoItem {
  id?: string
  categoria_insumo: string
  perigos_identificados: string
  classe_risco: 'Alto' | 'Médio' | 'Baixo' | string
  parametros_criticos: string
  frequencia_minima_analises: string
}

export interface A9MatrizRiscoData {
  titulo: string
  base_normativa: string
  categorias: A9MatrizRiscoItem[]
  rt_responsavel: string
  rt_assinatura_imagem?: string
}

export interface A10DeclaracaoData {
  compradora_empresa: string
  fornecedor_razao_social: string
  fornecedor_cnpj: string
  fornecedor_estabelecimento_endereco: string
  fornecedor_registro_mapa: string
  opcao_ractopamina:
    | 'consta_lista_mapa'
    | 'nao_manipula_nem_estoca'
    | 'linha_dedicada_isenta'
    | string
  local_data: string
  rt_fornecedor_nome: string
  rt_fornecedor_titulo: string
  rt_fornecedor_registro_classe: string
  rt_fornecedor_assinatura_url?: string
}

export interface FR01RNCData {
  numero_rnc: string
  data_ocorrencia: string
  origem: 'Recebimento' | 'Análise Laboratorial' | 'Auditoria' | 'Processo' | string
  grau: 'Crítico' | 'Maior' | 'Menor'
  fornecedor_razao_social: string
  produto_materia_prima: string
  lote_fornecedor: string
  lote_interno: string
  quantidade_afetada_kg: number | string
  nota_fiscal: string
  descricao_detalhada: string
  disposicao_imediata:
    | 'Bloqueio no Depósito de Não Aprovadas'
    | 'Devolução ao Fornecedor'
    | 'Solicitação de Descarte (FR 18)'
    | string
  analise_causa_raiz: {
    ishikawa_resumo?: string
    cinco_porques_resumo?: string
  }
  capa_acoes: Array<{
    acao: string
    responsavel: string
    prazo: string
  }>
  verificacao_eficacia: {
    data_avaliacao?: string
    parecer?: 'Eficaz — Encerrar RNC' | 'Ineficaz — Reabrir RNC' | string
    coordenador_cq_nome?: string
    rt_assinatura_imagem?: string
  }
}

// -------------------------------------------------------------
// Indicadores e Dashboard
// -------------------------------------------------------------
export interface POP01IndicadoresKPI {
  id: string
  codigo: string
  nome: string
  formula: string
  periodicidade: string
  meta: string
  valor_calculado: number
  valor_formatado: string
  status_meta: 'dentro' | 'fora' | 'alerta'
  detalhes?: string
}

export interface POP01PainelResumo {
  kpis: POP01IndicadoresKPI[]
  visao_geral: {
    total_recebimentos_fr08: number
    recebimentos_30_dias: number
    total_rncs_fr01: number
    rncs_criticas: number
    total_descartes_fr18: number
    descartes_kg: number
    fornecedores_cadastrados_fr14: number
    fornecedores_ativos: number
    fornecedores_vencidos: number
    fornecedores_suspensos: number
    monitoramentos_temp_fr15: number
    conformidade_termica_percent: number
    conformidade_recebimento_percent: number
  }
  atualizado_em: string
}
