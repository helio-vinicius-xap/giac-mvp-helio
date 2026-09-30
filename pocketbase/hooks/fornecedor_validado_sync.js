// Hook: sincroniza fornecedores qualificados com o banco global 'fornecedores_validados'
// Executado em onRecordAfterCreateSuccess e onRecordAfterUpdateSuccess na coleção 'qualificacoes'

onRecordAfterCreateSuccess((e) => {
  const qualif = e.record
  const resultado = qualif.getString('resultado')
  const rawCnpj = qualif.getString('fornecedor_cnpj')
  const cnpj = rawCnpj.replace(/\D/g, '')
  if (!cnpj) {
    return
  }

  const isAprovado = resultado === 'APROVADO' || resultado === 'APROVADO_COM_RESSALVA'
  const isReprovado = resultado === 'REPROVADO'

  // Buscar nome da organização
  let orgNome = ''
  const orgId = qualif.getString('organization')
  if (orgId) {
    try {
      const org = $app.findRecordById('organizations', orgId)
      orgNome = org.getString('nome_fantasia') || org.getString('razao_social') || ''
    } catch (_) {}
  }

  let dadosDeclarados = {}
  try {
    const rawDados = qualif.get('dados_declarados')
    dadosDeclarados = typeof rawDados === 'string' ? JSON.parse(rawDados) : rawDados || {}
  } catch (_) {}

  const tiposProduto = Array.isArray(dadosDeclarados.tipos_produto)
    ? dadosDeclarados.tipos_produto
    : []

  // Calcular categoria de risco proporcional
  let categoriaRisco = 'Médio Risco (Geral)'
  const tiposStr = tiposProduto.join(' ').toLowerCase()
  if (
    tiposStr.indexOf('aditivo') >= 0 ||
    tiposStr.indexOf('premix') >= 0 ||
    tiposStr.indexOf('núcleo') >= 0
  ) {
    categoriaRisco = 'Alto Risco (Microingredientes/Aditivos)'
  } else if (
    tiposStr.indexOf('concentrado') >= 0 ||
    tiposStr.indexOf('ração') >= 0 ||
    tiposStr.indexOf('suplemento') >= 0
  ) {
    categoriaRisco = 'Médio Risco (Compostos/Rações)'
  } else {
    categoriaRisco = 'Baixo Risco (Matérias-primas/Armazenagem)'
  }

  // Prazo de 1 ano para expirar aprovação
  let dataAprov = qualif.getString('data_formulario')
  if (!dataAprov) {
    dataAprov = new Date().toISOString().split('T')[0]
  } else {
    dataAprov = dataAprov.split('T')[0]
  }

  const parts = dataAprov.split('-')
  let validade1Ano = ''
  if (parts.length === 3) {
    const ano = parseInt(parts[0], 10) + 1
    validade1Ano = ano + '-' + parts[1] + '-' + parts[2]
  }

  try {
    const existing = $app.findFirstRecordByData('fornecedores_validados', 'cnpj', cnpj)
    if (isAprovado) {
      existing.set(
        'razao_social',
        dadosDeclarados.razao_social || existing.getString('razao_social'),
      )
      existing.set(
        'registro_sipeagro',
        dadosDeclarados.registro_sipeagro || existing.getString('registro_sipeagro'),
      )
      existing.set('situacao', 'ATIVO')
      existing.set('uf', dadosDeclarados.uf || existing.getString('uf'))
      existing.set('municipio', dadosDeclarados.municipio || existing.getString('municipio'))
      if (dadosDeclarados.categoria) existing.set('categoria', dadosDeclarados.categoria)
      existing.set('tipos_produto', tiposProduto)
      existing.set('categoria_de_risco', categoriaRisco)
      existing.set('status', 'VALIDADO')
      existing.set('data_aprovacao', dataAprov)
      existing.set('validade_aprovacao', validade1Ano)
      existing.set('score_aprovacao', qualif.getInt('score'))
      existing.set('origem_organizacao', orgId || existing.getString('origem_organizacao'))
      existing.set(
        'origem_organizacao_nome',
        orgNome || existing.getString('origem_organizacao_nome'),
      )
      existing.set('origem_qualificacao', qualif.id)
      $app.save(existing)
    } else if (isReprovado) {
      existing.set('status', 'EXPIRADO')
      $app.save(existing)
    }
  } catch (_) {
    // Não existia ainda: se aprovado, insere no banco compartilhado
    if (isAprovado) {
      try {
        const col = $app.findCollectionByNameOrId('fornecedores_validados')
        const novo = new Record(col)
        novo.set('cnpj', cnpj)
        novo.set('razao_social', dadosDeclarados.razao_social || 'Fornecedor Homologado')
        novo.set('registro_sipeagro', dadosDeclarados.registro_sipeagro || '')
        novo.set('situacao', 'ATIVO')
        novo.set('uf', dadosDeclarados.uf || '')
        novo.set('municipio', dadosDeclarados.municipio || '')
        if (dadosDeclarados.categoria) novo.set('categoria', dadosDeclarados.categoria)
        novo.set('tipos_produto', tiposProduto)
        novo.set('categoria_de_risco', categoriaRisco)
        novo.set('status', 'VALIDADO')
        novo.set('data_aprovacao', dataAprov)
        novo.set('validade_aprovacao', validade1Ano)
        novo.set('score_aprovacao', qualif.getInt('score'))
        if (orgId) novo.set('origem_organizacao', orgId)
        novo.set('origem_organizacao_nome', orgNome)
        novo.set('origem_qualificacao', qualif.id)
        novo.set('total_utilizacoes', 1)
        $app.save(novo)
      } catch (insertErr) {
        console.log('Erro ao criar fornecedor validado no hook:', insertErr)
      }
    }
  }
}, 'qualificacoes')

