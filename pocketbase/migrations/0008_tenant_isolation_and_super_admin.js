migrate(
  (app) => {
    const orgsCol = app.findCollectionByNameOrId('organizations')
    const plansCol = app.findCollectionByNameOrId('plans')
    const orgsId = orgsCol.id

    // 1. Atualizar users:
    // Expandir valores do select 'role' para incluir 'super_admin' e 'admin_cliente'
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = users.fields.getByName('role')
    if (roleField) {
      roleField.values = [
        'super_admin',
        'admin_cliente',
        'RT',
        'RQ',
        'RE',
        'admin',
        'operador',
        'auditor',
      ]
    } else {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: [
            'super_admin',
            'admin_cliente',
            'RT',
            'RQ',
            'RE',
            'admin',
            'operador',
            'auditor',
          ],
          maxSelect: 1,
        }),
      )
    }

    // Adicionar campo organization (relation -> organizations)
    if (!users.fields.getByName('organization')) {
      users.fields.add(
        new RelationField({
          name: 'organization',
          required: false,
          collectionId: orgsId,
          maxSelect: 1,
          cascadeDelete: false,
        }),
      )
    }
    app.save(users)

    // 2. Criar a organização padrão/master para os dados existentes (NutriAgro)
    let defaultPlanId = ''
    try {
      const defaultPlan = app.findFirstRecordByData('plans', 'code', 'plano-padrao')
      defaultPlanId = defaultPlan.id
    } catch (_) {}

    let initialOrgId = ''
    try {
      const existingOrg = app.findFirstRecordByData('organizations', 'cnpj', '12.345.678/0001-90')
      initialOrgId = existingOrg.id
    } catch (_) {
      const org = new Record(orgsCol)
      org.set('razao_social', 'NutriAgro Nutrição Animal e Premixes Ltda.')
      org.set('nome_fantasia', 'NutriAgro Nutrição Animal')
      org.set('cnpj', '12.345.678/0001-90')
      org.set('status', 'ativa')
      if (defaultPlanId) {
        org.set('plan', defaultPlanId)
      }
      // Trial de 14 dias a partir de agora
      const now = new Date()
      const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      org.set('trial_ends_at', trialEnd.toISOString().replace('T', ' '))
      org.set('billing_email', 'helio@dpharma.com.br')
      org.set('billing_name', 'Hélio Silva')
      org.set('billing_phone', '(16) 3600-4500')
      org.set('payment_method_preference', 'BOLETO')
      app.save(org)
      initialOrgId = org.id
    }

    // 3. Promover helio@dpharma.com.br a super_admin (dono do sistema)
    try {
      const helio = app.findAuthRecordByEmail('_pb_users_auth_', 'helio@dpharma.com.br')
      helio.set('role', 'super_admin')
      // super_admin pode ter ou não organization vinculada (como contexto principal inicial)
      helio.set('organization', initialOrgId)
      app.save(helio)
    } catch (_) {}

    // Vincular os outros usuários semente (Mariana, Carlos, João Carlos) à organização NutriAgro
    const seedEmails = [
      'mariana.qualidade@nutriagro.ind.br',
      'carlos.direcao@nutriagro.ind.br',
      'operador.recebimento@nutriagro.ind.br',
    ]
    for (let i = 0; i < seedEmails.length; i++) {
      try {
        const u = app.findAuthRecordByEmail('_pb_users_auth_', seedEmails[i])
        u.set('organization', initialOrgId)
        app.save(u)
      } catch (_) {}
    }

    // 4. Adicionar organization nas coleções de dados de negócio e aplicar Regras de Isolamento (RLS)
    const businessCollections = [
      'company',
      'procedures',
      'records',
      'audits',
      'audit_evidence',
      'non_conformities',
      'traceability_tests',
      'trainings',
      'documents',
    ]

    for (let i = 0; i < businessCollections.length; i++) {
      const name = businessCollections[i]
      try {
        const col = app.findCollectionByNameOrId(name)
        if (!col.fields.getByName('organization')) {
          col.fields.add(
            new RelationField({
              name: 'organization',
              required: false,
              collectionId: orgsId,
              maxSelect: 1,
              cascadeDelete: true,
            }),
          )
        }

        // Definir Regras de Isolamento:
        // super_admin tem acesso total a tudo.
        // Usuários de organizações têm acesso estritamente aos registros onde organization = @request.auth.organization
        // Para audit_evidence, a checagem é por audit.organization ou audit!=null.
        if (name === 'audit_evidence') {
          col.listRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && audit.organization = @request.auth.organization)"
          col.viewRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && audit.organization = @request.auth.organization)"
          col.createRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && audit.organization = @request.auth.organization)"
          col.updateRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && audit.organization = @request.auth.organization)"
          col.deleteRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && audit.organization = @request.auth.organization)"
        } else {
          col.listRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
          col.viewRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
          col.createRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
          col.updateRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
          col.deleteRule =
            "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
        }

        app.save(col)

        // Adicionar índice para performance de filtro multi-tenancy
        if (name !== 'audit_evidence') {
          col.addIndex(`idx_${name}_org`, false, 'organization', '')
          app.save(col)
        }

        // 5. Atribuir os dados já existentes no banco à organização NutriAgro
        if (initialOrgId) {
          app
            .db()
            .newQuery(
              `UPDATE ${name} SET organization = {:orgId} WHERE organization IS NULL OR organization = ''`,
            )
            .bind({ orgId: initialOrgId })
            .execute()
        }
      } catch (err) {
        console.log(`Erro ao atualizar isolamento em ${name}:`, err)
      }
    }

    // Atualizar regras de users para que usuários só vejam colegas da mesma organização
    users.listRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization)"
    users.viewRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization) || @request.auth.id = id"
    users.createRule =
      "@request.auth.role = 'super_admin' || @request.auth.id = '' || (@request.auth.organization != '' && organization = @request.auth.organization)"
    users.updateRule =
      "@request.auth.role = 'super_admin' || @request.auth.id = id || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'admin'))"
    users.deleteRule =
      "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'admin'))"
    app.save(users)
  },
  (app) => {
    // Reverter campos de organization se necessário
  },
)
