migrate(
  (app) => {
    // 1. Atualizar users com campo role estruturado e dados profissionais
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['RT', 'RQ', 'RE', 'admin', 'operador', 'auditor'],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('conselho_classe')) {
      users.fields.add(new TextField({ name: 'conselho_classe', required: false }))
    }
    if (!users.fields.getByName('cpf')) {
      users.fields.add(new TextField({ name: 'cpf', required: false }))
    }
    if (!users.fields.getByName('telefone')) {
      users.fields.add(new TextField({ name: 'telefone', required: false }))
    }
    app.save(users)

    // Atualizar usuário seed helio@dpharma.com.br com role RT
    try {
      const helio = app.findAuthRecordByEmail('_pb_users_auth_', 'helio@dpharma.com.br')
      helio.set('role', 'RT')
      helio.set('cargo', 'Responsável Técnico')
      helio.set('conselho_classe', 'CRMV-SP 18.420')
      app.save(helio)
    } catch (_) {}

    // 2. Criar coleção company (SIPEAGRO / MAPA)
    let companyCol
    try {
      companyCol = app.findCollectionByNameOrId('company')
    } catch (_) {
      companyCol = new Collection({
        name: 'company',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'razao_social', type: 'text', required: true },
          { name: 'nome_fantasia', type: 'text', required: false },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'numero_registro_mapa', type: 'text', required: true }, // Registro de estabelecimento no MAPA / SIPEAGRO
          { name: 'tipo_estabelecimento', type: 'text', required: false }, // Ex: Fábrica de Produtos para Alimentação Animal
          { name: 'atividades_autorizadas', type: 'text', required: false }, // Ex: Fabricante de Rações, Concentrados e Premixes
          { name: 'produtos_fabricados', type: 'text', required: false },
          { name: 'logradouro', type: 'text', required: false },
          { name: 'numero', type: 'text', required: false },
          { name: 'complemento', type: 'text', required: false },
          { name: 'bairro', type: 'text', required: false },
          { name: 'municipio', type: 'text', required: false },
          { name: 'uf', type: 'text', required: false },
          { name: 'cep', type: 'text', required: false },
          { name: 'telefone', type: 'text', required: false },
          { name: 'email', type: 'text', required: false },
          // Responsáveis formais
          { name: 'rt_nome', type: 'text', required: false },
          { name: 'rt_registro_conselho', type: 'text', required: false }, // CRMV / CRQ
          { name: 'rt_cpf', type: 'text', required: false },
          { name: 'rq_nome', type: 'text', required: false },
          { name: 'rq_cpf', type: 'text', required: false },
          { name: 're_nome', type: 'text', required: false }, // RE = Responsável pelo Estabelecimento no MAPA
          { name: 're_cpf', type: 'text', required: false },
          { name: 're_cargo_mapa', type: 'text', required: false },
          { name: 'logo', type: 'file', required: false, maxSelect: 1, maxSize: 5242880 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_company_cnpj ON company (cnpj)',
          'CREATE INDEX idx_company_mapa ON company (numero_registro_mapa)',
        ],
      })
      app.save(companyCol)
    }

    // Seed dados iniciais da empresa fabricante SIPEAGRO
    try {
      app.findFirstRecordByData('company', 'cnpj', '12.345.678/0001-90')
    } catch (_) {
      const comp = new Record(companyCol)
      comp.set('razao_social', 'NutriAgro Nutrição Animal e Premixes Ltda.')
      comp.set('nome_fantasia', 'NutriAgro Nutrição Animal')
      comp.set('cnpj', '12.345.678/0001-90')
      comp.set('numero_registro_mapa', 'SP-00412-8')
      comp.set('tipo_estabelecimento', 'Fábrica de Produtos para Alimentação Animal')
      comp.set(
        'atividades_autorizadas',
        'Fabricação com uso de medicamentos, Premixes, Rações e Suplementos para Ruminantes e Não-ruminantes',
      )
      comp.set(
        'produtos_fabricados',
        'Rações fareladas, rações peletizadas, concentrados, suplementos minerais e premixes',
      )
      comp.set('logradouro', 'Rodovia Agroindustrial SP-330, KM 142')
      comp.set('numero', 'S/N')
      comp.set('complemento', 'Distrito Agropecuário Galpão A-B')
      comp.set('bairro', 'Zona Agroindustrial')
      comp.set('municipio', 'Ribeirão Preto')
      comp.set('uf', 'SP')
      comp.set('cep', '14075-000')
      comp.set('telefone', '(16) 3600-4500')
      comp.set('email', 'garantiadaqualidade@nutriagro.ind.br')
      comp.set('rt_nome', 'Dr. Hélio Silva')
      comp.set('rt_registro_conselho', 'CRMV-SP 18.420')
      comp.set('rt_cpf', '123.456.789-00')
      comp.set('rq_nome', 'Dra. Mariana Siqueira')
      comp.set('rq_cpf', '987.654.321-11')
      comp.set('re_nome', 'Carlos Eduardo Prado de Oliveira')
      comp.set('re_cpf', '345.678.901-22')
      comp.set('re_cargo_mapa', 'RE - Responsável pelo Estabelecimento (MAPA)')
      app.save(comp)
    }

    // 3. Extender procedures com campos de definição editáveis (como executar) e assinaturas
    const procedures = app.findCollectionByNameOrId('procedures')
    if (!procedures.fields.getByName('versao')) {
      procedures.fields.add(new TextField({ name: 'versao', required: false }))
    }
    if (!procedures.fields.getByName('campos_execucao')) {
      procedures.fields.add(new JSONField({ name: 'campos_execucao', required: false }))
    }
    if (!procedures.fields.getByName('formularios_item07')) {
      procedures.fields.add(new JSONField({ name: 'formularios_item07', required: false }))
    }
    if (!procedures.fields.getByName('assinaturas_pop')) {
      procedures.fields.add(new JSONField({ name: 'assinaturas_pop', required: false }))
    }
    if (!procedures.fields.getByName('arquivo_pdf_assinado')) {
      procedures.fields.add(
        new FileField({
          name: 'arquivo_pdf_assinado',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['application/pdf'],
        }),
      )
    }
    app.save(procedures)

    // 4. Extender records com suporte ao formulário específico do POP, assinaturas RQ/RE e arquivo assinado
    const records = app.findCollectionByNameOrId('records')
    if (!records.fields.getByName('formulario_codigo')) {
      records.fields.add(new TextField({ name: 'formulario_codigo', required: false }))
    }
    if (!records.fields.getByName('dados_formulario')) {
      records.fields.add(new JSONField({ name: 'dados_formulario', required: false }))
    }
    if (!records.fields.getByName('assinaturas_registro')) {
      records.fields.add(new JSONField({ name: 'assinaturas_registro', required: false }))
    }
    if (!records.fields.getByName('status_assinatura')) {
      records.fields.add(
        new SelectField({
          name: 'status_assinatura',
          required: false,
          values: [
            'Pendente Assinatura',
            'Assinado Parcial (RQ)',
            'Assinado Parcial (RE)',
            'Comprovado (Assinado RQ/RE)',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!records.fields.getByName('arquivo_pdf_assinado')) {
      records.fields.add(
        new FileField({
          name: 'arquivo_pdf_assinado',
          required: false,
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['application/pdf'],
        }),
      )
    }
    app.save(records)
  },
  (app) => {
    try {
      const company = app.findCollectionByNameOrId('company')
      app.delete(company)
    } catch (_) {}
  },
)
