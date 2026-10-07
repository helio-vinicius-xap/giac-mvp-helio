import pb from '@/lib/pocketbase/client'
import {
  registrarAuditoriaLog,
  getQuestionarioAtivo,
  gerarProximoNumeroAutoAvaliacao,
  salvarAutoAvaliacao,
} from './autoAvaliacaoService'
import type {
  AutoAvaliacaoFornecedorCompleta,
  DadosCadastraisAutoAvaliacao,
} from '@/types/autoAvaliacaoFornecedor'

export interface ConvitePortalFornecedor {
  id: string
  organization?: string
  token: string
  fornecedor_cnpj?: string
  fornecedor_nome?: string
  fornecedor_email?: string
  status: 'PENDENTE' | 'PREENCHIDO' | 'VALIDADO_INTERNO' | 'EXPIRADO'
  data_expiracao?: string
  dados_pre_cadastro?: {
    cnpj: string
    razao_social?: string
    nome_fantasia?: string
    contato_nome: string
    telefone: string
    email: string
    cargo_contato?: string
  }
  respostas_questionario?: {
    secao2_tipo_fornecedor?: any
    secao3_programas_qualidade?: any
    secao4_respostas?: any
  }
  auto_avaliacao_gerada_id?: string
  criado_por_nome?: string
  created?: string
  updated?: string
}

function getCurrentOrgId(): string | null {
  const imp = localStorage.getItem('giac_impersonated_org')
  if (imp) {
    try {
      const parsed = JSON.parse(imp)
      if (parsed?.id) return parsed.id
    } catch {
      /* intentionally ignored */
    }
  }
  return pb.authStore.record?.organization || null
}

/**
 * Gera um novo convite/token de pré-cadastro para um fornecedor
 */
export async function gerarConvitePortal(options: {
  fornecedor_cnpj?: string
  fornecedor_nome?: string
  fornecedor_email?: string
}): Promise<ConvitePortalFornecedor> {
  const orgId = getCurrentOrgId()
  const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  const token = `pop01_${randomPart}`

  // Validade padrão: 30 dias
  const expira = new Date()
  expira.setDate(expira.getDate() + 30)

  const payload: any = {
    token,
    fornecedor_cnpj: options.fornecedor_cnpj || '',
    fornecedor_nome: options.fornecedor_nome || '',
    fornecedor_email: options.fornecedor_email || '',
    status: 'PENDENTE',
    data_expiracao: expira.toISOString(),
    criado_por_nome: pb.authStore.record?.name || pb.authStore.record?.email || 'Usuário Interno',
  }

  if (orgId) payload.organization = orgId

  const created = await pb
    .collection('convites_portal_fornecedor')
    .create<ConvitePortalFornecedor>(payload)

  await registrarAuditoriaLog({
    action: 'GERAR_CONVITE_PORTAL_FORNECEDOR',
    target: 'convites_portal_fornecedor',
    target_id: created.id,
    details: {
      token: created.token,
      fornecedor_cnpj: created.fornecedor_cnpj,
      fornecedor_nome: created.fornecedor_nome,
    },
  }).catch(() => {})

  return created
}

/**
 * Busca os convites gerados pela organização
 */
export async function getConvitesPortalList(): Promise<ConvitePortalFornecedor[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const list = await pb
      .collection('convites_portal_fornecedor')
      .getFullList<ConvitePortalFornecedor>({
        filter,
        sort: '-created',
      })
    return list
  } catch (err) {
    console.warn('Erro ao carregar convites_portal_fornecedor:', err)
    return []
  }
}

/**
 * Busca os dados de um convite a partir de seu token público
 */
export async function getConvitePorToken(token: string): Promise<ConvitePortalFornecedor | null> {
  try {
    const list = await pb
      .collection('convites_portal_fornecedor')
      .getList<ConvitePortalFornecedor>(1, 1, {
        filter: `token = '${token}'`,
      })
    return list.items[0] || null
  } catch (err) {
    console.error('Erro ao buscar convite por token:', err)
    return null
  }
}

/**
 * Submissão online feita pelo fornecedor externo (sem autenticação)
 */
