// Serviço de persistência e integração do PAASO com PocketBase (Multi-tenant)
import pb from '@/lib/pocketbase/client'
import type {
  SipeagroItem,
  FornecedorItem,
  QualificacaoItem,
  DevolucaoItem,
  NaoConformidadeFornecedorItem,
  AuditoriaImportacaoItem,
  FornecedorValidadoItem,
  StatusFornecedorValidado,
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

  // Carregar lista de CNPJs existentes na organização
  const existentes = await getSipeagroList()
  const existentesPorCnpj = new Map<string, SipeagroItem>()
  for (const ex of existentes) {
    existentesPorCnpj.set(normalizarCNPJ(ex.cnpj), ex)
  }

  const importadosCnpjs = new Set<string>()
  for (const item of estabelecimentos) {
    importadosCnpjs.add(normalizarCNPJ(item.cnpj))
  }

  let totalNovos = 0
  let totalAtualizados = 0

  const total = estabelecimentos.length
  // Enviar em blocos de até 150 registros para manter o payload leve e dentro do limite de transação SQLite
  const CHUNK_SIZE = 150
  const totalChunks = Math.ceil(total / CHUNK_SIZE)

  onProgress?.(15, `Iniciando gravação contínua em ${totalChunks} lotes (0/${total})...`)

  for (let c = 0; c < totalChunks; c++) {
    const start = c * CHUNK_SIZE
    const end = Math.min(start + CHUNK_SIZE, total)
    const chunk = estabelecimentos.slice(start, end).map((item) => ({
      cnpj: normalizarCNPJ(item.cnpj),
      razao_social: item.razao_social,
      registro_sipeagro: item.registro_sipeagro || '',
      situacao: 'ATIVO',
      uf: item.uf || '',
      municipio: item.municipio || '',
      categoria: item.categoria || undefined,
      tipos_produto: item.tipos_produto || [],
      arquivo_origem: arquivoOrigem || item.arquivo_origem || '',
    }))

    let chunkSucesso = false
    let tentativas = 0

    while (!chunkSucesso && tentativas < 3) {
      try {
        tentativas++
        const res = await pb.send('/backend/v1/sipeagro/batch-chunk', {
          method: 'POST',
          body: {
            organization_id: orgId,
            items: chunk,
          },
        })

        totalNovos += Number(res.inserted || 0)
        totalAtualizados += Number(res.updated || 0)
        chunkSucesso = true
      } catch (chunkErr: any) {
        console.warn(`Tentativa ${tentativas} falhou no lote ${c + 1}/${totalChunks}:`, chunkErr)
        if (tentativas >= 3) {
          // Fallback gracioso: tentar registro a registro dentro deste chunk com delay
          console.warn('Executando fallback individual para o lote...')
          for (const item of chunk) {
            try {
              const ex = existentesPorCnpj.get(item.cnpj)
              if (ex && ex.id) {
                await pb.collection('sipeagro').update(ex.id, {
                  ...item,
                  organization: orgId,
                  situacao: 'ATIVO',
                  is_exemplo: false,
                  importado_em: new Date().toISOString(),
                })
                totalAtualizados++
              } else {
                await pb.collection('sipeagro').create({
                  ...item,
                  organization: orgId,
                  situacao: 'ATIVO',
                  is_exemplo: false,
                  importado_em: new Date().toISOString(),
                })
                totalNovos++
              }
              await new Promise((r) => setTimeout(r, 20))
            } catch (singleErr) {
              console.error(`Erro ao salvar CNPJ individual ${item.cnpj}:`, singleErr)
            }
          }
          chunkSucesso = true
        } else {
          // Aguarda 400ms antes da próxima tentativa
          await new Promise((r) => setTimeout(r, 400))
        }
      }
    }

    // Atualiza progresso contínuo (de 15% até 88%)
    const pct = Math.round(15 + ((c + 1) / totalChunks) * 73)
    onProgress?.(
      pct,
      `Gravando lote ${c + 1} de ${totalChunks} (${end.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} registros gravados)...`,
    )

    // Pequena pausa para liberar o loop de eventos e a UI
    if (c < totalChunks - 1) {
      await new Promise((r) => setTimeout(r, 40))
    }
  }

  // Identificar CNPJs inativados
  onProgress?.(90, 'Identificando CNPJs inativados na base...')
  const inativadosCnpjs: string[] = []
  for (const [cnpj, ex] of existentesPorCnpj.entries()) {
    if (!ex.is_exemplo && !importadosCnpjs.has(cnpj) && ex.id) {
      inativadosCnpjs.push(cnpj)
      try {
        await pb.collection('sipeagro').update(ex.id, { situacao: 'INATIVO' })
      } catch (err) {
        console.warn(`Erro ao inativar CNPJ ${cnpj}:`, err)
      }
    }
  }

  // Gravar registro na auditoria_importacoes e na trilha geral através do backend hook
  onProgress?.(95, 'Registrando auditoria oficial da importação...')
  let auditId: string | undefined
  try {
    const finishRes = await pb.send('/backend/v1/sipeagro/finish-import', {
      method: 'POST',
      body: {
        organization_id: orgId,
        arquivo_origem: arquivoOrigem || 'Planilha Oficial MAPA',
        total_linhas: totalLinhasPlanilha,
        total_ativos: totalAtivosPlanilha,
        novos_count: totalNovos,
        atualizados_count: totalAtualizados,
        inativados_count: inativadosCnpjs.length,
        inativados_cnpjs: inativadosCnpjs.slice(0, 500),
        status: 'SUCESSO',
        mensagem: `Importação concluída com sucesso. ${totalLinhasPlanilha.toLocaleString('pt-BR')} linhas processadas, ${totalNovos} novos CNPJs, ${totalAtualizados} atualizados, ${inativadosCnpjs.length} inativados.`,
      },
    })
    auditId = finishRes?.auditoria_id
  } catch (err) {
    console.warn('Erro ao chamar /finish-import no backend, usando gravação direta:', err)
    try {
      const directAudit = await pb.collection('auditoria_importacoes').create({
        organization: orgId,
        data_hora: new Date().toISOString(),
        arquivo_origem: arquivoOrigem || 'Arquivo MAPA',
        total_linhas: totalLinhasPlanilha,
        total_ativos: totalAtivosPlanilha,
        novos_cnpj: totalNovos,
        inativados_cnpj: inativadosCnpjs.slice(0, 500),
        status: 'SUCESSO',
        mensagem: `Importação realizada com sucesso. ${totalNovos} novos, ${totalAtualizados} atualizados, ${inativadosCnpjs.length} inativados.`,
      })
      auditId = directAudit.id
    } catch (directErr) {
      console.warn('Erro ao salvar auditoria de importação direta:', directErr)
    }
  }

  onProgress?.(100, 'Processamento da base oficial concluído!')
  return {
    totalNovos,
    totalAtualizados,
    totalInativados: inativadosCnpjs.length,
    auditoriaId: auditId,
  }
}

