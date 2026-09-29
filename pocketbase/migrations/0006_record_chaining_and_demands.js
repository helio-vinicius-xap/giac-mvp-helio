migrate(
  (app) => {
    const records = app.findCollectionByNameOrId('records')

    // 1. Campo de encadeamento: registro anterior (referência simples / id ou código)
    if (!records.fields.getByName('registro_anterior')) {
      records.fields.add(
        new TextField({
          name: 'registro_anterior',
          required: false,
        }),
      )
    }

    // 2. Campo de encadeamento: registros seguintes exigidos e links gerados (JSON)
    if (!records.fields.getByName('registros_seguintes')) {
      records.fields.add(
        new JSONField({
          name: 'registros_seguintes',
          required: false,
        }),
      )
    }

    // 3. Campo identificando se este registro foi gerado por demanda do cliente (ou automático da cadeia)
    // Valores: 'sistema_automatico' | 'demanda_cliente_formulario' | 'demanda_cliente_anexo'
    if (!records.fields.getByName('origem_registro')) {
      records.fields.add(
        new SelectField({
          name: 'origem_registro',
          required: false,
          values: ['sistema_automatico', 'demanda_cliente_formulario', 'demanda_cliente_anexo'],
          maxSelect: 1,
        }),
      )
    }

    // 4. Status de execução do registro na cadeia:
    // 'Pendente' | 'Em Preenchimento' | 'Preenchido' | 'Cancelado'
    if (!records.fields.getByName('status_execucao')) {
      records.fields.add(
        new SelectField({
          name: 'status_execucao',
          required: false,
          values: ['Pendente', 'Em Preenchimento', 'Preenchido', 'Cancelado'],
          maxSelect: 1,
        }),
      )
    }

    // 5. Dados do aviso de pendência (se criado pelo sistema ou customizado pelo cliente)
    if (!records.fields.getByName('aviso_pendencia')) {
      records.fields.add(
        new JSONField({
          name: 'aviso_pendencia',
          required: false,
        }),
      )
    }

    app.save(records)
  },
  (app) => {
    // Reverter campos de encadeamento se necessário
    const records = app.findCollectionByNameOrId('records')
    const fieldsToRemove = [
      'registro_anterior',
      'registros_seguintes',
      'origem_registro',
      'status_execucao',
      'aviso_pendencia',
    ]
    for (const f of fieldsToRemove) {
      if (records.fields.getByName(f)) {
        records.fields.removeByName(f)
      }
    }
    app.save(records)
  },
)
