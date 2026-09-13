// Hook: Register digital signature (PFX event or Gov.br validation) on POP or Record
// POST /backend/v1/assinaturas/registrar
routerAdd(
  'POST',
  '/backend/v1/assinaturas/registrar',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const targetType = body.tipo_alvo // 'procedure' ou 'record'
      const targetId = body.id_alvo
      const papel = body.papel // 'RT', 'RQ', 'RE'
      const metodo = body.metodo // 'pfx' ou 'gov_br'
      const responsavelNome = body.responsavel_nome
      const responsavelIdentificacao = body.responsavel_identificacao // CPF ou CRMV
      const hashDoc = body.hash_documento || ''
      const observacao = body.observacao || ''

      if (!targetType || !targetId || !papel || !metodo) {
        return e.json(400, { error: 'Campos tipo_alvo, id_alvo, papel e metodo são obrigatórios' })
      }

      const carimboData = new Date().toISOString()
      const registroAssinatura = {
        papel: papel,
        metodo: metodo,
        responsavel_nome: responsavelNome,
        responsavel_identificacao: responsavelIdentificacao,
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
        if (papel === 'RQ') assinaturas.rq = registroAssinatura
        if (papel === 'RE') assinaturas.re = registroAssinatura

        rec.set('assinaturas_registro', assinaturas)

        // Atualizar status de comprovação formal
        let novoStatus = 'Pendente Assinatura'
        const hasRQ = Boolean(assinaturas.rq)
        const hasRE = Boolean(assinaturas.re)
        if (hasRQ && hasRE) {
          novoStatus = 'Comprovado (Assinado RQ/RE)'
        } else if (hasRQ) {
          novoStatus = 'Assinado Parcial (RQ)'
        } else if (hasRE) {
          novoStatus = 'Assinado Parcial (RE)'
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
