// Acesso às coleções pa_* do Plano de Amostragem (isoladas por organização) com trilha de auditoria
import pb from '@/lib/pocketbase/client'
import { getFornecedoresList } from '@/services/paasoService'
import { GRADE_SEED, MATRIZ_SEED, SECOES_SEED } from '@/lib/planoAmostragemSeed'
import type { ClasseRisco, Nivel } from '@/lib/planoAmostragem'

export type ColecaoPA =
  | 'pa_secoes'
  | 'pa_matriz_risco'
  | 'pa_grade_sensibilidade'
  | 'pa_sequenciamentos'
  | 'pa_colheitas'
  | 'pa_planos'
  | 'pa_parametros'

function orgId(): string {
  return (pb.authStore.record as any)?.organization ?? ''
}

function usuario() {
  const r: any = pb.authStore.record
  return { id: r?.id ?? '', email: r?.email ?? '', name: r?.name ?? '', role: r?.role ?? '' }
}

export async function registrarAuditoria(
  action: string,
  target: string,
  targetId: string,
  details: Record<string, unknown>,
) {
  const u = usuario()
  try {
    await pb.collection('audit_logs').create({
      action,
      target,
      target_id: targetId,
      details,
      organization: orgId(),
      user: u.id,
      user_email: u.email,
      user_name: u.name,
      user_role: u.role,
    })
  } catch {
    /* a falha de auditoria não deve impedir o registro já salvo */
  }
}

export async function listarPA(col: ColecaoPA, sort = 'created'): Promise<any[]> {
  return await pb.collection(col).getFullList<any>({ sort })
}

export async function criarPA(col: ColecaoPA, data: Record<string, unknown>): Promise<any> {
  const rec = await pb.collection(col).create<any>({ ...data, organization: orgId() })
  await registrarAuditoria('create', col, rec.id, data)
  return rec
}

export async function atualizarPA(
  col: ColecaoPA,
  id: string,
  data: Record<string, unknown>,
): Promise<any> {
  const rec = await pb.collection(col).update<any>(id, data)
  await registrarAuditoria('update', col, id, data)
  return rec
}

/** Fornecedores qualificados do Auto Controle 01 (POP 01 / PAASO) */
export async function listarFornecedoresAC01(): Promise<any[]> {
  try {
    return (await getFornecedoresList()) as any[]
  } catch {
    return []
  }
}

/** Semeia o conteúdo do template na primeira abertura (somente se a organização ainda não tem registros). */
export async function garantirSeed(): Promise<void> {
  if (!orgId()) return
  const seeds: [ColecaoPA, Record<string, unknown>[]][] = [
    [
      'pa_secoes',
      SECOES_SEED.map((s, i) => ({ ordem: i + 1, titulo: s.titulo, conteudo: s.conteudo })),
    ],
    ['pa_matriz_risco', MATRIZ_SEED.map((m, i) => ({ ...m, ordem: i + 1 }))],
    ['pa_grade_sensibilidade', GRADE_SEED.map((g) => ({ ...g }))],
  ]
  for (const [col, rows] of seeds) {
    const existentes = await pb.collection(col).getList(1, 1)
    if (existentes.totalItems > 0) continue
    for (const row of rows) {
      await pb.collection(col).create({ ...row, organization: orgId() })
    }
    await registrarAuditoria('seed', col, '', { quantidade: rows.length })
  }
}

export interface LaudoAvaliacao {
  numero_laudo: string
  laboratorio: string
  parametro: string
  metodo: string
  resultado: string
  limite: string
  conclusao: 'Conforme' | 'Não conforme'
  classificacao_desvio: 'Crítico' | 'Maior' | 'Menor' | ''
  acao_produto: string
  acao_processo: string
  medida_preventiva: string
  prazo: string
  responsavel_avaliacao: string
  aprovacao_rt: string
  data_avaliacao: string
}

/**
 * Registra a avaliação crítica do laudo na colheita. Laudo não conforme abre NC em
 * non_conformities (módulo de Não Conformidades) e vincula o nc_id à colheita.
 */
export async function registrarLaudo(colheita: any, laudo: LaudoAvaliacao): Promise<any> {
  let ncId = colheita.nc_id ?? ''
  if (laudo.conclusao === 'Não conforme') {
    const classificacao =
      laudo.classificacao_desvio === 'Crítico'
        ? 'Crítica'
        : laudo.classificacao_desvio === 'Menor'
          ? 'Menor'
          : 'Maior'
    const nc = await pb.collection('non_conformities').create<any>({
      codigo: `NC-PA-${Date.now()}`,
      descricao: `Laudo ${laudo.numero_laudo} não conforme — ${laudo.parametro}: resultado ${laudo.resultado} (limite ${laudo.limite}). Ficha ${colheita.numero}, produto ${colheita.produto}.`,
      classificacao,
      origem: 'Registro',
      area: 'Plano de Amostragem',
      data_identificacao: laudo.data_avaliacao,
      status: 'Aberta',
      lote: colheita.lote_interno ?? '',
      medidas_preventivas: laudo.medida_preventiva,
      plano_acao: laudo.acao_processo,
      organization: orgId(),
    })
    ncId = nc.id
    await registrarAuditoria('create', 'non_conformities', nc.id, {
      origem: 'pa_colheitas',
      colheita: colheita.id,
    })
  }
  return atualizarPA('pa_colheitas', colheita.id, {
    laudo,
    nc_id: ncId,
    status: 'Laudo avaliado',
  })
}

