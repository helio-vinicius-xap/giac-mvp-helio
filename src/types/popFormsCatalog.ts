export interface POPFormField {
  id: string
  label: string
  tipo: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'time' | 'textarea'
  obrigatorio?: boolean
  opcoes?: string[]
  unidade?: string
  limite_min?: number
  limite_max?: number
  ajuda?: string
}

export interface POPFormDefinition {
  codigo: string // Ex: "F-01-POP-001"
  titulo: string // Ex: "Registro de Homologação e Laudos de Fornecedores"
  frequencia: string
  item_in04: string // Ex: "IN 04/2007 Item 07 - Subitem 7.1"
  campos_fixos: POPFormField[]
}

export interface POPExecutionCustomFields {
  produtos_quimicos_utilizados?: string
  concentracoes_dosagens?: string
  tempos_temperaturas?: string
  frequencias_detalhadas?: string
  responsavel_etapa?: string
  parametros_monitoramento?: string
  limites_criticos_aceitacao?: string
  instrucoes_especificas_estabelecimento?: string
  epi_obrigatorios?: string
  acoes_corretivas_imediatas?: string
}

export const POP_ITEM07_CATALOG: Record<
  string,
  {
    codigo_pop: string
    nome_pop: string
    item_in04: string
    formularios: POPFormDefinition[]
    default_execucao: POPExecutionCustomFields
  }
