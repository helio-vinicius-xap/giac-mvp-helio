migrate(
  (app) => {
    // 1. Assegurar que as coleções necessárias tenham os campos ou ajustes caso precise
    // Em records, já temos dados_formulario (json), assinaturas_registro (json), status_assinatura (select), lote (text), etc.
    // Vamos adicionar índices ou campos auxiliares se conveniente, ou criar registros semente se necessário.

    // Adicionar outros usuários de teste caso não existam (RQ, RE, Operador) para facilitar a seleção de assinaturas e responsáveis
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'mariana.qualidade@nutriagro.ind.br')
    } catch (_) {
      try {
        const rqUser = new Record(usersCol)
        rqUser.setEmail('mariana.qualidade@nutriagro.ind.br')
        rqUser.setPassword('Skip@Pass')
        rqUser.setVerified(true)
        rqUser.set('name', 'Dra. Mariana Siqueira')
        rqUser.set('role', 'RQ')
        rqUser.set('cargo', 'Coordenadora de Garantia da Qualidade')
        rqUser.set('cpf', '987.654.321-11')
        rqUser.set('telefone', '(16) 98765-4321')
        app.save(rqUser)
      } catch (_) {}
    }

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'carlos.direcao@nutriagro.ind.br')
    } catch (_) {
      try {
        const reUser = new Record(usersCol)
        reUser.setEmail('carlos.direcao@nutriagro.ind.br')
        reUser.setPassword('Skip@Pass')
        reUser.setVerified(true)
        reUser.set('name', 'Carlos Eduardo Prado de Oliveira')
        reUser.set('role', 'RE')
        reUser.set('cargo', 'Responsável pelo Estabelecimento (RE/MAPA)')
        reUser.set('cpf', '345.678.901-22')
        reUser.set('telefone', '(16) 99887-1122')
        app.save(reUser)
      } catch (_) {}
    }

    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'operador.recebimento@nutriagro.ind.br')
    } catch (_) {
      try {
        const opUser = new Record(usersCol)
        opUser.setEmail('operador.recebimento@nutriagro.ind.br')
        opUser.setPassword('Skip@Pass')
        opUser.setVerified(true)
        opUser.set('name', 'João Carlos - Recepção e Amostragem')
        opUser.set('role', 'operador')
        opUser.set('cargo', 'Operador de Recebimento de Matérias-Primas')
        opUser.set('telefone', '(16) 99112-3344')
        app.save(opUser)
      } catch (_) {}
    }
  },
  (app) => {},
)
