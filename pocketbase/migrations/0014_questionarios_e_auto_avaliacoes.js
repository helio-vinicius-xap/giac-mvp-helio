migrate(
  (app) => {
    const orgsCol = app.findCollectionByNameOrId('organizations')
    const orgsId = orgsCol.id

    const rlsRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"

    // 1. questionarios_fornecedor (Definição dinâmica de perguntas do formulário por organização, importadas via .xlsx)
    let questCol
    try {
      questCol = app.findCollectionByNameOrId('questionarios_fornecedor')
    } catch (_) {
      questCol = new Collection({
        name: 'questionarios_fornecedor',
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
          { name: 'codigo', type: 'text', required: true }, // ex: POP 01-AC01
          { name: 'titulo', type: 'text', required: true },
          { name: 'versao_revisao', type: 'text', required: false }, // ex: Rev.01
          { name: 'arquivo_origem', type: 'text', required: false },
          { name: 'perguntas', type: 'json', required: true }, // Lista de 20 perguntas lidas da planilha
          { name: 'limiar_aprovacao', type: 'number', required: false, min: 0, max: 100 }, // limiar configurável ex 70
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_quest_forn_org ON questionarios_fornecedor (organization)',
          'CREATE INDEX idx_quest_forn_codigo ON questionarios_fornecedor (codigo)',
        ],
      })
      app.save(questCol)
    }

    // 2. auto_avaliacoes_fornecedor (Registros de Auto Avaliação do Fornecedor gerados pelo formulário)
    let autoCol
    try {
      autoCol = app.findCollectionByNameOrId('auto_avaliacoes_fornecedor')
    } catch (_) {
      autoCol = new Collection({
        name: 'auto_avaliacoes_fornecedor',
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
          { name: 'numero_registro', type: 'text', required: true }, // ex: PAC-01_R0001
          { name: 'fornecedor_cnpj', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          { name: 'nome_fantasia', type: 'text', required: false },
          { name: 'data_avaliacao', type: 'date', required: true },
          // Cabeçalho documental
          { name: 'codigo_doc', type: 'text', required: false }, // POP 01-AC01
          { name: 'data_elaboracao', type: 'date', required: false },
          { name: 'data_edicao', type: 'date', required: false },
          { name: 'revisao_doc', type: 'text', required: false }, // Rev.01
          // Dados cadastrais completos
          { name: 'dados_cadastrais', type: 'json', required: false },
          // Tipo de Fornecedor & Qualidade
          { name: 'tipo_fornecedor', type: 'json', required: false },
          // Respostas do questionário (20 itens com c, nc, na, arquivo)
          { name: 'respostas', type: 'json', required: false },
          // Totais e Nota
          { name: 'total_c', type: 'number', required: false },
          { name: 'total_nc', type: 'number', required: false },
          { name: 'total_na', type: 'number', required: false },
          { name: 'nota_final', type: 'number', required: false }, // % ex 60
          {
            name: 'avaliacao_final',
            type: 'select',
            required: true,
            values: ['APROVADO', 'REPROVADO', 'PENDENTE'],
            maxSelect: 1,
          },
          { name: 'observacoes', type: 'text', required: false },
          // Assinaturas e hierarquia
          { name: 'assinaturas', type: 'json', required: false },
          { name: 'status_assinatura', type: 'text', required: false },
          { name: 'acao_corretiva_vinculada', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_auto_aval_org ON auto_avaliacoes_fornecedor (organization)',
          'CREATE INDEX idx_auto_aval_num ON auto_avaliacoes_fornecedor (numero_registro)',
          'CREATE INDEX idx_auto_aval_cnpj ON auto_avaliacoes_fornecedor (fornecedor_cnpj)',
          'CREATE INDEX idx_auto_aval_status ON auto_avaliacoes_fornecedor (avaliacao_final)',
        ],
      })
      app.save(autoCol)
    }
  },
  (app) => {
    try {
      const autoCol = app.findCollectionByNameOrId('auto_avaliacoes_fornecedor')
      app.delete(autoCol)
    } catch (_) {}
    try {
      const questCol = app.findCollectionByNameOrId('questionarios_fornecedor')
      app.delete(questCol)
    } catch (_) {}
  },
)
