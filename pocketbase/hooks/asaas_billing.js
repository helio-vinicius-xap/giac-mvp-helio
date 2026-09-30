// Hook: Asaas & Multi-tenancy Billing API
// Route: POST /backend/v1/billing/create-invoice (gera fatura para a organização)
// Route: POST /backend/v1/billing/simulate-payment (simula confirmação de pagamento para testes sem chave Asaas)
// Route: POST /backend/v1/billing/webhook (webhook oficial do Asaas para confirmação de pagamento)
// Route: GET /backend/v1/admin/dashboard-stats (métricas completas para o Super Admin)
// Route: POST /backend/v1/admin/impersonate (Modo suporte - entrar como organização)

// Endpoint 1: Criar Fatura / Assinatura Asaas (ou modo simulação)
routerAdd(
  'POST',
  '/backend/v1/billing/create-invoice',
  (e) => {
    try {
      const auth = e.auth
      const body = e.requestInfo().body || {}
      let orgId = body.organization_id || ''

      // Se não for super_admin, a organização deve ser a do próprio usuário
      if (auth.getString('role') !== 'super_admin') {
        orgId = auth.getString('organization')
      }

      if (!orgId) {
        return e.json(400, { error: 'Organização não especificada.' })
      }

      const org = $app.findRecordById('organizations', orgId)
      let planRecord = null
      let amount = 0.0

      if (org.getString('plan')) {
        try {
          planRecord = $app.findRecordById('plans', org.getString('plan'))
          amount = planRecord.getFloat('monthly_price') || 0.0
        } catch (_) {}
      }

      // Se houver preço customizado para o CNPJ, usar ele
      const customPrice = org.getFloat('custom_monthly_price')
      if (customPrice && customPrice > 0) {
        amount = customPrice
      }

      const billingType =
        body.billing_type || org.getString('payment_method_preference') || 'BOLETO'
      const dueDate =
        body.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Verificar se existe chave de API Asaas no ambiente ou nas configurações
      let asaasApiKey = $os.getenv('ASAAS_API_KEY') || ''
      if (!asaasApiKey) {
        try {
          const setting = $app.findFirstRecordByData('system_settings', 'key', 'ASAAS_API_KEY')
          asaasApiKey = setting.getString('value')
        } catch (_) {}
      }

      let invoicesCol = $app.findCollectionByNameOrId('invoices')
      let invRecord = new Record(invoicesCol)
      invRecord.set('organization', org.id)
      invRecord.set('amount', amount)
      invRecord.set('status', 'PENDING')
      invRecord.set('due_date', dueDate)
      invRecord.set('billing_type', billingType)
      invRecord.set(
        'description',
        `Mensalidade SaaS GIAC Autocontrole - ${org.getString('razao_social')}`,
      )

      if (asaasApiKey) {
        // Chamada real à API do Asaas
        let baseUrl = 'https://sandbox.asaas.com/api/v3'
        try {
          const envSetting = $app.findFirstRecordByData(
            'system_settings',
            'key',
            'ASAAS_ENVIRONMENT',
          )
          if (envSetting.getString('value') === 'production') {
            baseUrl = 'https://api.asaas.com/v3'
          }
        } catch (_) {}

        // 1. Criar ou recuperar cliente no Asaas
        let customerId = org.getString('asaas_customer_id')
        if (!customerId) {
          const custRes = $http.send({
            url: baseUrl + '/customers',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: asaasApiKey,
            },
            body: JSON.stringify({
              name: org.getString('razao_social'),
              cpfCnpj: org.getString('cnpj').replace(/\D/g, ''),
              email: org.getString('billing_email') || auth.getString('email'),
              phone: org.getString('billing_phone') || '',
            }),
            timeout: 15,
          })

          if (custRes.statusCode === 200 || custRes.statusCode === 201) {
            customerId = custRes.json.id
            org.set('asaas_customer_id', customerId)
            $app.save(org)
          }
        }

        // 2. Criar cobrança no Asaas
        if (customerId) {
          const payRes = $http.send({
            url: baseUrl + '/payments',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              access_token: asaasApiKey,
            },
            body: JSON.stringify({
              customer: customerId,
              billingType: billingType,
              value: amount > 0 ? amount : 1.0,
              dueDate: dueDate,
              description: `Mensalidade Sistema GIAC - CNPJ ${org.getString('cnpj')}`,
            }),
            timeout: 15,
          })

          if (payRes.statusCode === 200 || payRes.statusCode === 201) {
            invRecord.set('asaas_payment_id', payRes.json.id)
            invRecord.set('invoice_url', payRes.json.invoiceUrl || '')
            invRecord.set('bank_slip_url', payRes.json.bankSlipUrl || '')
          }
        }
      } else {
        // MODO SIMULAÇÃO (Sem chave Asaas configurada)
        const fakePaymentId = 'pay_sim_' + Math.floor(Math.random() * 899999 + 100000)
        invRecord.set('asaas_payment_id', fakePaymentId)
        invRecord.set('invoice_url', `https://simulado.asaas.com/i/${fakePaymentId}`)
        if (billingType === 'BOLETO') {
          invRecord.set('bank_slip_url', `https://simulado.asaas.com/b/${fakePaymentId}`)
        }
        invRecord.set(
          'pix_qr_code',
          '00020126580014BR.GOV.BCB.PIX0136simulado-giac-pix-saas-cnpj520400005303986540' +
            amount +
            '5802BR5913NutriAgro6008BRASIL62070503***6304',
        )
      }

      $app.save(invRecord)

      return e.json(200, {
        success: true,
        invoice: {
          id: invRecord.id,
          amount: invRecord.getFloat('amount'),
          status: invRecord.getString('status'),
          due_date: invRecord.getString('due_date'),
          billing_type: invRecord.getString('billing_type'),
          invoice_url: invRecord.getString('invoice_url'),
          bank_slip_url: invRecord.getString('bank_slip_url'),
          asaas_payment_id: invRecord.getString('asaas_payment_id'),
        },
        mode: asaasApiKey ? 'live' : 'simulated',
      })
    } catch (err) {
      return e.json(500, { error: 'Falha ao processar fatura: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

// Endpoint 2: Simular Confirmação de Pagamento (para testes e transição imediata do cliente)
routerAdd(
  'POST',
  '/backend/v1/billing/simulate-payment',
  (e) => {
    try {
      const auth = e.auth
      const body = e.requestInfo().body || {}
      const invoiceId = body.invoice_id

      if (!invoiceId) {
        return e.json(400, { error: 'ID da fatura é obrigatório.' })
      }

      const inv = $app.findRecordById('invoices', invoiceId)
      const orgId = inv.getString('organization')

      // Verificar permissão
      if (auth.getString('role') !== 'super_admin' && auth.getString('organization') !== orgId) {
        return e.json(403, { error: 'Sem permissão para esta fatura.' })
      }

      // Atualizar status da fatura para CONFIRMED
      inv.set('status', 'CONFIRMED')
      inv.set('payment_date', new Date().toISOString().split('T')[0])
      $app.save(inv)

      // Reativar / atualizar organização para 'ativa' e renovar vencimento em +30 dias
      const org = $app.findRecordById('organizations', orgId)
      org.set('status', 'ativa')
      org.set('suspension_reason', '')
      const nextDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      org.set('subscription_due_date', nextDue)
      $app.save(org)

      // Registrar no log de auditoria
      try {
        const logsCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(logsCol)
        log.set('user', auth.id)
        log.set('user_email', auth.getString('email'))
        log.set('organization', orgId)
        log.set('action', 'payment_confirmed_simulated')
        log.set('target', invoiceId)
        log.set('details', {
          amount: inv.getFloat('amount'),
          method: inv.getString('billing_type'),
        })
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        message: 'Pagamento confirmado com sucesso! Organização reativada e assinatura renovada.',
        organization_status: org.getString('status'),
        subscription_due_date: nextDue,
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao simular pagamento: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

// Endpoint 3: Webhook Oficial Asaas (Público, recebimento de notificações de pagamento)
routerAdd('POST', '/backend/v1/billing/webhook', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const event = body.event // ex: 'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE'
    const payment = body.payment || {}
    const paymentId = payment.id

    if (!paymentId) {
      return e.json(200, { received: true, ignored: true })
    }

    // Buscar fatura vinculada a este paymentId
    let invoice = null
    try {
      invoice = $app.findFirstRecordByData('invoices', 'asaas_payment_id', paymentId)
    } catch (_) {
      // Ignorar pagamentos não gerenciados por esta instância
      return e.json(200, { received: true, status: 'invoice_not_found' })
    }

    const orgId = invoice.getString('organization')
    const org = $app.findRecordById('organizations', orgId)

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      invoice.set('status', 'CONFIRMED')
      invoice.set('payment_date', new Date().toISOString().split('T')[0])
      $app.save(invoice)

      org.set('status', 'ativa')
      org.set('suspension_reason', '')
      const nextDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      org.set('subscription_due_date', nextDue)
      $app.save(org)
    } else if (event === 'PAYMENT_OVERDUE') {
      invoice.set('status', 'OVERDUE')
      $app.save(invoice)
      // Se a tolerância de dias expirou, marcar como suspensa
      org.set('status', 'suspensa')
      org.set('suspension_reason', 'Fatura mensal Asaas vencida.')
      $app.save(org)
    }

    return e.json(200, { received: true, event: event })
  } catch (err) {
    return e.json(500, { error: 'Webhook processing error: ' + err.message })
  }
})
