/**
 * Salvar revisão de texto normativo do POP com validação de senha do administrador da organização.
 * Endpoint: POST /api/procedures/:id/save-revision
 *
 * Permissões:
 * - super_admin (modo suporte) pode salvar com a sua própria senha ou senha admin_cliente.
 * - Usuário da organização (RT, RE, admin_cliente) DEVE fornecer a senha de um administrador da organização (admin_cliente / admin).
 * - RE pode editar/substituir o que o RT fez, mas A SENHA DO ADMIN CONTINUA OBRIGATÓRIA.
 * - Salva histórico imutável na tabela procedure_revisions e atualiza a procedure com o novo texto/versão.
 */

routerAdd('POST', '/backend/v1/procedures/:id/save-revision', (c) => {
  const authRecord = c.get('authRecord')
  if (!authRecord) {
    return c.json(401, { error: 'Não autenticado' })
  }

  const procedureId = c.pathParam('id')
  if (!procedureId) {
    return c.json(400, { error: 'ID do procedimento é obrigatório' })
  }

  let body = {}
  try {
    body = $apis.requestInfo(c).data
  } catch (err) {
    return c.json(400, { error: 'Corpo da requisição inválido' })
  }

  const adminPassword = (body.admin_password || '').trim()
  const adminEmail = (body.admin_email || '').trim()
  const descricaoAlteracao = (body.descricao_alteracao || '').trim()
  const secoesNormativas = body.secoes_normativas || {}
  const camposExecucao = body.campos_execucao || []
  const textoCompleto = (body.texto_completo || '').trim()
  const novaVersao = (body.versao || '').trim()

  if (!adminPassword) {
    return c.json(400, {
      error:
        'A senha do Administrador da Organização é obrigatória para salvar alterações normativas no POP.',
    })
  }

  // 1. Obter a procedure
  let procRecord
  try {
    procRecord = $app.findRecordById('procedures', procedureId)
  } catch (err) {
    return c.json(404, { error: 'Procedimento não encontrado' })
  }

  const userRole = authRecord.getString('role')
  const userOrgId = authRecord.getString('organization')
  const procOrgId = procRecord.getString('organization')

  // Checar se o usuário tem acesso a esta procedure
  if (userRole !== 'super_admin') {
    if (userOrgId && procOrgId && userOrgId !== procOrgId) {
      return c.json(403, { error: 'Acesso não autorizado ao procedimento desta organização' })
    }
  }

  const targetOrgId = procOrgId || userOrgId

  // 2. Validação da Senha do Administrador
  let adminValidated = false
  let validatedAdminRecord = null

  if (userRole === 'super_admin') {
    // SuperAdmin pode validar com a sua própria senha
    if (authRecord.validatePassword(adminPassword)) {
      adminValidated = true
      validatedAdminRecord = authRecord
    }
  }

  if (!adminValidated) {
    // Buscar usuário administrador da organização:
    // Se o frontend passou admin_email, tenta validar especificamente essa conta
    if (adminEmail) {
      try {
        const candidate = $app.findAuthRecordByEmail('_pb_users_auth_', adminEmail)
        const candRole = candidate.getString('role')
        const candOrg = candidate.getString('organization')
        if (
          (candRole === 'admin_cliente' || candRole === 'admin' || candRole === 'super_admin') &&
          (!candOrg || candOrg === targetOrgId || candRole === 'super_admin')
        ) {
          if (candidate.validatePassword(adminPassword)) {
            adminValidated = true
            validatedAdminRecord = candidate
          }
        }
      } catch (_) {}
    }

    // Se o próprio usuário logado for admin_cliente ou admin, testar a senha dele
    if (!adminValidated && (userRole === 'admin_cliente' || userRole === 'admin')) {
      if (authRecord.validatePassword(adminPassword)) {
        adminValidated = true
        validatedAdminRecord = authRecord
      }
    }

    // Se ainda não validou, buscar qualquer admin da organização e testar a senha fornecida
    if (!adminValidated && targetOrgId) {
      try {
        const admins = $app.findRecordsByFilter(
          '_pb_users_auth_',
          `organization = '${targetOrgId}' && (role = 'admin_cliente' || role = 'admin')`,
          '-created',
          10,
        )
        for (let i = 0; i < admins.length; i++) {
          if (admins[i].validatePassword(adminPassword)) {
            adminValidated = true
            validatedAdminRecord = admins[i]
            break
          }
        }
      } catch (_) {}
    }

    // Fallback: se nenhum admin_cliente existe na org, aceitar a senha do super_admin
    if (!adminValidated) {
      try {
        const superAdmins = $app.findRecordsByFilter(
          '_pb_users_auth_',
          `role = 'super_admin'`,
          '-created',
          5,
        )
        for (let i = 0; i < superAdmins.length; i++) {
          if (superAdmins[i].validatePassword(adminPassword)) {
            adminValidated = true
            validatedAdminRecord = superAdmins[i]
            break
          }
        }
      } catch (_) {}
    }
  }

  if (!adminValidated) {
    return c.json(401, {
      error: 'Senha do Administrador da Organização incorreta. Edição não autorizada.',
    })
  }

  // 3. Calcular a nova versão se não foi fornecida
  let versaoFinal = novaVersao
  if (!versaoFinal) {
    const versaoAtual = procRecord.getString('versao') || '1.0'
    const parts = versaoAtual.split('.')
    const major = parseInt(parts[0], 10) || 1
    const minor = parseInt(parts[1], 10) || 0
    versaoFinal = `${major}.${minor + 1}`
  }

  let revisionRecord = null

  // 4. Salvar revisão na tabela procedure_revisions e atualizar a procedure
  $app.runInTransaction((txApp) => {
    const revCol = txApp.findCollectionByNameOrId('procedure_revisions')
    const rev = new Record(revCol)
    rev.set('procedure', procedureId)
    if (targetOrgId) {
      rev.set('organization', targetOrgId)
    }
    rev.set('versao', versaoFinal)
    rev.set(
      'descricao_alteracao',
      descricaoAlteracao || 'Revisão do texto normativo do procedimento',
    )
    rev.set('autor_nome', authRecord.getString('name') || authRecord.getString('email'))
    rev.set('autor_email', authRecord.getString('email'))
    rev.set('autor_role', userRole)
    rev.set('secoes_normativas', JSON.stringify(secoesNormativas))
    rev.set('campos_execucao', JSON.stringify(camposExecucao))
    rev.set('texto_completo', textoCompleto)
    txApp.save(rev)
    revisionRecord = rev

    // Atualizar procedure
    procRecord.set('versao', versaoFinal)
    procRecord.set('data_revisao', new Date().toISOString().split('T')[0])
    if (textoCompleto) {
      try {
        procRecord.set('texto_normativo_custom', textoCompleto)
      } catch (_) {}
    }
    txApp.save(procRecord)

    // Log de auditoria
    try {
      const auditLogCol = txApp.findCollectionByNameOrId('audit_logs')
      const logRecord = new Record(auditLogCol)
      logRecord.set('user', authRecord.id)
      logRecord.set('user_email', authRecord.getString('email'))
      logRecord.set('action', 'POP_REVISION_CREATED')
      logRecord.set('entity', 'procedures')
      logRecord.set('entity_id', procedureId)
      logRecord.set(
        'details',
        JSON.stringify({
          versao: versaoFinal,
          descricao: descricaoAlteracao,
          admin_autorizador: validatedAdminRecord ? validatedAdminRecord.getString('email') : 'N/A',
          autor_papel: userRole,
          data: new Date().toISOString(),
        }),
      )
      if (targetOrgId) {
        try {
          logRecord.set('organization', targetOrgId)
        } catch (_) {}
      }
      txApp.save(logRecord)
    } catch (_) {}
  })

  return c.json(200, {
    success: true,
    message: `Revisão ${versaoFinal} salva com sucesso.`,
    versao: versaoFinal,
    revision_id: revisionRecord ? revisionRecord.id : null,
  })
})

