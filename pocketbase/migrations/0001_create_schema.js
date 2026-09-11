migrate(
  (app) => {
    // 1. users: adicionar campo cargo
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('cargo')) {
      users.fields.add(new TextField({ name: 'cargo', required: false }))
      app.save(users)
    }

    // 2. procedures
    const procedures = new Collection({
      name: 'procedures',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'nome', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: [
            'BPF',
            'Limpeza',
            'Qualidade',
            'APPCC',
            'Higiene',
            'Manutenção',
            'Pragas',
            'Água',
            'Rastreabilidade',
          ],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'editor', required: false },
        {
          name: 'frequencia',
          type: 'select',
          required: false,
          values: ['Contínuo', 'Diário', 'Semanal', 'Mensal', 'Por lote'],
          maxSelect: 1,
        },
        { name: 'responsavel', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Ativo', 'Revisão', 'Arquivado'],
          maxSelect: 1,
        },
        { name: 'area_etapa', type: 'text', required: false },
        { name: 'objetivo', type: 'text', required: false },
        { name: 'perigos_relacionados', type: 'text', required: false },
        { name: 'medidas_preventivas', type: 'text', required: false },
        { name: 'referencia_in', type: 'text', required: false },
        { name: 'data_revisao', type: 'date', required: false },
        { name: 'validade', type: 'date', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_procedures_codigo ON procedures (codigo)',
        'CREATE INDEX idx_procedures_categoria ON procedures (categoria)',
        'CREATE INDEX idx_procedures_status ON procedures (status)',
      ],
    })
    app.save(procedures)

    const proceduresId = procedures.id

    // 3. records
    const records = new Collection({
      name: 'records',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'procedure',
          type: 'relation',
          required: true,
          collectionId: proceduresId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'data', type: 'date', required: true },
        {
          name: 'turno',
          type: 'select',
          required: false,
          values: ['Manhã', 'Tarde', 'Noite'],
          maxSelect: 1,
        },
        { name: 'valor_medido', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Conforme', 'Não Conforme'],
          maxSelect: 1,
        },
        { name: 'responsavel', type: 'text', required: false },
        { name: 'observacoes', type: 'text', required: false },
        { name: 'lote', type: 'text', required: false },
        {
          name: 'anexos',
          type: 'file',
          required: false,
          maxSelect: 5,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_records_procedure ON records (procedure)',
        'CREATE INDEX idx_records_data ON records (data)',
        'CREATE INDEX idx_records_status ON records (status)',
      ],
    })
    app.save(records)

    const recordsId = records.id

    // 4. audits
    const audits = new Collection({
      name: 'audits',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'data', type: 'date', required: false },
        {
          name: 'tipo',
          type: 'select',
          required: false,
          values: ['Interna', 'Externa'],
          maxSelect: 1,
        },
        { name: 'area_processo', type: 'text', required: false },
        { name: 'auditor', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Programada', 'Em Andamento', 'Concluída'],
          maxSelect: 1,
        },
        { name: 'escopo', type: 'editor', required: false },
        { name: 'checklist', type: 'json', required: false },
        {
          name: 'conclusao',
          type: 'select',
          required: false,
          values: ['Conforme', 'Conforme com Ressalvas', 'Não Conforme'],
          maxSelect: 1,
        },
        { name: 'relatorio_achados', type: 'text', required: false },
        { name: 'assinaturas', type: 'json', required: false },
        { name: 'plano_anual', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_audits_codigo ON audits (codigo)',
        'CREATE INDEX idx_audits_status ON audits (status)',
        'CREATE INDEX idx_audits_data ON audits (data)',
      ],
    })
    app.save(audits)

    const auditsId = audits.id

    // 5. audit_evidence
    const auditEvidence = new Collection({
      name: 'audit_evidence',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'audit',
          type: 'relation',
          required: true,
          collectionId: auditsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'item_numero', type: 'text', required: false },
        { name: 'descricao', type: 'text', required: false },
        {
          name: 'arquivo',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 10485760,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_audit_evidence_audit ON audit_evidence (audit)'],
    })
    app.save(auditEvidence)

    // 6. non_conformities
    const nonConformities = new Collection({
      name: 'non_conformities',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text', required: true },
        { name: 'descricao', type: 'text', required: true },
        {
          name: 'classificacao',
          type: 'select',
          required: false,
          values: ['Crítica', 'Maior', 'Menor'],
          maxSelect: 1,
        },
        {
          name: 'origem',
          type: 'select',
          required: false,
          values: ['Auditoria', 'Registro', 'Reclamação', 'Recall'],
          maxSelect: 1,
        },
        { name: 'area', type: 'text', required: false },
        { name: 'data_identificacao', type: 'date', required: true },
        { name: 'prazo', type: 'date', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Aberta', 'Em Andamento', 'Fechada'],
          maxSelect: 1,
        },
        { name: 'responsavel', type: 'text', required: false },
        { name: 'plano_acao', type: 'text', required: false },
        { name: 'prazo_acao', type: 'date', required: false },
        { name: 'responsavel_acao', type: 'text', required: false },
        { name: 'recursos', type: 'text', required: false },
        { name: 'medidas_preventivas', type: 'text', required: false },
        { name: 'indicador_eficacia', type: 'text', required: false },
        { name: 'causa_raiz', type: 'json', required: false },
        {
          name: 'execucao_evidencias',
          type: 'file',
          required: false,
          maxSelect: 5,
          maxSize: 10485760,
        },
        { name: 'data_execucao', type: 'date', required: false },
        { name: 'verificacao_responsavel', type: 'text', required: false },
        { name: 'data_verificacao', type: 'date', required: false },
        {
          name: 'eficaz',
          type: 'select',
          required: false,
          values: ['Eficaz', 'Não Eficaz'],
          maxSelect: 1,
        },
        { name: 'resultado_verificacao', type: 'text', required: false },
        { name: 'lote', type: 'text', required: false },
        {
          name: 'audit',
          type: 'relation',
          required: false,
          collectionId: auditsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'procedure',
          type: 'relation',
          required: false,
          collectionId: proceduresId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          name: 'record',
          type: 'relation',
          required: false,
          collectionId: recordsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_nc_codigo ON non_conformities (codigo)',
        'CREATE INDEX idx_nc_status ON non_conformities (status)',
        'CREATE INDEX idx_nc_classificacao ON non_conformities (classificacao)',
        'CREATE INDEX idx_nc_data ON non_conformities (data_identificacao)',
        'CREATE INDEX idx_nc_lote ON non_conformities (lote)',
      ],
    })
    app.save(nonConformities)

    // 7. traceability_tests
    const traceabilityTests = new Collection({
      name: 'traceability_tests',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'lote', type: 'text', required: true },
        { name: 'data_teste', type: 'date', required: false },
        {
          name: 'tipo',
          type: 'select',
          required: false,
          values: ['Rastreabilidade', 'Recall'],
          maxSelect: 1,
        },
        { name: 'tempo_rastreamento', type: 'text', required: false },
        { name: 'comunicacao_clientes', type: 'text', required: false },
        { name: 'localizacao_produtos', type: 'text', required: false },
        {
          name: 'resultado',
          type: 'select',
          required: false,
          values: ['Aprovado', 'Falhou', 'Em Análise'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_trace_lote ON traceability_tests (lote)'],
    })
    app.save(traceabilityTests)

    // 8. trainings
    const trainings = new Collection({
      name: 'trainings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo', type: 'text', required: false },
        { name: 'tema', type: 'text', required: true },
        { name: 'data', type: 'date', required: false },
        { name: 'instrutor', type: 'text', required: false },
        { name: 'participantes', type: 'json', required: false },
        { name: 'carga_horaria', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Concluído', 'Agendado'],
          maxSelect: 1,
        },
        { name: 'eficacia_verificada', type: 'bool', required: false },
        {
          name: 'evidencia',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 10485760,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(trainings)

    // 9. documents
    const documents = new Collection({
      name: 'documents',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo_arquivo',
          type: 'file',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
        },
        {
          name: 'categoria',
          type: 'select',
          required: false,
          values: ['Plano APPCC', 'Manual BPF', 'POP', 'Registro', 'Ação Corretiva', 'Verificação'],
          maxSelect: 1,
        },
        {
          name: 'referencia_pop',
          type: 'select',
          required: false,
          values: [
            'POP-001',
            'POP-002',
            'POP-003',
            'POP-004',
            'POP-005',
            'POP-006',
            'POP-007',
            'POP-008',
            'POP-009',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(documents)
  },
  (app) => {
    const toDelete = [
      'documents',
      'trainings',
      'traceability_tests',
      'non_conformities',
      'audit_evidence',
      'audits',
      'records',
      'procedures',
    ]
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