onRecordAfterUpdateSuccess((e) => {
  const qualif = e.record
  const resultado = qualif.getString('resultado')
  const rawCnpj = qualif.getString('fornecedor_cnpj')
  const cnpj = rawCnpj.replace(/\D/g, '')
  if (!cnpj) {
    return
  }

  const isAprovado = resultado === 'APROVADO' || resultado === 'APROVADO_COM_RESSALVA'
  const isReprovado = resultado === 'REPROVADO'

  let orgNome = ''
  const orgId = qualif.getString('organization')
  if (orgId) {
    try {
      const org = $app.findRecordById('organizations', orgId)
      orgNome = org.getString('nome_fantasia') || org.getString('razao_social') || ''
    } catch (_) {}
  }

  let dadosDeclarados = {}
  try {
    const rawDados = qualif.get('dados_declarados')
    dadosDeclarados = typeof rawDados === 'string' ? JSON.parse(rawDados) : rawDados || {}
  } catch (_) {}

  const tiposProduto = Array.isArray(dadosDeclarados.tipos_produto)
    ? dadosDeclarados.tipos_produto
    : []

  let categoriaRisco = 'Médio Risco (Geral)'
  const tiposStr = tiposProduto.join(' ').toLowerCase()
  if (
    tiposStr.indexOf('aditivo') >= 0 ||
    tiposStr.indexOf('premix') >= 0 ||
    tiposStr.indexOf('núcleo') >= 0
  ) {
    categoriaRisco = 'Alto Risco (Microingredientes/Aditivos)'
  } else if (
    tiposStr.indexOf('concentrado') >= 0 ||
    tiposStr.indexOf('ração') >= 0 ||
    tiposStr.indexOf('suplemento') >= 0
  ) {
    categoriaRisco = 'Médio Risco (Compostos/Rações)'
  } else {
    categoriaRisco = 'Baixo Risco (Matérias-primas/Armazenagem)'
  }

  let dataAprov = qualif.getString('data_formulario')
  if (!dataAprov) {
    dataAprov = new Date().toISOString().split('T')[0]
  } else {
    dataAprov = dataAprov.split('T')[0]
  }

  const parts = dataAprov.split('-')
  let validade1Ano = ''
  if (parts.length === 3) {
    const ano = parseInt(parts[0], 10) + 1
    validade1Ano = ano + '-' + parts[1] + '-' + parts[2]
  }

  try {
    const existing = $app.findFirstRecordByData('fornecedores_validados', 'cnpj', cnpj)
    if (isAprovado) {
      existing.set(
        'razao_social',
        dadosDeclarados.razao_social || existing.getString('razao_social'),
      )
      existing.set(
        'registro_sipeagro',
        dadosDeclarados.registro_sipeagro || existing.getString('registro_sipeagro'),
      )
      existing.set('situacao', 'ATIVO')
      existing.set('uf', dadosDeclarados.uf || existing.getString('uf'))
      existing.set('municipio', dadosDeclarados.municipio || existing.getString('municipio'))
      if (dadosDeclarados.categoria) existing.set('categoria', dadosDeclarados.categoria)
      existing.set('tipos_produto', tiposProduto)
      existing.set('categoria_de_risco', categoriaRisco)
      existing.set('status', 'VALIDADO')
      existing.set('data_aprovacao', dataAprov)
      existing.set('validade_aprovacao', validade1Ano)
      existing.set('score_aprovacao', qualif.getInt('score'))
      existing.set('origem_organizacao', orgId || existing.getString('origem_organizacao'))
      existing.set(
        'origem_organizacao_nome',
        orgNome || existing.getString('origem_organizacao_nome'),
      )
      existing.set('origem_qualificacao', qualif.id)
      $app.save(existing)
    } else if (isReprovado) {
      existing.set('status', 'EXPIRADO')
      $app.save(existing)
    }
  } catch (_) {
    if (isAprovado) {
      try {
        const col = $app.findCollectionByNameOrId('fornecedores_validados')
        const novo = new Record(col)
        novo.set('cnpj', cnpj)
        novo.set('razao_social', dadosDeclarados.razao_social || 'Fornecedor Homologado')
        novo.set('registro_sipeagro', dadosDeclarados.registro_sipeagro || '')
        novo.set('situacao', 'ATIVO')
        novo.set('uf', dadosDeclarados.uf || '')
        novo.set('municipio', dadosDeclarados.municipio || '')
        if (dadosDeclarados.categoria) novo.set('categoria', dadosDeclarados.categoria)
        novo.set('tipos_produto', tiposProduto)
        novo.set('categoria_de_risco', categoriaRisco)
        novo.set('status', 'VALIDADO')
        novo.set('data_aprovacao', dataAprov)
        novo.set('validade_aprovacao', validade1Ano)
        novo.set('score_aprovacao', qualif.getInt('score'))
        if (orgId) novo.set('origem_organizacao', orgId)
        novo.set('origem_organizacao_nome', orgNome)
        novo.set('origem_qualificacao', qualif.id)
        novo.set('total_utilizacoes', 1)
        $app.save(novo)
      } catch (insertErr) {
        console.log('Erro ao criar fornecedor validado no update hook:', insertErr)
      }
    }
  }
}, 'qualificacoes')
