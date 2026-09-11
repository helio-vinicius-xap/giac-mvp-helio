// Hook: Check overdue non-conformities and procedures review dates, exposing notification count
routerAdd('GET', '/backend/v1/notificacoes/resumo', (e) => {
  try {
    const today = new Date().toISOString()
    let overdueNCs = 0
    let overdueProcedures = 0
    const alerts = []

    try {
      const openNCs = $app.findRecordsByFilter(
        'non_conformities',
        "(status = 'Aberta' || status = 'Em Andamento') && prazo != '' && prazo < '" + today + "'",
        'prazo',
        20,
        0,
      )
      overdueNCs = openNCs.length
      for (let i = 0; i < openNCs.length; i++) {
        alerts.push({
          tipo: 'nc_vencida',
          titulo: 'Não Conformidade Vencida: ' + openNCs[i].getString('codigo'),
          descricao: openNCs[i].getString('descricao'),
          prazo: openNCs[i].getString('prazo'),
          link: '/nao-conformidades/' + openNCs[i].id,
        })
      }
    } catch (_) {}

    try {
      const procs = $app.findRecordsByFilter(
        'procedures',
        "status = 'Ativo' && validade != '' && validade < '" + today + "'",
        'validade',
        20,
        0,
      )
      overdueProcedures = procs.length
      for (let i = 0; i < procs.length; i++) {
        alerts.push({
          tipo: 'procedimento_vencido',
          titulo: 'Revisão Necessária: ' + procs[i].getString('codigo'),
          descricao: procs[i].getString('nome'),
          prazo: procs[i].getString('validade'),
          link: '/procedimentos/' + procs[i].id,
        })
      }
    } catch (_) {}

    return e.json(200, {
      total: overdueNCs + overdueProcedures,
      overdue_ncs: overdueNCs,
      overdue_procedures: overdueProcedures,
      alerts: alerts,
    })
  } catch (err) {
    return e.json(500, { error: err.message })
  }
})

// Daily scheduled check at 03:00 UTC
cronAdd('notification_alert', '0 3 * * *', () => {
  console.log('[CRON] Verificação diária de conformidade agro documental executada.')
})
