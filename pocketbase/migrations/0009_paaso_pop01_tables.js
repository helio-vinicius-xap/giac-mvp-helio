migrate(
  (app) => {
    const orgsCol = app.findCollectionByNameOrId('organizations')
    const orgsId = orgsCol.id

    const rlsRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"

    // 1. sipeagro (Base oficial importada do MAPA por organização)
    let sipeagroCol
    try {
      sipeagroCol = app.findCollectionByNameOrId('sipeagro')
    } catch (_) {
      sipeagroCol = new Collection({
        name: 'sipeagro',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          { name: 'registro_sipeagro', type: 'text', required: false },
          { name: 'situacao', type: 'text', required: true }, // 'ATIVO'
          { name: 'uf', type: 'text', required: false },
          { name: 'municipio', type: 'text', required: false },
          {
            name: 'categoria',
            type: 'select',
            required: false,
            values: ['fabricante', 'fracionador', 'importador', 'armazenador'],
            maxSelect: 1,
          },
          { name: 'tipos_produto', type: 'json', required: false },
          { name: 'arquivo_origem', type: 'text', required: false },
          { name: 'importado_em', type: 'date', required: false },
          { name: 'is_exemplo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_sipeagro_org ON sipeagro (organization)',
          'CREATE INDEX idx_sipeagro_cnpj ON sipeagro (cnpj)',
          'CREATE INDEX idx_sipeagro_uf ON sipeagro (uf)',
          'CREATE INDEX idx_sipeagro_cat ON sipeagro (categoria)',
        ],
      })
      app.save(sipeagroCol)
    }

    // 2. fornecedores (Fornecedores cadastrados da organização)
    let fornecedoresCol
    try {
      fornecedoresCol = app.findCollectionByNameOrId('fornecedores')
    } catch (_) {
      fornecedoresCol = new Collection({
        name: 'fornecedores',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          { name: 'contato_nome', type: 'text', required: false },
          { name: 'email', type: 'text', required: false },
          { name: 'telefone', type: 'text', required: false },
          { name: 'uf', type: 'text', required: false },
          { name: 'municipio', type: 'text', required: false },
          { name: 'criado_em', type: 'date', required: false },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'is_exemplo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_fornecedores_org ON fornecedores (organization)',
          'CREATE INDEX idx_fornecedores_cnpj ON fornecedores (cnpj)',
          'CREATE INDEX idx_fornecedores_razao ON fornecedores (razao_social)',
        ],
      })
      app.save(fornecedoresCol)
    }

    // 3. qualificacoes (Qualificações com score e cruzamento automatizado)
    let qualificacoesCol
    try {
      qualificacoesCol = app.findCollectionByNameOrId('qualificacoes')
    } catch (_) {
      qualificacoesCol = new Collection({
        name: 'qualificacoes',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'fornecedor_cnpj', type: 'text', required: true },
          { name: 'data_formulario', type: 'date', required: true },
          { name: 'dados_declarados', type: 'json', required: false },
          {
            name: 'resultado',
            type: 'select',
            required: true,
            values: ['APROVADO', 'APROVADO_COM_RESSALVA', 'REPROVADO', 'PENDENTE_REVISAO'],
            maxSelect: 1,
          },
          { name: 'score', type: 'number', required: false, min: 0, max: 100 },
          { name: 'divergencias', type: 'json', required: false },
          { name: 'validade', type: 'date', required: false },
          {
            name: 'status_vigencia',
            type: 'select',
            required: true,
            values: ['VIGENTE', 'VENCIDA'],
            maxSelect: 1,
          },
          { name: 'is_exemplo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_qualificacoes_org ON qualificacoes (organization)',
          'CREATE INDEX idx_qualificacoes_cnpj ON qualificacoes (fornecedor_cnpj)',
          'CREATE INDEX idx_qualificacoes_status ON qualificacoes (status_vigencia)',
          'CREATE INDEX idx_qualificacoes_resultado ON qualificacoes (resultado)',
        ],
      })
      app.save(qualificacoesCol)
    }

    // 4. devolucoes
    let devolucoesCol
    try {
      devolucoesCol = app.findCollectionByNameOrId('devolucoes')
    } catch (_) {
      devolucoesCol = new Collection({
        name: 'devolucoes',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'data', type: 'date', required: true },
          { name: 'fornecedor_cnpj', type: 'text', required: true },
          { name: 'produto', type: 'text', required: true },
          { name: 'lote', type: 'text', required: false },
          { name: 'motivo', type: 'text', required: true },
          { name: 'quantidade', type: 'number', required: false },
          { name: 'valor', type: 'number', required: false },
          { name: 'status', type: 'text', required: false },
          { name: 'is_exemplo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_devolucoes_org ON devolucoes (organization)',
          'CREATE INDEX idx_devolucoes_cnpj ON devolucoes (fornecedor_cnpj)',
          'CREATE INDEX idx_devolucoes_data ON devolucoes (data)',
        ],
      })
      app.save(devolucoesCol)
    }

    // 5. nao_conformidades_fornecedor
    let ncFornCol
    try {
      ncFornCol = app.findCollectionByNameOrId('nao_conformidades_fornecedor')
    } catch (_) {
      ncFornCol = new Collection({
        name: 'nao_conformidades_fornecedor',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'data', type: 'date', required: true },
          { name: 'fornecedor_cnpj', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: true },
          {
            name: 'severidade',
            type: 'select',
            required: true,
            values: ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'],
            maxSelect: 1,
          },
          { name: 'acao_corretiva', type: 'text', required: false },
          { name: 'prazo', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ABERTA', 'EM_TRATAMENTO', 'ENCERRADA'],
            maxSelect: 1,
          },
          { name: 'is_exemplo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nc_forn_org ON nao_conformidades_fornecedor (organization)',
          'CREATE INDEX idx_nc_forn_cnpj ON nao_conformidades_fornecedor (fornecedor_cnpj)',
          'CREATE INDEX idx_nc_forn_status ON nao_conformidades_fornecedor (status)',
          'CREATE INDEX idx_nc_forn_prazo ON nao_conformidades_fornecedor (prazo)',
        ],
      })
      app.save(ncFornCol)
    }

    // 6. auditoria_importacoes
    let auditImpCol
    try {
      auditImpCol = app.findCollectionByNameOrId('auditoria_importacoes')
    } catch (_) {
      auditImpCol = new Collection({
        name: 'auditoria_importacoes',
        type: 'base',
        listRule: rlsRule,
        viewRule: rlsRule,
        createRule: rlsRule,
        updateRule: rlsRule,
        deleteRule: rlsRule,
        fields: [
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'data_hora', type: 'date', required: true },
          { name: 'arquivo_origem', type: 'text', required: false },
          { name: 'total_linhas', type: 'number', required: false },
          { name: 'total_ativos', type: 'number', required: false },
          { name: 'novos_cnpj', type: 'number', required: false },
          { name: 'inativados_cnpj', type: 'json', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['SUCESSO', 'ERRO'],
            maxSelect: 1,
          },
          { name: 'mensagem', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_audit_imp_org ON auditoria_importacoes (organization)',
          'CREATE INDEX idx_audit_imp_data ON auditoria_importacoes (data_hora)',
        ],
      })
      app.save(auditImpCol)
    }
  },
  (app) => {
    const list = [
      'auditoria_importacoes',
      'nao_conformidades_fornecedor',
      'devolucoes',
      'qualificacoes',
      'fornecedores',
      'sipeagro',
    ]
    for (let i = 0; i < list.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(list[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
