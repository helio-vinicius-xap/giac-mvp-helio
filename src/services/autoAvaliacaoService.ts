import pb from '@/lib/pocketbase/client'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import { carregarSheetJs } from '@/lib/sipeagroParser'
import type {
  QuestionarioFornecedorDef,
  PerguntaQuestionarioItem,
  AutoAvaliacaoFornecedorItem,
} from '@/types/autoAvaliacaoFornecedor'

function getCurrentOrgId(): string | undefined {
  return pb.authStore.record?.organization || undefined
}

// -----------------------------------------------------------------------------
// 1. QUESTIONÁRIO DE AUTO AVALIAÇÃO (DEFINIÇÃO SALVA NO BANCO)
// -----------------------------------------------------------------------------

export async function getQuestionarioAtivo(): Promise<QuestionarioFornecedorDef | null> {
  try {
    const list = await pb.collection('questionarios_fornecedor').getFullList<any>({
      filter: 'is_ativo = true',
      sort: '-created',
      requestKey: null,
    })
    if (list.length === 0) {
      // Se não achou ativo, pega o mais recente da organização
      const fallbackList = await pb.collection('questionarios_fornecedor').getFullList<any>({
        sort: '-created',
        requestKey: null,
      })
      if (fallbackList.length === 0) return null
      const item = fallbackList[0]
      return {
        id: item.id,
        organization: item.organization,
        codigo: item.codigo,
        titulo: item.titulo,
        versao_revisao: item.versao_revisao,
        arquivo_origem: item.arquivo_origem,
        perguntas: Array.isArray(item.perguntas) ? item.perguntas : [],
        limiar_aprovacao: item.limiar_aprovacao ?? 70,
        is_ativo: item.is_ativo,
        created: item.created,
        updated: item.updated,
      }
    }

    const item = list[0]
    return {
      id: item.id,
      organization: item.organization,
      codigo: item.codigo,
      titulo: item.titulo,
      versao_revisao: item.versao_revisao,
      arquivo_origem: item.arquivo_origem,
      perguntas: Array.isArray(item.perguntas) ? item.perguntas : [],
      limiar_aprovacao: item.limiar_aprovacao ?? 70,
      is_ativo: item.is_ativo,
      created: item.created,
      updated: item.updated,
    }
  } catch (err) {
    console.warn('Erro ao carregar questionario ativo:', err)
    return null
  }
}

/**
 * Lê o arquivo .xlsx fornecido pelo usuário EM RUNTIME via SheetJS,
 * extrai as 20 perguntas da coluna de descrição (corrigindo a ordem se necessário: 18 antes de 19),
 * metadados de cabeçalho e persiste no banco (questionarios_fornecedor).
 * NENHUM texto de pergunta é embutido no código fonte.
 */
