migrate(
  (app) => {
    // 1. Seed user: helio@dpharma.com.br / Skip@Pass
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'helio@dpharma.com.br')
    } catch (_) {
      const user = new Record(users)
      user.setEmail('helio@dpharma.com.br')
      user.setPassword('Skip@Pass')
      user.setVerified(true)
      user.set('name', 'Hélio')
      user.set('cargo', 'Responsável Técnico')
      app.save(user)
    }

    // 2. Seed 9 POPs
    const procedures = app.findCollectionByNameOrId('procedures')
    const pops = [
      {
        codigo: 'POP-001',
        nome: 'Qualificação de Fornecedores e Controle de Matérias-Primas',
        categoria: 'Qualidade',
        frequencia: 'Mensal',
        responsavel: 'Hélio - Resp. Técnico',
        status: 'Ativo',
        area_etapa: 'Recepção e Qualificação',
        objetivo:
          'Estabelecer critérios técnicos e sanitários para homologação de fornecedores de grãos, premixes e aditivos.',
        perigos_relacionados:
          'Micotoxinas (aflatoxina, zearalenona), pesticidas, metais pesados e Salmonella em matérias-primas.',
        medidas_preventivas:
          'Exigência de laudo analítico por lote, auditoria técnica em fornecedores e teste rápido de micotoxinas no descarregamento.',
        referencia_in: 'IN 04/2007 Seção 6.1 e 7.1 / TF-Autocontroles Itens 19-22',
        data_revisao: '2025-01-15 00:00:00.000Z',
        validade: '2026-01-15 00:00:00.000Z',
      },
      {
        codigo: 'POP-002',
        nome: 'Limpeza e Higienização de Instalações, Linhas e Equipamentos',
        categoria: 'Limpeza',
        frequencia: 'Diário',
        responsavel: 'Carlos Mendes - Sup. Produção',
        status: 'Ativo',
        area_etapa: 'Linha de Moagem, Mistura e Ensaque',
        objetivo:
          'Garantir a desinfecção sistemática dos maquinários, prevenindo acúmulo de sujidades e proliferação bacteriana.',
        perigos_relacionados:
          'Contaminação microbiológica (Salmonella spp., Listeria) e resíduos alergênicos ou medicamentosos retidos.',
        medidas_preventivas:
          'Procedimento validado de varrição a seco, aspiração de dutos e higienização com detergente neutro biodegradável.',
        referencia_in: 'IN 04/2007 Seção 6.2.3 e 7.3 / TF-Autocontroles Itens 23-24',
        data_revisao: '2025-02-01 00:00:00.000Z',
        validade: '2026-02-01 00:00:00.000Z',
      },
      {
        codigo: 'POP-003',
        nome: 'Higiene e Saúde do Pessoal Operacional',
        categoria: 'Higiene',
        frequencia: 'Semanal',
        responsavel: 'Dra. Mariana Siqueira - Qualidade',
        status: 'Ativo',
        area_etapa: 'Áreas de Manipulação e Linha Direta',
        objetivo:
          'Regulamentar uniformização, asseio pessoal, lavagem de mãos e controle de atestados de saúde ocupacional (ASO).',
        perigos_relacionados:
          'Contaminação cruzada por portadores assintomáticos de patógenos entéricos e contaminação física.',
        medidas_preventivas:
          'Estações de higienização com sabonete bactericida e álcool 70%, uniformes sem bolsos superiores e treinamento obrigatório.',
        referencia_in: 'IN 04/2007 Seção 5 e 7.7 / TF-Autocontroles Itens 13 e 25',
        data_revisao: '2025-01-10 00:00:00.000Z',
        validade: '2026-01-10 00:00:00.000Z',
      },
      {
        codigo: 'POP-004',
        nome: 'Potabilidade da Água e Higienização de Reservatórios',
        categoria: 'Água',
        frequencia: 'Mensal',
        responsavel: 'Hélio - Resp. Técnico',
        status: 'Ativo',
        area_etapa: 'Reservatórios Centrais e Caldeira',
        objetivo:
          'Assegurar que a água de abastecimento industrial e geração de vapor atenda aos parâmetros microbiológicos e físico-químicos.',
        perigos_relacionados:
          'Coliformes totais, Escherichia coli, turbidez e contaminação química de caldeira.',
        medidas_preventivas:
          'Cloração automática com residual entre 0,5 e 2,0 ppm, análises microbiológicas mensais e limpeza semestral de reservatórios.',
        referencia_in: 'IN 04/2007 Seção 6.3 e 7.8 (Portaria GM/MS 888/2021) / TF Itens 26-28',
        data_revisao: '2025-01-20 00:00:00.000Z',
        validade: '2026-01-20 00:00:00.000Z',
      },
      {
        codigo: 'POP-005',
        nome: 'Prevenção de Contaminação Cruzada e Sequenciamento de Produção',
        categoria: 'BPF',
        frequencia: 'Por lote',
        responsavel: 'Carlos Mendes - Sup. Produção',
        status: 'Ativo',
        area_etapa: 'Misturador e Silos Intermediários',
        objetivo:
          'Evitar carreamento de princípios ativos medicamentosos, coccidiostáticos ou ingredientes proibidos para ruminantes.',
        perigos_relacionados:
          'Carryover de antimicrobianos e aditivos ionóforos em rações para animais sensíveis (ex: equinos).',
        medidas_preventivas:
          'Grade de sensibilidade e sequenciamento de bateladas validado; flushing com milho moído e descarte rastreado do arraste.',
        referencia_in: 'IN 04/2007 Seção 6.2 e 7.5 / TF-Autocontroles Itens 29-36',
        data_revisao: '2025-02-10 00:00:00.000Z',
        validade: '2026-02-10 00:00:00.000Z',
      },
      {
        codigo: 'POP-006',
        nome: 'Manutenção Preventiva e Calibração de Equipamentos',
        categoria: 'Manutenção',
        frequencia: 'Mensal',
        responsavel: 'Roberto Lima - Manutenção',
        status: 'Ativo',
        area_etapa: 'Balanças, Moinhos, Misturadores e Peletizadora',
        objetivo:
          'Padronizar o plano de manutenção e aferição metrológica dos instrumentos críticos de pesagem e dosagem.',
        perigos_relacionados:
          'Subdosagem ou superdosagem de premixes microminerais e falhas mecânicas com geração de limalha de ferro.',
        medidas_preventivas:
          'Calibração acreditada RBC das balanças, inspeção de peneiras de moinho e monitoramento de ímãs e detectores de metal.',
        referencia_in: 'IN 04/2007 Seção 4.4 e 7.9 / TF-Autocontroles Itens 16, 37-38',
        data_revisao: '2025-01-05 00:00:00.000Z',
        validade: '2026-01-05 00:00:00.000Z',
      },
      {
        codigo: 'POP-007',
        nome: 'Controle Integrado de Pragas e Vetores',
        categoria: 'Pragas',
        frequencia: 'Semanal',
        responsavel: 'Dra. Mariana Siqueira - Qualidade',
        status: 'Ativo',
        area_etapa: 'Perímetro Fabril, Silos e Armazéns',
        objetivo:
          'Monitorar e prevenir infestação de roedores, insetos e aves em todas as áreas internas e externas do estabelecimento.',
        perigos_relacionados:
          'Salmonelose aviária, contaminação fecal, danos em embalagens e transmissão de patógenos zoonóticos.',
        medidas_preventivas:
          'Armadilhas luminosas não adesivas internas, porta-iscas numerados e mapeados no perímetro externo, e inspeção semanal.',
        referencia_in: 'IN 04/2007 Seção 4.1 e 7.10 / TF-Autocontroles Item 39',
        data_revisao: '2025-02-15 00:00:00.000Z',
        validade: '2026-02-15 00:00:00.000Z',
      },
      {
        codigo: 'POP-008',
        nome: 'Controle de Resíduos Sólidos e Gestão de Efluentes',
        categoria: 'BPF',
        frequencia: 'Semanal',
        responsavel: 'Roberto Lima - Manutenção',
        status: 'Ativo',
        area_etapa: 'Pátio de Resíduos e Estação de Tratamento',
        objetivo:
          'Organizar a segregação, acondicionamento e destinação final de sacarias avariadas, poeira de filtros e efluentes de lavagem.',
        perigos_relacionados:
          'Atração de pragas, contaminação ambiental e reintrodução acidental de varredura contaminada no fluxo fabril.',
        medidas_preventivas:
          'Caçambas fechadas, identificação cromática de resíduos, descarte homologado com MTR e neutralização de efluentes.',
        referencia_in: 'IN 04/2007 Seção 4.3.25 e 7.11 / TF-Autocontroles Item 40',
        data_revisao: '2025-01-25 00:00:00.000Z',
        validade: '2026-01-25 00:00:00.000Z',
      },
      {
        codigo: 'POP-009',
        nome: 'Rastreabilidade de Lotes e Procedimento de Recolhimento (Recall)',
        categoria: 'Rastreabilidade',
        frequencia: 'Por lote',
        responsavel: 'Hélio - Resp. Técnico',
        status: 'Ativo',
        area_etapa: 'Cadeia Produtiva Completa e Expedição',
        objetivo:
          'Garantir a rastreabilidade bidirecional em tempo máximo de 4 horas e protocolo estruturado para recolhimento emergencial.',
        perigos_relacionados:
          'Distribuição e consumo de produto não conforme por falha de identificação, com risco sanitário aos animais.',
        medidas_preventivas:
          'Codificação alfanumérica por batelada, amarração eletrônica de ordem de produção, teste semestral e simulado anual.',
        referencia_in: 'IN 04/2007 Seção 7.12 e 8 / TF-Autocontroles Itens 41-42, 61-62',
        data_revisao: '2025-02-05 00:00:00.000Z',
        validade: '2026-02-05 00:00:00.000Z',
      },
    ]

    const procedureRecords = {}
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i]
      let record
      try {
        record = app.findFirstRecordByData('procedures', 'codigo', p.codigo)
      } catch (_) {
        record = new Record(procedures)
        record.set('codigo', p.codigo)
        record.set('nome', p.nome)
        record.set('categoria', p.categoria)
        record.set('frequencia', p.frequencia)
        record.set('responsavel', p.responsavel)
        record.set('status', p.status)
        record.set('area_etapa', p.area_etapa)
        record.set('objetivo', p.objetivo)
        record.set('perigos_relacionados', p.perigos_relacionados)
        record.set('medidas_preventivas', p.medidas_preventivas)
        record.set('referencia_in', p.referencia_in)
        record.set('data_revisao', p.data_revisao)
        record.set('validade', p.validade)
        app.save(record)
      }
      procedureRecords[p.codigo] = record
    }

    // 3. Seed Monitoring Records
    const recordsCol = app.findCollectionByNameOrId('records')
    const sampleRecords = [
      {
        procedureCode: 'POP-002',
        data: '2025-05-10 08:30:00.000Z',
        turno: 'Manhã',
        valor_medido: 'Limpeza realizada, pH residual 6,5',
        status: 'Conforme',
        responsavel: 'Carlos Mendes',
        observacoes: 'Higienização completa da linha de mistura concluída e aprovada visualmente.',
        lote: 'LOTE-2025-042',
      },
      {
        procedureCode: 'POP-005',
        data: '2025-05-10 14:15:00.000Z',
        turno: 'Tarde',
        valor_medido: 'Temperatura 78,5°C - Umidade 11,2%',
        status: 'Conforme',
        responsavel: 'João Silva',
        observacoes:
          'Tratamento térmico de peletização mantido nos limites críticos do APPCC (75-85°C).',
        lote: 'LOTE-2025-042',
      },
      {
        procedureCode: 'POP-004',
        data: '2025-05-11 09:00:00.000Z',
        turno: 'Manhã',
        valor_medido: 'Cloro residual 1,2 ppm - pH 7,1',
        status: 'Conforme',
        responsavel: 'Hélio',
        observacoes: 'Padrão de potabilidade da água dentro da Portaria GM/MS 888/2021.',
        lote: 'LOTE-2025-042',
      },
      {
        procedureCode: 'POP-006',
        data: '2025-05-11 16:45:00.000Z',
        turno: 'Tarde',
        valor_medido: 'Desvio na balança B-02: +1,8kg no teste de 500kg',
        status: 'Não Conforme',
        responsavel: 'Roberto Lima',
        observacoes:
          'Identificado desvio acima do erro máximo tolerado de 0,5%. Linha paralisada para reajuste.',
        lote: 'LOTE-2025-043',
      },
      {
        procedureCode: 'POP-001',
        data: '2025-05-12 10:20:00.000Z',
        turno: 'Manhã',
        valor_medido: 'Aflatoxina B1: 4 ppb (Limite < 20 ppb)',
        status: 'Conforme',
        responsavel: 'Dra. Mariana Siqueira',
        observacoes:
          'Carga de farelo de soja recebida com laudo analítico e teste de fita conforme.',
        lote: 'LOTE-2025-044',
      },
    ]

    let firstSavedRecordId = ''
    for (let i = 0; i < sampleRecords.length; i++) {
      const sr = sampleRecords[i]
      const proc = procedureRecords[sr.procedureCode]
      if (proc) {
        const rec = new Record(recordsCol)
        rec.set('procedure', proc.id)
        rec.set('data', sr.data)
        rec.set('turno', sr.turno)
        rec.set('valor_medido', sr.valor_medido)
        rec.set('status', sr.status)
        rec.set('responsavel', sr.responsavel)
        rec.set('observacoes', sr.observacoes)
        rec.set('lote', sr.lote)
        app.save(rec)
        if (!firstSavedRecordId && sr.status === 'Não Conforme') {
          firstSavedRecordId = rec.id
        }
      }
    }

    // 4. Seed Audit (status "Em Andamento" with TF-Autocontroles items)
    const auditsCol = app.findCollectionByNameOrId('audits')
    let auditRecord
    try {
      auditRecord = app.findFirstRecordByData('audits', 'codigo', 'AUD-001')
    } catch (_) {
      auditRecord = new Record(auditsCol)
      auditRecord.set('codigo', 'AUD-001')
      auditRecord.set('data', '2025-05-08 09:00:00.000Z')
      auditRecord.set('tipo', 'Interna')
      auditRecord.set('area_processo', 'Qualidade e Produção de Rações')
      auditRecord.set('auditor', 'Hélio - Auditor Líder')
      auditRecord.set('status', 'Em Andamento')
      auditRecord.set(
        'escopo',
        'Auditoria semestral de autocontrole baseada no TF-Autocontroles (MAPA Módulo I) e Módulo VII (Auditoria Interna e Verificação de Conformidade). Cobertura das seções A até I.',
      )
      auditRecord.set('conclusao', 'Conforme com Ressalvas')
      auditRecord.set(
        'relatorio_achados',
        'Auditoria em andamento satisfatório. Identificada necessidade de calibração imediata da balança B-02 conforme Item 38 e atualização do registro de treinamento no Item 13.',
      )
      auditRecord.set('checklist', {
        planejamento: {
          item48_programa_documentado: true,
          item49_equipe_qualificada: true,
          item50_plano_anual: true,
          item51_execucao_cronograma: true,
        },
        itens: {
          1: {
            status: 'C',
            evidencia: 'Certificado de registro MAPA nº SP-00412 em vigência regular.',
          },
          2: { status: 'C', evidencia: 'RT Hélio devidamente anotado no CRMV-SP sob o nº 18.420.' },
          3: {
            status: 'C',
            evidencia: 'Planos de ação da auditoria anterior concluídos integralmente.',
          },
          4: { status: 'C', evidencia: 'SipeAgro alimentado com os dados mensais de produção.' },
          5: {
            status: 'C',
            evidencia: 'Composições em rotulagem conferem com as ordens de batelada.',
          },
          10: {
            status: 'C',
            evidencia: 'Estruturas internas de alvenaria lavável e fluxo unidirecional.',
          },
          13: {
            status: 'C',
            evidencia: 'Treinamentos realizados em Jan/2025 para operadores da linha 1.',
          },
          14: {
            status: 'C',
            evidencia: 'Parâmetros de temperatura de peletização registrados nos logs.',
          },
          19: {
            status: 'C',
            evidencia: 'Qualificação de fornecedores homologada com laudos em dia.',
          },
          23: {
            status: 'C',
            evidencia: 'Checklists diários de higienização preenchidos e assinados.',
          },
          26: {
            status: 'C',
            evidencia: 'Água da rede de poço artesiano com cloração contínua e laudo mensal.',
          },
          29: {
            status: 'C',
            evidencia: 'Matriz de perigos e medidas preventivas descrita no POP-005.',
          },
          38: {
            status: 'NC',
            evidencia:
              'Balança B-02 apresentou variação de pesagem (+1,8kg) sem reteste imediato na semana anterior.',
          },
          39: {
            status: 'C',
            evidencia: 'Controle de pragas por empresa especializada com armadilhas monitoradas.',
          },
          41: {
            status: 'C',
            evidencia:
              'Teste de rastreabilidade do lote LOTE-2025-042 realizado em 2h30min com sucesso.',
          },
        },
      })
      auditRecord.set('assinaturas', {
        responsavel_estabelecimento: 'Hélio - Responsável Técnico (CRMV-SP 18.420)',
        auditor: 'Hélio - Auditor Líder',
      })
      app.save(auditRecord)
    }

    // 5. Seed Non-Conformities
    const ncCol = app.findCollectionByNameOrId('non_conformities')

    // NC 1: Maior aberta (origem Auditoria, Item 38)
    try {
      app.findFirstRecordByData('non_conformities', 'codigo', 'NC-001')
    } catch (_) {
      const nc1 = new Record(ncCol)
      nc1.set('codigo', 'NC-001')
      nc1.set(
        'descricao',
        'Desvio na calibração periódica da balança de micronutrientes B-02 com erro acima da tolerância permitida (TF-Autocontroles Item 38).',
      )
      nc1.set('classificacao', 'Maior')
      nc1.set('origem', 'Auditoria')
      nc1.set('area', 'Dosagem de Premix / Pesagem')
      nc1.set('data_identificacao', '2025-05-08 00:00:00.000Z')
      nc1.set('prazo', '2025-06-07 00:00:00.000Z')
      nc1.set('status', 'Aberta')
      nc1.set('responsavel', 'Roberto Lima - Manutenção')
      nc1.set(
        'plano_acao',
        'Realizar calibração com pesos-padrão RBC, ajustar célula de carga e retreinar operador de dosagem.',
      )
      nc1.set('prazo_acao', '2025-05-20 00:00:00.000Z')
      nc1.set('responsavel_acao', 'Roberto Lima')
      nc1.set('recursos', 'Kit de pesos-padrão aferidos RBC e técnico de calibração credenciado')
      nc1.set(
        'medidas_preventivas',
        'Aferição diária com peso-padrão de 20kg antes do início de cada turno.',
      )
      nc1.set(
        'indicador_eficacia',
        'Zero desvios superiores a 0,1% nas aferições diárias durante 30 dias subsequentes.',
      )
      nc1.set('causa_raiz', {
        cinco_porques: [
          'Por que a balança descalibrou? Célula de carga sofreu sobrecarga na limpeza mecânica.',
          'Por que sobrecarregou? O operador apoiou recipiente pesado sobre o prato da balança.',
          'Por que apoiou o recipiente? Falta de suporte auxiliar de apoio para pesagem de premix.',
          'Por que faltava suporte? Não havia sido contemplado no layout da bancada.',
          'Por que não foi contemplado? Análise ergonômica e de processo incompleta na instalação.',
        ],
        ishikawa: {
          maquina: 'Célula de carga sensível sem batente limitador mecânico de sobrecarga',
          metodo: 'Falta de procedimento para pesagem preliminar de bateladas pesadas',
          material: 'Baldes de aço inox de 25kg utilizados diretamente na plataforma',
          mao_de_obra: 'Operador novato não orientado sobre a fragilidade da célula',
          meio_ambiente: 'Vibração residual proveniente do misturador vizinho',
          medicao: 'Checagem diária ocorria apenas no início da semana',
        },
      })
      nc1.set('audit', auditRecord.id)
      if (procedureRecords['POP-006']) {
        nc1.set('procedure', procedureRecords['POP-006'].id)
      }
      app.save(nc1)
    }

    // NC 2: Menor fechada com eficácia verificada
    try {
      app.findFirstRecordByData('non_conformities', 'codigo', 'NC-002')
    } catch (_) {
      const nc2 = new Record(ncCol)
      nc2.set('codigo', 'NC-002')
      nc2.set(
        'descricao',
        'Registro de temperatura da peletizadora ausente no turno da noite do dia 28/04.',
      )
      nc2.set('classificacao', 'Menor')
      nc2.set('origem', 'Registro')
      nc2.set('area', 'Tratamento Térmico')
      nc2.set('data_identificacao', '2025-04-29 00:00:00.000Z')
      nc2.set('prazo', '2025-05-29 00:00:00.000Z')
      nc2.set('status', 'Fechada')
      nc2.set('responsavel', 'Carlos Mendes')
      nc2.set(
        'plano_acao',
        'Revisão dos logs do datalogger digital e inclusão de alarme sonoro para apontamento de turno.',
      )
      nc2.set('prazo_acao', '2025-05-02 00:00:00.000Z')
      nc2.set('responsavel_acao', 'Carlos Mendes')
      nc2.set('recursos', 'Configuração do software supervisório da peletizadora')
      nc2.set(
        'medidas_preventivas',
        'Integração automática das temperaturas do datalogger na nuvem.',
      )
      nc2.set(
        'indicador_eficacia',
        '100% dos turnos com registros preenchidos nos 30 dias subsequentes.',
      )
      nc2.set('causa_raiz', {
        cinco_porques: [
          'Por que não anotou? Operador precisou atender parada mecânica na ensacadeira.',
          'Por que ninguém cobriu? Falta de operador de reserva no turno da madrugada.',
          'Por que não houve registro posterior? O operador esqueceu de resgatar o log manual.',
          'Por que dependia de papel? Sistema digital ainda não imprimia relatório de turno.',
          'Causa raiz: Falta de automação no registro contínuo do sensor térmico.',
        ],
      })
      nc2.set('data_execucao', '2025-05-02 00:00:00.000Z')
      nc2.set('verificacao_responsavel', 'Dra. Mariana Siqueira')
      nc2.set('data_verificacao', '2025-06-05 00:00:00.000Z')
      nc2.set('eficaz', 'Eficaz')
      nc2.set(
        'resultado_verificacao',
        'Verificado que após a automação do datalogger todos os registros de 30 dias foram preenchidos sem nenhuma falha.',
      )
      nc2.set('lote', 'LOTE-2025-038')
      if (procedureRecords['POP-005']) {
        nc2.set('procedure', procedureRecords['POP-005'].id)
      }
      app.save(nc2)
    }

    // 6. Seed Traceability Test
    const traceCol = app.findCollectionByNameOrId('traceability_tests')
    try {
      app.findFirstRecordByData('traceability_tests', 'lote', 'LOTE-2025-042')
    } catch (_) {
      const tt = new Record(traceCol)
      tt.set('lote', 'LOTE-2025-042')
      tt.set('data_teste', '2025-05-05 14:00:00.000Z')
      tt.set('tipo', 'Rastreabilidade')
      tt.set('tempo_rastreamento', '2 horas e 24 minutos (máx. 4h conforme Item 61)')
      tt.set(
        'comunicacao_clientes',
        'Lista de 4 distribuidores com quantitativos exatos despachados identificados.',
      )
      tt.set(
        'localizacao_produtos',
        '100% do volume expedido (32 toneladas) localizado nos armazéns e revendas.',
      )
      tt.set('resultado', 'Aprovado')
      app.save(tt)
    }

    // 7. Seed Trainings
    const trainCol = app.findCollectionByNameOrId('trainings')
    try {
      app.findFirstRecordByData(
        'trainings',
        'tema',
        'Boas Práticas de Fabricação e Higiene Pessoal (IN 04/2007)',
      )
    } catch (_) {
      const t1 = new Record(trainCol)
      t1.set('codigo', 'TR-001')
      t1.set('tema', 'Boas Práticas de Fabricação e Higiene Pessoal (IN 04/2007)')
      t1.set('data', '2025-01-20 00:00:00.000Z')
      t1.set('instrutor', 'Hélio - Responsável Técnico')
      t1.set('participantes', [
        { nome: 'Carlos Mendes', cargo: 'Supervisor', nota: 9.5 },
        { nome: 'João Silva', cargo: 'Operador de Peletização', nota: 9.0 },
        { nome: 'Ana Paula', cargo: 'Operadora de Ensaque', nota: 10.0 },
        { nome: 'Roberto Lima', cargo: 'Manutenção', nota: 8.5 },
      ])
      t1.set('carga_horaria', '8 horas')
      t1.set('status', 'Concluído')
      t1.set('eficacia_verificada', true)
      app.save(t1)

      const t2 = new Record(trainCol)
      t2.set('codigo', 'TR-002')
      t2.set('tema', 'Prevenção de Contaminação Cruzada e Sequenciamento de Produção')
      t2.set('data', '2025-06-15 00:00:00.000Z')
      t2.set('instrutor', 'Dra. Mariana Siqueira')
      t2.set('participantes', [
        { nome: 'Carlos Mendes', cargo: 'Supervisor' },
        { nome: 'Marcos Souza', cargo: 'Operador de Mistura' },
      ])
      t2.set('carga_horaria', '4 horas')
      t2.set('status', 'Agendado')
      t2.set('eficacia_verificada', false)
      app.save(t2)
    }

    // 8. Seed Documents Repository
    const docsCol = app.findCollectionByNameOrId('documents')
    const sampleDocs = [
      {
        nome: 'Plano APPCC Formal - Linha de Ração Peletizada.pdf',
        categoria: 'Plano APPCC',
        referencia_pop: 'POP-005',
      },
      {
        nome: 'Manual de Boas Práticas de Fabricação BPF (IN 04/2007).pdf',
        categoria: 'Manual BPF',
        referencia_pop: 'POP-001',
      },
      {
        nome: 'POP 001 - Qualificação de Fornecedores e Matérias-Primas.pdf',
        categoria: 'POP',
        referencia_pop: 'POP-001',
      },
      {
        nome: 'POP 002 - Higienização de Linhas e Equipamentos.pdf',
        categoria: 'POP',
        referencia_pop: 'POP-002',
      },
      {
        nome: 'POP 004 - Controle de Potabilidade da Água.pdf',
        categoria: 'POP',
        referencia_pop: 'POP-004',
      },
      {
        nome: 'POP 009 - Rastreabilidade e Recolhimento de Lotes.pdf',
        categoria: 'POP',
        referencia_pop: 'POP-009',
      },
      {
        nome: 'Relatório de Auditoria Interna TF-Autocontroles AUD-001.pdf',
        categoria: 'Verificação',
        referencia_pop: 'POP-009',
      },
      {
        nome: 'Certificado de Calibração Balança RBC B-02.pdf',
        categoria: 'Ação Corretiva',
        referencia_pop: 'POP-006',
      },
    ]

    for (let i = 0; i < sampleDocs.length; i++) {
      const d = sampleDocs[i]
      try {
        app.findFirstRecordByData('documents', 'nome', d.nome)
      } catch (_) {
        const docRec = new Record(docsCol)
        docRec.set('nome', d.nome)
        docRec.set('categoria', d.categoria)
        docRec.set('referencia_pop', d.referencia_pop)
        app.save(docRec)
      }
    }
  },
  (app) => {
    // down logic is optional for seed
  },
)
