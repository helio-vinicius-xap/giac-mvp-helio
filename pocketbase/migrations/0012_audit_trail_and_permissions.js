migrate(
  (app) => {
    // 1. Atualizar regras e campos da coleção audit_logs
    try {
      const auditLogs = app.findCollectionByNameOrId('audit_logs')

      // Adicionar campos extras para rastreamento detalhado de alterações e antifalsificação se faltarem
      if (!auditLogs.fields.getByName('target_id')) {
        auditLogs.fields.add(
          new TextField({
            name: 'target_id',
            required: false,
          }),
        )
      }
      if (!auditLogs.fields.getByName('user_role')) {
        auditLogs.fields.add(
          new TextField({
            name: 'user_role',
            required: false,
          }),
        )
      }
      if (!auditLogs.fields.getByName('user_name')) {
        auditLogs.fields.add(
          new TextField({
            name: 'user_name',
            required: false,
          }),
        )
      }

      // Regras de acesso a audit_logs:
      // Leitura para super_admin E para usuários da própria organização que tenham perfil de gestão (admin_cliente, RE, RT, RQ)
      auditLogs.listRule =
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'RE' || @request.auth.role = 'RT' || @request.auth.role = 'RQ' || @request.auth.role = 'admin'))"
      auditLogs.viewRule =
        "@request.auth.role = 'super_admin' || (@request.auth.organization != '' && organization = @request.auth.organization && (@request.auth.role = 'admin_cliente' || @request.auth.role = 'RE' || @request.auth.role = 'RT' || @request.auth.role = 'RQ' || @request.auth.role = 'admin'))"
      // Criação permitida para qualquer usuário autenticado (ou via hooks do servidor)
      auditLogs.createRule = "@request.auth.id != ''"
      // Atualização e exclusão são NULAS (imutáveis) - anti-falsificação estrita
      auditLogs.updateRule = null
      auditLogs.deleteRule = null

      app.save(auditLogs)
    } catch (err) {
      console.log('Erro ao atualizar regras de audit_logs:', err)
    }
  },
  (app) => {
    // Reversão
  },
)