/**
 * Exclui todos os registros SIPEAGRO importados da organização
 * preservando os registros de exemplo (is_exemplo = true)
 */
export async function excluirBaseSipeagroImportada(
  motivo?: string,
): Promise<{ success: boolean; deletedCount: number; message: string }> {
  const orgId = getCurrentOrganizationId()

  try {
    const res = await pb.send('/backend/v1/sipeagro/purge-imported', {
      method: 'POST',
      body: {
        organization_id: orgId,
        motivo: motivo || 'Exclusão da base importada solicitada pelo usuário na aba SIPEAGRO',
      },
    })

    return {
      success: true,
      deletedCount: Number(res.deleted_count || 0),
      message: res.message || 'Base importada excluída com sucesso.',
    }
  } catch (err: any) {
    console.warn('Falha no endpoint /purge-imported, executando fallback direto via SDK:', err)
    // Fallback: buscar e deletar registros não-exemplo da organização
    const importados = await pb.collection('sipeagro').getFullList<any>({
      filter: 'is_exemplo != true',
    })

    let deleted = 0
    for (const item of importados) {
      try {
        await pb.collection('sipeagro').delete(item.id)
        deleted++
      } catch (delErr) {
        console.warn(`Erro ao excluir registro SIPEAGRO ${item.id}:`, delErr)
      }
    }

    return {
      success: true,
      deletedCount: deleted,
      message: `Base importada excluída (${deleted} registros removidos).`,
    }
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

  // Sincronizar com o banco global fornecedores_validados se APROVADO ou APROVADO_COM_RESSALVA
  try {
    await sincronizarFornecedorValidadoAposQualificacao(record)
  } catch (syncErr) {
    console.warn('Erro ao sincronizar fornecedor validado no frontend:', syncErr)
  }

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

// ---------------------------------------------------------------------------
// 7. BANCO COMPARTILHADO: FORNECEDORES VALIDADOS (GLOBAL)
// ---------------------------------------------------------------------------

/**
 * Calcula a categoria de risco proporcional aos tipos de produtos
 */
export function calcularCategoriaRiscoProdutos(tipos: string[]): string {
  if (!tipos || tipos.length === 0) return 'Médio Risco (Geral)'
  const tiposNorm = tipos.map((t) => t.toLowerCase())
  if (
    tiposNorm.some((t) => t.includes('aditivo') || t.includes('premix') || t.includes('núcleo'))
  ) {
    return 'Alto Risco (Microingredientes/Aditivos)'
  }
  if (
    tiposNorm.some(
      (t) => t.includes('concentrado') || t.includes('ração') || t.includes('suplemento'),
    )
  ) {
    return 'Médio Risco (Compostos/Rações)'
  }
  return 'Baixo Risco (Matérias-primas/Armazenagem)'
}

/**
 * Sincroniza um fornecedor no banco global quando qualificado
 */
export async function sincronizarFornecedorValidadoAposQualificacao(
  qualifRecord: any,
): Promise<void> {
  const cnpjNorm = normalizarCNPJ(qualifRecord.fornecedor_cnpj)
  if (!cnpjNorm) return

  const resultado = qualifRecord.resultado
  const isAprovado = resultado === 'APROVADO' || resultado === 'APROVADO_COM_RESSALVA'

  // Buscar registro da organização para obter o nome
  let orgNome = ''
  if (qualifRecord.organization) {
    try {
      const org = await pb.collection('organizations').getOne(qualifRecord.organization)
      orgNome = org.nome_fantasia || org.razao_social || ''
    } catch {
      /* intentionally ignored */
    }
  }

  const dadosDeclarados = qualifRecord.dados_declarados || {}
  const tiposProduto = Array.isArray(dadosDeclarados.tipos_produto)
    ? dadosDeclarados.tipos_produto
    : []

  // Calcular validade de 1 ano
  const dataAprov = qualifRecord.data_formulario || new Date().toISOString().split('T')[0]
  const dataObj = new Date(dataAprov)
  dataObj.setFullYear(dataObj.getFullYear() + 1)
  const validade1Ano = dataObj.toISOString().split('T')[0]

  const statusValidade: StatusFornecedorValidado = isAprovado ? 'VALIDADO' : 'EXPIRADO'
  const categoriaRisco = calcularCategoriaRiscoProdutos(tiposProduto)

  const payload: any = {
    cnpj: cnpjNorm,
    razao_social: dadosDeclarados.razao_social || 'Fornecedor Homologado',
    registro_sipeagro: dadosDeclarados.registro_sipeagro || '',
    situacao: 'ATIVO',
    uf: dadosDeclarados.uf || '',
    municipio: dadosDeclarados.municipio || '',
    categoria: dadosDeclarados.categoria || undefined,
    tipos_produto: tiposProduto,
    categoria_de_risco: categoriaRisco,
    status: statusValidade,
    data_aprovacao: isAprovado ? dataAprov : undefined,
    validade_aprovacao: isAprovado ? validade1Ano : undefined,
    score_aprovacao: qualifRecord.score || 0,
    origem_organizacao: qualifRecord.organization || undefined,
    origem_organizacao_nome: orgNome,
    origem_qualificacao: qualifRecord.id,
  }

  try {
    const existing = await pb
      .collection('fornecedores_validados')
      .getFirstListItem<any>(`cnpj = '${cnpjNorm}'`)

    // Se já existe e foi aprovado, renova data e validade; se reprovado, marca como EXPIRADO
    await pb.collection('fornecedores_validados').update(existing.id, {
      ...payload,
      total_utilizacoes: existing.total_utilizacoes || 1,
    })
  } catch {
    // Se não existe, cria apenas se for aprovado
    if (isAprovado) {
      await pb.collection('fornecedores_validados').create({
        ...payload,
        total_utilizacoes: 1,
      })
    }
  }
}

/**
 * Lista todos os fornecedores validados do banco compartilhado do sistema
 */
export async function getFornecedoresValidadosList(
  filter?: string,
  sort = '-validade_aprovacao',
): Promise<FornecedorValidadoItem[]> {
  try {
    const list = await pb.collection('fornecedores_validados').getFullList<any>({
      filter,
      sort,
    })

    const hoje = new Date().toISOString().split('T')[0]

    return list.map((item) => {
      let diasRestantes = 0
      let statusReal: StatusFornecedorValidado = item.status || 'VALIDADO'

      if (item.validade_aprovacao) {
        const valOnly = item.validade_aprovacao.split('T')[0]
        const diffMs = new Date(valOnly).getTime() - new Date(hoje).getTime()
        diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24))
        if (diasRestantes <= 0) {
          statusReal = 'EXPIRADO'
        }
      }

      return {
        id: item.id,
        cnpj: normalizarCNPJ(item.cnpj),
        razao_social: item.razao_social,
        registro_sipeagro: item.registro_sipeagro,
        situacao: item.situacao || 'ATIVO',
        uf: item.uf,
        municipio: item.municipio,
        categoria: item.categoria,
        tipos_produto: Array.isArray(item.tipos_produto) ? item.tipos_produto : [],
        categoria_de_risco: item.categoria_de_risco,
        status: statusReal,
        data_aprovacao: item.data_aprovacao,
        validade_aprovacao: item.validade_aprovacao,
        score_aprovacao: item.score_aprovacao || 0,
        origem_organizacao: item.origem_organizacao,
        origem_organizacao_nome: item.origem_organizacao_nome,
        origem_qualificacao: item.origem_qualificacao,
        total_utilizacoes: item.total_utilizacoes || 0,
        created: item.created,
        updated: item.updated,
        dias_restantes: diasRestantes,
      }
    })
  } catch (err) {
    console.warn('Erro ao listar fornecedores validados:', err)
    return []
  }
}

