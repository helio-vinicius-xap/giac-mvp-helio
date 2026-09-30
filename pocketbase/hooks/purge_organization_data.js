/**
 * Purge de dados da organização (Ferramenta Zerar Organização - SuperAdmin)
 * Endpoint: POST /api/admin/purge-organization-data
 * Exclusivo para super_admin.
 * Mantém intactos: organizations, users, plans, invoices e a base global fornecedores_validados (exceto desassociando registros).
 * Registra o evento em audit_logs com contagem por coleção.
 */

routerAdd('POST', '/backend/v1/admin/purge-organization-data', (c) => {
  const authRecord = c.get('authRecord')
  if (!authRecord) {
    return c.json(401, { error: 'Não autenticado' })
  }

  const userRole = authRecord.getString('role')
  if (userRole !== 'super_admin') {
    return c.json(403, { error: 'Acesso restrito ao Super Administrador' })
  }

  let body = {}
  try {
    body = $apis.requestInfo(c).data
  } catch (err) {
    return c.json(400, { error: 'Corpo da requisição inválido' })
  }

  const orgId = (body.organization_id || '').trim()
  const confirmationCnpj = (body.confirmation_cnpj || '').trim().replace(/\D/g, '')
  const confirmationKeyword = (body.confirmation_keyword || '').trim().toUpperCase()

  if (!orgId) {
    return c.json(400, { error: 'organization_id é obrigatório' })
  }

  // Obter a organização
  let orgRecord
  try {
    orgRecord = $app.findRecordById('organizations', orgId)
  } catch (err) {
    return c.json(404, { error: 'Organização não encontrada' })
  }

  const orgCnpjClean = orgRecord.getString('cnpj').replace(/\D/g, '')

  // Validação da dupla confirmação: CNPJ deve bater e palavra deve ser ZERAR
  if (confirmationCnpj !== orgCnpjClean) {
    return c.json(400, {
      error: 'CNPJ de confirmação incorreto para esta organização.',
    })
  }

  if (confirmationKeyword !== 'ZERAR') {
    return c.json(400, {
      error: 'Palavra-chave de confirmação deve ser exatamente ZERAR.',
    })
  }

  // Coleções de negócio que serão zeradas para esta organização
  // Mantém: organizations, users, plans, invoices
  const businessCollections = [
    'audit_evidence', // deve vir antes de audits por causa de cascade/relação
    'audits',
    'records',
    'procedure_revisions',
    'pop_custom_forms',
    'procedures',
    'non_conformities',
    'traceability_tests',
    'trainings',
    'documents',
    'devolucoes',
    'nao_conformidades_fornecedor',
    'qualificacoes',
    'fornecedores',
    'sipeagro',
  ]

  const deletedCounts = {}
  let totalDeleted = 0

  $app.runInTransaction((txApp) => {
    // 1. Apagar coleções com campo organization = orgId
    for (let i = 0; i < businessCollections.length; i++) {
      const colName = businessCollections[i]
      try {
        if (!txApp.hasTable(colName)) continue

        let count = 0
        if (colName === 'audit_evidence') {
          // audit_evidence pode ter audit que pertence à org ou campo organization se houver
          const res = txApp
            .db()
            .newQuery(
              `DELETE FROM audit_evidence WHERE audit IN (SELECT id FROM audits WHERE organization = {:orgId})`,
            )
            .bind({ orgId })
            .execute()
          count = res ? Number(res.rowsAffected || 0) : 0
        } else {
          const res = txApp
            .db()
            .newQuery(`DELETE FROM ${colName} WHERE organization = {:orgId}`)
            .bind({ orgId })
            .execute()
          count = res ? Number(res.rowsAffected || 0) : 0
        }
        deletedCounts[colName] = count
        totalDeleted += count
      } catch (err) {
        // Se a coluna organization não existir ou der erro em uma tabela específica, anotar
        deletedCounts[colName] = `erro: ${err.message}`
      }
    }

    // 2. Base global fornecedores_validados:
    // Nunca apagar a base global de outras organizações! Se houver registros vinculados com origem na org zerada, desassociar ou marcar como 'EXPIRADO'.
    try {
      if (txApp.hasTable('fornecedores_validados')) {
        const updateRes = txApp
          .db()
          .newQuery(
            `UPDATE fornecedores_validados SET status_vigencia = 'EXPIRADO', observacoes = 'Origem zerada pelo SuperAdmin' WHERE fornecedor_origem_id IN (SELECT id FROM fornecedores WHERE organization = {:orgId})`,
          )
          .bind({ orgId })
          .execute()
        deletedCounts['fornecedores_validados_expirados'] = updateRes
          ? Number(updateRes.rowsAffected || 0)
          : 0
      }
    } catch (fvErr) {
      deletedCounts['fornecedores_validados_expirados'] = 0
    }

    // 3. Registrar no audit_logs
    try {
      const auditLogCol = txApp.findCollectionByNameOrId('audit_logs')
      const logRecord = new Record(auditLogCol)
      logRecord.set('user', authRecord.id)
      logRecord.set('user_email', authRecord.getString('email'))
      logRecord.set('action', 'PURGE_ORGANIZATION_DATA')
      logRecord.set('entity', 'organizations')
      logRecord.set('entity_id', orgId)
      logRecord.set(
        'details',
        JSON.stringify({
          motivo: 'Zerar dados de negócio da organização solicitado pelo SuperAdmin',
          organization_id: orgId,
          organization_razao_social: orgRecord.getString('razao_social'),
          organization_cnpj: orgRecord.getString('cnpj'),
          deleted_counts: deletedCounts,
          total_deleted: totalDeleted,
          executor_id: authRecord.id,
          executor_email: authRecord.getString('email'),
          data_execucao: new Date().toISOString(),
        }),
      )
      // Se a coleção audit_logs tiver campo organization
      try {
        logRecord.set('organization', orgId)
      } catch (_) {}

      txApp.save(logRecord)
    } catch (logErr) {
      console.log('Erro ao gravar log de auditoria no purge:', logErr)
    }
  })

  return c.json(200, {
    success: true,
    message: `Dados da organização ${orgRecord.getString('razao_social')} zerados com sucesso.`,
    organization_id: orgId,
    deleted_counts: deletedCounts,
    total_deleted: totalDeleted,
  })
})
