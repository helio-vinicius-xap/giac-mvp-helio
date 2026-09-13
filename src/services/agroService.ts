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
  papel: 'RT' | 'RQ' | 'RE'
  metodo: 'pfx' | 'gov_br'
  responsavel_nome: string
  responsavel_identificacao?: string
  hash_documento?: string
  observacao?: string
}) => {
  return await pb.send('/backend/v1/assinaturas/registrar', {
    method: 'POST',
    body: payload,
  })
}
