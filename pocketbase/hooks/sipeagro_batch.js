// Hook: Operações de alta performance e lote para Base SIPEAGRO
// Endpoints:
// 1. POST /backend/v1/sipeagro/batch-chunk: grava um chunk de até 250 estabelecimentos dentro de uma transação SQL rápida
// 2. POST /backend/v1/sipeagro/finish-import: grava o registro oficial de auditoria_importacoes e log em audit_logs
// 3. POST /backend/v1/sipeagro/purge-imported: exclui os registros SIPEAGRO importados da organização (preservando is_exemplo=true) com log de auditoria

routerAdd(
  'POST',
  '/backend/v1/sipeagro/batch-chunk',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Não autenticado.' })
      }

      const body = e.requestInfo().body || {}
      const items = Array.isArray(body.items) ? body.items : []
      let orgId = body.organization_id || auth.getString('organization') || ''

      if (!orgId) {
        return e.json(400, { error: 'ID da organização é obrigatório.' })
      }

      if (items.length === 0) {
        return e.json(200, { inserted: 0, updated: 0 })
      }

      let insertedCount = 0
      let updatedCount = 0

      $app.runInTransaction((txApp) => {
        const col = txApp.findCollectionByNameOrId('sipeagro')
        const nowIso = new Date().toISOString()

        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const rawCnpj = String(item.cnpj || '').replace(/\D/g, '')
          if (!rawCnpj) continue

          // Normalizar tipos_produto
          let tiposArray = []
          if (Array.isArray(item.tipos_produto)) {
            tiposArray = item.tipos_produto
          } else if (typeof item.tipos_produto === 'string') {
            try {
              tiposArray = JSON.parse(item.tipos_produto)
            } catch (_) {
              tiposArray = []
            }
          }

          let existingRecord = null
          try {
            // Busca apenas dentro da organização
            const found = txApp.findRecordsByFilter(
              'sipeagro',
              `organization = '${orgId}' && cnpj = '${rawCnpj}'`,
              '',
              1,
              0,
            )
            if (found && found.length > 0) {
              existingRecord = found[0]
            }
          } catch (_) {}

          if (existingRecord) {
            existingRecord.set(
              'razao_social',
              item.razao_social || existingRecord.getString('razao_social'),
            )
            existingRecord.set('registro_sipeagro', item.registro_sipeagro || '')
            existingRecord.set('situacao', 'ATIVO')
            existingRecord.set('uf', item.uf || '')
            existingRecord.set('municipio', item.municipio || '')
            if (item.categoria) {
              existingRecord.set('categoria', item.categoria)
            }
            existingRecord.set('tipos_produto', tiposArray)
            if (item.arquivo_origem) {
              existingRecord.set('arquivo_origem', item.arquivo_origem)
            }
            existingRecord.set('importado_em', nowIso)
            existingRecord.set('is_exemplo', false)
            txApp.save(existingRecord)
            updatedCount++
          } else {
            const novo = new Record(col)
            novo.set('organization', orgId)
            novo.set('cnpj', rawCnpj)
            novo.set('razao_social', item.razao_social || '')
            novo.set('registro_sipeagro', item.registro_sipeagro || '')
            novo.set('situacao', 'ATIVO')
            novo.set('uf', item.uf || '')
            novo.set('municipio', item.municipio || '')
            if (item.categoria) {
              novo.set('categoria', item.categoria)
            }
            novo.set('tipos_produto', tiposArray)
            novo.set('arquivo_origem', item.arquivo_origem || '')
            novo.set('importado_em', nowIso)
            novo.set('is_exemplo', false)
            txApp.save(novo)
            insertedCount++
          }
        }
      })

      return e.json(200, {
        success: true,
        inserted: insertedCount,
        updated: updatedCount,
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao processar lote SIPEAGRO: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/sipeagro/finish-import',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Não autenticado.' })
      }

      const body = e.requestInfo().body || {}
      let orgId = body.organization_id || auth.getString('organization') || ''
      const totalLinhas = Number(body.total_linhas || 0)
      const totalAtivos = Number(body.total_ativos || 0)
      const novosCount = Number(body.novos_count || 0)
      const atualizadosCount = Number(body.atualizados_count || 0)
      const inativadosCount = Number(body.inativados_count || 0)
      const inativadosCnpjs = Array.isArray(body.inativados_cnpjs) ? body.inativados_cnpjs : []
      const arquivoOrigem = String(body.arquivo_origem || 'Planilha SIPEAGRO MAPA')
      const status = body.status === 'ERRO' ? 'ERRO' : 'SUCESSO'
      const mensagem =
        body.mensagem ||
        `Importação concluída. ${novosCount} novos, ${atualizadosCount} atualizados, ${inativadosCount} inativados.`

      let auditId = ''

      $app.runInTransaction((txApp) => {
        // 1. Criar registro em auditoria_importacoes
        const auditCol = txApp.findCollectionByNameOrId('auditoria_importacoes')
        const auditRec = new Record(auditCol)
        if (orgId) {
          auditRec.set('organization', orgId)
        }
        auditRec.set('data_hora', new Date().toISOString())
        auditRec.set('arquivo_origem', arquivoOrigem)
        auditRec.set('total_linhas', totalLinhas)
        auditRec.set('total_ativos', totalAtivos)
        auditRec.set('novos_cnpj', novosCount)
        auditRec.set('inativados_cnpj', inativadosCnpjs)
        auditRec.set('status', status)
        auditRec.set('mensagem', mensagem)
        txApp.save(auditRec)
        auditId = auditRec.id

        // 2. Registrar na trilha de auditoria geral (audit_logs)
        try {
          const logCol = txApp.findCollectionByNameOrId('audit_logs')
          const logRec = new Record(logCol)
          logRec.set('user', auth.id)
          logRec.set('user_email', auth.getString('email'))
          logRec.set('user_name', auth.getString('name'))
          logRec.set('user_role', auth.getString('role'))
          if (orgId) {
            logRec.set('organization', orgId)
          }
          logRec.set('action', 'IMPORT_SIPEAGRO')
          logRec.set('target', 'sipeagro')
          logRec.set('target_id', auditId)
          logRec.set('details', {
            arquivo_origem: arquivoOrigem,
            total_linhas: totalLinhas,
            total_ativos: totalAtivos,
            novos_cnpj: novosCount,
            atualizados_cnpj: atualizadosCount,
            inativados_count: inativadosCount,
            status: status,
            timestamp: new Date().toISOString(),
          })
          txApp.save(logRec)
        } catch (_) {}
      })

      return e.json(200, {
        success: true,
        auditoria_id: auditId,
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao registrar auditoria de importação: ' + err.message })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/sipeagro/purge-imported',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Não autenticado.' })
      }

      const body = e.requestInfo().body || {}
      let orgId = body.organization_id || auth.getString('organization') || ''

      if (!orgId) {
        return e.json(400, { error: 'ID da organização é obrigatório.' })
      }

      // Usuário precisa ter papel administrativo ou de RT/RE/RQ
      const role = auth.getString('role')
      const allowedRoles = ['super_admin', 'admin_cliente', 'RT', 'RE', 'RQ', 'admin']
      if (allowedRoles.indexOf(role) === -1) {
        return e.json(403, { error: 'Permissão insuficiente para excluir a base importada.' })
      }

      let deletedSipeagroCount = 0
      let deletedAuditoriasCount = 0

      $app.runInTransaction((txApp) => {
        // Excluir apenas registros SIPEAGRO com is_exemplo != 1 (ou is_exemplo IS NULL / FALSE / 0) da organização
        const res = txApp
          .db()
          .newQuery(
            `DELETE FROM sipeagro WHERE organization = {:orgId} AND (is_exemplo IS NULL OR is_exemplo = 0 OR is_exemplo = false)`,
          )
          .bind({ orgId })
          .execute()
        deletedSipeagroCount = res ? Number(res.rowsAffected || 0) : 0

        // Se solicitado limpar auditorias também
        if (body.limpar_auditorias === true) {
          const resAud = txApp
            .db()
            .newQuery(`DELETE FROM auditoria_importacoes WHERE organization = {:orgId}`)
            .bind({ orgId })
            .execute()
          deletedAuditoriasCount = resAud ? Number(resAud.rowsAffected || 0) : 0
        }

        // Registrar em audit_logs
        try {
          const logCol = txApp.findCollectionByNameOrId('audit_logs')
          const logRec = new Record(logCol)
          logRec.set('user', auth.id)
          logRec.set('user_email', auth.getString('email'))
          logRec.set('user_name', auth.getString('name'))
          logRec.set('user_role', auth.getString('role'))
          logRec.set('organization', orgId)
          logRec.set('action', 'PURGE_SIPEAGRO_IMPORTED')
          logRec.set('target', 'sipeagro')
          logRec.set('details', {
            deleted_sipeagro_count: deletedSipeagroCount,
            deleted_auditorias_count: deletedAuditoriasCount,
            motivo:
              body.motivo || 'Exclusão da base importada anterior para nova importação completa',
            timestamp: new Date().toISOString(),
          })
          txApp.save(logRec)
        } catch (_) {}
      })

      return e.json(200, {
        success: true,
        message: `Base SIPEAGRO importada excluída com sucesso (${deletedSipeagroCount} registros removidos). Registros de exemplo preservados.`,
        deleted_count: deletedSipeagroCount,
      })
    } catch (err) {
      return e.json(500, { error: 'Erro ao excluir base importada SIPEAGRO: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
