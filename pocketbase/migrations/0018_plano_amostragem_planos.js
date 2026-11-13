// Plano de Amostragem — planos por produto/insumo, parâmetros com limites e bloqueio de lote
migrate(
  (app) => {
    const orgsId = app.findCollectionByNameOrId('organizations').id

    const rlsRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"

    const orgField = {
      name: 'organization',
      type: 'relation',
      required: false,
      collectionId: orgsId,
      maxSelect: 1,
      cascadeDelete: true,
    }
    const autos = [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    const makeCol = (name, fields) => {
      try {
        return app.findCollectionByNameOrId(name)
      } catch (_) {
        const col = new Collection({
          name,
          type: 'base',
          listRule: rlsRule,
          viewRule: rlsRule,
          createRule: rlsRule,
          updateRule: rlsRule,
          deleteRule: rlsRule,
          fields: [orgField, ...fields, ...autos],
          indexes: [],
        })
        app.save(col)
        return col
      }
    }

    // Plano de amostragem por produto acabado ou matéria-prima (vinculado a fornecedor homologado POP 01)
    makeCol('pa_planos', [
      { name: 'codigo', type: 'text', required: true },
      { name: 'nome', type: 'text', required: true },
      {
        name: 'vinculo_tipo',
        type: 'select',
        required: true,
        values: ['MateriaPrima', 'Produto'],
        maxSelect: 1,
      },
      { name: 'produto_nome', type: 'text', required: false },
      { name: 'materia_prima_nome', type: 'text', required: false },
      { name: 'fornecedor_id', type: 'text', required: false },
      { name: 'fornecedor_nome', type: 'text', required: false },
      {
        name: 'frequencia',
        type: 'select',
        required: true,
        values: ['por_lote', 'diaria', 'semanal', 'mensal'],
        maxSelect: 1,
      },
      { name: 'tamanho_amostra', type: 'number', required: false },
      { name: 'regra_coleta', type: 'text', required: false },
      { name: 'ponto_coleta', type: 'text', required: false },
      {
        name: 'tipo_amostra',
        type: 'select',
        required: false,
        values: ['Simples', 'Composta', 'Testemunha'],
        maxSelect: 1,
      },
      { name: 'conservacao', type: 'text', required: false },
      { name: 'prazo_analise', type: 'text', required: false },
      { name: 'observacoes', type: 'text', required: false },
      { name: 'is_ativo', type: 'bool', required: false },
    ])

    // Parâmetros do plano com limites aceitáveis (ex.: proteína, umidade, micotoxinas, Salmonella)
    makeCol('pa_parametros', [
      { name: 'plano_id', type: 'text', required: true },
      { name: 'nome', type: 'text', required: true },
      { name: 'unidade', type: 'text', required: false },
      { name: 'limite_min', type: 'text', required: false },
      { name: 'limite_max', type: 'text', required: false },
      { name: 'limite_texto', type: 'text', required: false },
      { name: 'metodo_analise', type: 'text', required: false },
      { name: 'norma_referencia', type: 'text', required: false },
      { name: 'ordem', type: 'number', required: false },
    ])

    // Bloqueio de lote na colheita quando o laudo reprova (usado pela Rastreabilidade)
    const colheitas = app.findCollectionByNameOrId('pa_colheitas')
    const campos = colheitas.fields
    const tem = (n) => campos.some((f) => f.name === n)
    if (!tem('plano_id')) {
      colheitas.fields.push({ name: 'plano_id', type: 'text', required: false })
    }
    if (!tem('lote_bloqueado')) {
      colheitas.fields.push({ name: 'lote_bloqueado', type: 'bool', required: false })
    }
    app.save(colheitas)
  },
  (app) => {
    for (const name of ['pa_parametros', 'pa_planos']) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
    try {
      const colheitas = app.findCollectionByNameOrId('pa_colheitas')
      colheitas.fields = colheitas.fields.filter(
        (f) => f.name !== 'plano_id' && f.name !== 'lote_bloqueado',
      )
      app.save(colheitas)
    } catch (_) {}
  },
)
