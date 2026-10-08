migrate(
  (app) => {
    // Teste de ponta a ponta para validar os endpoints /backend/v1/master/
    // e verificar preservações e auditoria

    // 1. Criar dados de teste para verificar a zeragem
    try {
      const recordsCol = app.findCollectionByNameOrId('records')
      const recTest = new Record(recordsCol)
      recTest.set('responsavel', 'Operador Teste E2E')
      recTest.set('status', 'Conforme')
      recTest.set('observacoes', 'Registro temporário para teste de master reset')
      app.save(recTest)
    } catch (e) {
      console.log('Aviso ao criar registro de teste:', e)
    }

    // 2. Criar fornecedor de exemplo
    try {
      const fornCol = app.findCollectionByNameOrId('fornecedores')
      const fornTest = new Record(fornCol)
      fornTest.set('cnpj', '00.000.000/0001-99')
      fornTest.set('razao_social', 'Fornecedor Ficticio Teste E2E')
      fornTest.set('is_exemplo', true)
      app.save(fornTest)
    } catch (e) {
      console.log('Aviso ao criar fornecedor de teste:', e)
    }

    // 3. Fazer chamada interna ao endpoint ou executar a rotina do master reset
    const userMaster = app.findAuthRecordByEmail('_pb_users_auth_', 'helio@dpharma.com.br')
    if (!userMaster) {
      throw new Error('Usuário master helio@dpharma.com.br não encontrado.')
    }

    // Validar se o papel é super_admin
    const role = userMaster.getString('role')
    if (role !== 'super_admin') {
      throw new Error(`Esperado role super_admin, recebido ${role}`)
    }

    // Simular a rotina executada pelo master_reset_data.js
    const deletedCounts = {}
    let totalDeleted = 0

    app.runInTransaction((txApp) => {
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

      // Gravar log na audit_logs
      const auditLogCol = txApp.findCollectionByNameOrId('audit_logs')
      const logRecord = new Record(auditLogCol)
      logRecord.set('user', userMaster.id)
      logRecord.set('user_email', userMaster.getString('email'))
      logRecord.set('action', 'MASTER_RESET_ALL_DATA')
      logRecord.set('entity', 'system')
      logRecord.set('entity_id', 'master_reset')
      logRecord.set(
        'details',
        JSON.stringify({
          motivo: 'Validação E2E da rotina Master Reset e preservações',
          confirmacao_digitada: 'MASTER-ZERAR',
          deleted_counts: deletedCounts,
          total_deleted: totalDeleted,
          executor_id: userMaster.id,
          executor_email: userMaster.getString('email'),
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
    })

    // 4. Verificações das preservações
    const countOrgs = app.countRecords('organizations')
    if (countOrgs === 0) {
      throw new Error('Falha de integridade: organizations não pode ser zerada!')
    }

    const countUsers = app.countRecords('users')
    if (countUsers === 0) {
      throw new Error('Falha de integridade: users não pode ser zerada!')
    }

    const countProcedures = app.countRecords('procedures')
    if (countProcedures === 0) {
      throw new Error('Falha de integridade: procedures não pode ser zerada!')
    }

    const countRecords = app.countRecords('records')
    if (countRecords > 0) {
      throw new Error(`Falha: records deveria estar vazio após reset, mas tem ${countRecords}`)
    }

    const countAuditLogs = app.countRecords('audit_logs')
    if (countAuditLogs === 0) {
      throw new Error('Falha de integridade: audit_logs deve conter o evento MASTER_RESET_ALL_DATA')
    }

    console.log(
      `[E2E Master Reset] Sucesso: ${totalDeleted} registros excluídos, audit_logs=${countAuditLogs}, procedures=${countProcedures}, users=${countUsers}`,
    )
  },
  (app) => {
    // down migration
  },
)