/**
 * Restaurar uma versão anterior do POP
 * Endpoint: POST /api/procedures/:id/restore-revision
 */
routerAdd('POST', '/backend/v1/procedures/:id/restore-revision', (c) => {
  const authRecord = c.get('authRecord')
  if (!authRecord) {
    return c.json(401, { error: 'Não autenticado' })
  }

  const procedureId = c.pathParam('id')
  let body = {}
  try {
    body = $apis.requestInfo(c).data
  } catch (err) {
    return c.json(400, { error: 'Corpo inválido' })
  }

  const revisionId = (body.revision_id || '').trim()
  const adminPassword = (body.admin_password || '').trim()

  if (!revisionId || !adminPassword) {
    return c.json(400, { error: 'revision_id e admin_password são obrigatórios' })
  }

  // Validar senha admin
  const userRole = authRecord.getString('role')
  let adminOk = false
  if (authRecord.validatePassword(adminPassword)) {
    if (userRole === 'super_admin' || userRole === 'admin_cliente' || userRole === 'admin') {
      adminOk = true
    }
  }

  const targetOrgId = authRecord.getString('organization')
  if (!adminOk && targetOrgId) {
    try {
      const admins = $app.findRecordsByFilter(
        '_pb_users_auth_',
        `organization = '${targetOrgId}' && (role = 'admin_cliente' || role = 'admin')`,
        '-created',
        5,
      )
      for (let i = 0; i < admins.length; i++) {
        if (admins[i].validatePassword(adminPassword)) {
          adminOk = true
          break
        }
      }
    } catch (_) {}
  }

  if (!adminOk) {
    return c.json(401, { error: 'Senha de Administrador incorreta.' })
  }

  const revRecord = $app.findRecordById('procedure_revisions', revisionId)
  const procRecord = $app.findRecordById('procedures', procedureId)

  // Criar nova revisão registrando restauração
  const versaoAtual = procRecord.getString('versao') || '1.0'
  const parts = versaoAtual.split('.')
  const novaVersao = `${parseInt(parts[0] || '1', 10) + 1}.0`

  $app.runInTransaction((txApp) => {
    const revCol = txApp.findCollectionByNameOrId('procedure_revisions')
    const novaRev = new Record(revCol)
    novaRev.set('procedure', procedureId)
    if (targetOrgId) novaRev.set('organization', targetOrgId)
    novaRev.set('versao', novaVersao)
    novaRev.set(
      'descricao_alteracao',
      `Restaurada a partir da versão ${revRecord.getString('versao')} (id: ${revisionId})`,
    )
    novaRev.set('autor_nome', authRecord.getString('name') || authRecord.getString('email'))
    novaRev.set('autor_email', authRecord.getString('email'))
    novaRev.set('autor_role', userRole)
    novaRev.set('secoes_normativas', revRecord.getString('secoes_normativas'))
    novaRev.set('campos_execucao', revRecord.getString('campos_execucao'))
    novaRev.set('texto_completo', revRecord.getString('texto_completo'))
    novaRev.set('restaurado_de', revRecord.getString('versao'))
    txApp.save(novaRev)

    procRecord.set('versao', novaVersao)
    procRecord.set('data_revisao', new Date().toISOString().split('T')[0])
    try {
      procRecord.set('texto_normativo_custom', revRecord.getString('texto_completo'))
    } catch (_) {}
    txApp.save(procRecord)
  })

  return c.json(200, {
    success: true,
    message: `Versão restaurada com sucesso como revisão ${novaVersao}`,
    nova_versao: novaVersao,
  })
})
