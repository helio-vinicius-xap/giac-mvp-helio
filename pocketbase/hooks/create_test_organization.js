/**
 * Endpoint de Criação de Empresa de Teste com Hierarquia de Usuários
 * Rota: POST /api/master/create-test-organization
 * Exclusivo para super_admin (MASTER)
 *
 * Cria:
 * 1. Uma organização nova de teste limpa
 * 2. Os 9 Auto Controles pré-configurados (POP 01 a POP 09) para a organização
 * 3. Usuários para cada nível da hierarquia:
 *    - RE (Responsável pela Empresa)
 *    - RT (Responsável Técnico)
 *    - RQ (Responsável pela Qualidade)
 *    - Operador Setor Produção
 *    - Operador Setor Limpeza & Higienização
 * 4. Retorna logins e senhas gerados prontos para exibição na tela do Master
 */

routerAdd(
  'POST',
  '/backend/v1/master/create-test-organization',
  (c) => {
    const authRecord = c.auth || c.get('authRecord')
    if (!authRecord) {
      return c.json(401, { error: 'Não autorizado. Faça login como Super Admin Master.' })
    }

    const role = authRecord.getString('role')
    if (role !== 'super_admin') {
      return c.json(403, {
        error:
          'Acesso negado. Apenas o usuário Master (Super Admin) pode criar organizações de teste.',
      })
    }

    let body = {}
    try {
      body =
        (c.requestInfo && c.requestInfo().body) || c.get('body') || $apis.requestInfo(c).data || {}
    } catch (_) {
      body = {}
    }

    const nomeFantasia =
      (body.nome_fantasia || '').trim() || `Empresa Teste ${Math.floor(100 + Math.random() * 900)}`
    const segmento = (body.segmento || 'Fábrica de Rações e Suplementos Minerais').trim()

    // Gerar um CNPJ fictício válido para teste
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const cnpj =
      body.cnpj ||
      `12.345.${randomSuffix.toString().slice(0, 3)}/0001-${randomSuffix.toString().slice(2, 4)}`

    // Prefixo de e-mail seguro para testes
    const slug =
      nomeFantasia
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 12) || 'teste'
    const timestamp = Date.now().toString().slice(-4)
    const emailDomain = `teste${timestamp}.giac.local`

    const senhaPadrao = body.senha_padrao || 'Teste@123'

    let createdOrgId = null
    const createdUsers = []

    $app.runInTransaction((txApp) => {
      // 1. Criar Organização
      const orgCol = txApp.findCollectionByNameOrId('organizations')
      const org = new Record(orgCol)
      org.set('razao_social', `${nomeFantasia} Agroindustrial LTDA`)
      org.set('nome_fantasia', nomeFantasia)
      org.set('cnpj', cnpj)
      org.set('status', 'ativa')
      org.set('segmento', segmento)
      org.set('endereco', 'Distrito Agroindustrial, Lote 10')
      org.set('cidade', 'Ribeirão Preto')
      org.set('uf', 'SP')
      org.set('telefone', '(16) 3999-0000')
      org.set('email_contato', `contato@${emailDomain}`)
      org.set('rt_nome', `Dr. Roberto Técnico (${nomeFantasia})`)
      org.set('rt_registro_conselho', 'CRMV-SP 12345')

      // Atribuir plano Starter ou Pro se existir
      try {
        const planCol = txApp.findCollectionByNameOrId('plans')
        const plan = txApp.findFirstRecordByFilter(
          planCol.name,
          "nome ~ 'Pro' || nome ~ 'Profissional' || id != ''",
        )
        if (plan) {
          org.set('plano', plan.id)
        }
      } catch (_) {}

      txApp.save(org)
      createdOrgId = org.id

      // 2. Criar os 9 Auto Controles oficiais (POP-001 a POP-009) para a organização
      const procCol = txApp.findCollectionByNameOrId('procedures')
      const officialPops = [
        {
          codigo: 'POP-001',
          nome: 'Qualificação de Fornecedores e Controle de Matérias-Primas',
          cat: 'Qualidade',
          freq: 'Por lote',
        },
        {
          codigo: 'POP-002',
          nome: 'Limpeza e Higienização das Instalações e Equipamentos',
          cat: 'Limpeza',
          freq: 'Diário',
        },
        {
          codigo: 'POP-003',
          nome: 'Higiene e Saúde dos Operadores e Treinamentos',
          cat: 'Higiene',
          freq: 'Mensal',
        },
        {
          codigo: 'POP-004',
          nome: 'Potabilidade e Cloração da Água de Abastecimento',
          cat: 'Água',
          freq: 'Diário',
        },
        {
          codigo: 'POP-005',
          nome: 'Prevenção da Contaminação Cruzada e Sequenciamento',
          cat: 'BPF',
          freq: 'Por lote',
        },
        {
          codigo: 'POP-006',
          nome: 'Manutenção e Calibração de Equipamentos e Instrumentos',
          cat: 'Manutenção',
          freq: 'Mensal',
        },
        {
          codigo: 'POP-007',
          nome: 'Controle Integrado de Pragas e Vetores',
          cat: 'Pragas',
          freq: 'Semanal',
        },
        {
          codigo: 'POP-008',
          nome: 'Controle de Temperatura na Peletização e Resfriamento',
          cat: 'APPCC',
          freq: 'Contínuo',
        },
        {
          codigo: 'POP-009',
          nome: 'Rastreabilidade e Recolhimento (Recall)',
          cat: 'Rastreabilidade',
          freq: 'Por lote',
        },
      ]

      for (let i = 0; i < officialPops.length; i++) {
        const pDef = officialPops[i]
        const pRec = new Record(procCol)
        pRec.set('organization', createdOrgId)
        pRec.set('codigo', pDef.codigo)
        pRec.set('nome', pDef.nome)
        pRec.set('categoria', pDef.cat)
        pRec.set('frequencia', pDef.freq)
        pRec.set('responsavel', `Dr. Roberto Técnico (${pDef.codigo})`)
        pRec.set('status', 'Ativo')
        pRec.set('area_etapa', 'Linha de Processamento e Moagem')
        pRec.set(
          'objetivo',
          `Garantir o padrão sanitário e regulatório de acordo com o Auto Controle oficial da IN 04/2007 do MAPA.`,
        )
        pRec.set(
          'perigos_relacionados',
          'Contaminação microbiológica, física e química em rações animais.',
        )
        pRec.set(
          'medidas_preventivas',
          'Inspeções rotineiras, preenchimento das fichas operacionais e dupla assinatura RT/RE.',
        )
        pRec.set('referencia_in', 'Instrução Normativa nº 04/2007 - MAPA')
        pRec.set('data_revisao', new Date().toISOString())
        pRec.set('validade', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString())
        txApp.save(pRec)
      }

      // 3. Criar os Usuários por Hierarquia (RE > RT > RQ > usuários por setor)
      const userCol = txApp.findCollectionByNameOrId('users')
      const hierarchyUsers = [
        {
          papel_label: 'RE - Responsável pela Empresa (Administrador do Cliente)',
          role: 're',
          name: `Carlos Eduardo (RE - ${nomeFantasia})`,
          email: `re.${slug}${timestamp}@${emailDomain}`,
          cargo: 'Diretor Geral / Representante Legal',
          setor: 'Diretoria / Gestão',
          cpf: '111.222.333-44',
        },
        {
          papel_label: 'RT - Responsável Técnico (Assina todos os documentos)',
          role: 'rt',
          name: `Dra. Mariana Siqueira (RT - ${nomeFantasia})`,
          email: `rt.${slug}${timestamp}@${emailDomain}`,
          cargo: 'Responsável Técnica / Zootecnista',
          setor: 'Técnico / P&D',
          registro_conselho: 'CRMV-SP 54321',
          cpf: '222.333.444-55',
        },
        {
          papel_label: 'RQ - Responsável pela Qualidade (Verifica registros e limites)',
          role: 'rq',
          name: `Juliana Martins (RQ - ${nomeFantasia})`,
          email: `rq.${slug}${timestamp}@${emailDomain}`,
          cargo: 'Coordenadora de Controle de Qualidade',
          setor: 'Garantia da Qualidade',
          cpf: '333.444.555-66',
        },
        {
          papel_label: 'Operador de Produção (Preenche registros operacionais)',
          role: 'producao',
          name: `João da Silva (Produção - ${nomeFantasia})`,
          email: `operador.${slug}${timestamp}@${emailDomain}`,
          cargo: 'Operador da Linha de Peletização',
          setor: 'Produção',
          cpf: '444.555.666-77',
        },
        {
          papel_label: 'Operador de Limpeza & Sanitização (Execução de BPF)',
          role: 'limpeza',
          name: `Marcos Pereira (Higienização - ${nomeFantasia})`,
          email: `limpeza.${slug}${timestamp}@${emailDomain}`,
          cargo: 'Auxiliar de Limpeza e Higienização Industrial',
          setor: 'Higienização e BPF',
          cpf: '555.666.777-88',
        },
      ]

      for (let i = 0; i < hierarchyUsers.length; i++) {
        const uDef = hierarchyUsers[i]
        const userRec = new Record(userCol)
        userRec.set('organization', createdOrgId)
        userRec.set('email', uDef.email)
        userRec.set('name', uDef.name)
        userRec.set('role', uDef.role)
        userRec.set('cargo', uDef.cargo)
        userRec.set('setor', uDef.setor)
        userRec.set('cpf', uDef.cpf)
        if (uDef.registro_conselho) {
          userRec.set('registro_conselho', uDef.registro_conselho)
        }
        userRec.setPassword(senhaPadrao)

        txApp.save(userRec)

        createdUsers.push({
          id: userRec.id,
          nome: uDef.name,
          email: uDef.email,
          senha: senhaPadrao,
          role: uDef.role,
          papel_label: uDef.papel_label,
          cargo: uDef.cargo,
          setor: uDef.setor,
        })
      }

      // 4. Gravar log de auditoria
      try {
        const auditLogCol = txApp.findCollectionByNameOrId('audit_logs')
        const logRecord = new Record(auditLogCol)
        logRecord.set('user', authRecord.id)
        logRecord.set('user_email', authRecord.getString('email'))
        logRecord.set('action', 'CREATE_TEST_ORGANIZATION_HIERARCHY')
        logRecord.set('entity', 'organizations')
        logRecord.set('entity_id', createdOrgId)
        logRecord.set(
          'details',
          JSON.stringify({
            motivo: 'Criação de organização de teste com hierarquia completa pelo SuperAdmin',
            organization_id: createdOrgId,
            nome_fantasia: nomeFantasia,
            cnpj: cnpj,
            total_usuarios: createdUsers.length,
            usuarios_criados: createdUsers.map((u) => ({
              nome: u.nome,
              email: u.email,
              role: u.role,
            })),
            executor_id: authRecord.id,
            executor_email: authRecord.getString('email'),
            data_criacao: new Date().toISOString(),
          }),
        )
        txApp.save(logRecord)
      } catch (_) {}
    })

    return c.json(201, {
      success: true,
      message: `Empresa de teste "${nomeFantasia}" criada com sucesso com 5 usuários na hierarquia (RE > RT > RQ > Produção > Limpeza).`,
      organization: {
        id: createdOrgId,
        nome_fantasia: nomeFantasia,
        cnpj: cnpj,
        segmento: segmento,
      },
      usuarios: createdUsers,
      senha_padrao: senhaPadrao,
    })
  },
  $apis.requireAuth(),
)
