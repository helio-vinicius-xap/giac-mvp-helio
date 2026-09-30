// Serviço de persistência e integração do PAASO com PocketBase (Multi-tenant)
import pb from '@/lib/pocketbase/client'
import type {
  SipeagroItem,
  FornecedorItem,
  QualificacaoItem,
  DevolucaoItem,
  NaoConformidadeFornecedorItem,
  AuditoriaImportacaoItem,
} from '@/types/paaso'
import { normalizarCNPJ, verificarStatusVigencia } from '@/lib/cruzamentoEngine'

/**
 * Retorna o organizationId do usuário logado atual
 */
function getCurrentOrganizationId(): string | undefined {
  const model = pb.authStore.record
  return model?.organization || undefined
}

// ---------------------------------------------------------------------------
// 1. SIPEAGRO
// ---------------------------------------------------------------------------

export async function getSipeagroList(
  filter?: string,
  sort = 'razao_social',
): Promise<SipeagroItem[]> {
  try {
    const records = await pb.collection('sipeagro').getFullList<any>({
      filter,
      sort,
    })
    return records.map((r) => ({
      id: r.id,
      organization: r.organization,
      cnpj: r.cnpj,
      razao_social: r.razao_social,
      registro_sipeagro: r.registro_sipeagro,
      situacao: r.situacao,
      uf: r.uf,
      municipio: r.municipio,
      categoria: r.categoria,
      tipos_produto: Array.isArray(r.tipos_produto) ? r.tipos_produto : [],
      arquivo_origem: r.arquivo_origem,
      importado_em: r.importado_em,
      is_exemplo: r.is_exemplo,
      created: r.created,
      updated: r.updated,
    }))
  } catch (err) {
    console.warn('Erro ao listar sipeagro:', err)
    return []
  }
}

export async function findSipeagroByCnpj(cnpj: string): Promise<SipeagroItem | null> {
  const norm = normalizarCNPJ(cnpj)
  if (!norm) return null

  try {
    const record = await pb.collection('sipeagro').getFirstListItem<any>(`cnpj = '${norm}'`)
    return {
      id: record.id,
      organization: record.organization,
      cnpj: record.cnpj,
      razao_social: record.razao_social,
      registro_sipeagro: record.registro_sipeagro,
      situacao: record.situacao,
      uf: record.uf,
      municipio: record.municipio,
      categoria: record.categoria,
      tipos_produto: Array.isArray(record.tipos_produto) ? record.tipos_produto : [],
      arquivo_origem: record.arquivo_origem,
      importado_em: record.importado_em,
      is_exemplo: record.is_exemplo,
      created: record.created,
      updated: record.updated,
    }
  } catch {
    return null
  }
}

/**
 * Upsert da base SIPEAGRO: atualiza existentes, insere novos, marca inativados
 * e registra auditoria de importação
 */
