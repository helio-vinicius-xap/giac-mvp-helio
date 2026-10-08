import pb from '@/lib/pocketbase/client'
import type {
  Procedure,
  MonitoringRecord,
  Audit,
  AuditEvidence,
  NonConformity,
  TraceabilityTest,
  Training,
  DocumentItem,
  Company,
  DigitalSignatureRecord,
} from '@/types/agro'

// Procedures
export const getProcedures = async (filter?: string, sort = 'codigo') => {
  return await pb.collection('procedures').getFullList<Procedure>({
    filter,
    sort,
  })
}

export const getProcedureById = async (id: string) => {
  return await pb.collection('procedures').getOne<Procedure>(id)
}

export const createProcedure = async (data: Partial<Procedure>) => {
  return await pb.collection('procedures').create<Procedure>(data)
}

export const updateProcedure = async (id: string, data: Partial<Procedure>) => {
  return await pb.collection('procedures').update<Procedure>(id, data)
}

export const deleteProcedure = async (id: string) => {
  return await pb.collection('procedures').delete(id)
}

// Records
export const getRecords = async (filter?: string, sort = '-data', expand = 'procedure') => {
  return await pb.collection('records').getFullList<MonitoringRecord>({
    filter,
    sort,
    expand,
  })
}

export const createRecord = async (data: Partial<MonitoringRecord> | FormData) => {
  return await pb.collection('records').create<MonitoringRecord>(data)
}

export const updateRecord = async (id: string, data: Partial<MonitoringRecord> | FormData) => {
  return await pb.collection('records').update<MonitoringRecord>(id, data)
}

export const deleteRecord = async (id: string) => {
  return await pb.collection('records').delete(id)
}

// Audits
export const getAudits = async (filter?: string, sort = '-data') => {
  return await pb.collection('audits').getFullList<Audit>({
    filter,
    sort,
  })
}

export const getAuditById = async (id: string) => {
  return await pb.collection('audits').getOne<Audit>(id)
}

export const createAudit = async (data: Partial<Audit>) => {
  return await pb.collection('audits').create<Audit>(data)
}

export const updateAudit = async (id: string, data: Partial<Audit>) => {
  return await pb.collection('audits').update<Audit>(id, data)
}

// Non-Conformities
export const getNonConformities = async (
  filter?: string,
  sort = '-data_identificacao',
  expand = 'audit,procedure,record',
) => {
  return await pb.collection('non_conformities').getFullList<NonConformity>({
    filter,
    sort,
    expand,
  })
}

export const getNonConformityById = async (id: string, expand = 'audit,procedure,record') => {
  return await pb.collection('non_conformities').getOne<NonConformity>(id, {
    expand,
  })
}

export const createNonConformity = async (data: Partial<NonConformity> | FormData) => {
  return await pb.collection('non_conformities').create<NonConformity>(data)
}

export const updateNonConformity = async (id: string, data: Partial<NonConformity> | FormData) => {
  return await pb.collection('non_conformities').update<NonConformity>(id, data)
}

// Traceability Tests
export const getTraceabilityTests = async (filter?: string, sort = '-created') => {
  return await pb.collection('traceability_tests').getFullList<TraceabilityTest>({
    filter,
    sort,
  })
}

export const createTraceabilityTest = async (data: Partial<TraceabilityTest>) => {
  return await pb.collection('traceability_tests').create<TraceabilityTest>(data)
}

// Trainings
export const getTrainings = async (filter?: string, sort = '-data') => {
  return await pb.collection('trainings').getFullList<Training>({
    filter,
    sort,
  })
}

export const createTraining = async (data: Partial<Training> | FormData) => {
  return await pb.collection('trainings').create<Training>(data)
}

export const updateTraining = async (id: string, data: Partial<Training> | FormData) => {
  return await pb.collection('trainings').update<Training>(id, data)
}

// Documents
export const getDocuments = async (filter?: string, sort = 'nome') => {
  return await pb.collection('documents').getFullList<DocumentItem>({
    filter,
    sort,
  })
}

