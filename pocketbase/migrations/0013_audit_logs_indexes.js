migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('audit_logs')
      // Índice para buscas por target_id (por registro ou POP) e ordenação por data
      col.addIndex('idx_audit_logs_target_id', false, 'target_id', '')
      col.addIndex('idx_audit_logs_org_target', false, 'organization, target_id', '')
      col.addIndex('idx_audit_logs_target_created', false, 'target_id, created', '')
      app.save(col)
    } catch (err) {
      console.log('Erro ao adicionar índices em audit_logs:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('audit_logs')
      col.removeIndex('idx_audit_logs_target_id')
      col.removeIndex('idx_audit_logs_org_target')
      col.removeIndex('idx_audit_logs_target_created')
      app.save(col)
    } catch (err) {
      console.log('Erro ao reverter índices em audit_logs:', err)
    }
  },
)
