// Conteúdo Integral das 15 Seções Normativas do POP 01
// Baseado fielmente no documento "pop 01 - saas_versao 01-cdc26.docx"
// Suporta substituição de placeholders {{EMPRESA}}, {{CNPJ}}, {{REGISTRO_MAPA}} etc.

export interface POP01RaciItem {
  atividade: string
  suprimentos: 'R' | 'A' | 'C' | 'I'
  nutricao: 'R' | 'A' | 'C' | 'I'
  rt: 'R' | 'A' | 'C' | 'I'
  coord_cq: 'R' | 'A' | 'C' | 'I'
  encarregado_cq: 'R' | 'A' | 'C' | 'I'
  almoxarife: 'R' | 'A' | 'C' | 'I'
  operadores: 'R' | 'A' | 'C' | 'I'
}

export interface POP01AcaoCorretivaItem {
  desvio: string
  acao_imediata: string
  acao_preventiva: string
}

export interface POP01GestaoRegistroItem {
  registro: string
  formato: string
  retencao: string
  custodia: string
}

export interface POP01NormativeContent {
  codigo: string
  titulo: string
  subtitulo: string
  data_vigor: string
  revisao: string
  referencias_normativas: Array<{
    item: number
    texto: string
  }>
  definicoes: Array<{
    termo: string
    conceito: string
  }>
  matriz_raci: POP01RaciItem[]
  secao_6_procedimento: {
    qualificacao_fornecedores: string[]
    criterios_limitantes: string[]
    recebimento_inspecao: string[]
    amostragem_procedimentos: {
      macro_ingredientes: string
      micro_ingredientes: string
      graneis: string
      amostra_composta: string
    }
    ensaios_laboratoriais: string[]
    segregacao_deposito: string[]
    armazenamento_temperatura: {
      sala_medicamentos: string
      armazens_gerais: string
      monitoramento_diario: string
    }
    monitoramento_continuo: string
    verificacao_anual: string[]
    desqualificacao_criterios: string[]
    rastreabilidade_montante_jusante: string
    contaminacao_cruzada_substancias_proibidas: string[]
  }
  materiais_equipamentos: string[]
  matriz_frequencia: Array<{
    atividade: string
    frequencia: string
    responsavel: string
    registro: string
  }>
  sistematica_monitoramento: string[]
  procedimentos_verificacao: string[]
  acoes_corretivas_preventivas: POP01AcaoCorretivaItem[]
  gestao_registros_retencao: POP01GestaoRegistroItem[]
  treinamento_capacitacao: string[]
  indicadores_gestao: Array<{
    nome: string
    sigla: string
    formula: string
    periodicidade: string
    meta: string
    responsavel: string
  }>
  documentacao_relacionada: string[]
}

