// Modelos Tipados para os 11 Formulários/Anexos Digitais do POP 01 (conforme docx e planilha XLSX)
// ESTRUTURAS NORMATIVAS APENAS — SEM DADOS DE EXEMPLO EMBUTIDOS

export interface CheckItemState {
  item: number | string
  descricao: string
  avaliacao?: 'C' | 'NC' | 'NA' | 'SIM' | 'NÃO' | ''
  observacoes?: string
}

// 1. FR 08 - Registro de Recebimento de Mercadorias
export interface FR08RecebimentoData {
  data_recebimento: string
  horario: string
  fornecedor_razao_social: string
  fabricante_razao_social: string
  nota_fiscal: string
  transportadora: string
  placa_veiculo: string
  tipo_veiculo: 'Baú' | 'Sider' | 'Graneleiro' | string
  produto_insumo: string
  lote_fornecedor: string
  lote_interno: string
  data_fabricacao: string
  data_validade: string
  peso_nf_kg: number | string
  peso_aferido_kg: number | string
  variacao_peso_percent: number | string
  numero_volumes: number | string

  // Checklist de Inspeção do Veículo e da Carga (8 itens)
  checklist_veiculo: {
    item_1_higiene: 'C' | 'NC' | 'NA'
    item_1_obs?: string
    item_2_integridade: 'C' | 'NC' | 'NA'
    item_2_obs?: string
    item_3_lona: 'C' | 'NC' | 'NA'
    item_3_obs?: string
    item_4_incompatíveis: 'C' | 'NC' | 'NA'
    item_4_obs?: string
    item_5_embalagens: 'C' | 'NC' | 'NA'
    item_5_obs?: string
    item_6_rotulagem_decreto: 'C' | 'NC' | 'NA'
    item_6_obs?: string
    item_7_fornecedor_qualificado_fr14: 'C' | 'NC' | 'NA'
    item_7_obs?: string
    item_8_laudo_conforme: 'C' | 'NC' | 'NA'
    item_8_obs?: string
  }

  // Avaliação Sensorial
  sensorial: {
    cor: 'Característica (Típica)' | 'Alterada' | string
    odor: 'Característico' | 'Estranho / Rancoso / Mofo' | string
    aspecto_textura: 'Uniforme (Normal)' | 'Empedrado / Desuniforme' | string
    umidade_visivel: 'Ausente' | 'Presente' | string
    pragas_sujidades: 'Ausente' | 'Presente' | string
  }

  // Parecer Final
  parecer_final: 'Liberado para Descarga' | 'Retido em Quarentena' | 'Rejeitado Totalmente' | string
  observacoes_desvios?: string
  responsavel_recebimento_nome: string
  visto_cq_nome: string
  rt_assinatura_imagem?: string
}

// 2. FR 14 - Lista de Fornecedores e Fabricantes Qualificados
export interface FR14FornecedorItem {
  id?: string
  codigo: string
  materia_prima_insumo: string
  razao_social: string
  registro_mapa: string
  registro_cadastro_produto: string
  risco_insumo: 'Alto' | 'Médio' | 'Baixo' | string
  validade_qualificacao: string
  status_cadastral: 'Ativo' | 'Suspenso'
  observacoes?: string
}

export interface FR14Data {
  titulo: string
  data_atualizacao: string
  fornecedores: FR14FornecedorItem[]
  notas_normativas: {
    nota_1: string
    nota_2: string
  }
}

// 3. FR 15 - Monitoramento Diário de Temperatura e Umidade
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

// 4. FR 16 - Formulário de Qualificação de Fornecedores
export interface FR16QualificacaoData {
  // Proponente
  razao_social: string
  nome_fantasia?: string
  cnpj: string
  inscricao_estadual?: string
  registro_mapa: string
  endereco_completo: string
  uf: string
  responsavel_tecnico: string
  registro_classe_rt: string

  // Produto
  produto_denominacao: string
  produto_registro_mapa: string
  categoria: 'MP Vegetal' | 'MP Animal' | 'Aditivo' | 'Mineral' | 'Embalagem' | string
  risco_appcc: 'Alto' | 'Médio' | 'Baixo' | string

  // Checklist Documental Mandatório (Critérios Limitantes) - 6 itens
  checklist_documental: {
    item_1_registro_estabelecimento_mapa: boolean
    item_2_registro_produto_isencao: boolean
    item_3_ficha_tecnica: boolean
    item_4_declaracao_conformidade_a10: boolean
    item_5_controle_ractopamina: boolean
    item_6_certificados_3_ultimos_lotes: boolean
  }

  // Avaliação Analítica da Amostra Piloto
  amostra_piloto: {
    laudo_numero: string
    data_laudo: string
    resultado: 'Aprovado' | 'Reprovado' | string
    umidade_percent?: number | string
    proteina_bruta_percent?: number | string
    cinzas_percent?: number | string
    microscopia?: string
  }

  // Parecer Conclusivo
  parecer_conclusivo:
    | 'Qualificado sem Restrições'
    | 'Qualificado com Restrições'
    | 'Reprovado / Não Qualificado'
    | string
  restricoes_observacoes?: string
  coordenador_cq_nome: string
  coordenador_cq_data?: string
  rt_nome: string
  rt_data?: string
  rt_assinatura_imagem?: string
}

// 5. FR 18 - Solicitação de Descarte de Insumos e Produtos
export interface FR18ItemDescarte {
  id?: string
  item_num: number
  descricao: string
  lote_interno: string
  lote_fornecedor: string
  quantidade_kg: number | string
  local_destinacao: string
  data_execucao: string
}

export interface FR18DescarteData {
  motivo_descarte:
    | 'Validade Vencida'
    | 'Produto Impróprio (Arts. 95-99)'
    | 'Contaminação Física/Química'
    | 'Avaria Crítica'
    | string
  itens: FR18ItemDescarte[]
  parecer_tecnico_ambiental: string
  encarregado_almoxarifado_nome: string
  rt_nome: string
  rt_assinatura_imagem?: string
}

// 6. FR 19 - Verificação Anual dos Critérios de Qualificação
export interface FR19VerificacaoData {
  fornecedor_razao_social: string
  codigo_fr14: string
  insumos_fornecidos: string
  data_avaliacao: string

  // 5 Itens de Avaliação
  verificacao_itens: {
    item_1_registro_mapa_vigente: boolean
    item_1_obs?: string
    item_2_produtos_regulares: boolean
    item_2_obs?: string
    item_3_indice_nc_menor_meta: boolean
    item_3_obs?: string
    item_4_rotulagem_decreto: boolean
    item_4_obs?: string
    item_5_prazos_validade_especificacoes: boolean
    item_5_obs?: string
  }

  decisao_comissao:
    | 'Manter Qualificação Ativa (12 meses)'
    | 'Requalificar sob Condicionantes (Auditoria em 60 dias)'
    | 'Desqualificar e Bloquear Imediatamente'
    | string
  avaliador_cq_nome: string
  homologacao_rt_nome: string
  rt_assinatura_imagem?: string
}

// 7. IT 14 - Instrução de Trabalho: Análise de Matérias-Primas
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

// 8. A8 - Checklist de Auditoria / Visita Técnica a Fornecedores
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

// 9. A9 - Matriz de Risco de Matérias-Primas (APPCC)
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

// 10. A10 - Declaração de Conformidade do Fornecedor
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

// 11. FR 01 - Registro de Não Conformidade (RNC)
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

// 12. PAINEL DE INDICADORES (Seção 14 do POP 01 e aba PAINEL_Indicadores)
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
