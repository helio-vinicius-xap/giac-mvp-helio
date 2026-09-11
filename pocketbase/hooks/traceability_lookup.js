// Hook: Traceability lookup custom route GET /backend/v1/rastreabilidade/{lote}
routerAdd('GET', '/backend/v1/rastreabilidade/{lote}', (e) => {
  const lote = e.request.pathValue('lote')
  if (!lote) {
    return e.json(400, { error: 'Parâmetro lote é obrigatório' })
  }

  try {
    // 1. Records with this lote
    const records = $app.findRecordsByFilter(
      'records',
      "lote ~ '" + lote.replace(/'/g, '') + "'",
      '-data',
      50,
      0,
    )

    // 2. Non-conformities with this lote
    const ncs = $app.findRecordsByFilter(
      'non_conformities',
      "lote ~ '" + lote.replace(/'/g, '') + "'",
      '-data_identificacao',
      50,
      0,
    )

    // 3. Traceability tests
    const tests = $app.findRecordsByFilter(
      'traceability_tests',
      "lote ~ '" + lote.replace(/'/g, '') + "'",
      '-created',
      20,
      0,
    )

    // Assemble structured payload
    const recordsData = []
    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      let procName = 'Procedimento Operacional'
      try {
        const procId = r.getString('procedure')
        if (procId) {
          const p = $app.findRecordById('procedures', procId)
          procName = p.getString('codigo') + ' - ' + p.getString('nome')
        }
      } catch (_) {}

      recordsData.push({
        id: r.id,
        procedure: r.getString('procedure'),
        procedure_name: procName,
        data: r.getString('data'),
        turno: r.getString('turno'),
        valor_medido: r.getString('valor_medido'),
        status: r.getString('status'),
        responsavel: r.getString('responsavel'),
        observacoes: r.getString('observacoes'),
        lote: r.getString('lote'),
      })
    }

    const ncsData = []
    for (let i = 0; i < ncs.length; i++) {
      const n = ncs[i]
      ncsData.push({
        id: n.id,
        codigo: n.getString('codigo'),
        descricao: n.getString('descricao'),
        classificacao: n.getString('classificacao'),
        origem: n.getString('origem'),
        area: n.getString('area'),
        data_identificacao: n.getString('data_identificacao'),
        status: n.getString('status'),
        responsavel: n.getString('responsavel'),
      })
    }

    const testsData = []
    for (let i = 0; i < tests.length; i++) {
      const t = tests[i]
      testsData.push({
        id: t.id,
        lote: t.getString('lote'),
        data_teste: t.getString('data_teste'),
        tipo: t.getString('tipo'),
        tempo_rastreamento: t.getString('tempo_rastreamento'),
        comunicacao_clientes: t.getString('comunicacao_clientes'),
        localizacao_produtos: t.getString('localizacao_produtos'),
        resultado: t.getString('resultado'),
      })
    }

    return e.json(200, {
      lote: lote,
      found: recordsData.length > 0 || ncsData.length > 0 || testsData.length > 0,
      records: recordsData,
      non_conformities: ncsData,
      tests: testsData,
    })
  } catch (err) {
    return e.json(500, { error: 'Erro ao consultar rastreabilidade: ' + err.message })
  }
})
