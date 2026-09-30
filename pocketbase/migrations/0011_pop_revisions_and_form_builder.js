migrate(
  (app) => {
    const orgsCol = app.findCollectionByNameOrId('organizations')
    const orgsId = orgsCol.id
    const procsCol = app.findCollectionByNameOrId('procedures')
    const procsId = procsCol.id

    // 1. Criar coleção procedure_revisions (Histórico de revisões de texto normativo do POP)
    if (!app.hasTable('procedure_revisions')) {
      const revsCol = new Collection({
        name: 'procedure_revisions',
        type: 'base',
        listRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        viewRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        createRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        updateRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'RE' || @request.auth.role = 'RT'))",
        deleteRule: "@request.auth.role = 'super_admin'",
        fields: [
          {
            name: 'procedure',
            type: 'relation',
            required: true,
            collectionId: procsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'versao', type: 'text', required: true },
          { name: 'descricao_alteracao', type: 'text', required: false },
          { name: 'autor_nome', type: 'text', required: false },
          { name: 'autor_email', type: 'text', required: false },
          { name: 'autor_role', type: 'text', required: false },
          { name: 'secoes_normativas', type: 'json', required: false },
          { name: 'campos_execucao', type: 'json', required: false },
          { name: 'texto_completo', type: 'text', required: false },
          { name: 'restaurado_de', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_proc_rev_proc ON procedure_revisions (procedure)',
          'CREATE INDEX idx_proc_rev_org ON procedure_revisions (organization)',
          'CREATE INDEX idx_proc_rev_created ON procedure_revisions (created DESC)',
        ],
      })
      app.save(revsCol)
    }

    // 2. Criar coleção pop_custom_forms (Formulários digitais criados pelo cliente por POP)
    if (!app.hasTable('pop_custom_forms')) {
      const formsCol = new Collection({
        name: 'pop_custom_forms',
        type: 'base',
        listRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        viewRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        createRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        updateRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)",
        deleteRule:
          "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'RE' || @request.auth.role = 'RT'))",
        fields: [
          {
            name: 'procedure',
            type: 'relation',
            required: true,
            collectionId: procsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'organization',
            type: 'relation',
            required: false,
            collectionId: orgsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'codigo', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: false },
          { name: 'frequencia', type: 'text', required: false },
          { name: 'campos', type: 'json', required: true },
          { name: 'regras_limites', type: 'json', required: false },
          { name: 'criado_por_nome', type: 'text', required: false },
          { name: 'obrigatorio_na_cadeia', type: 'bool', required: false },
          { name: 'gera_pendencia', type: 'bool', required: false },
          { name: 'is_ativo', type: 'bool', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_pop_forms_proc ON pop_custom_forms (procedure)',
          'CREATE INDEX idx_pop_forms_org ON pop_custom_forms (organization)',
          'CREATE INDEX idx_pop_forms_cod ON pop_custom_forms (codigo)',
        ],
      })
      app.save(formsCol)
    }

    // 3. Atualizar collection procedures com texto_normativo_custom (caso queira salvar o texto normativo geral direto no registro)
    try {
      const procCol = app.findCollectionByNameOrId('procedures')
      if (!procCol.fields.getByName('texto_normativo_custom')) {
        procCol.fields.add(
          new TextField({
            name: 'texto_normativo_custom',
            required: false,
          }),
        )
      }
      if (!procCol.fields.getByName('numero_revisao')) {
        procCol.fields.add(
          new NumberField({
            name: 'numero_revisao',
            required: false,
          }),
        )
      }
      app.save(procCol)
    } catch (_) {}
  },
  (app) => {
    try {
      const revs = app.findCollectionByNameOrId('procedure_revisions')
      app.delete(revs)
    } catch (_) {}
    try {
      const forms = app.findCollectionByNameOrId('pop_custom_forms')
      app.delete(forms)
    } catch (_) {}
  },
)
