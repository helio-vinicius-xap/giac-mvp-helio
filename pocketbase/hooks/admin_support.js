// Hook: Super Admin Dashboard Metrics & Support Mode
// GET /backend/v1/admin/dashboard-stats
// POST /backend/v1/admin/support-login
// POST /backend/v1/admin/log-action

routerAdd(
  'GET',
  '/backend/v1/admin/dashboard-stats',
  (e) => {
    try {
      const auth = e.auth
      if (auth.getString('role') !== 'super_admin') {
        return e.json(403, { error: 'Acesso restrito ao Super Admin Master.' })
      }

      // 1. Estatísticas de Organizações
      let totalOrgs = 0
      let activeOrgs = 0
      let trialOrgs = 0
      let suspendedOrgs = 0
      let cancelledOrgs = 0

      const allOrgs = $app.findRecordsByFilter('organizations', '', '-created', 500, 0)
      totalOrgs = allOrgs.length

      // Mapa de planos para calcular MRR previsto
      const plansMap = {}
      try {
        const plans = $app.findRecordsByFilter('plans', '', '', 100, 0)
        for (let i = 0; i < plans.length; i++) {
          plansMap[plans[i].id] = plans[i].getFloat('monthly_price') || 0.0
        }
      } catch (_) {}

      let mrrPrevisto = 0.0

      for (let i = 0; i < allOrgs.length; i++) {
        const o = allOrgs[i]
        const st = o.getString('status')
        if (st === 'ativa') {
          activeOrgs++
          // Somar MRR
          const customPrice = o.getFloat('custom_monthly_price')
          if (customPrice && customPrice > 0) {
            mrrPrevisto += customPrice
          } else {
            const planId = o.getString('plan')
            if (planId && plansMap[planId]) {
              mrrPrevisto += plansMap[planId]
            }
          }
        } else if (st === 'trial') {
          trialOrgs++
        } else if (st === 'suspensa') {
          suspendedOrgs++
        } else if (st === 'cancelada') {
          cancelledOrgs++
        }
      }

      // 2. Faturamento e Pagamentos Recebidos no mês atual
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      let pagamentosMesValor = 0.0
      let faturasPagasCount = 0
      let faturasPendentesCount = 0
      let faturasVencidasCount = 0

      try {
        const allInvoices = $app.findRecordsByFilter('invoices', '', '-created', 1000, 0)
        for (let j = 0; j < allInvoices.length; j++) {
          const inv = allInvoices[j]
          const st = inv.getString('status')
          const amount = inv.getFloat('amount') || 0.0
          const payDate = inv.getString('payment_date') || ''

          if (st === 'CONFIRMED' || st === 'RECEIVED') {
            faturasPagasCount++
            if (payDate >= startOfMonth) {
              pagamentosMesValor += amount
            }
          } else if (st === 'PENDING') {
            faturasPendentesCount++
          } else if (st === 'OVERDUE') {
            faturasVencidasCount++
          }
        }
      } catch (_) {}

      // 3. Total de usuários na plataforma
      let totalUsers = 0
      try {
        const users = $app.findRecordsByFilter('users', '', '', 1000, 0)
        totalUsers = users.length
      } catch (_) {}

      // 4. Logs recentes de auditoria do super admin
      let recentLogs = []
      try {
        const logs = $app.findRecordsByFilter('audit_logs', '', '-created', 10, 0)
        for (let k = 0; k < logs.length; k++) {
          recentLogs.push({
            id: logs[k].id,
            action: logs[k].getString('action'),
            user_email: logs[k].getString('user_email'),
            target: logs[k].getString('target'),
            details: logs[k].get('details'),
            created: logs[k].getString('created'),
          })
        }
      } catch (_) {}

      return e.json(200, {
        organizations: {
          total: totalOrgs,
          active: activeOrgs,
          trial: trialOrgs,
          suspended: suspendedOrgs,
          cancelled: cancelledOrgs,
        },
        billing: {
          mrr_previsto: mrrPrevisto,
          pagamentos_mes: pagamentosMesValor,
          faturas_pagas: faturasPagasCount,
          faturas_pendentes: faturasPendentesCount,
          faturas_vencidas: faturasVencidasCount,
        },
        total_users: totalUsers,
        recent_audit_logs: recentLogs,
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao gerar métricas do super admin: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

// Endpoint: Modo suporte - Registrar entrada do Super Admin na conta da organização
routerAdd(
  'POST',
  '/backend/v1/admin/support-login',
  (e) => {
    try {
      const auth = e.auth
      if (auth.getString('role') !== 'super_admin') {
        return e.json(403, { error: 'Apenas o Super Admin Master pode usar o modo suporte.' })
      }

      const body = e.requestInfo().body || {}
      const targetOrgId = body.organization_id
      const action = body.action || 'enter' // 'enter' ou 'exit'

      if (!targetOrgId) {
        return e.json(400, { error: 'ID da organização é obrigatório.' })
      }

      const org = $app.findRecordById('organizations', targetOrgId)

      // Registrar auditoria da ação do suporte
      try {
        const logsCol = $app.findCollectionByNameOrId('audit_logs')
        const log = new Record(logsCol)
        log.set('user', auth.id)
        log.set('user_email', auth.getString('email'))
        log.set('organization', targetOrgId)
        log.set('action', action === 'enter' ? 'MODO_SUPORTE_ENTRADA' : 'MODO_SUPORTE_SAIDA')
        log.set('target', org.getString('razao_social'))
        log.set('details', {
          cnpj: org.getString('cnpj'),
          super_admin_email: auth.getString('email'),
          timestamp: new Date().toISOString(),
        })
        $app.save(log)
      } catch (_) {}

      return e.json(200, {
        success: true,
        message:
          action === 'enter'
            ? `Modo suporte ativo na organização ${org.getString('razao_social')}. Ação devidamente registrada em auditoria.`
            : 'Modo suporte encerrado.',
        organization: {
          id: org.id,
          razao_social: org.getString('razao_social'),
          cnpj: org.getString('cnpj'),
        },
      })
    } catch (err) {
      return e.json(500, { error: 'Erro no modo suporte: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
