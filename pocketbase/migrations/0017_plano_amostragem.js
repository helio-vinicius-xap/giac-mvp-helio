// Plano de Amostragem (corpo do plano, Anexos I a V) — coleções pa_* isoladas por organização
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

    // Registros comprovados não podem ser excluídos (IN 04/2007)
    const makeCol = (name, fields, deleteRule) => {
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
          deleteRule: deleteRule || rlsRule,
          fields: [orgField, ...fields, ...autos],
          indexes: [],
        })
        app.save(col)
        return col
      }
    }

    const nivelValues = ['ALTA', 'MEDIA', 'BAIXA']
    const statusProtegido = `(${rlsRule}) && status != 'Comprovado'`

    makeCol('pa_secoes', [
      { name: 'ordem', type: 'number', required: false },
      { name: 'titulo', type: 'text', required: true },
      { name: 'conteudo', type: 'text', required: false },
    ])

    // Anexo I (perigos por etapa) e Anexo II (matriz de risco) na mesma linha etapa+perigo
    makeCol('pa_matriz_risco', [
      { name: 'ordem', type: 'number', required: false },
      { name: 'etapa', type: 'text', required: true },
      { name: 'perigo', type: 'text', required: true },
      { name: 'significativo', type: 'select', required: false, values: ['S', 'N'], maxSelect: 1 },
      { name: 'medida_preventiva', type: 'text', required: false },
      { name: 'ponto_amostragem', type: 'text', required: false },
      { name: 'parametro', type: 'text', required: false },
      { name: 'frequencia_controle', type: 'text', required: false },
      { name: 'registro', type: 'text', required: false },
      { name: 'acao_desvio', type: 'text', required: false },
      { name: 'severidade', type: 'select', required: false, values: nivelValues, maxSelect: 1 },
      { name: 'probabilidade', type: 'select', required: false, values: nivelValues, maxSelect: 1 },
      { name: 'pontuacao', type: 'number', required: false },
      {
        name: 'classe',
        type: 'select',
        required: false,
        values: ['ALTO', 'MEDIO', 'BAIXO'],
        maxSelect: 1,
      },
      { name: 'frequencia', type: 'text', required: false },
      { name: 'justificativa', type: 'text', required: false },
      { name: 'data_revisao', type: 'date', required: false },
    ])

    // Anexo IV — resumo executivo de frequências
    makeCol('pa_frequencias', [
      { name: 'ordem', type: 'number', required: false },
      { name: 'grupo', type: 'text', required: true },
      { name: 'parametro', type: 'text', required: true },
      { name: 'frequencia', type: 'text', required: false },
      { name: 'classe', type: 'select', required: false, values: ['ALTO', 'MEDIO', 'BAIXO'], maxSelect: 1 },
      { name: 'responsavel', type: 'text', required: false },
      { name: 'registro', type: 'text', required: false },
      { name: 'meses', type: 'json', required: false },
    ])

    // Anexo III — grade de sensibilidade
    makeCol('pa_grade_sensibilidade', [
      { name: 'perigo', type: 'text', required: true },
      { name: 'especie_sensivel', type: 'text', required: false },
      { name: 'motivo', type: 'text', required: false },
      { name: 'criterio', type: 'text', required: false },
      { name: 'acao', type: 'text', required: false },
      { name: 'base_legal', type: 'text', required: false },
    ])

    // Anexo III — registro de sequenciamento (data, hora início e fim obrigatórios)
    makeCol(
      'pa_sequenciamentos',
      [
        { name: 'data', type: 'date', required: true },
        { name: 'hora_inicio', type: 'text', required: true },
        { name: 'hora_fim', type: 'text', required: true },
        { name: 'ordem_producao', type: 'text', required: false },
        { name: 'produto', type: 'text', required: true },
        { name: 'especie_destino', type: 'text', required: false },
        { name: 'contem_perigo_restritivo', type: 'bool', required: false },
        { name: 'produto_anterior', type: 'text', required: false },
        { name: 'atende_grade', type: 'select', required: false, values: ['C', 'NC'], maxSelect: 1 },
        { name: 'houve_limpeza_linha', type: 'bool', required: false },
        { name: 'material_quantidade', type: 'text', required: false },
        { name: 'responsavel', type: 'text', required: false },
        { name: 'conferente', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Pendente', 'Assinado', 'Comprovado'],
          maxSelect: 1,
        },
      ],
      statusProtegido,
    )

    // Anexo III — registro de limpeza de linha e destinação do material
    makeCol(
      'pa_limpezas_linha',
      [
        { name: 'data', type: 'date', required: true },
        { name: 'hora', type: 'text', required: true },
        { name: 'linha', type: 'text', required: false },
        { name: 'produto_anterior', type: 'text', required: false },
        { name: 'produto_seguinte', type: 'text', required: false },
        { name: 'metodo', type: 'select', required: false, values: ['Arraste', 'Flushing', 'Outro'], maxSelect: 1 },
        { name: 'material', type: 'text', required: false },
        { name: 'quantidade_utilizada', type: 'text', required: false },
        { name: 'quantidade_validada', type: 'text', required: false },
        { name: 'verificacao_analitica', type: 'bool', required: false },
        { name: 'laudo_verificacao', type: 'text', required: false },
        { name: 'destino_material', type: 'text', required: false },
        { name: 'criterio_reprocesso', type: 'bool', required: false },
        { name: 'responsavel', type: 'text', required: false },
        { name: 'conferente', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Pendente', 'Assinado', 'Comprovado'],
          maxSelect: 1,
        },
      ],
      statusProtegido,
    )

    // Anexo V — ficha de colheita, cadeia de custódia e avaliação crítica do laudo
    makeCol(
      'pa_colheitas',
      [
        { name: 'numero', type: 'text', required: true },
        { name: 'data', type: 'date', required: true },
        { name: 'hora', type: 'text', required: true },
        { name: 'matriz', type: 'text', required: false },
        { name: 'produto', type: 'text', required: true },
        { name: 'fornecedor_id', type: 'text', required: false },
        { name: 'fornecedor_nome', type: 'text', required: false },
        { name: 'fornecedor_situacao', type: 'text', required: false },
        { name: 'nota_fiscal', type: 'text', required: false },
        { name: 'lote_interno', type: 'text', required: false },
        { name: 'lote_fornecedor', type: 'text', required: false },
        { name: 'ponto_colheita', type: 'text', required: false },
        {
          name: 'tipo_amostra',
          type: 'select',
          required: false,
          values: ['Monitoramento', 'Verificação', 'Retenção', 'Contraprova'],
          maxSelect: 1,
        },
        { name: 'parametros', type: 'text', required: false },
        { name: 'laboratorio', type: 'text', required: false },
        { name: 'incrementos', type: 'number', required: false },
        { name: 'massa_amostra', type: 'text', required: false },
        { name: 'cadeia_custodia', type: 'json', required: false },
        { name: 'responsavel_colheita', type: 'text', required: false },
        { name: 'conferente', type: 'text', required: false },
        { name: 'laudo', type: 'json', required: false },
        { name: 'nc_id', type: 'text', required: false },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Colhida', 'Laudo avaliado', 'Comprovado'],
          maxSelect: 1,
        },
      ],
      statusProtegido,
    )
  },
  (app) => {
    for (const name of [
      'pa_colheitas',
      'pa_limpezas_linha',
      'pa_sequenciamentos',
      'pa_grade_sensibilidade',
      'pa_frequencias',
      'pa_matriz_risco',
      'pa_secoes',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