export const POP01_NORMATIVE_DATA: POP01NormativeContent = {
  codigo: 'POP-01',
  titulo:
    'QUALIFICAÇÃO DE FORNECEDORES E CONTROLE DE MATÉRIAS-PRIMAS, INGREDIENTES E DE EMBALAGENS',
  subtitulo:
    'Procedimento Operacional Padrão fundamentado na legislação consolidada: Decreto nº 12.031/2024 e Instrução Normativa MAPA nº 04/2007',
  data_vigor: '15 de setembro de 2026',
  revisao: '01/2026',
  referencias_normativas: [
    {
      item: 1,
      texto:
        'BRASIL. Presidência da República. Decreto nº 12.031, de 28 de maio de 2024. Regulamenta a Lei nº 6.198, de 26 de dezembro de 1974, e a Lei nº 14.515, de 29 de dezembro de 2022, para dispor sobre a inspeção e a fiscalização obrigatórias dos produtos destinados à alimentação animal. Revoga expressamente o Decreto nº 80.583/1977, os arts. 1º, 2º e o Anexo do Decreto nº 6.296/2007 e o art. 153 do Decreto nº 7.045/2009, mantendo em vigor as normas complementares (art. 151) e fixando vigência a partir de 8 de julho de 2024 (art. 154).',
    },
    {
      item: 2,
      texto:
        'BRASIL. Ministério da Agricultura, Pecuária e Abastecimento (MAPA). Instrução Normativa nº 04, de 23 de fevereiro de 2007. Aprova o Regulamento Técnico sobre as Condições Higiênico-Sanitárias e de Boas Práticas de Fabricação para Estabelecimentos Fabricantes de Produtos Destinados à Alimentação Animal e o Roteiro de Inspeção (Itens 3, 6.1, 6.2, 6.6, 6.7, 6.8, 7, 8 e 9).',
    },
    {
      item: 3,
      texto:
        'BRASIL. Ministério da Agricultura e Pecuária (MAPA/SDA). Autocontroles: Manual de Fiscalização de Autocontroles – Alimentação Animal. Módulo I – Boas Práticas de Fabricação e Autocontroles: Seção F.1 (Itens 19, 20, 21 e 22), Seção F.5 (Item 29) e Seção F.9 (Item 41); Módulo VI – Controle de Resíduos e Contaminantes.',
    },
    {
      item: 4,
      texto:
        'BRASIL. Ministério da Agricultura e Pecuária (MAPA/SDA). Manual para Caracterização do Risco dos Estabelecimentos Fabricantes e Fracionadores de Produtos para Alimentação Animal. Diretrizes para avaliação de risco intrínseco (RI) e risco regulatório (RR).',
    },
  ],
  definicoes: [
    {
      termo: 'Boas Práticas de Fabricação (BPF)',
      conceito:
        'Procedimentos higiênico-sanitários e operacionais aplicados em todo o fluxo de produção, desde a obtenção dos ingredientes e matérias-primas até a distribuição do produto final, com o objetivo de garantir a qualidade, conformidade e inocuidade dos produtos destinados à alimentação animal.',
    },
    {
      termo: 'Contaminação',
      conceito:
        'Presença de substâncias ou agentes biológicos, químicos ou físicos estranhos, indesejáveis ou nocivos no produto, em níveis capazes de comprometer sua segurança sanitária.',
    },
    {
      termo: 'Contaminação Cruzada',
      conceito:
        'Contaminação de matéria-prima, ingrediente, produto intermediário ou produto acabado por outro produto, insumo ou resíduo durante o processo de transporte, recebimento, armazenamento ou fabricação, por contato direto ou indireto.',
    },
    {
      termo: 'Controle da Qualidade',
      conceito:
        'Conjunto planejado de operações e procedimentos que envolvem programação, coordenação, execução e amostragem com o objetivo de verificar, atestar e assegurar a conformidade da matéria-prima, do ingrediente, da embalagem e do produto intermediário e acabado frente aos padrões técnicos e legais vigentes.',
    },
    {
      termo: 'Lote',
      conceito:
        'Quantidade definida de matéria-prima, ingrediente, material de embalagem ou produto acabado elaborado ou processado em condições uniformes durante um ciclo de fabricação determinado e identificado por código específico.',
    },
    {
      termo: 'Matéria-Prima',
      conceito:
        'Toda substância de origem vegetal, animal, mineral ou sintética utilizada diretamente ou após processamento na elaboração de produtos destinados à alimentação animal.',
    },
    {
      termo: 'Material de Embalagem',
      conceito:
        'Qualquer recipiente, invólucro primário, secundário ou material acessório utilizado para acondicionar, proteger, vedar, conservar e identificar o produto.',
    },
    {
      termo: 'Procedimento Operacional Padrão (POP)',
      conceito:
        'Descrição pormenorizada, instrucional e sequencial de técnicas, operações rotineiras e diretrizes a serem seguidas pelo estabelecimento fabril, visando à garantia de preservação da qualidade e da inocuidade das matérias-primas, ingredientes e produtos acabados.',
    },
    {
      termo: 'Produtos com Medicamento',
      conceito:
        'Produtos destinados à alimentação animal que contenham substâncias medicamentosas ou produtos de uso veterinário incorporados em sua formulação.',
    },
    {
      termo: 'Produtos Destinados à Alimentação Animal',
      conceito:
        'Qualquer substância, ingrediente, produto simples, composto, concentrado, premix, núcleo, aditivo ou ração processado para o consumo de animais.',
    },
    {
      termo: 'Fabricante',
      conceito:
        'Estabelecimento que realiza operações industriais de síntese, beneficiamento, mistura, transformação, manipulação ou fracionamento de insumos e produtos para alimentação animal (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Armazenador',
      conceito:
        'Estabelecimento dotado de instalações e equipamentos adequados destinado especificamente à estocagem, guarda e conservação de matérias-primas e produtos de terceiros (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Fracionamento',
      conceito:
        'Operação industrial e técnica de divisão de um produto em quantidades menores, sem alteração de sua composição original, com manutenção de embalagem e rotulagem regulamentares (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Rastreabilidade',
      conceito:
        'Capacidade técnica e documental de reconstituir o histórico, a aplicação, os lotes utilizados e a localização de um produto e seus insumos por meio de registros sistematizados, à montante (fornecedores) e à jusante (clientes e distribuidores) (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Análise de Perigos e Pontos Críticos de Controle (APPCC)',
      conceito:
        'Sistema preventivo de base científica que identifica, avalia e controla perigos significativos para a inocuidade dos produtos (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Regulamento Técnico de Identidade e Qualidade (RTIQ)',
      conceito:
        'Ato normativo que estabelece a identidade, os padrões físico-químicos, os níveis de garantia mínimos e máximos e as características técnicas de qualidade de determinado produto (art. 10 do Decreto nº 12.031/2024).',
    },
    {
      termo: 'Produtos Impróprios para Uso ou Consumo',
      conceito:
        'Insumos, matérias-primas e produtos enquadrados como alterados (decaimento qualitativo físico-químico ou biológico), fraudados (adulteração intencional de fórmula, procedência ou rotulagem) ou perigosos (presença de contaminantes nocivos, substâncias proibidas ou patógenos), consoante os arts. 95 a 99 do Decreto nº 12.031/2024.',
    },
    {
      termo: 'Qualificação de Fornecedor',
      conceito:
        'Processo técnico de auditoria, análise documental, verificação analítica e aprovação formal que homologa uma pessoa jurídica a fornecer determinados insumos ao estabelecimento.',
    },
    {
      termo: 'Requalificação de Fornecedor',
      conceito:
        'Reavaliação periódica compulsória (mínimo anual) dos critérios de conformidade técnica, higiênico-sanitária, documental e analítica dos parceiros previamente homologados.',
    },
    {
      termo: 'Desqualificação',
      conceito:
        'Exclusão formal e imediato bloqueio cadastral de um fornecedor da Lista de Qualificados em decorrência do descumprimento de critérios limitantes, ocorrência de não conformidades críticas recorrentes ou constatação de produtos impróprios.',
    },
    {
      termo: 'Área de Retenção / Depósito de Não Aprovadas',
      conceito:
        'Instalação física segregada, identificada e dotada de dispositivo de fechamento e controle restrito de acesso, destinada ao isolamento de matérias-primas, ingredientes e embalagens rejeitados ou sob quarentena, em conformidade com o item 7.5 da IN MAPA nº 04/2007.',
    },
  ],
  matriz_raci: [
    {
      atividade: 'Prospecção e cotação comercial de fornecedores',
      suprimentos: 'R',
      nutricao: 'C',
      rt: 'I',
      coord_cq: 'I',
      encarregado_cq: 'I',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Coleta e avaliação documental/regulatória',
      suprimentos: 'C',
      nutricao: 'I',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'C',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Auditoria presencial / Visita técnica no fornecedor',
      suprimentos: 'I',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'R',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Análise físico-química e microbiológica de amostra padrão',
      suprimentos: 'I',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'R',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Aprovação e inclusão na Lista de Fornecedores Qualificados',
      suprimentos: 'I',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'A',
      encarregado_cq: 'I',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Inspeção do veículo, conferência fiscal e sensorial de carga',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'I',
      coord_cq: 'I',
      encarregado_cq: 'C',
      almoxarife: 'R',
      operadores: 'I',
    },
    {
      atividade: 'Coleta de amostras de recebimento e identificação de lote',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'I',
      coord_cq: 'I',
      encarregado_cq: 'C',
      almoxarife: 'R',
      operadores: 'I',
    },
    {
      atividade: 'Liberação, retenção ou rejeição formal de matérias-primas',
      suprimentos: 'I',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'R',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Segregação e guarda no Depósito de Não Aprovadas',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'I',
      coord_cq: 'C',
      encarregado_cq: 'C',
      almoxarife: 'R',
      operadores: 'I',
    },
    {
      atividade: 'Monitoramento diário de temperatura e umidade relativa',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'I',
      coord_cq: 'I',
      encarregado_cq: 'R',
      almoxarife: 'R',
      operadores: 'I',
    },
    {
      atividade: 'Revisão periódica anual e requalificação de fornecedores',
      suprimentos: 'C',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'C',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Abertura, tratamento e desqualificação de fornecedores',
      suprimentos: 'C',
      nutricao: 'C',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'C',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Treinamento de operadores em BPF e recebimento',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'A',
      coord_cq: 'R',
      encarregado_cq: 'R',
      almoxarife: 'I',
      operadores: 'I',
    },
    {
      atividade: 'Manutenção, guarda e arquivo de registros auditáveis',
      suprimentos: 'I',
      nutricao: 'I',
      rt: 'C',
      coord_cq: 'A',
      encarregado_cq: 'R',
      almoxarife: 'R',
      operadores: 'I',
    },
  ],
  secao_6_procedimento: {
    qualificacao_fornecedores: [
      'Identificação da Demanda: solicitada pela Gerência de Nutrição ou pelo RT à Gerência de Suprimentos.',
      'Fluxo Obrigatório Encadeado de Registros (Regra de Comprovação): Todo registro deve conter subcampos de encadeamento (registro anterior e próximos exigidos). A comprovação do POP só é validada quando a cadeia completa estiver resolvida sem pendências abertas.',
      'Coleta de Documentos Regulatórios: envio obrigatório do formulário FR 16 / Anexo I, comprovante de Registro de Estabelecimento MAPA atualizado (Título II Dec. 12.031/2024), Certificado de Registro/Cadastro do Produto (arts. 49-57), Ficha Técnica com níveis de garantia e carência, Declaração de Conformidade A10 e Laudos analíticos dos últimos 3 lotes.',
      'Aplicação de Critérios Limitantes: vigência incondicional do Registro de Estabelecimento MAPA, regularidade de produto no SIPEAGRO e proibição taxativa de resíduos do varejo para matérias-primas de origem animal (item 19 do Manual).',
      'Avaliação Laboratorial de Amostra Prévia: envio de amostra piloto para ensaios físico-químicos, microscópicos e microbiológicos.',
      'Auditoria Presencial / Visita Técnica: obrigatória para insumos de Categoria de Risco Alto (Anexo A9) via Checklist A8.',
      'Parecer e Homologação: avaliado pelo Coordenador do CQ e homologado pelo RT. Estando favorável, inclusão imediata e automática na Lista FR 14 / Anexo II.',
    ],
    criterios_limitantes: [
      'A existência e vigência incondicional do Registro de Estabelecimento no MAPA;',
      'A regularidade regulatória de registro ou cadastro de cada produto a ser adquirido;',
      'A comprovação de que o fornecedor de matérias-primas de origem animal não utiliza resíduos provenientes do comércio varejista (proibição taxativa do item 19 do Manual de Fiscalização de Autocontroles).',
    ],
    recebimento_inspecao: [
      'Conferência Prévia de Cadastro: consulta à Lista FR 14 / Anexo II no sistema para certificar qualificação ativa do fornecedor e do produto.',
      'Inspeção do Veículo Transportador: art. 77 do Decreto nº 12.031/2024 e itens 6.8 e 20 do Manual (higiene, assoalho sem pregos salientes, lona impermeável limpa, ausência de cargas incompatíveis e controle de temperatura).',
      'Conferência Documental e Rotulagem: Nota Fiscal confrontada com Ordem de Compra e Laudo do Lote. Rotulagem inspecionada conforme arts. 61-67.',
      'Avaliação Sensorial da Carga: cor, odor, textura, ausência de empedramento, pragas e umidade visível.',
      'Geração do Lote Interno e Registro Encadeado (FR 08 / Anexo III): Ao salvar o recebimento conforme, o sistema gera automaticamente a Coleta de Amostra (Anexo IV) como pendência obrigatória. Se reprovado na recepção, gera de imediato Destinação (FR 18) e Ação Corretiva (FR 01).',
      'Possibilidade de Registro por Demanda: Permite criação avulsa sob demanda do cliente via formulário digital interno ou planilha/documento externo anexado.',
    ],
    amostragem_procedimentos: {
      macro_ingredientes:
        'Amostrar 10% do total de volumes por lote com calador em pontos superior, mediano e inferior (mínimo 1, máximo 30 volumes).',
      micro_ingredientes:
        'Amostrar 10% dos volumes recebidos por lote (mínimo 1, máximo 10 volumes) com procedimento asséptico.',
      graneis:
        'Amostragem estratificada durante o descarregamento em intervalos regulares ou amostradores contínuos.',
      amostra_composta:
        'Homogeneização em quarteador: 1 amostra de ensaio para o laboratório e 2 contraprovas lacradas e armazenadas na sala de retenção pelo prazo de validade.',
    },
    ensaios_laboratoriais: [
      'Análises de Recebimento: parâmetros imediatos de liberação (umidade por infravermelho, densidade PH, impurezas visíveis, microscopia direta).',
      'Análises de Rotina e Complementares: ensaios físico-químicos completos (PB, EE, MM, FB, minerais, micotoxinas e microbiologia).',
      'Decisão Técnica de Liberação e Bifurcação do Fluxo (Anexo V): Ao emitir o laudo no sistema, se APROVADO, a cadeia analítica encerra-se com sucesso. Se REPROVADO, o sistema gera automaticamente os próximos registros vinculados de Destinação de Produtos Não Aprovados (FR 18 / Anexo VI) e Ação Corretiva (FR 01 / Anexo VII).',
    ],
    segregacao_deposito: [
      'Bloqueio Imediato: etiqueta vermelha "LOTE REPROVADO / EM QUARENTENA" e bloqueio digital no sistema.',
      'Transferência para Depósito de Não Aprovadas: área física segregada e trancada à chave (item 7.5 IN 04/2007) com chave sob custódia do CQ.',
      'Tratamento e Destinação: Devolução com FR 01; Descarte auditável com FR 18 (arts. 95-99); ou Uso Condicionado estritamente formalizado pelo RT.',
    ],
    armazenamento_temperatura: {
      sala_medicamentos:
        'Temperatura mantida rigorosamente entre 15 ºC e 25 ºC e Umidade Relativa (UR) inferior a 85%.',
      armazens_gerais: 'Temperatura mantida abaixo de 35 ºC e UR inferior a 85%.',
      monitoramento_diario:
        'Aferição realizada 2 vezes ao dia (início da manhã e meio da tarde) com registro na FR 15.',
    },
    monitoramento_continuo:
      'Coordenador do CQ audita continuamente os fornecedores no formulário FR 19, avaliando IQR, cumprimento de prazos e conformidade.',
    verificacao_anual: [
      'Auditoria de vigência de licenças MAPA e registros de produtos no SIPEAGRO;',
      'Levantamento estatístico de não conformidades do período de 12 meses;',
      'Emissão de parecer conclusivo no FR 19 de requalificação;',
      'Revisão formal deste POP a cada 12 meses (item 7.14 da IN MAPA nº 04/2007).',
    ],
    desqualificacao_criterios: [
      'Reincidência de 3 não conformidades analíticas graves consecutivas sem ação corretiva eficaz;',
      'Cancelamento, cassação ou suspensão do Registro de Estabelecimento ou de Produto no MAPA;',
      'Constatação de produtos impróprios para uso (arts. 95 a 99 do Decreto nº 12.031/2024);',
      'Presença comprovada de substâncias proibidas pela legislação brasileira ou fraude em laudos.',
    ],
    rastreabilidade_montante_jusante:
      'Lote Interno correlacionado a NF de entrada, lote do fabricante, laudos e destino nas bateladas de produção, com reconstituição em prazo máximo de 2 horas (art. 10 Decreto 12.031/2024).',
    contaminacao_cruzada_substancias_proibidas: [
      'Substâncias Proibidas: veto irrestrito a cloranfenicol, nitrofuranos e violeta de genciana.',
      'Proteínas Animais: aquisição exclusiva de estabelecimentos registrados e segregação para prevenção de EEB.',
      'Controle de Ractopamina: validação na lista MAPA ou comprovação formal de linha fabril dedicada e isenta (Anexo A10).',
    ],
  },
  materiais_equipamentos: [
    'Formulários e Documentos: FR 01, FR 08, FR 14, FR 15, FR 16, FR 18, FR 19 e Manual de Especificações.',
    'Instrumentos de Medição: Termo-higrômetros digitais calibrados nos armazéns e termômetro tipo espeto para cargas.',
    'Equipamentos de Amostragem: Caladores metálicos de sacaria (inox), amostradores de grãos tipo sonda, quarteadores de Jones e coletores assépticos.',
    'Materiais de Consumo: Sacos estéreis, lacres numerados de segurança e etiquetas adesivas padronizadas (verde, amarela, vermelha).',
    'EPIs Obrigatórios: Óculos de ampla visão, máscaras PFF2 contra particulados, protetores auriculares, luvas nitrílicas e botas com biqueira.',
    'Instalações Físicas: Balança rodoviária aferida, área de recepção coberta e Depósito de Não Aprovadas trancado.',
  ],
  matriz_frequencia: [
    {
      atividade: 'Inspeção de veículos e conferência de carga',
      frequencia: 'A cada recebimento de mercadoria',
      responsavel: 'Almoxarife / Recebimento',
      registro: 'FR 08 (Anexo A1)',
    },
    {
      atividade: 'Amostragem representativa de insumos',
      frequencia: 'A cada lote recebido',
      responsavel: 'Almoxarife / Encarregado CQ',
      registro: 'FR 08 / IT 14',
    },
    {
      atividade: 'Análises laboratoriais imediatas (recebimento)',
      frequencia: 'A cada lote recebido',
      responsavel: 'Analista do Laboratório CQ',
      registro: 'Boletim Analítico / IT 14',
    },
    {
      atividade: 'Análises de rotina e complementares',
      frequencia: 'Conforme matriz de risco e IT 14',
      responsavel: 'Laboratório Interno / Credenciado',
      registro: 'Laudo Analítico Externo',
    },
    {
      atividade: 'Monitoramento de temperatura e umidade',
      frequencia: 'Diário (2 vezes ao dia)',
      responsavel: 'Encarregado do CQ / Almoxarife',
      registro: 'FR 15 (Anexo A3)',
    },
    {
      atividade: 'Verificação mensal de registros ambientais',
      frequencia: 'Mensal',
      responsavel: 'Coordenador do CQ',
      registro: 'FR 15',
    },
    {
      atividade: 'Monitoramento contínuo de fornecedores',
      frequencia: 'Contínuo / Mensal',
      responsavel: 'Coordenador do CQ',
      registro: 'FR 19 (Anexo A6)',
    },
    {
      atividade: 'Verificação anual e requalificação de fornecedores',
      frequencia: 'Anual',
      responsavel: 'Coordenador do CQ / RT',
      registro: 'FR 19 e FR 14',
    },
    {
      atividade: 'Revisão integral deste POP',
      frequencia: 'Anual ou por alteração técnica/legal',
      responsavel: 'Responsável Técnico / CQ',
      registro: 'Histórico de Revisões',
    },
    {
      atividade: 'Treinamento em BPF e Recebimento',
      frequencia: 'Na admissão e reciclagem anual',
      responsavel: 'Coordenador do CQ / RT',
      registro: 'Lista de Treinamento',
    },
  ],
  sistematica_monitoramento: [
    'Monitoramento do Recebimento: auditoria diária em 100% dos formulários FR 08 gerados pelo Coordenador do CQ.',
    'Monitoramento no Sistema Informatizado: status dos lotes verificado em tempo real no SaaS para impedir uso de lote bloqueado.',
    'Monitoramento das Condições Ambientais: inspeção visual das planilhas FR 15 e validação semanal dos gráficos térmicos.',
  ],
  procedimentos_verificacao: [
    'Auditorias Internas de BPF: semestrais com checagem física dos armazéns, depósito de não aprovadas e simulação de recall.',
    'Avaliação Anual do Programa de Qualificação: análise integral da lista FR 14 pelo RT e Coordenador do CQ.',
    'Análise Crítica pela Direção: reunião anual executiva para revisão dos indicadores e taxas de devolução.',
  ],
  acoes_corretivas_preventivas: [
    {
      desvio: 'Recebimento de matéria-prima de fornecedor não qualificado',
      acao_imediata:
        'Interdição cautelar imediata do lote no ato; retenção em área segregada; proibição de descarregamento ou devolução imediata ao transportador.',
      acao_preventiva:
        'Bloqueio eletrônico de emissão de Ordens de Compra no ERP para fornecedores sem qualificação ativa no SaaS; reciclagem da equipe de suprimentos.',
    },
    {
      desvio: 'Matéria-prima ou ingrediente fora das especificações técnicas',
      acao_imediata:
        'Bloqueio do lote; identificação com etiqueta vermelha; transferência para o Depósito de Não Aprovadas; abertura formal de RNC (FR 01).',
      acao_preventiva:
        'Notificação ao fornecedor com exigência de Plano de Ação (CAPA) em até 5 dias; aumento da frequência de amostragem nos 3 lotes subsequentes.',
    },
    {
      desvio: 'Uso acidental de insumo não conforme em produto acabado já expedido',
      acao_imediata:
        'Ativação imediata do POP 09 (Rastreabilidade e Recolhimento); levantamento de saldo expedido, comunicação aos clientes afetados e comunicação formal ao MAPA.',
      acao_preventiva:
        'Implementação de duplo bloqueio físico e digital (leitura de código de barras na boca de dosagem vinculada à liberação prévia do CQ).',
    },
    {
      desvio: 'Registro de estabelecimento ou produto vencido ou cancelado no MAPA',
      acao_imediata:
        'Suspensão imediata da qualificação na Lista FR 14; bloqueio de todo o estoque remanescente no estabelecimento fabril.',
      acao_preventiva:
        'Automatização de alertas no SaaS com 60, 30 e 15 dias de antecedência do vencimento de licenças e certidões regulatórias.',
    },
    {
      desvio: 'Matéria-prima ou ingrediente com prazo de validade expirado no estoque',
      acao_imediata:
        'Interdição física e lógica do lote; emissão de Solicitação de Descarte (FR 18); descarte seguro conforme normas ambientais vigentes.',
      acao_preventiva:
        'Ajuste da curva de reposição de estoque (Ponto de Pedido); aplicação rigorosa do sistema PEPS/FIFO e auditorias quinzenais de validade.',
    },
    {
      desvio: 'Temperatura ou umidade dos armazéns fora da faixa permitida',
      acao_imediata:
        'Acionamento de ventilação/exaustão auxiliar e desumidificadores; priorização de uso dos lotes em até 30 dias mediante parecer do RT.',
      acao_preventiva:
        'Manutenção preventiva periódica dos sistemas de climatização; adequação do isolamento térmico das instalações de armazenagem.',
    },
    {
      desvio: 'Detecção de substâncias proibidas ou produto impróprio (arts. 95-99)',
      acao_imediata:
        'Apreensão interna do lote; comunicação formal e imediata ao Serviço de Inspeção do MAPA; desqualificação imediata e definitiva do fornecedor.',
      acao_preventiva:
        'Revisão do protocolo analítico de entrada com exigência de laudos toxicológicos prévios lote a lote para categorias de alto risco.',
    },
  ],
  gestao_registros_retencao: [
    {
      registro: 'Registro de Recebimento de Mercadorias (FR 08)',
      formato: 'Físico / Sistema SaaS',
      retencao: '2 anos (3 anos p/ produtos com medicamento)',
      custodia: 'Encarregado do CQ / Almoxarife',
    },
    {
      registro: 'Lista de Fornecedores Qualificados (FR 14)',
      formato: 'Digital no SaaS / Físico',
      retencao: 'Permanente (histórico de 5 anos)',
      custodia: 'Coordenador do CQ',
    },
    {
      registro: 'Planilha de Temperatura e Umidade (FR 15)',
      formato: 'Físico / Planilha digital',
      retencao: '2 anos (3 anos p/ salas de medicamentos)',
      custodia: 'Encarregado do CQ',
    },
    {
      registro: 'Formulários de Qualificação e Dossiês (FR 16)',
      formato: 'Digital no SaaS / Físico',
      retencao: '5 anos após desativação do fornecedor',
      custodia: 'Coordenador do CQ',
    },
    {
      registro: 'Solicitações de Descarte de Insumos (FR 18)',
      formato: 'Físico / Sistema ERP',
      retencao: '2 anos (3 anos p/ produtos com medicamento)',
      custodia: 'Responsável Técnico',
    },
    {
      registro: 'Verificação de Critérios de Qualificação (FR 19)',
      formato: 'Digital no SaaS / Físico',
      retencao: '3 anos',
      custodia: 'Coordenador do CQ',
    },
    {
      registro: 'Boletins e Laudos Analíticos Laboratoriais',
      formato: 'Físico / Digital',
      retencao: '2 anos (3 anos p/ produtos com medicamento)',
      custodia: 'Coordenador do CQ',
    },
    {
      registro: 'Registros de Não Conformidade (FR 01)',
      formato: 'Digital no SaaS / Físico',
      retencao: '3 anos',
      custodia: 'Coordenador do CQ / RT',
    },
  ],
  treinamento_capacitacao: [
    'Boas Práticas de Fabricação (BPF) aplicadas ao recebimento e estocagem;',
    'Técnicas de inspeção veicular, amostragem asséptica e critérios de integridade de embalagens;',
    'Diretrizes para prevenção de contaminação cruzada e controle de substâncias proibidas;',
    'Metodologia de operação do sistema SaaS de autocontrole e rastreabilidade de lotes;',
    'Avaliação de eficácia do treinamento através de testes teóricos e auditorias práticas em campo.',
  ],
  indicadores_gestao: [
    {
      nome: 'Índice de Devolução de Matérias-Primas',
      sigla: 'IDMP',
      formula: '(Volume de Insumos Devolvidos / Volume Total Recebido) × 100',
      periodicidade: 'Mensal',
      meta: '≤ 0,5%',
      responsavel: 'Coordenador do CQ',
    },
    {
      nome: 'Índice de Não Conformidades no Recebimento',
      sigla: 'INCR',
      formula: '(Nº de Lotes com NC no Recebimento / Total de Lotes Recebidos) × 100',
      periodicidade: 'Mensal',
      meta: '≤ 1,5%',
      responsavel: 'Encarregado do CQ',
    },
    {
      nome: 'Conformidade Documental de Fornecedores',
      sigla: 'CDF',
      formula: '(Fornecedores com Dossiê Regular / Total de Fornecedores Ativos) × 100',
      periodicidade: 'Trimestral',
      meta: '100%',
      responsavel: 'Coordenador do CQ',
    },
    {
      nome: 'Índice de Lotes Fora de Especificação',
      sigla: 'ILFE',
      formula: '(Nº de Lotes Reprovados em Análises / Total de Lotes Analisados) × 100',
      periodicidade: 'Mensal',
      meta: '≤ 0,8%',
      responsavel: 'Coordenador do CQ',
    },
    {
      nome: 'Índice de Desqualificação de Fornecedores',
      sigla: 'IDF',
      formula: 'Contagem absoluta de fornecedores desqualificados por falhas críticas',
      periodicidade: 'Anual',
      meta: 'Zero por fraude',
      responsavel: 'Responsável Técnico',
    },
  ],
  documentacao_relacionada: [
    'Manual de Boas Práticas de Fabricação (BPF) do estabelecimento {{EMPRESA}} (do qual este POP é anexo integrante);',
    'POP 05 – Procedimento para Prevenção de Contaminação Cruzada;',
    'POP 09 – Procedimento de Rastreabilidade e Recolhimento de Produtos (Recall);',
    'IT 14 – Instrução de Trabalho para Análise e Amostragem de Matérias-Primas;',
    'Manual de Especificação Técnica de Matérias-Primas e Embalagens;',
    'Formulários associados: FR 01, FR 08, FR 14, FR 15, FR 16, FR 18 e FR 19.',
  ],
}