export async function salvarImportacaoSipeagro(
  estabelecimentos: SipeagroItem[],
  totalLinhasPlanilha: number,
  totalAtivosPlanilha: number,
  arquivoOrigem?: string,
  onProgress?: (porcentagem: number, etapa: string) => void,
): Promise<{
  totalNovos: number
  totalAtualizados: number
  totalInativados: number
  auditoriaId?: string
}> {
  const orgId = getCurrentOrganizationId()
  onProgress?.(10, 'Carregando estabelecimentos pré-existentes na organização...')

  const existentes = await getSipeagroList()
  const existentesPorCnpj = new Map<string, SipeagroItem>()
  for (const ex of existentes) {
    existentesPorCnpj.set(normalizarCNPJ(ex.cnpj), ex)
  }

  const novosCnpjs = new Set<string>()
  const importadosCnpjs = new Set<string>()

  let atualizadosCount = 0
  let novosCount = 0

  const total = estabelecimentos.length
  const batchStep = Math.max(1, Math.floor(total / 20))

  for (let i = 0; i < total; i++) {
    const item = estabelecimentos[i]
    const cnpj = normalizarCNPJ(item.cnpj)
    importadosCnpjs.add(cnpj)

    const payload: any = {
      cnpj,
      razao_social: item.razao_social,
      registro_sipeagro: item.registro_sipeagro || '',
      situacao: 'ATIVO',
      uf: item.uf || '',
      municipio: item.municipio || '',
      categoria: item.categoria || undefined,
      tipos_produto: item.tipos_produto || [],
      arquivo_origem: arquivoOrigem || item.arquivo_origem || '',
      importado_em: new Date().toISOString(),
      is_exemplo: false,
    }
    if (orgId) payload.organization = orgId

    const existente = existentesPorCnpj.get(cnpj)
    try {
      if (existente && existente.id) {
        await pb.collection('sipeagro').update(existente.id, payload)
        atualizadosCount++
      } else {
        await pb.collection('sipeagro').create(payload)
        novosCount++
        novosCnpjs.add(cnpj)
      }
    } catch (err) {
      console.error(`Erro ao salvar CNPJ ${cnpj} no SIPEAGRO:`, err)
    }

    if (i % batchStep === 0) {
      const perc = 10 + Math.round((i / total) * 75)
      onProgress?.(perc, `Gravando registro ${i + 1} de ${total}...`)
    }
  }

  // Identificar inativados: estavam na importação anterior e sumiram/não constam como ATIVO
  onProgress?.(90, 'Identificando CNPJs inativados...')
  const inativadosCnpjs: string[] = []
  for (const [cnpj, ex] of existentesPorCnpj.entries()) {
    if (!importadosCnpjs.has(cnpj) && ex.id) {
      inativadosCnpjs.push(cnpj)
      try {
        await pb.collection('sipeagro').update(ex.id, { situacao: 'INATIVO' })
      } catch (err) {
        console.warn(`Erro ao inativar CNPJ ${cnpj}:`, err)
      }
    }
  }

  // Gravar registro na auditoria_importacoes
  onProgress?.(95, 'Registrando auditoria da importação...')
  let auditId: string | undefined
  try {
    const auditRecord = await pb.collection('auditoria_importacoes').create({
      organization: orgId,
      data_hora: new Date().toISOString(),
      arquivo_origem: arquivoOrigem || 'Arquivo MAPA',
      total_linhas: totalLinhasPlanilha,
      total_ativos: totalAtivosPlanilha,
      novos_cnpj: novosCount,
      inativados_cnpj: inativadosCnpjs,
      status: 'SUCESSO',
      mensagem: `Importação realizada com sucesso. ${novosCount} novos, ${atualizadosCount} atualizados, ${inativadosCnpjs.length} inativados.`,
    })
    auditId = auditRecord.id
  } catch (err) {
    console.warn('Erro ao salvar auditoria de importação:', err)
  }

  onProgress?.(100, 'Processamento da base oficial concluído!')
  return {
    totalNovos: novosCount,
    totalAtualizados: atualizadosCount,
    totalInativados: inativadosCnpjs.length,
    auditoriaId: auditId,
  }
}

// ---------------------------------------------------------------------------
// 2. FORNECEDORES
// ---------------------------------------------------------------------------

