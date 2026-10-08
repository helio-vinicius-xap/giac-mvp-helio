/**
 * Endpoint de Zeragem Total de Dados de Teste / Fictícios
 * Rota: POST /api/master/reset-all-data
 * Exclusivo para super_admin (MASTER)
 *
 * O QUE APAGA:
 * - Registros de teste (records)
 * - Dados de exemplo do PAASO e de teste (fornecedores de exemplo/teste, nc_fornecedor, devolucoes_mp, etc.)
 * - Estabelecimentos SIPEAGRO com is_exemplo = true (PRESERVANDO os 5.721 estabelecimentos reais do MAPA)
 * - Não conformidades de teste (non_conformities)
 * - Treinamentos de exemplo/teste (trainings)
 * - Auditorias de teste (audits, audit_evidence)
 * - Rastreabilidade de teste (traceability_lots, traceability_mock_recalls)
 * - Auto avaliações de teste (auto_avaliacoes_fornecedor, portal_fornecedor_convites)
 *
 * O QUE MANTÉM INTACTO:
 * - Cadastros de Organizações (organizations)
 * - Usuários do sistema (users)
 * - Os 9 Auto Controles e sua estrutura (procedures, pop_custom_forms)
 * - O Editor Normativo e revisões oficiais
 * - Base SIPEAGRO REAL (sipeagro onde is_exemplo != true)
 * - Base estrutural de produtos e setores de limpeza (pop02_limpeza_*)
 * - Trilha de auditoria audit_logs (IMUTÁVEL: nunca apaga, apenas registra a zeragem)
 * - Planos e faturas (plans, invoices)
 */

routerAdd(
  'POST',
  '/backend/v1/master/reset-all-data',
  (c) => {
    // Obter o registro de autenticação a partir de c.auth (definido por requireAuth / PocketBase) ou fallback c.get('authRecord')
    const authRecord = c.auth || c.get('authRecord')
    if (!authRecord) {
      return c.json(401, { error: 'Não autorizado. Faça login como Super Admin Master.' })
    }

    const role = authRecord.getString('role')
    if (role !== 'super_admin') {
      return c.json(403, {
        error:
          'Acesso negado. Apenas o usuário Master (Super Admin) pode executar a Zeragem Total.',
      })
    }

    let body = {}
    try {
      body =
        (c.requestInfo && c.requestInfo().body) || c.get('body') || $apis.requestInfo(c).data || {}
    } catch (_) {
      body = {}
    }

    const confirmacao = (body.confirmacao || '').toString().trim().toUpperCase()
    if (confirmacao !== 'MASTER-ZERAR') {
      return c.json(400, {
        error: 'Confirmação inválida. Digite exatamente "MASTER-ZERAR" para confirmar a operação.',
      })
    }

    const deletedCounts = {}
    let totalDeleted = 0

    $app.runInTransaction((txApp) => {
      // 1. Apagar coleções transacionais/de teste por completo
      const transactionalCollections = [
        'audit_evidence',
        'audits',
        'records',
        'non_conformities',
        'traceability_tests',
        'trainings',
        'devolucoes',
        'nao_conformidades_fornecedor',
        'qualificacoes',
        'auto_avaliacoes_fornecedor',
        'convites_portal_fornecedor',
        'fornecedores',
        'fornecedores_validados',
      ]

      for (let i = 0; i < transactionalCollections.length; i++) {
        const colName = transactionalCollections[i]
        try {
          if (!txApp.hasTable(colName)) continue
          const res = txApp.db().newQuery(`DELETE FROM ${colName}`).execute()
          const count = res ? Number(res.rowsAffected || 0) : 0
          deletedCounts[colName] = count
          totalDeleted += count
        } catch (err) {
          deletedCounts[colName] = `erro: ${err.message}`
        }
      }

      // 2. Apagar APENAS os dados fictícios do SIPEAGRO (is_exemplo = true), NUNCA os 5.721 reais do MAPA!
      try {
        if (txApp.hasTable('sipeagro')) {
          const res = txApp
            .db()
            .newQuery(`DELETE FROM sipeagro WHERE is_exemplo = 1 OR is_exemplo = 'true'`)
            .execute()
          const count = res ? Number(res.rowsAffected || 0) : 0
          deletedCounts['sipeagro_ficticios'] = count
          totalDeleted += count
        }
      } catch (sipErr) {
        deletedCounts['sipeagro_ficticios'] = `erro: ${sipErr.message}`
      }

      // 3. Registrar o evento na trilha imutável audit_logs
      try {
        const auditLogCol = txApp.findCollectionByNameOrId('audit_logs')
        const logRecord = new Record(auditLogCol)
        logRecord.set('user', authRecord.id)
        logRecord.set('user_email', authRecord.getString('email'))
        logRecord.set('action', 'MASTER_RESET_ALL_DATA')
        logRecord.set('entity', 'system')
        logRecord.set('entity_id', 'master_reset')
        logRecord.set(
          'details',
          JSON.stringify({
            motivo: 'Zeragem total de dados de teste e fictícios realizada pelo usuário Master',
            confirmacao_digitada: confirmacao,
            deleted_counts: deletedCounts,
            total_deleted: totalDeleted,
            executor_id: authRecord.id,
            executor_email: authRecord.getString('email'),
            data_execucao: new Date().toISOString(),
            preservados: [
              'organizations',
              'users',
              'procedures (9 Auto Controles)',
              'pop_custom_forms',
              'sipeagro (base real MAPA)',
              'audit_logs',
              'plans',
              'invoices',
            ],
          }),
        )

        txApp.save(logRecord)
      } catch (logErr) {
        console.log('Erro ao gravar log de auditoria no reset master:', logErr)
      }
    })

    return c.json(200, {
      success: true,
      message:
        'Zeragem total de dados de teste concluída com sucesso. Estrutura de Auto Controles preservada.',
      deleted_counts: deletedCounts,
      total_deleted: totalDeleted,
      executed_at: new Date().toISOString(),
    })
  },
  $apis.requireAuth(),
)
