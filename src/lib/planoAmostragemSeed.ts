// Conteúdo-semente do Plano de Amostragem (fonte: Plano_de_Amostragem_Processo_Racoes e Anexos).
// É copiado para as coleções pa_* da organização na primeira abertura; depois é editável pelo cliente.

export const SECOES_SEED: { titulo: string; conteudo: string }[] = [
  {
    titulo: 'Quadro de aprovação',
    conteudo:
      'Elaborado por: Controle de Qualidade (nome, assinatura e data).\nAprovado por: Responsável Técnico (nome, assinatura e CRMV).\nVersão: 01.\nVigência: a partir da data de aprovação.\nPrevisão de revisão: mínima anual, ou sempre que houver alteração de processo, fornecedor, linha, equipamento, produto ou norma.',
  },
  {
    titulo: '1. Objetivo',
    conteudo:
      'Definir os pontos de colheita, matrizes, parâmetros, métodos, frequências, tamanhos de amostra, critérios de aceitação, ações corretivas e registros necessários para demonstrar, de forma auditável, que o processo produtivo é mantido sob controle e que os produtos atendem aos requisitos de inocuidade, identidade, qualidade e segurança (art. 76 do Decreto nº 12.031/2024).\nO plano é um instrumento de MONITORAMENTO e VERIFICAÇÃO de perigos identificados no fluxograma do processo, e não uma lista de análises isoladas.',
  },
  {
    titulo: '2. Campo de aplicação',
    conteudo:
      'Aplicável a todas as etapas do estabelecimento, desde o recebimento de matérias-primas até a expedição, incluindo: matérias-primas e ingredientes; produto intermediário; produto acabado; água; superfícies e ambiente; embalagens; insumos de apoio; controle integrado de pragas; e amostras de retenção.',
  },
  {
    titulo: '3. Base legal e referências',
    conteudo:
      'Decreto nº 12.031/2024 (arts. 37, 39, 40, 41, 44, 45, 46, 55, 58, 59, 64, 68 a 76).\nIN MAPA nº 04/2007 (itens 6.1, 6.2, 6.6, 7.1 a 7.15, 8.2 e 8.3; limpeza de linha item 6.2.3).\nManual de fiscalização de autocontroles – Alimentação Animal, DIPOA/SDA, versão 3.0 (itens 14 a 42, 94 e 95).\nManual para caracterização do risco, DIPOA, versão 3 (item 4.2.1.5 e Quadro VIII).\nIN MAPA nº 110/2020 (parâmetros, níveis de garantia e contaminantes).\nPortaria SDA/MAPA nº 1.412/2025 (limites de micotoxinas).\nIN MAPA nº 09/2016 (dioxinas, PCBs e furanos).\nPortaria GM/MS nº 888/2021 (potabilidade da água).\nIN MAPA nº 03/2021 (emprego de matérias-primas).',
  },
  {
    titulo: '4. Princípios de construção do plano',
    conteudo:
      '4.1 O plano deriva do fluxograma e da análise de perigos por etapa (item 29 do Manual). Perigo significativo sem controle documentado é não conformidade.\n4.2 Frequência e intensidade de amostragem são proporcionais ao risco (probabilidade x severidade) e à criticidade da etapa.\n4.3 Distinção formal entre MONITORAMENTO (rotina em processo) e VERIFICAÇÃO (confirmação periódica da eficácia do controle). Os registros são distintos.\n4.4 A monensina é UM dos perigos químicos do processo, sem tratamento diferenciado dos demais.\n4.5 Resultado analítico é dado a ser criticamente avaliado. Laudo sem avaliação, sem rastreabilidade e sem ação definida não constitui evidência de autocontrole.\n4.6 Métodos reconhecidos, mencionados no laudo; colheita representativa com cadeia de custódia.\n4.7 Registros datados, assinados, sem rasuras, mantidos por no mínimo 2 anos.',
  },
  {
    titulo: '5. Metodologia de priorização e matriz de risco',
    conteudo:
      'Severidade: ALTA (risco à saúde animal ou pública, perda de identidade) = 3; MÉDIA (desvio de garantia ou especificação com efeito limitado) = 2; BAIXA (desvio de aspecto) = 1.\nProbabilidade: ALTA = 3; MÉDIA = 2; BAIXA = 1.\nClasse ALTO: verificação por lote ou no mínimo mensal. Classe MÉDIO: verificação trimestral. Classe BAIXO: verificação semestral ou anual, ou controle documental.\nPrudência sanitária: severidade ALTA com probabilidade MÉDIA é RISCO ALTO.\nA matriz deve ser revista ao menos anualmente, ou após alteração de processo, fornecedor, linha, equipamento, produto ou norma.',
  },
  {
    titulo: '6. Análise de perigos e pontos de controle por etapa',
    conteudo:
      'Para cada etapa do fluxograma (E1 Recebimento; E2 Inspeção de matérias-primas; E3 Armazenamento; E4/E5 Pesagem e dosagem; E6 Moagem; E7 Mistura; E8 Tratamento térmico; E9 Resfriamento, armazenamento e envase; E10 Expedição; transversais) são identificados perigos físicos, químicos e biológicos, medidas preventivas, parâmetros, pontos e matrizes de amostragem, métodos, frequências, critérios de aceitação e ações em desvio. Detalhamento completo no Anexo I e na matriz do Anexo II.',
  },
  {
    titulo: '7. Matriz consolidada de amostragem',
    conteudo:
      'Organizada por grupo de matriz: a) grãos, farelos e coprodutos (ALTO); b) fontes minerais, fosfatos, calcário e sal (MÉDIO); c) aditivos, premixes e núcleos (ALTO); d) óleos e gorduras vegetais (MÉDIO); e) produto intermediário e acabado (ALTO); f) água (MÉDIO); g) superfícies e higienização (MÉDIO); h) embalagens, rótulos e insumos de apoio (BAIXO); i) pragas (MÉDIO); j) amostras de retenção (BAIXO). A matriz completa (parâmetro, método, frequência, critério) está no Anexo IV.',
  },
  {
    titulo: '8. Procedimento de colheita e cadeia de custódia',
    conteudo:
      'Utensílios limpos e identificados; mínimo de 10 incrementos por lote a granel; em produto ensacado, 10% das sacas com mínimo de 5 e máximo de 20. Massa: cerca de 1 kg para físico-química e 200 g em frasco estéril para microbiologia. Homogeneização e quarteamento da amostra composta. Identificação: produto, lote, ponto, data, hora e responsável. Prevenção de contaminação cruzada entre amostras. Laboratórios: Rede Nacional de Laboratórios Agropecuários ou credenciados, com método mencionado no laudo.\nColheita oficial em triplicata; a contraprova é entregue ao estabelecimento no ato (art. 70 do Decreto nº 12.031/2024).',
  },
  {
    titulo: '9. Critérios de aceitação, desvios e ações corretivas',
    conteudo:
      'Resultado conforme: lote liberado e registro arquivado com a avaliação crítica.\nResultado não conforme: (1) segregação do lote e da matéria-prima; (2) avaliação do alcance (intermediário, acabado, estoque e expedido); (3) investigação de causa; (4) ação sobre produto e processo; (5) medida preventiva com responsável e prazo; (6) registro do desvio com avaliação crítica.\nLote sem o resultado analítico exigido não é liberado.',
  },
  {
    titulo: '10. Verificação do plano e indicadores',
    conteudo:
      'Aderência ao plano (executadas sobre programadas): ≥ 95%.\nPercentual de conformidade por perigo e por etapa: ≥ 98%.\nRastreabilidade completa: em até 4 horas.\nNúmero e reincidência de desvios: tendência decrescente.\nHomogeneidade de mistura: CV ≤ 5%; carryover abaixo do LQ.',
  },
  {
    titulo: '11. Responsabilidades',
    conteudo:
      'Responsável Técnico (RT — CRMV): aprovação e revisão do plano; aprovação de fórmulas e rótulos isentos de registro.\nControle de Qualidade: execução do plano, avaliação crítica de laudos, abertura e condução de desvios.\nMonitores de processo: colheita e registro conforme POP.\nVerificadores e auditoria interna: confirmação da eficácia do controle.\nDireção: recursos e plano de ação.\nCompras: aquisição exclusiva de fornecedores qualificados.',
  },
  {
    titulo: '12. Registros',
    conteudo:
      'Ficha de recebimento e de colheita de matéria-prima; ficha de colheita de produto acabado e intermediário; planilha de homogeneidade de mistura; planilha de sequenciamento com data e hora; registro de limpeza de linha e destinação do material; laudos com avaliação crítica; registro de desvio e ação corretiva; registro de amostras de retenção; registro de higienização e potabilidade da água; mapa de controle integrado de pragas. Retenção mínima: 2 anos.',
  },
  {
    titulo: '13. Anexos',
    conteudo:
      'Anexo I — Fluxograma e mapa de perigos por etapa.\nAnexo II — Matriz de risco detalhada.\nAnexo III — Grade de sensibilidade e sequenciamento de produção.\nAnexo IV — Resumo executivo das frequências e programação anual.\nAnexo V — Ficha de colheita e cadeia de custódia.',
  },
]