export async function getFornecedoresList(): Promise<FornecedorItem[]> {
  try {
    const [fornRecords, qualifs, devols, ncs] = await Promise.all([
      pb.collection('fornecedores').getFullList<any>({ sort: 'razao_social' }),
      pb
        .collection('qualificacoes')
        .getFullList<any>({ sort: '-data_formulario' })
        .catch(() => []),
      pb
        .collection('devolucoes')
        .getFullList<any>()
        .catch(() => []),
      pb
        .collection('nao_conformidades_fornecedor')
        .getFullList<any>()
        .catch(() => []),
    ])

    // Indexar última qualificação por CNPJ
    const qualifMap = new Map<string, QualificacaoItem>()
    for (const q of qualifs) {
      const cnpj = normalizarCNPJ(q.fornecedor_cnpj)
      if (!qualifMap.has(cnpj)) {
        qualifMap.set(cnpj, {
          id: q.id,
          organization: q.organization,
          fornecedor_cnpj: q.fornecedor_cnpj,
          data_formulario: q.data_formulario,
          dados_declarados: q.dados_declarados || {},
          resultado: q.resultado,
          score: q.score || 0,
          divergencias: Array.isArray(q.divergencias) ? q.divergencias : [],
          validade: q.validade,
          status_vigencia: verificarStatusVigencia(q.validade),
          is_exemplo: q.is_exemplo,
        })
      }
    }

    // Contadores de devoluções e NCs abertas por CNPJ
    const devolMap = new Map<string, number>()
    for (const d of devols) {
      const cnpj = normalizarCNPJ(d.fornecedor_cnpj)
      devolMap.set(cnpj, (devolMap.get(cnpj) || 0) + 1)
    }

    const ncMap = new Map<string, number>()
    for (const n of ncs) {
      if (n.status === 'ABERTA' || n.status === 'EM_TRATAMENTO') {
        const cnpj = normalizarCNPJ(n.fornecedor_cnpj)
        ncMap.set(cnpj, (ncMap.get(cnpj) || 0) + 1)
      }
    }

    return fornRecords.map((r) => {
      const cnpjNorm = normalizarCNPJ(r.cnpj)
      return {
        id: r.id,
        organization: r.organization,
        cnpj: cnpjNorm,
        razao_social: r.razao_social,
        contato_nome: r.contato_nome,
        email: r.email,
        telefone: r.telefone,
        uf: r.uf,
        municipio: r.municipio,
        criado_em: r.criado_em || r.created,
        observacoes: r.observacoes,
        is_exemplo: r.is_exemplo,
        created: r.created,
        updated: r.updated,
        qualificacao_vigente: qualifMap.get(cnpjNorm),
        total_devolucoes: devolMap.get(cnpjNorm) || 0,
        total_ncs_abertas: ncMap.get(cnpjNorm) || 0,
      }
    })
  } catch (err) {
    console.warn('Erro ao buscar fornecedores:', err)
    return []
  }
}

export async function criarOuAtualizarFornecedor(
  data: Partial<FornecedorItem>,
): Promise<FornecedorItem> {
  const orgId = getCurrentOrganizationId()
  const cnpjNorm = normalizarCNPJ(data.cnpj)

  const payload: any = {
    cnpj: cnpjNorm,
    razao_social: data.razao_social || '',
    contato_nome: data.contato_nome || '',
    email: data.email || '',
    telefone: data.telefone || '',
    uf: data.uf || '',
    municipio: data.municipio || '',
    criado_em: data.criado_em || new Date().toISOString().split('T')[0],
    observacoes: data.observacoes || '',
    is_exemplo: Boolean(data.is_exemplo),
  }
  if (orgId) payload.organization = orgId

  let record: any
  if (data.id) {
    record = await pb.collection('fornecedores').update(data.id, payload)
  } else {
    // Verificar se já existe por CNPJ
    try {
      const existing = await pb
        .collection('fornecedores')
        .getFirstListItem<any>(`cnpj = '${cnpjNorm}'`)
      record = await pb.collection('fornecedores').update(existing.id, payload)
    } catch {
      record = await pb.collection('fornecedores').create(payload)
    }
  }

  return {
    id: record.id,
    organization: record.organization,
    cnpj: record.cnpj,
    razao_social: record.razao_social,
    contato_nome: record.contato_nome,
    email: record.email,
    telefone: record.telefone,
    uf: record.uf,
    municipio: record.municipio,
    criado_em: record.criado_em,
    observacoes: record.observacoes,
    is_exemplo: record.is_exemplo,
    created: record.created,
    updated: record.updated,
  }
}

// ---------------------------------------------------------------------------
// 3. QUALIFICAÇÕES
// ---------------------------------------------------------------------------

