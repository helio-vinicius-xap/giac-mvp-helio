// Hook: Monitoring Record PDF data & digital signature route
// GET /backend/v1/registros/{id}/documento-pdf
routerAdd('GET', '/backend/v1/registros/{id}/documento-pdf', (e) => {
  const recId = e.request.pathValue('id')
  if (!recId) {
    return e.json(400, { error: 'ID do registro obrigatório' })
  }

  try {
    const record = $app.findRecordById('records', recId)
    const procId = record.getString('procedure')
    let procData = null
    if (procId) {
      try {
        const p = $app.findRecordById('procedures', procId)
        procData = {
          id: p.id,
          codigo: p.getString('codigo'),
          nome: p.getString('nome'),
          categoria: p.getString('categoria'),
          referencia_in: p.getString('referencia_in'),
          area_etapa: p.getString('area_etapa'),
          versao: p.getString('versao') || 'Rev. 02/2025',
          campos_execucao: p.get('campos_execucao') || {},
          formularios_item07: p.get('formularios_item07') || [],
        }
      } catch (_) {}
    }

    // Buscar empresa
    let company = null
    try {
      const companies = $app.findRecordsByFilter('company', '', '-created', 1, 0)
      if (companies && companies.length > 0) {
        const c = companies[0]
        company = {
          razao_social: c.getString('razao_social'),
          cnpj: c.getString('cnpj'),
          numero_registro_mapa: c.getString('numero_registro_mapa'),
          tipo_estabelecimento: c.getString('tipo_estabelecimento'),
          rq_nome: c.getString('rq_nome'),
          rq_cpf: c.getString('rq_cpf'),
          re_nome: c.getString('re_nome'),
          re_cpf: c.getString('re_cpf'),
          re_cargo_mapa:
            c.getString('re_cargo_mapa') || 'RE - Responsável pelo Estabelecimento (MAPA)',
          rt_nome: c.getString('rt_nome'),
          rt_registro_conselho: c.getString('rt_registro_conselho'),
        }
      }
    } catch (_) {}

    return e.json(200, {
      record: {
        id: record.id,
        data: record.getString('data'),
        turno: record.getString('turno'),
        lote: record.getString('lote'),
        valor_medido: record.getString('valor_medido'),
        status: record.getString('status'),
        responsavel: record.getString('responsavel'),
        observacoes: record.getString('observacoes'),
        formulario_codigo: record.getString('formulario_codigo'),
        dados_formulario: record.get('dados_formulario') || {},
        assinaturas_registro: record.get('assinaturas_registro') || {},
        status_assinatura: record.getString('status_assinatura') || 'Pendente Assinatura',
        arquivo_pdf_assinado: record.getString('arquivo_pdf_assinado'),
      },
      procedure: procData,
      company: company,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    return e.json(404, { error: 'Registro não encontrado: ' + err.message })
  }
})
