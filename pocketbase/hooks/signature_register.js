// Hook: Register digital signature (PFX event or Gov.br validation) on POP or Record
// POST /backend/v1/assinaturas/registrar
routerAdd(
  'POST',
  '/backend/v1/assinaturas/registrar',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const authRecord = e.get('authRecord')
      const userRole = authRecord ? authRecord.getString('role') : ''

      const targetType = body.tipo_alvo // 'procedure', 'record' ou 'auto_avaliacao'
      const targetId = body.id_alvo
      const papel = body.papel // 'RT', 'RQ', 'RE', 'operador'
      const metodo = body.metodo // 'pfx' ou 'gov_br'
      const responsavelNome = body.responsavel_nome
      const responsavelIdentificacao = body.responsavel_identificacao // CPF ou CRMV
      const hashDoc = body.hash_documento || ''
      const observacao = body.observacao || ''

      if (!targetType || !targetId || !papel || !metodo) {
        return e.json(400, { error: 'Campos tipo_alvo, id_alvo, papel e metodo são obrigatórios' })
      }

      // HIERARQUIA GIAC: RE > RT > RQ > usuários por setor
      // - RE: autoridade máxima, possui todas as permissões de RT e pode substituir RT e RQ
      // - admin_cliente: gestor da própria organização, com autoridade administrativa/técnica no seu tenant
      // - RT: assina como RT; não pode assinar como RE
      // - RQ: assina verificação (RQ); não pode assinar como RT ou RE
      // - Outros (setor): assinam apenas como operador / execução
      if (userRole !== 'super_admin') {
        if (papel === 'RE' && userRole !== 'RE' && userRole !== 'admin_cliente') {
          return e.json(403, {
            error:
              'Apenas o RE (ou admin da organização) possui autoridade para assinar como Responsável pelo Estabelecimento.',
          })
        }
        if (
          papel === 'RT' &&
          userRole !== 'RT' &&
          userRole !== 'RE' &&
          userRole !== 'admin_cliente'
        ) {
          return e.json(403, {
            error:
              'Apenas o RT (ou o RE / admin da organização em substituição) possui autoridade técnica para assinar como RT.',
          })
        }
        if (
          papel === 'RQ' &&
          userRole !== 'RQ' &&
          userRole !== 'RE' &&
          userRole !== 'admin_cliente'
        ) {
          return e.json(403, {
            error:
              'Apenas o RQ (ou o RE / admin da organização em supervisão) possui autoridade para assinar verificação de qualidade (RQ).',
          })
        }
      }

      const carimboData = new Date().toISOString()
      const imagemUrl = body.imagem_url || ''
      const registroAssinatura = {
        papel: papel,
        metodo: metodo,
        responsavel_nome: responsavelNome,
        responsavel_identificacao: responsavelIdentificacao,
        imagem_url: imagemUrl,
        data_assinatura: carimboData,
        hash_documento: hashDoc,
        observacao: observacao,
        autenticidade_mapa: `Assinado eletronicamente via ${metodo === 'gov_br' ? 'Identidade Gov.br (Autenticação Qualificada)' : 'Certificado Digital ICP-Brasil (PFX)'} em ${carimboData}`,
      }

      if (targetType === 'procedure') {
        const proc = $app.findRecordById('procedures', targetId)
        let assinaturas = proc.get('assinaturas_pop') || {}
        if (typeof assinaturas !== 'object') assinaturas = {}
        if (papel === 'RT') assinaturas.rt = registroAssinatura
        if (papel === 'RE') assinaturas.re = registroAssinatura
        if (papel === 'RQ') assinaturas.rq = registroAssinatura
        if (papel === 'Direcao') assinaturas.direcao = registroAssinatura
        if (papel === 'CQ') assinaturas.cq = registroAssinatura
        proc.set('assinaturas_pop', assinaturas)
        $app.save(proc)

        // Gravar no log de auditoria
        try {
          const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
          const logRecord = new Record(auditLogCol)
          if (authRecord) {
            logRecord.set('user', authRecord.id)
            logRecord.set('user_email', authRecord.getString('email'))
            logRecord.set('user_name', responsavelNome || authRecord.getString('name'))
            logRecord.set('user_role', userRole)
          }
          logRecord.set('action', 'SIGNATURE_APPLIED')
          logRecord.set('target', 'procedures')
          logRecord.set('target_id', targetId)
          logRecord.set(
            'details',
            JSON.stringify({
              target_type: 'procedure',
              target_id: targetId,
              target_code: proc.getString('codigo'),
              papel: papel,
              metodo: metodo,
              responsavel_nome: responsavelNome,
              responsavel_identificacao: responsavelIdentificacao,
              timestamp: carimboData,
            }),
          )
          const procOrg = proc.getString('organization')
          if (procOrg) logRecord.set('organization', procOrg)
          $app.save(logRecord)
        } catch (_) {}

        return e.json(200, {
          success: true,
          message: `Assinatura de ${papel} registrada com sucesso no POP ${proc.getString('codigo')}`,
          assinaturas_pop: assinaturas,
        })
      } else if (targetType === 'record') {
        const rec = $app.findRecordById('records', targetId)
        let assinaturas = rec.get('assinaturas_registro') || {}
        if (typeof assinaturas !== 'object') assinaturas = {}
        if (papel === 'RT') assinaturas.rt = registroAssinatura
        if (papel === 'RQ') assinaturas.rq = registroAssinatura
        if (papel === 'RE') assinaturas.re = registroAssinatura
        if (papel === 'operador') assinaturas.operador = registroAssinatura

        rec.set('assinaturas_registro', assinaturas)

        // REGRA DE ASSINATURA OBRIGATÓRIA EM TODO O SISTEMA:
        // cada POP e cada registro é assinado por RT ou RE (primeira assinatura) + RQ (segunda assinatura)
        const hasAssinatura1 = Boolean(assinaturas.rt || assinaturas.re)
        const hasAssinatura2 = Boolean(assinaturas.rq)

        let novoStatus = 'Pendente Assinatura'
        if (hasAssinatura1 && hasAssinatura2) {
          novoStatus = 'Comprovado (Assinado RT/RE + RQ)'
        } else if (hasAssinatura1) {
          novoStatus = 'Pendente Assinatura RQ'
        } else if (hasAssinatura2) {
          novoStatus = 'Pendente Assinatura RT/RE'
        }
        rec.set('status_assinatura', novoStatus)
        $app.save(rec)

        // Gravar no log de auditoria
        try {
          const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
          const logRecord = new Record(auditLogCol)
          if (authRecord) {
            logRecord.set('user', authRecord.id)
            logRecord.set('user_email', authRecord.getString('email'))
            logRecord.set('user_name', responsavelNome || authRecord.getString('name'))
            logRecord.set('user_role', userRole)
          }
          logRecord.set('action', 'SIGNATURE_APPLIED')
          logRecord.set('target', 'records')
          logRecord.set('target_id', targetId)
          logRecord.set(
            'details',
            JSON.stringify({
              target_type: 'record',
              target_id: targetId,
              formulario_codigo: rec.getString('formulario_codigo'),
              lote: rec.getString('lote'),
              papel: papel,
              metodo: metodo,
              novo_status: novoStatus,
              responsavel_nome: responsavelNome,
              responsavel_identificacao: responsavelIdentificacao,
              timestamp: carimboData,
            }),
          )
          const recOrg = rec.getString('organization')
          if (recOrg) logRecord.set('organization', recOrg)
          $app.save(logRecord)
        } catch (_) {}

        return e.json(200, {
          success: true,
          message: `Assinatura de ${papel} registrada com sucesso no registro`,
          status_assinatura: novoStatus,
          assinaturas_registro: assinaturas,
        })
      } else if (targetType === 'auto_avaliacao') {
        const autoAval = $app.findRecordById('auto_avaliacoes_fornecedor', targetId)
        let assinaturas = autoAval.get('assinaturas') || {}
        if (typeof assinaturas === 'string') {
          try {
            assinaturas = JSON.parse(assinaturas)
          } catch (_) {
            assinaturas = {}
          }
        }
        if (typeof assinaturas !== 'object') assinaturas = {}

        // Hierarquia GIAC para Auto Avaliação (POP 01-AC01):
        // Assinatura 1 = RT ou RE (RE substitui o RT)
        // Assinatura 2 = RQ (verificação da qualidade)
        // Operadores/setor assinam preenchimento / execução
        if (papel === 'RT' || papel === 'RE') {
          assinaturas.aprovacao = {
            nome: responsavelNome,
            funcao:
              papel === 'RE' ? 'Responsável pelo Estabelecimento (RE)' : 'Responsável Técnico (RT)',
            papel: papel,
            usuario_id: authRecord ? authRecord.id : '',
            user_role: userRole,
            data_assinatura: carimboData,
            metodo: metodo,
            imagem_url: imagemUrl,
            hash_documento: hashDoc,
          }
        } else if (papel === 'RQ') {
          assinaturas.verificacao_rq = {
            nome: responsavelNome,
            funcao: 'Responsável pela Qualidade (RQ)',
            papel: papel,
            usuario_id: authRecord ? authRecord.id : '',
            user_role: userRole,
            data_assinatura: carimboData,
            metodo: metodo,
            imagem_url: imagemUrl,
            hash_documento: hashDoc,
          }
        } else {
          // Preenchimento / execução
          assinaturas.preenchimento = {
            nome: responsavelNome,
            funcao: observacao || 'Execução do Preenchimento',
            papel: papel,
            usuario_id: authRecord ? authRecord.id : '',
            user_role: userRole,
            data_assinatura: carimboData,
            metodo: metodo,
            imagem_url: imagemUrl,
            hash_documento: hashDoc,
          }
        }

        autoAval.set('assinaturas', assinaturas)

        const hasAssinatura1 = Boolean(assinaturas.aprovacao)
        const hasAssinatura2 = Boolean(assinaturas.verificacao_rq)

        let statusAssinatura = 'Pendente Assinatura'
        if (hasAssinatura1 && hasAssinatura2) {
          statusAssinatura = 'Homologado (RT/RE + RQ)'
        } else if (hasAssinatura1) {
          statusAssinatura = 'Pendente Assinatura RQ'
        } else if (hasAssinatura2) {
          statusAssinatura = 'Pendente Assinatura RT/RE'
        } else if (assinaturas.preenchimento) {
          statusAssinatura = 'Preenchido (Aguardando RT/RE + RQ)'
        }

        autoAval.set('status_assinatura', statusAssinatura)
        $app.save(autoAval)

        // Gravar no audit_logs
        try {
          const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
          const logRecord = new Record(auditLogCol)
          if (authRecord) {
            logRecord.set('user', authRecord.id)
            logRecord.set('user_email', authRecord.getString('email'))
            logRecord.set('user_name', responsavelNome || authRecord.getString('name'))
            logRecord.set('user_role', userRole)
          }
          logRecord.set('action', 'SIGNATURE_APPLIED')
          logRecord.set('target', 'auto_avaliacoes_fornecedor')
          logRecord.set('target_id', targetId)
          logRecord.set(
            'details',
            JSON.stringify({
              target_type: 'auto_avaliacao',
              target_id: targetId,
              numero_registro: autoAval.getString('numero_registro'),
              fornecedor_cnpj: autoAval.getString('fornecedor_cnpj'),
              razao_social: autoAval.getString('razao_social'),
              papel: papel,
              metodo: metodo,
              status_assinatura: statusAssinatura,
              responsavel_nome: responsavelNome,
              timestamp: carimboData,
            }),
          )
          const org = autoAval.getString('organization')
          if (org) logRecord.set('organization', org)
          $app.save(logRecord)
        } catch (_) {}

        return e.json(200, {
          success: true,
          message: `Assinatura de ${papel} registrada com sucesso na auto avaliação`,
          status_assinatura: statusAssinatura,
          assinaturas: assinaturas,
        })
      } else {
        return e.json(400, {
          error: 'tipo_alvo inválido. Utilize "procedure", "record" ou "auto_avaliacao"',
        })
      }
    } catch (err) {
      return e.json(500, { error: 'Erro ao registrar assinatura: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
