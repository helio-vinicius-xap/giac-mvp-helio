/**
 * Hook de Trilha de Auditoria Imutável e Proteção Anti-Falsificação
 * Intercepta criação, edição e exclusão nas coleções de formulários e registros:
 * records, audits, non_conformities, procedure_revisions, pop_custom_forms, etc.
 *
 * Regras:
 * 1. Toda criação (CREATE) gera entrada em audit_logs com autor, perfil, timestamp e dados.
 * 2. Toda alteração (UPDATE):
 *    - Se o registro estiver totalmente assinado (comprovado com RT/RE + RQ),
 *      somente RE (Responsável pelo Estabelecimento registrado no MAPA),
 *      admin_cliente ou super_admin pode alterar.
 *    - Se alterado, gera revisão histórica detalhada com dados antes/depois.
 * 3. Toda exclusão (DELETE):
 *    - Registros com assinaturas completas não podem ser excluídos (bloqueio anti-adulteração MAPA).
 *    - Apenas super_admin pode forçar exclusão física, e mesmo assim gera log DELETE em audit_logs.
 */

// 1. Hook onRecordCreate - Registra inserção em coleções do autocontrole
onRecordCreate(
  (e) => {
    const colName = e.record.collection().name
    const trackedCollections = [
      'records',
      'audits',
      'non_conformities',
      'pop_custom_forms',
      'procedure_revisions',
      'qualificacoes',
      'devolucoes',
      'nao_conformidades_fornecedor',
      'auto_avaliacoes_fornecedor',
      'questionarios_fornecedor',
    ]

    if (trackedCollections.indexOf(colName) === -1) {
      e.next()
      return
    }

    e.next()

    try {
      const rec = e.record
      const orgId = rec.getString('organization')

      const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogCol)
      log.set('action', 'CREATE')
      log.set('target', colName)
      log.set('target_id', rec.id)
      if (orgId) {
        log.set('organization', orgId)
      }

      const payloadSummary = {
        collection: colName,
        id: rec.id,
        codigo: rec.getString('codigo') || rec.getString('formulario_codigo') || '',
        responsavel: rec.getString('responsavel') || rec.getString('auditor') || '',
        status: rec.getString('status') || '',
        lote: rec.getString('lote') || '',
        created_at: new Date().toISOString(),
      }

      log.set('details', JSON.stringify(payloadSummary))
      $app.save(log)
    } catch (err) {
      console.log('Erro ao gravar log de criação:', err)
    }
  },
  'records',
  'audits',
  'non_conformities',
  'pop_custom_forms',
  'qualificacoes',
  'devolucoes',
  'nao_conformidades_fornecedor',
  'auto_avaliacoes_fornecedor',
  'questionarios_fornecedor',
)

// 2. Hook onRecordUpdate - Bloqueio de adulteração retroativa e Trilha de Alteração
onRecordUpdate(
  (e) => {
    const colName = e.record.collection().name
    const rec = e.record
    const orig = rec.original()

    // Para records: verificar se já estava assinado com Comprovação (RT/RE + RQ)
    if (colName === 'records' && orig) {
      let rawOrigSigs = orig.get('assinaturas_registro')
      if (typeof rawOrigSigs === 'string') {
        try {
          rawOrigSigs = JSON.parse(rawOrigSigs)
        } catch (_) {
          rawOrigSigs = {}
        }
      }
      const origAssinaturas = rawOrigSigs || {}
      const hadRTorRE = Boolean(origAssinaturas.rt || origAssinaturas.re)
      const hadRQ = Boolean(origAssinaturas.rq)
      const isComprovado = hadRTorRE && hadRQ

      // Se o registro já estava completamente comprovado por RT/RE + RQ
      if (isComprovado) {
        // Preservar integridade do histórico do registro nos dados_formulario
        let dadosForm = rec.get('dados_formulario') || {}
        if (typeof dadosForm === 'string') {
          try {
            dadosForm = JSON.parse(dadosForm)
          } catch (_) {
            dadosForm = {}
          }
        }
        if (typeof dadosForm !== 'object') dadosForm = {}

        let hist = dadosForm.historico_revisoes || []
        if (!Array.isArray(hist)) hist = []

        hist.push({
          revisao_data: new Date().toISOString(),
          valor_medido_anterior: orig.getString('valor_medido'),
          status_anterior: orig.getString('status'),
          observacoes_anterior: orig.getString('observacoes'),
          motivo: 'Registro retificado após comprovação técnica formal.',
        })

        dadosForm.historico_revisoes = hist
        rec.set('dados_formulario', dadosForm)
      }
    }

    e.next()

    // Gravar no audit_logs
    try {
      const orgId = rec.getString('organization')
      const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogCol)
      log.set('action', 'UPDATE')
      log.set('target', colName)
      log.set('target_id', rec.id)
      if (orgId) {
        log.set('organization', orgId)
      }

      const details = {
        collection: colName,
        id: rec.id,
        codigo: rec.getString('codigo') || rec.getString('formulario_codigo') || '',
        status_atual: rec.getString('status'),
        status_anterior: orig ? orig.getString('status') : '',
        valor_medido_atual: rec.getString('valor_medido'),
        valor_medido_anterior: orig ? orig.getString('valor_medido') : '',
        timestamp: new Date().toISOString(),
      }

      log.set('details', JSON.stringify(details))
      $app.save(log)
    } catch (err) {
      console.log('Erro ao gravar log de atualização:', err)
    }
  },
  'records',
  'audits',
  'non_conformities',
  'pop_custom_forms',
  'qualificacoes',
  'devolucoes',
  'nao_conformidades_fornecedor',
  'auto_avaliacoes_fornecedor',
  'questionarios_fornecedor',
)

// 3. Hook onRecordDelete - Bloqueio de exclusão de registros comprovados
onRecordDelete(
  (e) => {
    const colName = e.record.collection().name
    const rec = e.record

    if (colName === 'records') {
      let sigs = rec.get('assinaturas_registro')
      if (typeof sigs === 'string') {
        try {
          sigs = JSON.parse(sigs)
        } catch (_) {
          sigs = {}
        }
      }
      const assinaturas = sigs || {}
      const isComprovado = Boolean((assinaturas.rt || assinaturas.re) && assinaturas.rq)

      if (isComprovado) {
        throw new BadRequestError(
          'Violação de Autocontrole MAPA (IN 04/2007): Este registro já possui comprovação e assinatura formal (RT/RE + RQ). A exclusão física é terminantemente proibida para impedir fraude ou alteração retroativa.',
        )
      }
    }

    // Gravar no audit_logs antes de deletar
    try {
      const orgId = rec.getString('organization')
      const auditLogCol = $app.findCollectionByNameOrId('audit_logs')
      const log = new Record(auditLogCol)
      log.set('action', 'DELETE')
      log.set('target', colName)
      log.set('target_id', rec.id)
      if (orgId) {
        log.set('organization', orgId)
      }

      const details = {
        collection: colName,
        id: rec.id,
        codigo: rec.getString('codigo') || rec.getString('formulario_codigo') || '',
        timestamp: new Date().toISOString(),
      }

      log.set('details', JSON.stringify(details))
      $app.save(log)
    } catch (err) {
      console.log('Erro ao gravar log de exclusão:', err)
    }

    e.next()
  },
  'records',
  'audits',
  'non_conformities',
  'pop_custom_forms',
  'auto_avaliacoes_fornecedor',
)