export type { ClasseRisco, Nivel }

// =========================================================================
// Planos de amostragem por produto/insumo (Anexo II do desenho validado)
// =========================================================================

export type FrequenciaPlano = 'por_lote' | 'diaria' | 'semanal' | 'mensal'

export interface PlanoAmostragemItem {
  id?: string
  codigo: string
  nome: string
  vinculo_tipo: 'MateriaPrima' | 'Produto'
  produto_nome?: string
  materia_prima_nome?: string
  fornecedor_id?: string
  fornecedor_nome?: string
  frequencia: FrequenciaPlano
  tamanho_amostra?: number
  regra_coleta?: string
  ponto_coleta?: string
  tipo_amostra?: 'Simples' | 'Composta' | 'Testemunha'
  conservacao?: string
  prazo_analise?: string
  observacoes?: string
  is_ativo?: boolean
  created?: string
  updated?: string
}

export interface ParametroPlanoItem {
  id?: string
  plano_id: string
  nome: string
  unidade?: string
  limite_min?: string
  limite_max?: string
  limite_texto?: string
  metodo_analise?: string
  norma_referencia?: string
  ordem?: number
}

export const ROTULO_FREQUENCIA: Record<FrequenciaPlano, string> = {
  por_lote: 'Por lote',
  diaria: 'Diária',
  semanal: 'Semanal',
  mensal: 'Mensal',
}

/** Regra raiz quadrada de N (Anexo II do Manual TF: amostragem em sacos/granel) */
export function calcularRegraRaizQuadrada(totalSacos: number): number {
  if (!totalSacos || totalSacos <= 0) return 0
  return Math.max(1, Math.ceil(Math.sqrt(totalSacos)))
}

export async function listarPlanos(): Promise<PlanoAmostragemItem[]> {
  return await pb.collection('pa_planos').getFullList<PlanoAmostragemItem>({ sort: '-created' })
}

export async function criarPlano(data: Partial<PlanoAmostragemItem>): Promise<any> {
  return criarPA('pa_planos', { ...data, is_ativo: data.is_ativo ?? true })
}

export async function atualizarPlano(id: string, data: Partial<PlanoAmostragemItem>): Promise<any> {
  return atualizarPA('pa_planos', id, data)
}

export async function excluirPlano(id: string): Promise<boolean> {
  await pb.collection('pa_planos').delete(id)
  await registrarAuditoria('delete', 'pa_planos', id, {})
  return true
}

export async function listarParametros(planoId: string): Promise<ParametroPlanoItem[]> {
  return await pb
    .collection('pa_parametros')
    .getFullList<ParametroPlanoItem>({ filter: `plano_id = '${planoId}'`, sort: 'ordem,created' })
}

export async function criarParametro(data: Partial<ParametroPlanoItem>): Promise<any> {
  return criarPA('pa_parametros', data)
}

export async function atualizarParametro(
  id: string,
  data: Partial<ParametroPlanoItem>,
): Promise<any> {
  return atualizarPA('pa_parametros', id, data)
}

export async function excluirParametro(id: string): Promise<boolean> {
  await pb.collection('pa_parametros').delete(id)
  await registrarAuditoria('delete', 'pa_parametros', id, {})
  return true
}

// =========================================================================
// Colheitas vinculadas a um plano + bloqueio de lote
// =========================================================================

export async function listarColheitas(planoId?: string): Promise<any[]> {
  const filter = planoId ? `plano_id = '${planoId}'` : ''
  return await pb.collection('pa_colheitas').getFullList<any>({
    filter,
    sort: '-created',
  })
}

export async function criarColheita(data: Record<string, unknown>): Promise<any> {
  return criarPA('pa_colheitas', { status: 'Colhida', ...data })
}

export async function excluirColheita(id: string): Promise<boolean> {
  await pb.collection('pa_colheitas').delete(id)
  await registrarAuditoria('delete', 'pa_colheitas', id, {})
  return true
}

/**
 * Bloqueia o lote na Rastreabilidade: o lote da colheita reprovada é marcado em
 * pa_colheitas.lote_bloqueado e uma NC de bloqueio é registrada em traceability_tests-like
 * channel (non_conformities já cobre a consulta do hook traceability_lookup).
 */
export async function bloquearLoteReprovado(colheita: any, laudo: LaudoAvaliacao): Promise<void> {
  await atualizarPA('pa_colheitas', colheita.id, { lote_bloqueado: true })
  const lote = colheita.lote_interno || colheita.lote_fornecedor || ''
  if (lote) {
    await registrarAuditoria('bloqueio_lote', 'pa_colheitas', colheita.id, {
      lote,
      motivo: `Laudo ${laudo.numero_laudo} reprovado — parâmetro ${laudo.parametro}`,
      produto: colheita.produto,
    })
  }
}

/** Laudos reprovados com lote — usado pela Rastreabilidade para saber quais lotes estão bloqueados */
export async function listarLotesBloqueados(): Promise<string[]> {
  const colheitas = await pb.collection('pa_colheitas').getFullList<any>({
    filter: 'lote_bloqueado = true',
  })
  return Array.from(
    new Set(
      colheitas.map((c) => (c.lote_interno || c.lote_fornecedor || '').trim()).filter(Boolean),
    ),
  )
}