export async function submeterPreCadastroPortal(options: {
  token: string
  dados_pre_cadastro: {
    cnpj: string
    razao_social: string
    nome_fantasia?: string
    contato_nome: string
    telefone: string
    email: string
    cargo_contato?: string
  }
  respostas_questionario: {
    secao2_tipo_fornecedor: any
    secao3_programas_qualidade: any
    secao4_respostas: any
    nota_final_calculada?: number
  }
}): Promise<ConvitePortalFornecedor> {
  const convite = await getConvitePorToken(options.token)
  if (!convite) {
    throw new Error('Convite não localizado ou expirado.')
  }
  if (convite.status === 'VALIDADO_INTERNO') {
    throw new Error('Este formulário já foi validado e homologado pela empresa compradora.')
  }

  // Atualizar o convite com as respostas e status PREENCHIDO
  const updatedConvite = await pb
    .collection('convites_portal_fornecedor')
    .update<ConvitePortalFornecedor>(convite.id, {
      status: 'PREENCHIDO',
      fornecedor_cnpj: options.dados_pre_cadastro.cnpj,
      fornecedor_nome: options.dados_pre_cadastro.razao_social,
      fornecedor_email: options.dados_pre_cadastro.email,
      dados_pre_cadastro: options.dados_pre_cadastro,
      respostas_questionario: options.respostas_questionario,
    })

  // Criar também um registro na collection 'auto_avaliacoes_fornecedor' em status PENDENTE para a organização revisar
  try {
    const questionarioDef = await getQuestionarioAtivo()
    const numeroAutoAval = `EXT-${convite.token.slice(-6).toUpperCase()}`

    const autoAvalPayload: any = {
      organization: convite.organization,
      numero_registro: numeroAutoAval,
      avaliacao_final: 'PENDENTE',
      data_avaliacao: new Date().toISOString().split('T')[0],
      fornecedor_cnpj: options.dados_pre_cadastro.cnpj,
      razao_social: options.dados_pre_cadastro.razao_social,
      nome_fantasia: options.dados_pre_cadastro.nome_fantasia || '',
      revisao_doc: questionarioDef?.versao_revisao || questionarioDef?.versao || 'Rev.01',
      dados_cadastrais: {
        razao_social: options.dados_pre_cadastro.razao_social,
        nome_fantasia: options.dados_pre_cadastro.nome_fantasia || '',
        cnpj: options.dados_pre_cadastro.cnpj,
        contato: options.dados_pre_cadastro.contato_nome,
        telefone: options.dados_pre_cadastro.telefone,
        email: options.dados_pre_cadastro.email,
        data_avaliacao: new Date().toISOString().split('T')[0],
      },
      tipo_fornecedor: options.respostas_questionario.secao2_tipo_fornecedor || {},
      respostas: options.respostas_questionario.secao4_respostas || [],
      nota_final: options.respostas_questionario.nota_final_calculada || 0,
      status_assinatura: 'Pendente de Validação Interna',
      observacoes: `Pré-cadastro online submetido pelo fornecedor via Portal do Fornecedor GIAC (Token: ${convite.token}). Aguardando validação de RT/RE e RQ.`,
    }

    const createdAutoAval = await pb
      .collection('auto_avaliacoes_fornecedor')
      .create(autoAvalPayload)

    // Atualiza id no convite
    await pb.collection('convites_portal_fornecedor').update(convite.id, {
      auto_avaliacao_gerada_id: createdAutoAval.id,
    })
  } catch (err) {
    console.error('Erro ao espelhar em auto_avaliacoes_fornecedor:', err)
  }

  return updatedConvite
}

/**
 * Validação interna e aprovação com a hierarquia da organização
 */
export async function validarPreCadastroInternamente(
  conviteId: string,
  autoAvaliacaoId: string,
): Promise<boolean> {
  await pb.collection('convites_portal_fornecedor').update(conviteId, {
    status: 'VALIDADO_INTERNO',
  })

  await registrarAuditoriaLog({
    action: 'HOMOLOGAR_PRE_CADASTRO_PORTAL',
    target: 'convites_portal_fornecedor',
    target_id: conviteId,
    details: { autoAvaliacaoId },
  }).catch(() => {})

  return true
}