export async function importarQuestionarioXlsxRuntime(file: File): Promise<{
  questionario: QuestionarioFornecedorDef
  perguntasCount: number
  cabecalhoExtraido?: {
    codigo?: string
    elaboracao?: string
    edicao?: string
    revisao?: string
  }
}> {
  const XLSX = await carregarSheetJs()
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('A planilha selecionada está vazia.')
  }

  // Tenta encontrar a aba com nome "P01-AC-01" ou usa a primeira
  let targetSheetName =
    workbook.SheetNames.find(
      (s: string) =>
        s.toLowerCase().includes('auto_aval') ||
        s.toLowerCase().includes('p01-ac-01') ||
        s.toLowerCase().includes('questionario'),
    ) || workbook.SheetNames[0]

  const worksheet = workbook.Sheets[targetSheetName]
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Nenhum dado encontrado na aba da planilha.')
  }

  // 1. Procurar metadados no cabeçalho (Código, Elaboração, Edição, Revisão)
  let codigoDoc = 'POP 01-AC01'
  let elaboracaoDoc = ''
  let edicaoDoc = ''
  let revisaoDoc = 'Rev.01'
  let tituloDoc = 'FORMULÁRIO DE AUTO AVALIAÇÃO DO FORNECEDOR'

  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const row = rawRows[r]
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim()
      const valLower = val.toLowerCase()
      if (
        valLower.includes('questionário de auto avaliação') ||
        valLower.includes('auto avaliacao')
      ) {
        tituloDoc = val
      }
      if (valLower.startsWith('código:') || valLower.startsWith('codigo:')) {
        const nextVal = String(row[c + 1] || '').trim()
        if (nextVal) codigoDoc = nextVal
      }
      if (valLower.startsWith('elaboração:') || valLower.startsWith('elaboracao:')) {
        const nextVal = row[c + 1]
        elaboracaoDoc = formatarDataOuString(nextVal)
      }
      if (valLower.startsWith('edição') || valLower.startsWith('edicao')) {
        const nextVal = row[c + 1]
        edicaoDoc = formatarDataOuString(nextVal)
      }
      if (valLower.startsWith('revisão') || valLower.startsWith('revisao')) {
        const nextVal = String(row[c + 1] || '').trim()
        if (nextVal) revisaoDoc = nextVal
      }
    }
  }

  // 2. Extrair perguntas dinamicamente das linhas da coluna 1 (ou colunas de texto)
  // A planilha possui linhas como: "1 - O fornecedor comprova...", "2 - Existem...", etc.
  const perguntasMap = new Map<number, string>()

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r]
    if (!row || row.length === 0) continue

    for (let c = 0; c < Math.min(row.length, 5); c++) {
      const cellText = String(row[c] || '').trim()
      if (!cellText) continue

      // Regex para identificar itens numerados de 1 a 20: ex "1 - ...", "1. ...", "1  - ..."
      const match = cellText.match(/^(\d{1,2})\s*[-–—.]\s*(.+)$/s)
      if (match) {
        const num = parseInt(match[1], 10)
        const textoDescricao = match[2].trim()
        // Permitir somente perguntas do questionário (1 a 20)
        if (num >= 1 && num <= 20 && textoDescricao.length > 5) {
          if (!perguntasMap.has(num)) {
            perguntasMap.set(num, textoDescricao)
          }
        }
      }
    }
  }

  if (perguntasMap.size === 0) {
    throw new Error(
      'Não foram encontradas perguntas numeradas (1 a 20) na planilha. Certifique-se de importar o arquivo oficial do POP 01-AC01.',
    )
  }

  // 3. Montar a lista de perguntas respeitando a ordem correta
  // O usuário solicitou: "Corrigir a ordem invertida da planilha (19 antes de 18): exibir 18 antes de 19."
  // Ao ordenar por número natural (1..20), o 18 ficará naturalmente antes do 19!
  const sortedNumeros = Array.from(perguntasMap.keys()).sort((a, b) => a - b)

  const perguntas: PerguntaQuestionarioItem[] = sortedNumeros.map((num) => {
    const texto = perguntasMap.get(num) || ''
    // Classificação conforme o pedido:
    // Perguntas 1–2 gerais; 3–9 e 20 para fabricantes de MP/embalagem; 10–17 e 18–19 para todos.
    let grupo: 'geral' | 'fabricante_mp' | 'todos' = 'todos'
    if (num <= 2) {
      grupo = 'geral'
    } else if ((num >= 3 && num <= 9) || num === 20) {
      grupo = 'fabricante_mp'
    } else {
      grupo = 'todos'
    }

    return {
      numero: num,
      texto,
      grupo,
      obrigatorio: true,
    }
  })

  // 4. Gravar no banco (desativando definições anteriores se houver)
  const orgId = getCurrentOrgId()

  try {
    const prevs = await pb.collection('questionarios_fornecedor').getFullList<any>({
      filter: 'is_ativo = true',
      requestKey: null,
    })
    for (const p of prevs) {
      await pb.collection('questionarios_fornecedor').update(p.id, { is_ativo: false })
    }
  } catch {
    /* intentionally ignored */
  }

  const payload: any = {
    codigo: codigoDoc || 'POP 01-AC01',
    titulo: tituloDoc || 'FORMULÁRIO DE AUTO AVALIAÇÃO DO FORNECEDOR',
    versao_revisao: revisaoDoc || 'Rev.01',
    arquivo_origem: file.name,
    perguntas: perguntas,
    limiar_aprovacao: 70,
    is_ativo: true,
  }
  if (orgId) payload.organization = orgId

  const savedRecord = await pb.collection('questionarios_fornecedor').create(payload)

  // 5. Registrar evento na trilha de auditoria (audit_logs)
  try {
    await registrarAuditoriaLog({
      action: 'IMPORT_QUESTIONARIO_XLSX',
      target: 'questionarios_fornecedor',
      target_id: savedRecord.id,
      details: {
        arquivo_nome: file.name,
        tamanho_bytes: file.size,
        total_perguntas_extraidas: perguntas.length,
        codigo_doc: codigoDoc,
        revisao_doc: revisaoDoc,
      },
    })
  } catch (err) {
    console.warn('Erro ao gravar log de auditoria da importação:', err)
  }

  const questionario: QuestionarioFornecedorDef = {
    id: savedRecord.id,
    organization: savedRecord.organization,
    codigo: savedRecord.codigo,
    titulo: savedRecord.titulo,
    versao_revisao: savedRecord.versao_revisao,
    arquivo_origem: savedRecord.arquivo_origem,
    perguntas: savedRecord.perguntas,
    limiar_aprovacao: savedRecord.limiar_aprovacao,
    is_ativo: savedRecord.is_ativo,
    created: savedRecord.created,
    updated: savedRecord.updated,
  }

  return {
    questionario,
    perguntasCount: perguntas.length,
    cabecalhoExtraido: {
      codigo: codigoDoc,
      elaboracao: elaboracaoDoc,
      edicao: edicaoDoc,
      revisao: revisaoDoc,
    },
  }
}

