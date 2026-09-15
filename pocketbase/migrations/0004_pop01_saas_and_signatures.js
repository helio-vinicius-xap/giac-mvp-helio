migrate(
  (app) => {
    // 1. Campo de assinatura digitalizada do RT (arquivo de imagem JPG / PNG) em users
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('assinatura_imagem')) {
      users.fields.add(
        new FileField({
          name: 'assinatura_imagem',
          required: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
    }
    app.save(users)

    // 2. Extender procedures com campo metadados_saas (JSON com documento, bases legais, anexos, campos e aprovações)
    const procedures = app.findCollectionByNameOrId('procedures')
    if (!procedures.fields.getByName('metadados_saas')) {
      procedures.fields.add(
        new JSONField({
          name: 'metadados_saas',
          required: false,
        }),
      )
    }
    if (!procedures.fields.getByName('secoes_normativas')) {
      procedures.fields.add(
        new JSONField({
          name: 'secoes_normativas',
          required: false,
        }),
      )
    }
    app.save(procedures)

    // 3. Atualizar o POP 01 (POP-001) para o NOVO MODELO COMPLETO do usuário
    try {
      const pop01 = app.findFirstRecordByData('procedures', 'codigo', 'POP-001')
      pop01.set('codigo', 'POP-01')
      pop01.set(
        'nome',
        'Qualificação de Fornecedores e Controle de Matérias-Primas, Ingredientes e de Embalagens',
      )
      pop01.set('categoria', 'Qualidade')
      pop01.set('frequencia', 'Contínuo')
      pop01.set('responsavel', 'Dr. Hélio Silva - RT / Coordenador CQ')
      pop01.set('status', 'Ativo')
      pop01.set('area_etapa', 'Recepção, Amostragem, Laboratório e Armazenamento')
      pop01.set(
        'objetivo',
        'Estabelecer e padronizar a metodologia executiva para a qualificação, homologação, monitoramento contínuo, verificação periódica e desqualificação de fabricantes, armazenadores e fornecedores comerciais de matérias-primas, macro e micro-ingredientes, aditivos, premixes, núcleos, concentrados, produtos com medicamentos e materiais de embalagem primária e secundária. Disciplinar recepção, conferência documental, inspeção higiênico-sanitária de veículos, amostragem representativa, ensaios laboratoriais de liberação, armazenamento segregado e destinação de itens não conformes (IN MAPA 04/2007 item 7.1 "a" e item 7.5; Decreto 12.031/2024).',
      )
      pop01.set(
        'perigos_relacionados',
        'Perigos Biológicos: Salmonella sp., Clostridium, contaminação cruzada EEB por farinhas animais não autorizadas. Perigos Químicos: Micotoxinas (aflatoxinas, zearalenona, fumonisinas), agrotóxicos residuais, rancidez oxidativa, metais pesados (flúor, chumbo, arsênio), carreamento de medicamentos e substâncias proibidas (cloranfenicol, nitrofuranos, violeta de genciana, ractopamina não autorizada). Perigos Físicos: Sujidades, fragmentos metálicos, insetos/pragas e avarias.',
      )
      pop01.set(
        'medidas_preventivas',
        'Qualificação documental e analítica prévia de 100% dos fabricantes e fornecedores na Lista FR 14; inspeção física e higiênico-sanitária de 100% dos veículos no recebimento (FR 08); amostragem representativa com quarteamento e retenção de contraprovas (IT 14); bloqueio compulsório e guarda em Depósito de Não Aprovadas com chave; controle diário de temperatura e umidade relativa (FR 15); verificação anual com requalificação (FR 19); descarte auditável (FR 18); e abertura imediata de RNC (FR 01).',
      )
      pop01.set(
        'referencia_in',
        'Decreto Federal nº 12.031/2024 / IN MAPA nº 04/2007 itens 3, 6.1, 6.2, 6.8, 7 e 8 / Manual de Fiscalização de Autocontroles MAPA Módulo I (itens 19-22, 29, 41)',
      )
      pop01.set('versao', '01-2026')
      pop01.set('data_revisao', '2026-09-15 00:00:00.000Z')
      pop01.set('validade', '2027-09-15 00:00:00.000Z')

      // Metadados SaaS conforme bloco JSON do docx
      const metadadosSaas = {
        document_code: 'POP-01',
        title:
          'Qualificação de Fornecedores e Controle de Matérias-Primas, Ingredientes e de Embalagens',
        revision: '01/2026',
        effective_date: '2026-09-15',
        creation_date: '2026-09-15',
        company: '{{EMPRESA}}',
        cnpj: '{{CNPJ}}',
        mapa_registration: '{{REGISTRO_MAPA}}',
        address: '{{ENDERECO}}',
        responsible_technician: '{{RESPONSAVEL_TECNICO}}',
        professional_registration: '{{REGISTRO_PROFISSIONAL}}',
        prepared_by: '{{ELABORADO_POR}}',
        approved_by_direction: '{{APROVADO_POR}}',
        approved_by_qc: '{{APROVADO_POR_CQ}}',
        status: 'Aprovado',
        risk_classification: 'Risco Alto (RI)',
        legal_basis: [
          'Decreto nº 12.031/2024',
          'Instrução Normativa MAPA nº 04/2007',
          'Manual de Fiscalização de Autocontroles – Alimentação Animal (MAPA/SDA)',
          'Manual para Caracterização do Risco dos Estabelecimentos Fabricantes e Fracionadores (MAPA/SDA)',
        ],
        annexes: [
          'FR 08 - Registro de Recebimento de Mercadorias',
          'FR 14 - Lista de Fornecedores e Fabricantes Qualificados',
          'FR 15 - Monitoramento de Temperatura e Umidade',
          'FR 16 - Formulário de Qualificação de Fornecedores',
          'FR 18 - Solicitação de Descarte de MP, Ingredientes, PA e Embalagens',
          'FR 19 - Verificação dos Critérios de Qualificação de Fornecedor',
          'IT 14 - Instrução de Trabalho: Análise de Matérias-Primas',
          'A8 - Checklist de Auditoria/Visita Técnica a Fornecedores',
          'A9 - Matriz de Risco de Matérias-Primas e Ingredientes (APPCC)',
          'A10 - Declaração de Conformidade do Fornecedor',
          'FR 01 - Registro de Não Conformidade (RNC)',
        ],
        fields: [
          '{{EMPRESA}}',
          '{{CNPJ}}',
          '{{REGISTRO_MAPA}}',
          '{{ENDERECO}}',
          '{{RESPONSAVEL_TECNICO}}',
          '{{REGISTRO_PROFISSIONAL}}',
          '{{ELABORADO_POR}}',
          '{{APROVADO_POR}}',
          '{{APROVADO_POR_CQ}}',
          '{{REVISAO}}',
          '{{DATA_VIGOR}}',
          '{{DATA_ELABORACAO}}',
          '{{STATUS}}',
          '{{CLASSIFICACAO_RISCO}}',
        ],
      }
      pop01.set('metadados_saas', metadadosSaas)

      // Campos de execução atualizados conforme Seção 6 do docx
      pop01.set('campos_execucao', {
        qualificacao_etapas:
          '1. Demanda; 2. Coleta de Documentos (Registro MAPA, Ficha Técnica, Declaração A10, 3 laudos); 3. Critérios Limitantes; 4. Amostra Piloto (Umidade, PB, Cinzas, Microscopia); 5. Auditoria Técnica (A8) para Categoria Alto Risco; 6. Homologação formal na Lista FR 14 pelo RT e Coordenador CQ.',
        recebimento_inspecao:
          '1. Conferência na Lista FR 14; 2. Inspeção veicular do art. 77 Decreto 12.031/2024 (higiene, lona, ausência de incompatíveis, controle de temp); 3. Rotulagem arts. 61-67; 4. Avaliação sensorial (cor, odor, textura, umidade, insetos); 5. Geração de Lote Interno.',
        amostragem_procedimentos:
          'Macro ensacados: 10% sacaria (1 a 30 volumes); Micro/Medicamentos: 10% (1 a 10 volumes); Granéis: amostragem contínua/estratificada; Quarteamento: 1 amostra ensaio + 2 contraprovas lacradas.',
        temperatura_umidade_limites:
          'Sala de Medicamentos e Premixes: 15–25 ºC / UR < 85%. Armazéns Gerais de MP e Embalagens: < 35 ºC / UR < 85%. Monitoramento 2x/dia (FR 15).',
        segregacao_deposito:
          'Área segregada trancada à chave sob custódia do CQ (item 7.5 IN 04/2007). Bloqueio no sistema com etiqueta vermelha.',
        rastreabilidade_tempo:
          'Reconstituição à montante e jusante em prazo máximo de 2 horas (art. 10 Decreto 12.031/2024).',
        substancias_proibidas:
          'Veto absoluto a nitrofuranos, cloranfenicol e violeta de genciana. Controle de Ractopamina e regras de prevenção de EEB.',
        epi_obrigatorios:
          'Óculos de proteção, máscaras contra particulados (PFF2), protetores auriculares, luvas nitrílicas e calçados com biqueira de segurança.',
        acoes_corretivas_imediatas:
          'Lote reprovado: bloqueio imediato, etiqueta vermelha, guarda no depósito trancado, abertura de RNC (FR 01) e emissão de FR 18 se for descarte.',
      })

      // Catálogo de formulários normativos vinculados (anexos A1-A11)
      pop01.set('formularios_item07', [
        {
          codigo: 'FR 08',
          titulo: 'Registro de Recebimento de Mercadorias',
          frequencia: 'A cada recebimento de carga / lote',
          retencao: '2 anos (3 anos para produtos com medicamento)',
        },
        {
          codigo: 'FR 14',
          titulo: 'Lista de Fornecedores e Fabricantes Qualificados',
          frequencia: 'Permanente (atualização contínua / anual)',
          retencao: 'Permanente (histórico mínimo de 5 anos)',
        },
        {
          codigo: 'FR 15',
          titulo: 'Monitoramento Diário de Temperatura e Umidade',
          frequencia: 'Diário (2 vezes ao dia)',
          retencao: '2 anos (3 anos para salas de medicamentos)',
        },
        {
          codigo: 'FR 16',
          titulo: 'Formulário de Qualificação de Fornecedores',
          frequencia: 'Por fornecedor / proponente e produto',
          retencao: '5 anos após eventual desativação',
        },
        {
          codigo: 'FR 18',
          titulo: 'Solicitação de Descarte de Insumos e Produtos',
          frequencia: 'Por evento de descarte / produto impróprio',
          retencao: '2 anos (3 anos para produtos com medicamento)',
        },
        {
          codigo: 'FR 19',
          titulo: 'Verificação Anual dos Critérios de Qualificação',
          frequencia: 'Anual (mínimo a cada 12 meses por fornecedor)',
          retencao: '3 anos',
        },
        {
          codigo: 'IT 14',
          titulo: 'Instrução de Trabalho: Análise de Matérias-Primas',
          frequencia: 'Lote a lote / rotina laboratorial',
          retencao: '2 anos (3 anos para produtos com medicamento)',
        },
        {
          codigo: 'A8',
          titulo: 'Checklist de Auditoria/Visita Técnica a Fornecedores',
          frequencia: 'Bienal ou por risco alto',
          retencao: '3 anos',
        },
        {
          codigo: 'A9',
          titulo: 'Matriz de Risco de Matérias-Primas e Ingredientes (APPCC)',
          frequencia: 'Revisão anual ou por alteração regulatória',
          retencao: 'Permanente',
        },
        {
          codigo: 'A10',
          titulo: 'Declaração de Conformidade do Fornecedor',
          frequencia: 'Na homologação e renovação anual',
          retencao: '5 anos',
        },
        {
          codigo: 'FR 01',
          titulo: 'Registro de Não Conformidade (RNC)',
          frequencia: 'Por ocorrência de desvio / não conformidade',
          retencao: '3 anos',
        },
      ])

      app.save(pop01)
    } catch (_) {}
  },
  (app) => {
    // Reverter apenas se necessário
  },
)
