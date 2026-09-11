// Hook: Audit report custom route GET /backend/v1/auditorias/{id}/relatorio
routerAdd('GET', '/backend/v1/auditorias/{id}/relatorio', (e) => {
  const auditId = e.request.pathValue('id')
  if (!auditId) {
    return e.json(400, { error: 'ID da auditoria obrigatório' })
  }

  try {
    const audit = $app.findRecordById('audits', auditId)
    let linkedNCs = []
    try {
      linkedNCs = $app.findRecordsByFilter(
        'non_conformities',
        "audit = '" + auditId + "'",
        'codigo',
        50,
        0,
      )
    } catch (_) {}

    const ncsFormatted = []
    for (let i = 0; i < linkedNCs.length; i++) {
      const nc = linkedNCs[i]
      ncsFormatted.push({
        codigo: nc.getString('codigo'),
        descricao: nc.getString('descricao'),
        classificacao: nc.getString('classificacao'),
        status: nc.getString('status'),
        plano_acao: nc.getString('plano_acao'),
        responsavel_acao: nc.getString('responsavel_acao'),
        prazo_acao: nc.getString('prazo_acao'),
      })
    }

    return e.json(200, {
      id: audit.id,
      codigo: audit.getString('codigo'),
      data: audit.getString('data'),
      tipo: audit.getString('tipo'),
      area_processo: audit.getString('area_processo'),
      auditor: audit.getString('auditor'),
      status: audit.getString('status'),
      escopo: audit.getString('escopo'),
      conclusao: audit.getString('conclusao'),
      relatorio_achados: audit.getString('relatorio_achados'),
      checklist: audit.get('checklist'),
      assinaturas: audit.get('assinaturas'),
      non_conformities: ncsFormatted,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    return e.json(404, { error: 'Auditoria não encontrada: ' + err.message })
  }
})