export async function getQualificacoesList(filter?: string): Promise<QualificacaoItem[]> {
  try {
    const list = await pb.collection('qualificacoes').getFullList<any>({
      filter,
      sort: '-data_formulario',
    })
    return list.map((q) => ({
      id: q.id,
      organization: q.organization,
      fornecedor_cnpj: normalizarCNPJ(q.fornecedor_cnpj),
      data_formulario: q.data_formulario,
      dados_declarados: q.dados_declarados || {},
      resultado: q.resultado,
      score: q.score || 0,
      divergencias: Array.isArray(q.divergencias) ? q.divergencias : [],
      validade: q.validade,
      status_vigencia: verificarStatusVigencia(q.validade),
      is_exemplo: q.is_exemplo,
      created: q.created,
      updated: q.updated,
    }))
  } catch (err) {
    console.warn('Erro ao carregar qualificações:', err)
    return []
  }
}

export async function salvarQualificacao(
  data: Omit<QualificacaoItem, 'id' | 'created' | 'updated'>,
): Promise<QualificacaoItem> {
  const orgId = getCurrentOrganizationId()
  const payload: any = {
    fornecedor_cnpj: normalizarCNPJ(data.fornecedor_cnpj),
    data_formulario: data.data_formulario,
    dados_declarados: data.dados_declarados,
    resultado: data.resultado,
    score: data.score,
    divergencias: data.divergencias,
    validade: data.validade,
    status_vigencia: data.status_vigencia,
    is_exemplo: Boolean(data.is_exemplo),
  }
  if (orgId) payload.organization = orgId

  const record = await pb.collection('qualificacoes').create(payload)
  return {
    id: record.id,
    organization: record.organization,
    fornecedor_cnpj: record.fornecedor_cnpj,
    data_formulario: record.data_formulario,
    dados_declarados: record.dados_declarados,
    resultado: record.resultado,
    score: record.score,
    divergencias: record.divergencias,
    validade: record.validade,
    status_vigencia: record.status_vigencia,
    is_exemplo: record.is_exemplo,
    created: record.created,
    updated: record.updated,
  }
}

// ---------------------------------------------------------------------------
// 4. DEVOLUÇÕES
// ---------------------------------------------------------------------------

export async function getDevolucoesList(): Promise<DevolucaoItem[]> {
  try {
    const list = await pb.collection('devolucoes').getFullList<any>({
      sort: '-data',
    })
    return list.map((d) => ({
      id: d.id,
      organization: d.organization,
      data: d.data,
      fornecedor_cnpj: normalizarCNPJ(d.fornecedor_cnpj),
      produto: d.produto,
      lote: d.lote,
      motivo: d.motivo,
      quantidade: d.quantidade,
      valor: d.valor,
      status: d.status || 'Pendente',
      is_exemplo: d.is_exemplo,
      created: d.created,
      updated: d.updated,
    }))
  } catch (err) {
    console.warn('Erro ao buscar devoluções:', err)
    return []
  }
}

export async function criarDevolucao(data: Partial<DevolucaoItem>): Promise<DevolucaoItem> {
  const orgId = getCurrentOrganizationId()
  const payload: any = {
    data: data.data || new Date().toISOString().split('T')[0],
    fornecedor_cnpj: normalizarCNPJ(data.fornecedor_cnpj),
    produto: data.produto || '',
    lote: data.lote || '',
    motivo: data.motivo || '',
    quantidade: Number(data.quantidade || 0),
    valor: Number(data.valor || 0),
    status: data.status || 'Concluída',
    is_exemplo: Boolean(data.is_exemplo),
  }
  if (orgId) payload.organization = orgId

  let record: any
  if (data.id) {
    record = await pb.collection('devolucoes').update(data.id, payload)
  } else {
    record = await pb.collection('devolucoes').create(payload)
  }

  return {
    id: record.id,
    organization: record.organization,
    data: record.data,
    fornecedor_cnpj: record.fornecedor_cnpj,
    produto: record.produto,
    lote: record.lote,
    motivo: record.motivo,
    quantidade: record.quantidade,
    valor: record.valor,
    status: record.status,
    is_exemplo: record.is_exemplo,
    created: record.created,
    updated: record.updated,
  }
}