export const createDocument = async (data: FormData | Partial<DocumentItem>) => {
  return await pb.collection('documents').create<DocumentItem>(data)
}

export const deleteDocument = async (id: string) => {
  return await pb.collection('documents').delete(id)
}

// Helper custom endpoint: Traceability lookup
export const lookupTraceability = async (lote: string) => {
  const res = await pb.send(`/backend/v1/rastreabilidade/${encodeURIComponent(lote)}`, {
    method: 'GET',
  })
  return res
}

// Helper custom endpoint: Dashboard summary
export const getDashboardSummary = async () => {
  return await pb.send('/backend/v1/dashboard/resumo', {
    method: 'GET',
  })
}

// Helper custom endpoint: Notifications
export const getNotificationsSummary = async () => {
  return await pb.send('/backend/v1/notificacoes/resumo', {
    method: 'GET',
  })
}

// Company (SIPEAGRO / MAPA)
export const getCompany = async () => {
  const records = await pb.collection('company').getFullList<Company>({
    sort: '-created',
    limit: 1,
  })
  return records.length > 0 ? records[0] : null
}

export const createCompany = async (data: Partial<Company> | FormData) => {
  return await pb.collection('company').create<Company>(data)
}

export const updateCompany = async (id: string, data: Partial<Company> | FormData) => {
  return await pb.collection('company').update<Company>(id, data)
}

// Custom endpoints: POP & Record PDF Data
export const getProcedurePdfData = async (id: string) => {
  return await pb.send(`/backend/v1/procedimentos/${id}/documento-pdf`, {
    method: 'GET',
  })
}

export const getRecordPdfData = async (id: string) => {
  return await pb.send(`/backend/v1/registros/${id}/documento-pdf`, {
    method: 'GET',
  })
}

// Custom endpoint: Digital Signatures (PFX or Gov.br)
export const registerDigitalSignature = async (payload: {
  tipo_alvo: 'procedure' | 'record'
  id_alvo: string
  papel: 'RT' | 'RQ' | 'RE' | 'Direcao' | 'CQ' | string
  metodo: 'pfx' | 'gov_br' | 'imagem' | string
  responsavel_nome: string
  responsavel_identificacao?: string
  imagem_url?: string
  hash_documento?: string
  observacao?: string
}) => {
  return await pb.send('/backend/v1/assinaturas/registrar', {
    method: 'POST',
    body: payload,
  })
}

// User Profile Signature Image upload/update
export const uploadRtSignatureImage = async (userId: string, file: File) => {
  const formData = new FormData()
  formData.append('assinatura_imagem', file)
  return await pb.collection('users').update(userId, formData)
}

export const getFileUrl = (record: any, fileName: string) => {
  if (!record || !fileName) return ''
  return pb.files.getURL(record, fileName)
}

// -------------------------------------------------------------
// MULTI-TENANCY, ASINATURAS, PLANOS E SUPER ADMIN
// -------------------------------------------------------------

// Obter organização pelo ID ou da sessão atual
export const getOrganization = async (id: string) => {
  return await pb.collection('organizations').getOne(id, { expand: 'plan' })
}

export const getOrganizationsList = async (filter?: string, sort = '-created') => {
  return await pb.collection('organizations').getFullList({
    filter,
    sort,
    expand: 'plan',
  })
}

export const updateOrganization = async (id: string, data: any) => {
  return await pb.collection('organizations').update(id, data)
}

export const createOrganization = async (data: any) => {
  return await pb.collection('organizations').create(data)
}

// Planos
export const getPlans = async (filter?: string, sort = 'monthly_price') => {
  return await pb.collection('plans').getFullList({
    filter,
    sort,
  })
}

export const updatePlan = async (id: string, data: any) => {
  return await pb.collection('plans').update(id, data)
}

export const createPlan = async (data: any) => {
  return await pb.collection('plans').create(data)
}

// Faturas
export const getInvoices = async (filter?: string, sort = '-created') => {
  return await pb.collection('invoices').getFullList({
    filter,
    sort,
    expand: 'organization',
  })
}

