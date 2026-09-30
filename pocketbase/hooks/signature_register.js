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

      const targetType = body.tipo_alvo // 'procedure' ou 'record'
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
      // - RE: autoridade máxima, pode assinar por si mesmo ou substituir RT e RQ
      // - RT: assina como RT; não pode assinar como RE
      // - RQ: assina verificação (RQ); não pode assinar como RT ou RE
      // - Outros (setor): assinam apenas como operador / execução
      if (userRole !== 'super_admin') {
        if (papel === 'RE' && userRole !== 'RE') {
          return e.json(403, {
            error:
              'Apenas o RE possui autoridade para assinar como Responsável pelo Estabelecimento.',
          })
        }
        if (papel === 'RT' && userRole !== 'RT' && userRole !== 'RE') {
          return e.json(403, {
            error:
              'Apenas o RT (ou o RE em substituição) possui autoridade técnica para assinar como RT.',
          })
        }
        if (papel === 'RQ' && userRole !== 'RQ' && userRole !== 'RE') {
          return e.json(403, {
            error:
              'Apenas o RQ (ou o RE em supervisão) possui autoridade para assinar verificação de qualidade (RQ).',
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

        return e.json(200, {
          success: true,
          message: `Assinatura de ${papel} registrada com sucesso no registro`,
          status_assinatura: novoStatus,
          assinaturas_registro: assinaturas,
        })
      } else {
        return e.json(400, { error: 'tipo_alvo inválido. Utilize "procedure" ou "record"' })
      }
    } catch (err) {
      return e.json(500, { error: 'Erro ao registrar assinatura: ' + err.message })
    }
  },
  $apis.requireAuth(),
)
