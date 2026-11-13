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