export async function excluirDevolucao(id: string): Promise<boolean> {
  await pb.collection('devolucoes').delete(id)
  return true
}

// ---------------------------------------------------------------------------
// 5. NÃO CONFORMIDADES DE FORNECEDOR
// ---------------------------------------------------------------------------

export async function getNcFornecedorList(): Promise<NaoConformidadeFornecedorItem[]> {
  try {
    const list = await pb.collection('nao_conformidades_fornecedor').getFullList<any>({
      sort: '-data',
    })
    const today = new Date().toISOString().split('T')[0]

    return list.map((n) => {
      const prazoOnly = n.prazo ? n.prazo.split('T')[0] : ''
      const estourado = Boolean(prazoOnly && prazoOnly < today && n.status !== 'ENCERRADA')
      let diasRestantes = 0
      if (prazoOnly) {
        const diffMs = new Date(prazoOnly).getTime() - new Date(today).getTime()
        diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        id: n.id,
        organization: n.organization,
        data: n.data,
        fornecedor_cnpj: normalizarCNPJ(n.fornecedor_cnpj),
        descricao: n.descricao,
        severidade: n.severidade,
        acao_corretiva: n.acao_corretiva || '',
        prazo: n.prazo || '',
        status: n.status || 'ABERTA',
        is_exemplo: n.is_exemplo,
        estourado,
        dias_restantes: diasRestantes,
        created: n.created,
        updated: n.updated,
      }
    })
  } catch (err) {
    console.warn('Erro ao buscar NCs do fornecedor:', err)
    return []
  }
}

export async function salvarNcFornecedor(
  data: Partial<NaoConformidadeFornecedorItem>,
): Promise<NaoConformidadeFornecedorItem> {
  const orgId = getCurrentOrganizationId()
  const payload: any = {
    data: data.data || new Date().toISOString().split('T')[0],
    fornecedor_cnpj: normalizarCNPJ(data.fornecedor_cnpj),
    descricao: data.descricao || '',
    severidade: data.severidade || 'MEDIA',
    acao_corretiva: data.acao_corretiva || '',
    prazo: data.prazo || '',
    status: data.status || 'ABERTA',
    is_exemplo: Boolean(data.is_exemplo),
  }
  if (orgId) payload.organization = orgId

  let record: any
  if (data.id) {
    record = await pb.collection('nao_conformidades_fornecedor').update(data.id, payload)
  } else {
    record = await pb.collection('nao_conformidades_fornecedor').create(payload)
  }

  return {
    id: record.id,
    organization: record.organization,
    data: record.data,
    fornecedor_cnpj: record.fornecedor_cnpj,
    descricao: record.descricao,
    severidade: record.severidade,
    acao_corretiva: record.acao_corretiva,
    prazo: record.prazo,
    status: record.status,
    is_exemplo: record.is_exemplo,
    created: record.created,
    updated: record.updated,
  }
}

export async function excluirNcFornecedor(id: string): Promise<boolean> {
  await pb.collection('nao_conformidades_fornecedor').delete(id)
  return true
}

// ---------------------------------------------------------------------------
// 6. AUDITORIA DE IMPORTAÇÃO
// ---------------------------------------------------------------------------

export async function getAuditoriasImportacao(): Promise<AuditoriaImportacaoItem[]> {
  try {
    const list = await pb.collection('auditoria_importacoes').getFullList<any>({
      sort: '-data_hora',
    })
    return list.map((a) => ({
      id: a.id,
      organization: a.organization,
      data_hora: a.data_hora,
      arquivo_origem: a.arquivo_origem,
      total_linhas: a.total_linhas || 0,
      total_ativos: a.total_ativos || 0,
      novos_cnpj: a.novos_cnpj || 0,
      inativados_cnpj: Array.isArray(a.inativados_cnpj) ? a.inativados_cnpj : [],
      status: a.status,
      mensagem: a.mensagem,
      created: a.created,
    }))
  } catch (err) {
    console.warn('Erro ao carregar auditorias:', err)
    return []
  }
}