> = {
  'POP-001': {
    codigo_pop: 'POP-001',
    nome_pop: 'Qualificação de Fornecedores e Controle de Matérias-Primas',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.1 (Qualificação de Fornecedores e Controle de Matérias-Primas)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Kits ELISA / Tiras de fluxo lateral para detecção de Micotoxinas (Aflatoxina B1, Zearalenona, Fumonina).',
      concentracoes_dosagens:
        'Detecção qualitativa e quantitativa: Limite de corte 20 ppb (Aflatoxinas totais), 200 ppb (Zearalenona).',
      tempos_temperaturas:
        'Tempo de incubação de teste rápido: 5 a 10 minutos a 25°C. Coleta amostral em 100% dos caminhões.',
      frequencias_detalhadas:
        'A cada carga/veículo recebido no entreposto ou silo de recepção (100% dos lotes).',
      responsavel_etapa: 'Analista de CQ no recebimento e conferência de laudos pelo RT.',
      parametros_monitoramento:
        'Umidade do grão (máx. 13,0%), impurezas (máx. 1,0%), micotoxinas, carência de agrotóxicos e ausência de insetos vivos.',
      limites_criticos_aceitacao:
        'Umidade <= 13,5%; Aflatoxina <= 20 ppb; Temperatura da massa de grãos <= 25°C.',
      instrucoes_especificas_estabelecimento:
        'O veículo é pesado, amostrado com calador pneumático em 8 pontos da caçamba e submetido ao teste de fita antes do descarregamento.',
      epi_obrigatorios:
        'Capacete, protetor auricular, máscara PFF2 contra poeira de grãos e bota de segurança.',
      acoes_corretivas_imediatas:
        'Rejeitar imediatamente o caminhão caso a micotoxina exceda 20 ppb ou umidade > 14%, lavrando termo de devolução com foto.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-001',
        titulo: 'Registro de Inspeção de Recepção de Matérias-Primas e Grãos',
        frequencia: 'Por lote recebido',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.1',
        campos_fixos: [
          {
            id: 'fornecedor',
            label: 'Nome / Razão Social do Fornecedor',
            tipo: 'text',
            obrigatorio: true,
          },
          { id: 'nota_fiscal', label: 'Número da Nota Fiscal', tipo: 'text', obrigatorio: true },
          {
            id: 'lote_fornecedor',
            label: 'Lote do Fornecedor / Fabricante',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'materia_prima',
            label: 'Matéria-Prima / Ingrediente',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'umidade_percent',
            label: 'Umidade Encontrada (%)',
            tipo: 'number',
            unidade: '%',
            limite_max: 13.5,
            obrigatorio: true,
          },
          {
            id: 'aflatoxina_ppb',
            label: 'Aflatoxina B1 (ppb)',
            tipo: 'number',
            unidade: 'ppb',
            limite_max: 20,
            obrigatorio: true,
          },
          {
            id: 'presenca_insetos',
            label: 'Presença de Insetos / Pragas',
            tipo: 'select',
            opcoes: ['Ausente', 'Presente'],
            obrigatorio: true,
          },
          {
            id: 'laudo_anexo',
            label: 'Laudo Analítico do Fabricante Anexado?',
            tipo: 'select',
            opcoes: ['Sim', 'Não', 'Dispensado por Homologação'],
            obrigatorio: true,
          },
        ],
      },
      {
        codigo: 'F-02-POP-001',
        titulo: 'Registro Anual de Qualificação e Homologação de Fornecedores',
        frequencia: 'Semestral / Anual',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.1',
        campos_fixos: [
          {
            id: 'fornecedor',
            label: 'Razão Social do Fornecedor Auditado',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'registro_mapa_fornecedor',
            label: 'Nº Registro no MAPA ou SIPEAGRO',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'status_qualificacao',
            label: 'Parecer da Qualificação',
            tipo: 'select',
            opcoes: ['Qualificado', 'Qualificado com Restrições', 'Desqualificado'],
            obrigatorio: true,
          },
          {
            id: 'pontuacao_auditoria',
            label: 'Pontuação Checklist de BPF (%)',
            tipo: 'number',
            unidade: '%',
            obrigatorio: true,
          },
        ],
      },
    ],
  },
  'POP-002': {
    codigo_pop: 'POP-002',
    nome_pop: 'Limpeza e Higienização de Instalações, Linhas e Equipamentos',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.3 (Limpeza e Higienização das Instalações e Equipamentos)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Detergente alcalino clorado biodegradável (2,0%), sanitizante à base de ácido peracético (0,2%) ou quaternário de amônio (0,5%).',
      concentracoes_dosagens:
        'Diluição: 200 mL para 10 L de água (detergente) e 20 mL para 10 L (sanitizante).',
      tempos_temperaturas:
        'Tempo de contato químico de 15 minutos em temperatura ambiente. Enxágue com água potável.',
      frequencias_detalhadas:
        'Pisos e paredes: diário no encerramento do turno. Misturador e balanças: varrição a seco a cada troca de batelada e sanitização semanal.',
      responsavel_etapa:
        'Equipe de Higienização industrial sob supervisão do encarregado de qualidade.',
      parametros_monitoramento:
        'Ausência visual de crostas ou pó acumulado, teste de ATP bioluminescência (< 30 RLU) e swab microbiológico mensal.',
      limites_criticos_aceitacao:
        'ATP < 30 RLU; Contagem bacteriana total < 10 UFC/cm²; Ausência de Salmonella em 100 cm².',
      instrucoes_especificas_estabelecimento:
        'Linhas secas de ração devem ser submetidas primariamente a raspagem mecânica e aspiração industrial antes de qualquer umedecimento.',
      epi_obrigatorios:
        'Luvas de borracha nitrílica de cano longo, óculos de ampla visão, avental impermeável e botas de PVC com solado antiderrapante.',
      acoes_corretivas_imediatas:
        'Se ATP >= 30 RLU, repetir imediatamente a etapa de limpeza e sanitização antes de liberar a linha para produção.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-002',
        titulo: 'Registro Diário de Limpeza e Sanitização Operacional',
        frequencia: 'Diário (por turno)',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.3',
        campos_fixos: [
          {
            id: 'area_equipamento',
            label: 'Área / Linha / Equipamento Higienizado',
            tipo: 'select',
            opcoes: [
              'Misturador Principal',
              'Moinho de Martelos',
              'Ensacadeira 01',
              'Ensacadeira 02',
              'Silos Pulmão',
              'Piso e Ralos da Moagem',
              'Balança de Premix',
            ],
            obrigatorio: true,
          },
          {
            id: 'metodo_limpeza',
            label: 'Método Aplicado',
            tipo: 'select',
            opcoes: [
              'Varrição a Seco / Aspiração',
              'Lavagem Úmida Completa com Sanitizante',
              'Flushing Mecânico com Milho',
            ],
            obrigatorio: true,
          },
          {
            id: 'produto_quimico_utilizado',
            label: 'Sanitizante / Detergente Aplicado',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'concentracao_medida',
            label: 'Concentração Solução Quimica (%)',
            tipo: 'number',
            unidade: '%',
            obrigatorio: true,
          },
          {
            id: 'inspecao_visual',
            label: 'Inspeção Visual Pós-Limpeza',
            tipo: 'select',
            opcoes: ['Aprovado sem resíduos', 'Reprovado com sujidade'],
            obrigatorio: true,
          },
          {
            id: 'teste_atp_rlu',
            label: 'Leitura de ATP Bioluminescência (RLU)',
            tipo: 'number',
            unidade: 'RLU',
            limite_max: 30,
            obrigatorio: false,
          },
        ],
      },
    ],
  },
  'POP-003': {
    codigo_pop: 'POP-003',
    nome_pop: 'Higiene e Saúde do Pessoal Operacional',
    item_in04: 'Item 07 da IN 04/2007 - Subitem 7.7 (Higiene, Saúde e Conduta dos Manipuladores)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Sabonete líquido bactericida à base de triclosan ou clorexidina 0,5% e álcool em gel 70° INPM com emoliente.',
      concentracoes_dosagens: 'Dispensador automático: 2 mL de sabonete e 2 mL de álcool 70%.',
      tempos_temperaturas:
        'Tempo mínimo de esfregação das mãos: 40 segundos abrangendo unhas, dedos e antebraço.',
      frequencias_detalhadas:
        'Ao entrar no setor produtivo, após usar o sanitário, após manusear sacarias avariadas ou resíduos.',
      responsavel_etapa: 'Cada manipulador com verificação diária pelo encarregado de turno e RQ.',
      parametros_monitoramento:
        'Unhas curtas e limpas, sem adornos (anéis, relógios), uniforme branco completo limpo e ASO válido.',
      limites_criticos_aceitacao:
        '100% dos manipuladores com ASO apto e livre de sintomas infecciosos/lesões cutâneas visíveis.',
      instrucoes_especificas_estabelecimento:
        'Proibido consumo de alimentos ou mascar chicletes no pavilhão fabril. Uniforme lavado em lavanderia credenciada.',
      epi_obrigatorios:
        'Touca descartável cobrindo todo o cabelo, máscara facial, protetor auricular e uniforme sem bolsos acima da cintura.',
      acoes_corretivas_imediatas:
        'Operador com ferimentos abertos ou sintomas gastrointestinais deve ser afastado da linha de manipulação direta.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-003',
        titulo: 'Registro Diário de Inspeção de Hábitos Higiênicos e Saúde',
        frequencia: 'Diário no início do turno',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.7',
        campos_fixos: [
          {
            id: 'total_operadores_turno',
            label: 'Total de Operadores no Turno',
            tipo: 'number',
            obrigatorio: true,
          },
          {
            id: 'uniformizacao_conforme',
            label: 'Uniformes Limpos e Toucas em 100%?',
            tipo: 'select',
            opcoes: ['Sim', 'Não'],
            obrigatorio: true,
          },
          {
            id: 'adornos_retirados',
            label: 'Ausência de Adornos / Celulares na Linha?',
            tipo: 'select',
            opcoes: ['Sim', 'Não'],
            obrigatorio: true,
          },
          {
            id: 'colaborador_com_sintoma',
            label: 'Houve Colaborador com Sintomas / Afastado?',
            tipo: 'select',
            opcoes: ['Não - Todos Aptos', 'Sim - Encaminhado ao SESMT'],
            obrigatorio: true,
          },
          {
            id: 'detalhe_afastamento',
            label: 'Nome e Motivo do Afastamento (se houver)',
            tipo: 'textarea',
            obrigatorio: false,
          },
        ],
      },
    ],
  },
  'POP-004': {
    codigo_pop: 'POP-004',
    nome_pop: 'Potabilidade da Água e Higienização de Reservatórios',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.8 (Controle da Potabilidade da Água e Higienização de Reservatórios)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Pastilhas de hipoclorito de sódio ou cloro gás para dosagem na entrada da caixa central.',
      concentracoes_dosagens:
        'Dosagem contínua para manutenção do teor de Cloro Residual Livre entre 0,5 e 2,0 mg/L (ppm).',
      tempos_temperaturas:
        'Tempo de contato mínimo do cloro antes do primeiro ponto de consumo: 30 minutos.',
      frequencias_detalhadas:
        'Cloro e pH: diário no início da manhã. Microbiologia: mensal por laboratório credenciado. Limpeza de caixa: semestral.',
      responsavel_etapa: 'Operador de Utilidades / Caldeira sob conferência do RT.',
      parametros_monitoramento:
        'Cloro livre (0,5 a 2,0 ppm), pH (6,0 a 9,0), turbidez (< 5,0 uT), ausência de Coliformes Totais e E. coli.',
      limites_criticos_aceitacao:
        'Cloro livre >= 0,5 ppm e <= 2,0 ppm; Ausência de E. coli em 100 mL (Portaria GM/MS 888/2021).',
      instrucoes_especificas_estabelecimento:
        'Coleta de água realizada em 4 pontos rotativos: saída do poço, reservatório central, torneira do laboratório e caldeira.',
      epi_obrigatorios: 'Luvas de nitrila e óculos de proteção para aferição do colorímetro DPD.',
      acoes_corretivas_imediatas:
        'Se cloro livre < 0,5 ppm, ajustar a bomba dosadora e suspender temporariamente a alimentação de caldeira/vapor.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-004',
        titulo: 'Registro Diário de Cloração e Potabilidade da Água',
        frequencia: 'Diário',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.8',
        campos_fixos: [
          {
            id: 'ponto_coleta',
            label: 'Ponto de Coleta Aferido',
            tipo: 'select',
            opcoes: [
              'Ponto 01 - Saída do Reservatório Superior',
              'Ponto 02 - Torneira Refeitório/Vestiário',
              'Ponto 03 - Entrada da Caldeira',
              'Ponto 04 - Torneira Laboratório CQ',
            ],
            obrigatorio: true,
          },
          {
            id: 'cloro_residual_ppm',
            label: 'Cloro Residual Livre (ppm/mg/L)',
            tipo: 'number',
            unidade: 'ppm',
            limite_min: 0.5,
            limite_max: 2.0,
            obrigatorio: true,
          },
          {
            id: 'ph_agua',
            label: 'pH da Água (6,0 a 9,0)',
            tipo: 'number',
            limite_min: 6.0,
            limite_max: 9.0,
            obrigatorio: true,
          },
          {
            id: 'aspecto_odor',
            label: 'Aspecto Visual e Odor',
            tipo: 'select',
            opcoes: ['Límpida e Inodora (Conforme)', 'Turva ou com Odor Anômalo'],
            obrigatorio: true,
          },
        ],
      },
      {
        codigo: 'F-02-POP-004',
        titulo: 'Registro Semestral de Higienização de Reservatórios de Água',
        frequencia: 'Semestral',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.8',
        campos_fixos: [
          {
            id: 'reservatorio_identificacao',
            label: 'Identificação da Caixa/Reservatório',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'empresa_executora',
            label: 'Empresa Executora / Equipe Interna',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'sanitizante_utilizado',
            label: 'Solução Clorada / Sanitizante Aplicado',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'proxima_higienizacao',
            label: 'Data Prevista para Próxima Limpeza',
            tipo: 'date',
            obrigatorio: true,
          },
        ],
      },
    ],
  },
  'POP-005': {
    codigo_pop: 'POP-005',
    nome_pop: 'Prevenção de Contaminação Cruzada e Sequenciamento de Produção',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.5 (Prevenção de Contaminação Cruzada e Sequenciamento)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Não se aplica produto químico. Utiliza-se carga de arraste mecânico (milho moído seco - flushing).',
      concentracoes_dosagens:
        'Volume de flushing: 10% da capacidade volumétrica do misturador (mínimo 200 kg).',
      tempos_temperaturas: 'Tempo de homogeneização do flushing: 5 minutos em rotação plena.',
      frequencias_detalhadas:
        'A cada troca de formulação contendo medicamentos ionóforos para formulação sem medicamento, e proibição rigorosa para ração equina.',
      responsavel_etapa: 'Operador da sala de comando de mistura e Supervisor de Produção.',
      parametros_monitoramento:
        'Ordem de batelada respeitando a Matriz de Sequenciamento validada e destinação do produto de arraste.',
      limites_criticos_aceitacao:
        'Carryover residual inferior a 1,0% do princípio ativo medicamentoso.',
      instrucoes_especificas_estabelecimento:
        'Após produzir ração com monensina/lasalocida, obrigatório rodar batelada de flushing e ensacar o arraste em sacos vermelhos identificados.',
      epi_obrigatorios:
        'Protetor auricular e respirador PFF2 na cabine de dosagem de microingredientes.',
      acoes_corretivas_imediatas:
        'Se houver quebra de sequência ou carryover suspeito, segregar o lote subsequente em quarentena para análise cromatográfica.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-005',
        titulo: 'Registro de Sequenciamento de Produção e Validação de Flushing',
        frequencia: 'Por batelada / Por lote',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.5',
        campos_fixos: [
          {
            id: 'ordem_producao',
            label: 'Ordem de Produção (OP)',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'produto_anterior',
            label: 'Produto / Medicamento da Batelada Anterior',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'produto_atual',
            label: 'Produto da Batelada Atual',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'exigiu_flushing',
            label: 'Necessitou de Flushing de Arraste?',
            tipo: 'select',
            opcoes: ['Sim - Realizado com Milho', 'Não - Sequência Compatível'],
            obrigatorio: true,
          },
          {
            id: 'peso_flushing_kg',
            label: 'Peso do Flushing Executado (kg)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: false,
          },
          {
            id: 'destino_arraste',
            label: 'Identificação e Destino do Arraste',
            tipo: 'text',
            obrigatorio: false,
          },
        ],
      },
    ],
  },
  'POP-006': {
    codigo_pop: 'POP-006',
    nome_pop: 'Manutenção Preventiva e Calibração de Equipamentos',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.9 (Manutenção Preventiva e Calibração de Equipamentos)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Graxas atóxicas grau alimentício (Food Grade NSF H1) para mancais e rolamentos.',
      concentracoes_dosagens: 'Lubrificação pontual conforme especificação do fabricante mecânico.',
      tempos_temperaturas:
        'Checagem de temperatura de mancais por termografia infravermelha semanal (< 75°C).',
      frequencias_detalhadas:
        'Checagem diária com peso-padrão RBC de 20kg antes do turno; calibração acreditada semestral.',
      responsavel_etapa: 'Encarregado de Manutenção Mecânica / Metrologista credenciado.',
      parametros_monitoramento:
        'Erro máximo tolerado de balança (<= 0,1%), integridade das peneiras de moinho e força dos ímãs.',
      limites_criticos_aceitacao:
        'Desvio de pesagem inferior a 0,1%; Ausência de rasgos em peneiras; Força magnética >= 7.000 Gauss.',
      instrucoes_especificas_estabelecimento:
        'Ao identificar limalha no detector magnético, registrar peso retido e avaliar se há desgaste interno nas pás do misturador.',
      epi_obrigatorios: 'Luvas de vaqueta, óculos de proteção e calçado com biqueira de aço.',
      acoes_corretivas_imediatas:
        'Balança com erro acima de 0,5% deve ser imediatamente interditada com etiqueta vermelha e calibrada antes de novo uso.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-006',
        titulo: 'Registro Diário de Aferição de Balanças com Pesos-Padrão RBC',
        frequencia: 'Diário no início de cada turno',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.9',
        campos_fixos: [
          {
            id: 'balanca_tag',
            label: 'Tag da Balança Aferida',
            tipo: 'select',
            opcoes: [
              'B-01 Balança Rodoviária',
              'B-02 Balança de Premix e Micro',
              'B-03 Balança de Macroingredientes',
              'B-04 Ensacadeira Automática',
            ],
            obrigatorio: true,
          },
          {
            id: 'peso_padrao_nominal_kg',
            label: 'Peso-Padrão Utilizado (kg)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: true,
          },
          {
            id: 'peso_indicado_balanca_kg',
            label: 'Peso Indicado no Display (kg)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: true,
          },
          {
            id: 'desvio_encontrado_kg',
            label: 'Desvio Calculado (kg)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: true,
          },
          {
            id: 'dentro_tolerancia',
            label: 'Conforme Tolerância Admissível?',
            tipo: 'select',
            opcoes: ['Conforme (<= 0,1%)', 'Não Conforme (Interditar)'],
            obrigatorio: true,
          },
        ],
      },
      {
        codigo: 'F-02-POP-006',
        titulo: 'Registro de Inspeção de Ímãs, Peneiras e Detectores de Metais',
        frequencia: 'Semanal',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.9',
        campos_fixos: [
          {
            id: 'equipamento_inspecionado',
            label: 'Equipamento Inspecionado',
            tipo: 'select',
            opcoes: [
              'Ímã de Recepção de Grãos',
              'Peneira Vibratória Moinho',
              'Ímã de Saída do Misturador',
              'Detector de Metais do Ensaque',
            ],
            obrigatorio: true,
          },
          {
            id: 'presenca_fragmentos_ferrosos',
            label: 'Presença de Partículas / Metais Retidos',
            tipo: 'select',
            opcoes: ['Ausente', 'Pouca Limalha Fina', 'Fragmento Metálico Crítico'],
            obrigatorio: true,
          },
          {
            id: 'estado_mecanico_peneira',
            label: 'Integridade da Malha / Peneira',
            tipo: 'select',
            opcoes: ['Íntegra sem furos', 'Desgastada / Avariada'],
            obrigatorio: true,
          },
        ],
      },
    ],
  },
  'POP-007': {
    codigo_pop: 'POP-007',
    nome_pop: 'Controle Integrado de Pragas e Vetores',
    item_in04: 'Item 07 da IN 04/2007 - Subitem 7.10 (Controle Integrado de Pragas e Vetores)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Iscas raticidas rodenticidas anticoagulantes (Brodifacoum 0,005%) em blocos parafinados restritos a porta-iscas externos.',
      concentracoes_dosagens:
        'Armadilhas luminosas com placa adesiva nas áreas internas (sem veneno ou atrativo químico volátil).',
      tempos_temperaturas:
        'Substituição das placas adesivas a cada 15 dias ou quando atingir 50% de ocupação.',
      frequencias_detalhadas:
        'Inspeção e mapeamento semanal de 100% dos porta-iscas do perímetro fabril.',
      responsavel_etapa:
        'Empresa controladora de pragas especializada homologada e contraprova pela Qualidade.',
      parametros_monitoramento:
        'Consumo de isca, presença de fezes, trilhas, insetos alados nas armadilhas luminosas.',
      limites_criticos_aceitacao:
        'Zero presença de roedores e aves no interior dos galpões de produção e ensaque.',
      instrucoes_especificas_estabelecimento:
        'Porta-iscas devem ser fixados no chão, numerados, trancados com chave e mapeados na planta de layout de controle.',
      epi_obrigatorios:
        'Luvas de borracha nitrílica e máscara facial durante a reposição de blocos raticidas.',
      acoes_corretivas_imediatas:
        'Se houver consumo de isca superior a 30% em ponto crítico, reforçar bloqueio químico e vedação de ralos vizinhos.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-007',
        titulo: 'Registro Semanal de Monitoramento de Porta-Iscas e Roedores',
        frequencia: 'Semanal',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.10',
        campos_fixos: [
          {
            id: 'setor_perimetro',
            label: 'Setor / Perímetro Avaliado',
            tipo: 'select',
            opcoes: [
              'Perímetro Externo Silos',
              'Docas de Recepção',
              'Depósito de Embalagens',
              'Armazém de Produto Acabado',
            ],
            obrigatorio: true,
          },
          {
            id: 'iscas_ativas_total',
            label: 'Total de Pontos / Porta-Iscas Checados',
            tipo: 'number',
            obrigatorio: true,
          },
          {
            id: 'pontos_com_consumo',
            label: 'Quantidade de Pontos com Consumo/Avaria',
            tipo: 'number',
            obrigatorio: true,
          },
          {
            id: 'vestigios_fezes_roedor',
            label: 'Presença de Fezes / Vestígios de Roedor',
            tipo: 'select',
            opcoes: [
              'Ausente',
              'Presente no Perímetro Externo',
              'Presente em Área Interna (Crítico)',
            ],
            obrigatorio: true,
          },
          {
            id: 'necessidade_reposicao',
            label: 'Iscas Repostas / Placas Substituídas',
            tipo: 'select',
            opcoes: ['Sim', 'Não'],
            obrigatorio: true,
          },
        ],
      },
    ],
  },
  'POP-008': {
    codigo_pop: 'POP-008',
    nome_pop: 'Controle de Resíduos Sólidos e Gestão de Efluentes',
    item_in04:
      'Item 07 da IN 04/2007 - Subitem 7.11 (Controle e Destinação de Resíduos e Efluentes)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Cal virgem ou desinfetante para pátio de caçambas de descarte externo.',
      concentracoes_dosagens: 'Aplicação quinzenal no solo do abrigo de resíduos.',
      tempos_temperaturas:
        'Esvaziamento de lixeiras ao final de cada turno (máximo 8 horas de acúmulo).',
      frequencias_detalhadas:
        'Varrição e recolhimento diário de sacarias rasgadas e poeira de filtros de manga.',
      responsavel_etapa: 'Encarregado de Serviços Gerais sob auditoria da Qualidade.',
      parametros_monitoramento:
        'Separação cromática correta (reciclável, varredura de ração, lixo contaminado) e MTR emitido.',
      limites_criticos_aceitacao:
        'Nenhum resíduo de varredura pode retornar à linha de produção sem desnaturação química.',
      instrucoes_especificas_estabelecimento:
        'A varredura industrial imprópria deve ser imediatamente descaracterizada com corante vegetal alimentício azul.',
      epi_obrigatorios: 'Luvas de raspa de couro, máscara contra poeiras e botas de segurança.',
      acoes_corretivas_imediatas:
        'Caçamba cheia deve ser fechada imediatamente para evitar atração de pássaros e roedores.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-008',
        titulo: 'Registro de Destinação de Varredura Fabril e Resíduos Sólidos',
        frequencia: 'Semanal',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.11',
        campos_fixos: [
          {
            id: 'tipo_residuo',
            label: 'Classificação do Resíduo',
            tipo: 'select',
            opcoes: [
              'Varredura de Ração Descartada',
              'Poeira de Filtros de Manga',
              'Sacarias Avariadas / Paletes',
              'Efluente Sanitário / ETE',
            ],
            obrigatorio: true,
          },
          {
            id: 'quantidade_estimada_kg',
            label: 'Quantidade Descartada (kg ou Litros)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: true,
          },
          {
            id: 'descaracterizacao_executada',
            label: 'Resíduo Foi Devidamente Descaracterizado?',
            tipo: 'select',
            opcoes: ['Sim - Corante Azul / Inutilizado', 'Não se Aplica (Reciclável Limpo)'],
            obrigatorio: true,
          },
          {
            id: 'empresa_recolhimento',
            label: 'Empresa Coletora / Destino Final Homologado',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'numero_mtr',
            label: 'Nº do Manifesto de Transporte de Resíduos (MTR)',
            tipo: 'text',
            obrigatorio: false,
          },
        ],
      },
    ],
  },
  'POP-009': {
    codigo_pop: 'POP-009',
    nome_pop: 'Rastreabilidade de Lotes e Procedimento de Recolhimento (Recall)',
    item_in04: 'Item 07 da IN 04/2007 - Subitem 7.12 (Rastreabilidade e Procedimento de Recall)',
    default_execucao: {
      produtos_quimicos_utilizados:
        'Não se aplica produto químico. Procedimento lógico e documental.',
      concentracoes_dosagens:
        'Tempo máximo regulamentar de reconstituição: 4 horas para 100% dos volumes expedidos.',
      tempos_temperaturas: 'Simulado de recall semestral com balanço de massa completo (+/- 2%).',
      frequencias_detalhadas:
        'A cada lote produzido (rastreabilidade contínua) e simulado formal a cada 6 meses.',
      responsavel_etapa:
        'Comitê de Crise e Recall liderado pelo RT e RE (Responsável pelo Estabelecimento no MAPA).',
      parametros_monitoramento:
        'Balanço de massa entre matérias-primas pesadas, volume ensacado e notas fiscais de venda aos clientes.',
      limites_criticos_aceitacao:
        'Reconciliação superior a 98% dos produtos distribuídos localizada em até 4 horas.',
      instrucoes_especificas_estabelecimento:
        'Todo lote possui codificação alfanumérica contendo ano, dia juliano e código da linha impressa no carimbo de ensaque.',
      epi_obrigatorios: 'Não aplicável para rotina documental.',
      acoes_corretivas_imediatas:
        'Em caso de recall real classe 1, notificar a Superintendência Federal de Agricultura (SFA/MAPA) em até 24 horas.',
    },
    formularios: [
      {
        codigo: 'F-01-POP-009',
        titulo: 'Registro de Teste de Rastreabilidade Bidirecional de Lote',
        frequencia: 'Por lote / Simulado semestral',
        item_in04: 'IN 04/2007 Item 07 - Subitem 7.12',
        campos_fixos: [
          {
            id: 'lote_investigado',
            label: 'Lote Investigado de Produto Acabado',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'produto_nome',
            label: 'Descrição Comercial do Produto',
            tipo: 'text',
            obrigatorio: true,
          },
          {
            id: 'volume_total_produzido_kg',
            label: 'Volume Total Fabricado (kg)',
            tipo: 'number',
            unidade: 'kg',
            obrigatorio: true,
          },
          {
            id: 'tempo_decorrido_minutos',
            label: 'Tempo Decorrido para Rastrear (minutos)',
            tipo: 'number',
            unidade: 'min',
            limite_max: 240,
            obrigatorio: true,
          },
          {
            id: 'percentual_localizado',
            label: 'Percentual do Volume Localizado (%)',
            tipo: 'number',
            unidade: '%',
            limite_min: 98,
            obrigatorio: true,
          },
          {
            id: 'conclusao_teste',
            label: 'Parecer da Rastreabilidade',
            tipo: 'select',
            opcoes: ['Aprovado (<= 4h e >= 98%)', 'Reprovado'],
            obrigatorio: true,
          },
        ],
      },
    ],
  },
}