export const createBillingInvoice = async (payload: {
  organization_id?: string
  billing_type?: string
  due_date?: string
}) => {
  return await pb.send('/backend/v1/billing/create-invoice', {
    method: 'POST',
    body: payload,
  })
}

export const simulateInvoicePayment = async (invoiceId: string) => {
  return await pb.send('/backend/v1/billing/simulate-payment', {
    method: 'POST',
    body: { invoice_id: invoiceId },
  })
}

// Super Admin Dashboard Stats
export const getSuperAdminStats = async () => {
  return await pb.send('/backend/v1/admin/dashboard-stats', {
    method: 'GET',
  })
}

// Audit Logs
export const getAuditLogs = async (filter?: string, sort = '-created') => {
  return await pb.collection('audit_logs').getFullList({
    filter,
    sort,
    expand: 'user,organization',
  })
}

export const getAuditLogsList = async (
  page = 1,
  perPage = 30,
  filter?: string,
  sort = '-created',
) => {
  return await pb.collection('audit_logs').getList(page, perPage, {
    filter,
    sort,
    expand: 'user,organization',
  })
}

export const getAuditLogsByTarget = async (targetId: string, limit = 50) => {
  if (!targetId) return []
  return await pb.collection('audit_logs').getFullList({
    filter: `target_id = "${targetId}"`,
    sort: '-created',
    expand: 'user,organization',
  })
}

// Zerar dados de negócio de uma organização (Super Admin)
export const purgeOrganizationData = async (payload: {
  organization_id: string
  confirmation_cnpj: string
  confirmation_keyword: string
}) => {
  return await pb.send('/backend/v1/admin/purge-organization-data', {
    method: 'POST',
    body: payload,
  })
}

// Salvar revisão de texto normativo do POP (com validação de senha do Administrador)
export const saveProcedureRevision = async (
  procedureId: string,
  payload: {
    admin_password: string
    admin_email?: string
    descricao_alteracao?: string
    versao?: string
    secoes_normativas?: any
    campos_execucao?: any
    texto_completo?: string
  },
) => {
  return await pb.send(`/backend/v1/procedures/${procedureId}/save-revision`, {
    method: 'POST',
    body: payload,
  })
}

// Restaurar revisão do POP
export const restoreProcedureRevision = async (
  procedureId: string,
  payload: {
    revision_id: string
    admin_password: string
  },
) => {
  return await pb.send(`/backend/v1/procedures/${procedureId}/restore-revision`, {
    method: 'POST',
    body: payload,
  })
}

// Listar revisões do POP
export const getProcedureRevisions = async (procedureId: string) => {
  return await pb.collection('procedure_revisions').getFullList({
    filter: `procedure = "${procedureId}"`,
    sort: '-created',
  })
}

// Formulários Customizados por POP
export const getPopCustomForms = async (procedureId?: string) => {
  const filter = procedureId ? `procedure = "${procedureId}"` : undefined
  return await pb.collection('pop_custom_forms').getFullList({
    filter,
    sort: 'codigo',
  })
}

export const createPopCustomForm = async (payload: any) => {
  return await pb.collection('pop_custom_forms').create(payload)
}

export const updatePopCustomForm = async (id: string, payload: any) => {
  return await pb.collection('pop_custom_forms').update(id, payload)
}

export const deletePopCustomForm = async (id: string) => {
  return await pb.collection('pop_custom_forms').delete(id)
}

// Master / Super Admin: Zeragem Total de Dados de Teste
export const executeMasterResetAllData = async (confirmacao: string) => {
  return await pb.send('/backend/v1/master/reset-all-data', {
    method: 'POST',
    body: { confirmacao },
  })
}

// Master / Super Admin: Criar Organização de Teste com Hierarquia Completa
export interface CreateTestOrgPayload {
  nome_fantasia?: string
  segmento?: string
  cnpj?: string
  senha_padrao?: string
}

export const createTestOrganizationHierarchy = async (payload: CreateTestOrgPayload) => {
  return await pb.send('/backend/v1/master/create-test-organization', {
    method: 'POST',
    body: payload,
  })
}