function formatarDataOuString(val: any): string {
  if (!val) return ''
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0]
  }
  const str = String(val).trim()
  // Se for timestamp tipo "Wed Oct 07 2026..."
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }
  return str
}

// -----------------------------------------------------------------------------
// 2. AUTO AVALIAÇÕES (PERSISTÊNCIA, SEQUÊNCIA PAC-01_R0001, LISTAGEM)
// -----------------------------------------------------------------------------

/**
 * Gera o próximo número sequencial com o prefixo PAC-01_R0001, PAC-01_R0002...
 */
export async function gerarProximoNumeroAutoAvaliacao(): Promise<string> {
  try {
    const list = await pb.collection('auto_avaliacoes_fornecedor').getFullList<any>({
      sort: '-created',
      fields: 'numero_registro',
      requestKey: null,
    })

    let maxNum = 0
    for (const item of list) {
      const match = String(item.numero_registro || '').match(/PAC-01_R(\d+)/i)
      if (match) {
        const val = parseInt(match[1], 10)
        if (val > maxNum) maxNum = val
      }
    }

    const next = maxNum + 1
    return `PAC-01_R${String(next).padStart(4, '0')}`
  } catch (err) {
    console.warn('Erro ao calcular próximo número:', err)
    return 'PAC-01_R0001'
  }
}

export async function getAutoAvaliacoesList(
  filter?: string,
): Promise<AutoAvaliacaoFornecedorItem[]> {
  try {
    const records = await pb.collection('auto_avaliacoes_fornecedor').getFullList<any>({
      filter,
      sort: '-created',
      requestKey: null,
    })

    return records.map(mapRecordToAutoAvaliacao)
  } catch (err) {
    console.warn('Erro ao listar auto avaliações:', err)
    return []
  }
}

export async function getAutoAvaliacaoById(
  id: string,
): Promise<AutoAvaliacaoFornecedorItem | null> {
  try {
    const record = await pb.collection('auto_avaliacoes_fornecedor').getOne<any>(id, {
      requestKey: null,
    })
    return mapRecordToAutoAvaliacao(record)
  } catch (err) {
    console.warn('Erro ao buscar auto avaliação por id:', err)
    return null
  }
}