/**
 * Ação "Usar este fornecedor": copia/associa o fornecedor validado para a organização atual
 */
export async function importarFornecedorValidadoParaOrganizacao(
  validado: FornecedorValidadoItem,
): Promise<FornecedorItem> {
  const forn = await criarOuAtualizarFornecedor({
    cnpj: validado.cnpj,
    razao_social: validado.razao_social,
    uf: validado.uf,
    municipio: validado.municipio,
    observacoes: `Importado do banco compartilhado de fornecedores validados do sistema. Score de homologação: ${validado.score_aprovacao || 0} pts.`,
  })

  // Incrementar contador de utilizações no banco compartilhado
  if (validado.id) {
    try {
      await pb.collection('fornecedores_validados').update(validado.id, {
        total_utilizacoes: (validado.total_utilizacoes || 0) + 1,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  return forn
}

/**
 * Super Admin: atualizar manualmente status ou validade de um fornecedor validado
 */
export async function superAdminAtualizarFornecedorValidado(
  id: string,
  data: Partial<FornecedorValidadoItem>,
): Promise<void> {
  await pb.collection('fornecedores_validados').update(id, data)
}

/**
 * Super Admin: excluir fornecedor validado
 */
export async function superAdminExcluirFornecedorValidado(id: string): Promise<void> {
  await pb.collection('fornecedores_validados').delete(id)
}

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
