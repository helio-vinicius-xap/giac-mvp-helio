migrate(
  (app) => {
    // 1. Coleção plans (planos com valor editável pelo super_admin)
    const plans = new Collection({
      name: 'plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'super_admin'",
      updateRule: "@request.auth.role = 'super_admin'",
      deleteRule: "@request.auth.role = 'super_admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'code', type: 'text', required: true },
        { name: 'description', type: 'text', required: false },
        { name: 'monthly_price', type: 'number', required: false }, // valor provisório em R$, ex: 0.00 ou editável
        {
          name: 'interval',
          type: 'select',
          required: false,
          values: ['mensal', 'anual'],
          maxSelect: 1,
        },
        { name: 'is_active', type: 'bool', required: false },
        { name: 'features', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_plans_code ON plans (code)'],
    })
    app.save(plans)
    const plansId = plans.id

    // Seed planos padrão com valores provisórios editáveis
    const planStandard = new Record(plans)
    planStandard.set('name', 'Plano Básico IN 04/2007')
    planStandard.set('code', 'plano-padrao')
    planStandard.set(
      'description',
      'Gestão completa de POPs, registros de monitoramento, SIPEAGRO e rastreabilidade para fábricas de alimentação animal.',
    )
    planStandard.set('monthly_price', 0.0)
    planStandard.set('interval', 'mensal')
    planStandard.set('is_active', true)
    planStandard.set('features', [
      'Cobrança por CNPJ com usuários ilimitados',
      'Gestão de Procedimentos e POP 01 completo com fluxo encadeado',
      'Assinaturas digitais de RT, RQ e RE',
      'Geração de relatórios e PDFs oficiais MAPA',
      'Módulo de Rastreabilidade, Não Conformidades e Treinamentos',
    ])
    app.save(planStandard)

    const planPro = new Record(plans)
    planPro.set('name', 'Plano Premium / Multi-Fábricas')
    planPro.set('code', 'plano-premium')
    planPro.set(
      'description',
      'Plano avançado com auditorias integradas, inteligência de autocontrole e suporte prioritário.',
    )
    planPro.set('monthly_price', 0.0)
    planPro.set('interval', 'mensal')
    planPro.set('is_active', true)
    planPro.set('features', [
      'Tudo do Plano Básico',
      'Auditorias externas e módulos avançados MAPA',
      'Suporte técnico e regulatório prioritário',
    ])
    app.save(planPro)

    // 2. Coleção organizations (Multi-tenancy por CNPJ)
    const organizations = new Collection({
      name: 'organizations',
      type: 'base',
      listRule:
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && @request.auth.organization = id)",
      viewRule:
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && @request.auth.organization = id)",
      createRule: "@request.auth.id != ''", // Permitir criação no onboarding / register
      updateRule:
        "@request.auth.role = 'super_admin' || (@request.auth.organization = id && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'admin'))",
      deleteRule: "@request.auth.role = 'super_admin'",
      fields: [
        { name: 'razao_social', type: 'text', required: true },
        { name: 'nome_fantasia', type: 'text', required: false },
        { name: 'cnpj', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['trial', 'ativa', 'suspensa', 'cancelada'],
          maxSelect: 1,
        },
        {
          name: 'plan',
          type: 'relation',
          required: false,
          collectionId: plansId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'trial_ends_at', type: 'date', required: false },
        { name: 'subscription_due_date', type: 'date', required: false },
        { name: 'asaas_customer_id', type: 'text', required: false },
        { name: 'asaas_subscription_id', type: 'text', required: false },
        { name: 'billing_email', type: 'text', required: false },
        { name: 'billing_phone', type: 'text', required: false },
        { name: 'billing_name', type: 'text', required: false },
        {
          name: 'payment_method_preference',
          type: 'select',
          required: false,
          values: ['BOLETO', 'CREDIT_CARD', 'UNDEFINED'],
          maxSelect: 1,
        },
        { name: 'custom_monthly_price', type: 'number', required: false }, // caso o super_admin queira ajustar o valor para um CNPJ específico
        { name: 'suspension_reason', type: 'text', required: false },
        { name: 'notes', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_organizations_cnpj ON organizations (cnpj)',
        'CREATE INDEX idx_organizations_status ON organizations (status)',
      ],
    })
    app.save(organizations)
    const orgsId = organizations.id

    // 3. Coleção invoices (faturas de mensalidade recorrente por organização)
    const invoices = new Collection({
      name: 'invoices',
      type: 'base',
      listRule:
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && @request.auth.organization = organization)",
      viewRule:
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && @request.auth.organization = organization)",
      createRule: "@request.auth.role = 'super_admin'",
      updateRule: "@request.auth.role = 'super_admin'",
      deleteRule: "@request.auth.role = 'super_admin'",
      fields: [
        {
          name: 'organization',
          type: 'relation',
          required: true,
          collectionId: orgsId,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'amount', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'CANCELLED'],
          maxSelect: 1,
        },
        { name: 'due_date', type: 'date', required: true },
        { name: 'payment_date', type: 'date', required: false },
        {
          name: 'billing_type',
          type: 'select',
          required: false,
          values: ['BOLETO', 'CREDIT_CARD', 'PIX', 'UNDEFINED'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: false },
        { name: 'asaas_payment_id', type: 'text', required: false },
        { name: 'invoice_url', type: 'text', required: false },
        { name: 'bank_slip_url', type: 'text', required: false },
        { name: 'pix_qr_code', type: 'text', required: false },
        { name: 'credit_card_details', type: 'json', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_invoices_org ON invoices (organization)',
        'CREATE INDEX idx_invoices_status ON invoices (status)',
        'CREATE INDEX idx_invoices_due ON invoices (due_date)',
      ],
    })
    app.save(invoices)

    // 4. Coleção audit_logs (auditoria de ações do super_admin sobre clientes e do sistema)
    const auditLogs = new Collection({
      name: 'audit_logs',
      type: 'base',
      listRule: "@request.auth.role = 'super_admin'",
      viewRule: "@request.auth.role = 'super_admin'",
      createRule: "@request.auth.id != ''",
      updateRule: null, // imutável
      deleteRule: null, // imutável
      fields: [
        {
          name: 'user',
          type: 'relation',
          required: false,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'user_email', type: 'text', required: false },
        {
          name: 'organization',
          type: 'relation',
          required: false,
          collectionId: orgsId,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { name: 'action', type: 'text', required: true }, // ex: "login_as_tenant", "suspend_organization", "update_plan_price", "plan_change"
        { name: 'target', type: 'text', required: false },
        { name: 'details', type: 'json', required: false },
        { name: 'ip', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_audit_logs_action ON audit_logs (action)',
        'CREATE INDEX idx_audit_logs_org ON audit_logs (organization)',
      ],
    })
    app.save(auditLogs)

    // 5. Coleção system_settings (para guardar configurações do Asaas e do SaaS se o super_admin desejar configurar em runtime)
    const systemSettings = new Collection({
      name: 'system_settings',
      type: 'base',
      listRule: "@request.auth.role = 'super_admin'",
      viewRule: "@request.auth.role = 'super_admin'",
      createRule: "@request.auth.role = 'super_admin'",
      updateRule: "@request.auth.role = 'super_admin'",
      deleteRule: "@request.auth.role = 'super_admin'",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'text', required: false },
        { name: 'description', type: 'text', required: false },
        { name: 'is_secret', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_settings_key ON system_settings (key)'],
    })
    app.save(systemSettings)

    // Seed configuração inicial do Asaas em modo simulação
    const asaasEnv = new Record(systemSettings)
    asaasEnv.set('key', 'ASAAS_ENVIRONMENT')
    asaasEnv.set('value', 'sandbox')
    asaasEnv.set('description', 'Ambiente do Asaas (sandbox ou production)')
    asaasEnv.set('is_secret', false)
    app.save(asaasEnv)
  },
  (app) => {
    const toDelete = ['system_settings', 'audit_logs', 'invoices', 'organizations', 'plans']
    for (let i = 0; i < toDelete.length; i++) {
      try {
        const col = app.findCollectionByNameOrId(toDelete[i])
        app.delete(col)
      } catch (_) {}
    }
  },
)
