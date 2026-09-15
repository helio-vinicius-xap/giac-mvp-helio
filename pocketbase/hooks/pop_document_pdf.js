// Hook: POP Document Report data and HTML/PDF generation support
// GET /backend/v1/procedimentos/{id}/documento-pdf
routerAdd('GET', '/backend/v1/procedimentos/{id}/documento-pdf', (e) => {
  const procId = e.request.pathValue('id')
  if (!procId) {
    return e.json(400, { error: 'ID do procedimento obrigatório' })
  }

  try {
    const proc = $app.findRecordById('procedures', procId)

    // Buscar dados da empresa (SIPEAGRO)
    let company = null
    try {
      const companies = $app.findRecordsByFilter('company', '', '-created', 1, 0)
      if (companies && companies.length > 0) {
        const c = companies[0]
        company = {
          id: c.id,
          razao_social: c.getString('razao_social'),
          nome_fantasia: c.getString('nome_fantasia'),
          cnpj: c.getString('cnpj'),
          numero_registro_mapa: c.getString('numero_registro_mapa'),
          tipo_estabelecimento: c.getString('tipo_estabelecimento'),
          atividades_autorizadas: c.getString('atividades_autorizadas'),
          produtos_fabricados: c.getString('produtos_fabricados'),
          endereco: `${c.getString('logradouro')}, ${c.getString('numero')} - ${c.getString('bairro')}, ${c.getString('municipio')}/${c.getString('uf')} - CEP: ${c.getString('cep')}`,
          telefone: c.getString('telefone'),
          email: c.getString('email'),
          rt_nome: c.getString('rt_nome'),
          rt_registro_conselho: c.getString('rt_registro_conselho'),
          rt_cpf: c.getString('rt_cpf'),
          rq_nome: c.getString('rq_nome'),
          rq_cpf: c.getString('rq_cpf'),
          re_nome: c.getString('re_nome'),
          re_cpf: c.getString('re_cpf'),
          re_cargo_mapa:
            c.getString('re_cargo_mapa') || 'Responsável pelo Estabelecimento (RE - MAPA)',
        }
      }
    } catch (_) {}

    // Buscar registros recentes do POP e verificar conformidade e assinaturas
    let recentRecords = []
    let totalSignedRQ = 0
    let totalSignedRE = 0
    let totalRecords = 0
    try {
      const recs = $app.findRecordsByFilter('records', `procedure = '${procId}'`, '-data', 50, 0)
      totalRecords = recs.length
      for (let i = 0; i < recs.length; i++) {
        const r = recs[i]
        const statusAssinatura = r.getString('status_assinatura')
        const ass = r.get('assinaturas_registro') || {}
        if (ass.rq || statusAssinatura.indexOf('RQ') !== -1) totalSignedRQ++
        if (ass.re || statusAssinatura.indexOf('RE') !== -1) totalSignedRE++
        if (recentRecords.length < 10) {
          recentRecords.push({
            id: r.id,
            data: r.getString('data'),
            turno: r.getString('turno'),
            lote: r.getString('lote'),
            valor_medido: r.getString('valor_medido'),
            status: r.getString('status'),
            responsavel: r.getString('responsavel'),
            status_assinatura: statusAssinatura || 'Pendente Assinatura',
          })
        }
      }
    } catch (_) {}

    const isComprovadoExecutado = totalRecords > 0 && totalSignedRQ > 0 && totalSignedRE > 0

    return e.json(200, {
      procedure: {
        id: proc.id,
        codigo: proc.getString('codigo'),
        nome: proc.getString('nome'),
        categoria: proc.getString('categoria'),
        frequencia: proc.getString('frequencia'),
        responsavel: proc.getString('responsavel'),
        status: proc.getString('status'),
        area_etapa: proc.getString('area_etapa'),
        objetivo: proc.getString('objetivo'),
        perigos_relacionados: proc.getString('perigos_relacionados'),
        medidas_preventivas: proc.getString('medidas_preventivas'),
        referencia_in: proc.getString('referencia_in'),
        data_revisao: proc.getString('data_revisao'),
        validade: proc.getString('validade'),
        versao: proc.getString('versao') || 'Rev. 01/2026',
        campos_execucao: proc.get('campos_execucao') || {},
        formularios_item07: proc.get('formularios_item07') || [],
        metadados_saas: proc.get('metadados_saas') || null,
        secoes_normativas: proc.get('secoes_normativas') || null,
        assinaturas_pop: proc.get('assinaturas_pop') || {},
        arquivo_pdf_assinado: proc.getString('arquivo_pdf_assinado'),
      },
      company: company,
      stats: {
        total_records: totalRecords,
        signed_rq: totalSignedRQ,
        signed_re: totalSignedRE,
        is_comprovado_executado: isComprovadoExecutado,
        status_validade: isComprovadoExecutado
          ? 'Comprovado como Executado (Assinado RQ/RE)'
          : 'Pendente Assinatura RQ/RE para comprovação',
      },
      recent_records: recentRecords,
      generated_at: new Date().toISOString(),
    })
  } catch (err) {
    return e.json(404, { error: 'Procedimento não encontrado: ' + err.message })
  }
})