export async function salvarAutoAvaliacao(
  data: Partial<AutoAvaliacaoFornecedorItem>,
): Promise<AutoAvaliacaoFornecedorItem> {
  const orgId = getCurrentOrgId()
  const cnpjNorm = normalizarCNPJ(data.fornecedor_cnpj || data.dados_cadastrais?.cnpj || '')

  let numeroRegistro = data.numero_registro
  if (!numeroRegistro) {
    numeroRegistro = await gerarProximoNumeroAutoAvaliacao()
  }

  const payload: any = {
    numero_registro: numeroRegistro,
    fornecedor_cnpj: cnpjNorm,
    razao_social: data.razao_social || data.dados_cadastrais?.razao_social || '',
    nome_fantasia: data.nome_fantasia || data.dados_cadastrais?.nome_fantasia || '',
    data_avaliacao: data.data_avaliacao || new Date().toISOString().split('T')[0],
    codigo_doc: data.codigo_doc || 'POP 01-AC01',
    data_elaboracao: data.data_elaboracao || '',
    data_edicao: data.data_edicao || '',
    revisao_doc: data.revisao_doc || 'Rev.01',
    dados_cadastrais: data.dados_cadastrais || {},
    tipo_fornecedor: data.tipo_fornecedor || {},
    respostas: data.respostas || [],
    total_c: data.total_c ?? 0,
    total_nc: data.total_nc ?? 0,
    total_na: data.total_na ?? 0,
    nota_final: data.nota_final ?? 0,
    avaliacao_final: data.avaliacao_final || 'PENDENTE',
    observacoes: data.observacoes || '',
    assinaturas: data.assinaturas || {},
    status_assinatura: data.status_assinatura || 'Pendente Assinatura',
    acao_corretiva_vinculada: data.acao_corretiva_vinculada || '',
  }
  if (orgId) payload.organization = orgId

  let record: any
  let isEdicao = false

  if (data.id) {
    isEdicao = true
    record = await pb.collection('auto_avaliacoes_fornecedor').update(data.id, payload)
  } else {
    record = await pb.collection('auto_avaliacoes_fornecedor').create(payload)
  }

  // Registrar na trilha de auditoria
  try {
    await registrarAuditoriaLog({
      action: isEdicao ? 'UPDATE_AUTO_AVALIACAO' : 'CREATE_AUTO_AVALIACAO',
      target: 'auto_avaliacoes_fornecedor',
      target_id: record.id,
      details: {
        numero_registro: record.numero_registro,
        cnpj: record.fornecedor_cnpj,
        razao_social: record.razao_social,
        nota_final: record.nota_final,
        avaliacao_final: record.avaliacao_final,
        status_assinatura: record.status_assinatura,
      },
    })
  } catch (err) {
    console.warn('Erro ao registrar log de auto avaliação:', err)
  }

  return mapRecordToAutoAvaliacao(record)
}

function mapRecordToAutoAvaliacao(r: any): AutoAvaliacaoFornecedorItem {
  return {
    id: r.id,
    organization: r.organization,
    numero_registro: r.numero_registro,
    fornecedor_cnpj: normalizarCNPJ(r.fornecedor_cnpj),
    razao_social: r.razao_social,
    nome_fantasia: r.nome_fantasia,
    data_avaliacao: r.data_avaliacao,
    codigo_doc: r.codigo_doc,
    data_elaboracao: r.data_elaboracao,
    data_edicao: r.data_edicao,
    revisao_doc: r.revisao_doc,
    dados_cadastrais: r.dados_cadastrais || {},
    tipo_fornecedor: r.tipo_fornecedor || {
      tipo: 'Fabricante',
      area_atuacao: 'MAPA',
      categorias: [],
      programas_qualidade: [],
    },
    respostas: Array.isArray(r.respostas) ? r.respostas : [],
    total_c: r.total_c ?? 0,
    total_nc: r.total_nc ?? 0,
    total_na: r.total_na ?? 0,
    nota_final: r.nota_final ?? 0,
    avaliacao_final: r.avaliacao_final || 'PENDENTE',
    observacoes: r.observacoes || '',
    assinaturas: r.assinaturas || {
      preenchimento: { nome: '', funcao: '' },
    },
    status_assinatura: r.status_assinatura,
    acao_corretiva_vinculada: r.acao_corretiva_vinculada,
    created: r.created,
    updated: r.updated,
  }
}

/**
 * Auxiliar para salvar eventos em audit_logs
 */
export async function registrarAuditoriaLog(evento: {
  action: string
  target: string
  target_id: string
  details: any
}): Promise<void> {
  const user = pb.authStore.record
  const orgId = user?.organization || getCurrentOrgId()

  const payload: any = {
    user: user?.id || null,
    user_email: user?.email || '',
    user_name: user?.name || '',
    user_role: user?.role || '',
    action: evento.action,
    target: evento.target,
    target_id: evento.target_id,
    details: evento.details,
    ip: 'client',
  }
  if (orgId) payload.organization = orgId

  await pb.collection('audit_logs').create(payload)
}