export const MATRIZ_SEED: { etapa: string; perigo: string }[] = [
  { etapa: 'E1 Recebimento', perigo: 'Químico: resíduos de carga anterior no veículo' },
  { etapa: 'E1 Recebimento', perigo: 'Físico: matérias estranhas, pedras, vidro, metal' },
  { etapa: 'E1 Recebimento', perigo: 'Biológico: pragas, fezes de aves e roedores' },
  { etapa: 'E1 Recebimento', perigo: 'Documental: produto ou fornecedor sem registro; produto vencido' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Químico: micotoxinas em milho, DDGS, farelo e polpa cítrica' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Químico: metais tóxicos em fontes minerais e fosfatos' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Químico: dioxinas, PCBs e furanos em polpa cítrica e fontes minerais' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Biológico: Salmonella spp.' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Físico/químico: umidade acima da especificação' },
  { etapa: 'E2 Inspeção de matérias-primas', perigo: 'Documental: identidade divergente da especificada' },
  { etapa: 'E3 Armazenamento', perigo: 'Troca de identificação de silos e big bags' },
  { etapa: 'E3 Armazenamento', perigo: 'Mistura de lotes com perda de rastreabilidade' },
  { etapa: 'E3 Armazenamento', perigo: 'Biológico: proliferação fúngica por umidade' },
  { etapa: 'E3 Armazenamento', perigo: 'Biológico: infestação por pragas' },
  { etapa: 'E3 Armazenamento', perigo: 'Documental/qualidade: uso de insumo vencido' },
  { etapa: 'E4 Pesagem e dosagem de macroingredientes', perigo: 'Troca de insumo; erro de pesagem; dupla dosagem' },
  { etapa: 'E5 Pesagem e dosagem de microingredientes e aditivos', perigo: 'Omissão de aditivo; pesagem cumulativa sobreposta em um mesmo recipiente' },
  { etapa: 'E4 e E5 Pesagem e dosagem', perigo: 'Balança descalibrada' },
  { etapa: 'E6 Moagem', perigo: 'Físico: contaminação por peças e material de desgaste' },
  { etapa: 'E6 Moagem', perigo: 'Qualidade: granulometria fora da especificação' },
  { etapa: 'E6 Moagem', perigo: 'Biológico/químico: contaminação cruzada por resíduo retido no equipamento' },
  { etapa: 'E7 Mistura', perigo: 'Homogeneidade insuficiente; tempo de mistura inadequado' },
  { etapa: 'E7 Mistura', perigo: 'Segregação de microingredientes' },
  { etapa: 'E7 Mistura', perigo: 'Contaminação por resíduo de batida anterior' },
  { etapa: 'E8 Tratamento térmico', perigo: 'Biológico: sobrevivência microbiana por falha de temperatura ou tempo' },
  { etapa: 'E8 Tratamento térmico', perigo: 'Químico: degradação de aditivo termossensível' },
  { etapa: 'E8 Tratamento térmico', perigo: 'Uniformidade do tratamento no equipamento' },
  { etapa: 'E9 Resfriamento, armazenamento e envase', perigo: 'Biológico: condensação e recontaminação' },
  { etapa: 'E9 Resfriamento, armazenamento e envase', perigo: 'Poeira e contaminação entre silos' },
  { etapa: 'E9 Resfriamento, armazenamento e envase', perigo: 'Documental: troca de embalagem e de rótulo; perda de lote e de validade' },
  { etapa: 'E10 Expedição e transporte', perigo: 'Químico: carga anterior incompatível com alimentação animal' },
  { etapa: 'E10 Expedição e transporte', perigo: 'Contaminação e umidade; pragas' },
  { etapa: 'E10 Expedição e transporte', perigo: 'Documental: troca de destino; perda de rastreabilidade' },
  { etapa: 'Transversal', perigo: 'Contaminação cruzada em linha por aditivo com restrição de espécie' },
  { etapa: 'Transversal', perigo: 'Água não potável' },
  { etapa: 'Transversal', perigo: 'Higienização insuficiente de superfícies' },
  { etapa: 'Transversal', perigo: 'Lubrificante não grau alimentício' },
  { etapa: 'Transversal', perigo: 'Devolução e reprocesso sem avaliação' },
]

export const GRADE_SEED: {
  perigo: string
  especie_sensivel: string
  motivo: string
  criterio: string
  acao: string
  base_legal: string
}[] = [
  {
    perigo: 'Coccidiostático ionóforo do tipo monensina',
    especie_sensivel: 'Equinos',
    motivo: 'Toxicidade do ionóforo, com risco de intoxicação e morte',
    criterio: 'Não produzir ração para equinos após produto contendo o aditivo, salvo com limpeza de linha validada e verificação analítica',
    acao: 'Sequenciar e, se houver produção para equinos na mesma linha, limpeza de linha validada',
    base_legal: 'Item 31 do Manual de Autocontroles; indicação de uso do produto comercial',
  },
  {
    perigo: 'Coccidiostático ionóforo do tipo monensina',
    especie_sensivel: 'Suínos',
    motivo: 'Indicação de uso não autorizada para a espécie',
    criterio: 'Não produzir ração para suínos com o aditivo; verificar a indicação de uso na rotulagem antes de qualquer sequenciamento',
    acao: 'Restrição de uso, não apenas sequenciamento',
    base_legal: 'Item 22 do Manual de Autocontroles; rotulagem do aditivo',
  },
  {
    perigo: 'Nicarbazina',
    especie_sensivel: 'Aves poedeiras',
    motivo: 'Efeito sobre a produção de ovos',
    criterio: 'Não produzir ração para poedeiras após produto contendo nicarbazina',
    acao: 'Sequenciar',
    base_legal: 'Grade de sensibilidade do estabelecimento',
  },
  {
    perigo: 'Aditivos antimicrobianos melhoradores de desempenho',
    especie_sensivel: 'Destinos com restrição (ex.: União Europeia e Reino Unido) e programas voluntários',
    motivo: 'Restrição de mercado e de programa',
    criterio: 'Não produzir produto elegível após produto com o aditivo, sem limpeza de linha validada e verificação analítica',
    acao: 'Sequenciar e limpar linha com verificação',
    base_legal: 'Módulo VII do Termo de Fiscalização',
  },
  {
    perigo: 'Fontes minerais traço (zinco, manganês, cobre)',
    especie_sensivel: 'Categorias com limite de inclusão',
    motivo: 'Risco de excesso por carryover',
    criterio: 'Sequenciar produtos com maior inclusão antes dos de menor inclusão',
    acao: 'Sequenciar',
    base_legal: 'Especificação técnica',
  },
]
