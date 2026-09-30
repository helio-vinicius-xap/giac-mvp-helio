migrate(
  (app) => {
    let orgsId = ''
    try {
      const orgsCol = app.findCollectionByNameOrId('organizations')
      orgsId = orgsCol.id
    } catch (_) {}

    let qualifsId = ''
    try {
      const qualifsCol = app.findCollectionByNameOrId('qualificacoes')
      qualifsId = qualifsCol.id
    } catch (_) {}

    // Coleção global de Fornecedores Validados do sistema
    // listRule e viewRule: todos os usuários autenticados podem ler
    // createRule, updateRule, deleteRule: super_admin (e hooks/código do sistema)
    const readRule = "@request.auth.id != ''"
    const adminRule = "@request.auth.role = 'super_admin'"

    let validadosCol
    try {
      validadosCol = app.findCollectionByNameOrId('fornecedores_validados')
    } catch (_) {
      validadosCol = new Collection({
        name: 'fornecedores_validados',
        type: 'base',
        listRule: readRule,
        viewRule: readRule,
        createRule: adminRule,
        updateRule: adminRule,
        deleteRule: adminRule,
        fields: [
          { name: 'cnpj', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          { name: 'registro_sipeagro', type: 'text', required: false },
          { name: 'situacao', type: 'text', required: false }, // 'ATIVO'
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
          { name: 'categoria_de_risco', type: 'text', required: false }, // Classificação proporcional ao risco/tipo de produto
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['VALIDADO', 'EXPIRADO'],
            maxSelect: 1,
          },
          { name: 'data_aprovacao', type: 'date', required: false },
          { name: 'validade_aprovacao', type: 'date', required: false }, // data_aprovacao + 1 ano
          { name: 'score_aprovacao', type: 'number', required: false, min: 0, max: 100 },
          {
            name: 'origem_organizacao',
            type: 'relation',
            required: false,
            collectionId: orgsId || undefined,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'origem_organizacao_nome', type: 'text', required: false },
          {
            name: 'origem_qualificacao',
            type: 'relation',
            required: false,
            collectionId: qualifsId || undefined,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'total_utilizacoes', type: 'number', required: false, min: 0 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_forn_validados_cnpj ON fornecedores_validados (cnpj)',
          'CREATE INDEX idx_forn_validados_status ON fornecedores_validados (status)',
          'CREATE INDEX idx_forn_validados_uf ON fornecedores_validados (uf)',
          'CREATE INDEX idx_forn_validados_cat ON fornecedores_validados (categoria)',
          'CREATE INDEX idx_forn_validados_validade ON fornecedores_validados (validade_aprovacao)',
        ],
      })
      app.save(validadosCol)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('fornecedores_validados')
      app.delete(col)
    } catch (_) {}
  },
)
