// Hook: Dashboard summary custom route GET /backend/v1/dashboard/resumo
routerAdd('GET', '/backend/v1/dashboard/resumo', (e) => {
  try {
    // 1. Procedures count
    let activeProcedures = 0
    try {
      const procs = $app.findRecordsByFilter('procedures', "status = 'Ativo'", '', 100, 0)
      activeProcedures = procs.length
    } catch (_) {}

    // 2. Records this month
    let recordsThisMonth = 0
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    try {
      const monthRecs = $app.findRecordsByFilter(
        'records',
        "created >= '" + startOfMonth + "'",
        '',
        1000,
        0,
      )
      recordsThisMonth = monthRecs.length
    } catch (_) {}

    // 3. Open non-conformities
    let openNCs = 0
    let openCriticalNCs = 0
    let ncsAberta = 0
    let ncsAndamento = 0
    let ncsFechada = 0
    let recentNCs = []

    try {
      const allNCs = $app.findRecordsByFilter('non_conformities', '', '-data_identificacao', 100, 0)
      for (let i = 0; i < allNCs.length; i++) {
        const item = allNCs[i]
        const status = item.getString('status')
        const classif = item.getString('classificacao')
        if (status === 'Aberta') {
          ncsAberta++
          openNCs++
          if (classif === 'Crítica') openCriticalNCs++
        } else if (status === 'Em Andamento') {
          ncsAndamento++
          openNCs++
          if (classif === 'Crítica') openCriticalNCs++
        } else if (status === 'Fechada') {
          ncsFechada++
        }

        if (recentNCs.length < 5) {
          recentNCs.push({
            id: item.id,
            codigo: item.getString('codigo'),
            descricao: item.getString('descricao'),
            classificacao: classif,
            data_identificacao: item.getString('data_identificacao'),
            status: status,
          })
        }
      }
    } catch (_) {}

    // 4. Audits count and upcoming audits
    let completedAudits = 0
    let nextAudits = []
    try {
      const allAudits = $app.findRecordsByFilter('audits', '', 'data', 50, 0)
      for (let i = 0; i < allAudits.length; i++) {
        const a = allAudits[i]
        const st = a.getString('status')
        if (st === 'Concluída') {
          completedAudits++
        } else if (nextAudits.length < 5) {
          nextAudits.push({
            id: a.id,
            codigo: a.getString('codigo'),
            data: a.getString('data'),
            tipo: a.getString('tipo'),
            area_processo: a.getString('area_processo'),
            auditor: a.getString('auditor'),
            status: st,
          })
        }
      }
    } catch (_) {}

    // 5. Records per procedure (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    let recordsByProcedure = []
    try {
      const procs = $app.findRecordsByFilter('procedures', "status = 'Ativo'", 'codigo', 20, 0)
      for (let i = 0; i < procs.length; i++) {
        const p = procs[i]
        const pRecs = $app.findRecordsByFilter(
          'records',
          "procedure = '" + p.id + "' && created >= '" + thirtyDaysAgo + "'",
          '',
          500,
          0,
        )
        recordsByProcedure.push({
          codigo: p.getString('codigo'),
          nome: p.getString('nome'),
          categoria: p.getString('categoria'),
          total: pRecs.length,
        })
      }
    } catch (_) {}

    return e.json(200, {
      indicators: {
        active_procedures: activeProcedures,
        records_month: recordsThisMonth,
        open_ncs: openNCs,
        open_critical_ncs: openCriticalNCs,
        completed_audits: completedAudits,
      },
      nc_status_distribution: {
        aberta: ncsAberta,
        em_andamento: ncsAndamento,
        fechada: ncsFechada,
      },
      records_by_procedure: recordsByProcedure,
      recent_ncs: recentNCs,
      next_audits: nextAudits,
    })
  } catch (err) {
    return e.json(500, { error: 'Erro no resumo do dashboard: ' + err.message })
  }
})
