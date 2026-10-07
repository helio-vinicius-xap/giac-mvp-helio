import pb from '@/lib/pocketbase/client'
import type { Procedure, MonitoringRecord, PopCustomForm, Training } from '@/types/agro'
import { POP_ITEM07_CATALOG } from '@/types/popFormsCatalog'
import { registrarAuditoriaLog } from './autoAvaliacaoService'

export interface ProgramacaoRegistroItem {
  id: string
  organization?: string
  procedure?: string
  pop_codigo: string
  formulario_codigo: string
  titulo: string
  periodicidade: 'diaria' | 'semanal' | 'mensal' | 'anual'
  data_inicio: string
  data_fim?: string
  turno_preferencial?: string
  setor?: string
  responsavel_cargo?: string
  dias_semana?: number[]
  dia_mes?: number
  is_ativo?: boolean
  observacoes?: string
  created?: string
  updated?: string
}

export interface RegistroCatalogoDisponivel {
  pop_codigo: string
  pop_nome: string
  formulario_codigo: string
  titulo: string
  frequencia_sugerida: string
  origem: 'sistema' | 'customizado'
  custom_form_id?: string
  tem_vencimento?: boolean
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
 * Retorna todos os formulários/registros cadastrados em todos os Auto Controles
 * (catálogo padrão POP-001 a POP-009 + formulários customizados criados pelo cliente)
 */
export async function getCatalogoRegistrosDisponiveis(
  procedures: Procedure[],
): Promise<RegistroCatalogoDisponivel[]> {
  const lista: RegistroCatalogoDisponivel[] = []

  // 1. Catálogo fixo por POP
  for (const [code, pop] of Object.entries(POP_ITEM07_CATALOG)) {
    for (const f of pop.formularios) {
      lista.push({
        pop_codigo: code,
        pop_nome: pop.nome_pop,
        formulario_codigo: f.codigo,
        titulo: f.titulo,
        frequencia_sugerida: f.frequencia,
        origem: 'sistema',
      })
    }
  }

  // 2. Formulários customizados criados pelo cliente via PopCustomForm
  try {
    const orgId = getCurrentOrgId()
    const filter = orgId ? `organization = '${orgId}' && is_ativo = true` : 'is_ativo = true'
    const customForms = await pb.collection('pop_custom_forms').getFullList<PopCustomForm>({
      filter,
      sort: 'codigo',
    })

    for (const cf of customForms) {
      const proc = procedures.find((p) => p.id === cf.procedure)
      const popCodigo = proc?.codigo || 'POP-CUSTOM'
      const popNome = proc?.nome || 'Auto Controle Customizado'

      lista.push({
        pop_codigo: popCodigo,
        pop_nome: popNome,
        formulario_codigo: cf.codigo,
        titulo: cf.titulo,
        frequencia_sugerida: cf.frequencia || 'Diário',
        origem: 'customizado',
        custom_form_id: cf.id,
        tem_vencimento: cf.tem_vencimento,
      })
    }
  } catch (e) {
    console.error('Erro ao buscar pop_custom_forms:', e)
  }

  return lista
}

/**
 * Busca a lista de agendamentos da programação
 */
export async function getProgramacoesRegistros(): Promise<ProgramacaoRegistroItem[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const records = await pb
      .collection('programacao_registros')
      .getFullList<ProgramacaoRegistroItem>({
        filter,
        sort: '-created',
      })
    return records
  } catch (err) {
    console.warn('Erro ao carregar programacao_registros:', err)
    return []
  }
}

/**
 * Cria um novo agendamento na raiz de programação
 */
export async function createProgramacaoRegistro(
  data: Partial<ProgramacaoRegistroItem>,
): Promise<ProgramacaoRegistroItem> {
  const orgId = getCurrentOrgId()
  const payload: any = {
    ...data,
    is_ativo: data.is_ativo ?? true,
  }
  if (orgId) payload.organization = orgId

  const created = await pb
    .collection('programacao_registros')
    .create<ProgramacaoRegistroItem>(payload)

  await registrarAuditoriaLog({
    action: 'CRIAR_PROGRAMACAO_REGISTRO',
    target: 'programacao_registros',
    target_id: created.id,
    details: {
      formulario_codigo: created.formulario_codigo,
      periodicidade: created.periodicidade,
      titulo: created.titulo,
    },
  }).catch(() => {})

  return created
}

/**
 * Atualiza um agendamento
 */
export async function updateProgramacaoRegistro(
  id: string,
  data: Partial<ProgramacaoRegistroItem>,
): Promise<ProgramacaoRegistroItem> {
  const updated = await pb
    .collection('programacao_registros')
    .update<ProgramacaoRegistroItem>(id, data)
  await registrarAuditoriaLog({
    action: 'ATUALIZAR_PROGRAMACAO_REGISTRO',
    target: 'programacao_registros',
    target_id: id,
    details: data,
  }).catch(() => {})
  return updated
}

/**
 * Remove um agendamento da programação
 */
export async function deleteProgramacaoRegistro(id: string): Promise<boolean> {
  await pb.collection('programacao_registros').delete(id)
  await registrarAuditoriaLog({
    action: 'EXCLUIR_PROGRAMACAO_REGISTRO',
    target: 'programacao_registros',
    target_id: id,
    details: { id },
  }).catch(() => {})
  return true
}

/**
 * Modelo de item no cronograma calculado para visualização por dia, semana, mês e ano
 */
export interface CronogramaItemVisualizacao {
  id: string
  programacao_id?: string
  pop_codigo: string
  formulario_codigo: string
  titulo: string
  data_alvo: string // YYYY-MM-DD
  periodicidade: string
  turno?: string
  status_operacional: 'PENDENTE' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'ATRASADO'
  status_validade?: 'VIGENTE' | 'A_VENCER' | 'VENCIDO'
  data_vencimento?: string
  dias_para_vencer?: number
  registro_executado?: MonitoringRecord
  treinamento_vinculado?: Training
  origem: 'programacao' | 'registro_avulso' | 'treinamento' | 'vencimento'
}

/**
 * Calcula os itens da agenda/cronograma a partir dos agendamentos, registros preenchidos e treinamentos
 */
export function calcularItensCronograma(options: {
  programacoes: ProgramacaoRegistroItem[]
  records: MonitoringRecord[]
  trainings: Training[]
  dataInicioFiltro: Date
  dataFimFiltro: Date
}): CronogramaItemVisualizacao[] {
  const { programacoes, records, trainings, dataInicioFiltro, dataFimFiltro } = options
  const resultado: CronogramaItemVisualizacao[] = []
  const hojeStr = new Date().toISOString().split('T')[0]
  const hoje = new Date(hojeStr)

  // 1. Processar Programações de Registros Obrigatórios
  for (const prog of programacoes.filter((p) => p.is_ativo !== false)) {
    // Gerar ocorrências no período
    const inicioProg = new Date(prog.data_inicio)
    const fimProg = prog.data_fim ? new Date(prog.data_fim) : dataFimFiltro

    const cur = new Date(Math.max(inicioProg.getTime(), dataInicioFiltro.getTime()))
    const limite = new Date(Math.min(fimProg.getTime(), dataFimFiltro.getTime()))

    while (cur <= limite) {
      const curStr = cur.toISOString().split('T')[0]
      let deveIncluir = false

      if (prog.periodicidade === 'diaria') {
        deveIncluir = true
      } else if (prog.periodicidade === 'semanal') {
        const diaSem = cur.getDay() // 0=Dom, 1=Seg...
        if (prog.dias_semana && prog.dias_semana.length > 0) {
          deveIncluir = prog.dias_semana.includes(diaSem)
        } else {
          // Padrão: segundas-feiras (1)
          deveIncluir = diaSem === 1
        }
      } else if (prog.periodicidade === 'mensal') {
        const diaAlvo = prog.dia_mes || 1
        deveIncluir = cur.getDate() === diaAlvo
      } else if (prog.periodicidade === 'anual') {
        deveIncluir =
          cur.getDate() === inicioProg.getDate() && cur.getMonth() === inicioProg.getMonth()
      }

      if (deveIncluir) {
        // Checar se já foi preenchido na data ou proximidade
        const recExistente = records.find(
          (r) =>
            r.formulario_codigo === prog.formulario_codigo &&
            (r.data ? r.data.split('T')[0] : '') === curStr,
        )

        let statusOp: CronogramaItemVisualizacao['status_operacional'] = 'PENDENTE'
        if (recExistente) {
          const sig = recExistente.status_assinatura || ''
          const isAprovado =
            sig.includes('Comprovado') ||
            (recExistente.assinaturas_registro?.rq &&
              (recExistente.assinaturas_registro?.rt || recExistente.assinaturas_registro?.re))

          if (isAprovado) {
            statusOp = 'APROVADO'
          } else {
            statusOp = 'AGUARDANDO_APROVACAO'
          }
        } else {
          if (cur < hoje) {
            statusOp = 'ATRASADO'
          } else {
            statusOp = 'PENDENTE'
          }
        }

        // Validade
        let statusVal: CronogramaItemVisualizacao['status_validade']
        let diasParaVencer: number | undefined
        let dataVencStr: string | undefined

        if (recExistente?.data_validade) {
          dataVencStr = recExistente.data_validade.split('T')[0]
          const diffMs = new Date(dataVencStr).getTime() - hoje.getTime()
          diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
          if (diasParaVencer < 0) {
            statusVal = 'VENCIDO'
          } else if (diasParaVencer <= (recExistente.dias_lembrete_vencimento || 60)) {
            statusVal = 'A_VENCER'
          } else {
            statusVal = 'VIGENTE'
          }
        }

        resultado.push({
          id: `prog_${prog.id}_${curStr}`,
          programacao_id: prog.id,
          pop_codigo: prog.pop_codigo,
          formulario_codigo: prog.formulario_codigo,
          titulo: prog.titulo,
          data_alvo: curStr,
          periodicidade: prog.periodicidade,
          turno: prog.turno_preferencial,
          status_operacional: statusOp,
          status_validade: statusVal,
          data_vencimento: dataVencStr,
          dias_para_vencer: diasParaVencer,
          registro_executado: recExistente,
          origem: 'programacao',
        })
      }

      // Avança 1 dia
      cur.setDate(cur.getDate() + 1)
    }
  }

  // 2. Processar Treinamentos agendados/realizados vinculados a POPs
  for (const tr of trainings) {
    if (!tr.data) continue
    const trDataStr = tr.data.split('T')[0]
    const trData = new Date(trDataStr)

    if (trData >= dataInicioFiltro && trData <= dataFimFiltro) {
      resultado.push({
        id: `tr_${tr.id}`,
        pop_codigo: (tr as any).pop_codigo || 'POP-003',
        formulario_codigo: tr.codigo || 'TREINAMENTO',
        titulo: `Treinamento: ${tr.tema}`,
        data_alvo: trDataStr,
        periodicidade: 'conforme_demanda',
        status_operacional:
          tr.status === 'Concluído' ? 'APROVADO' : trData < hoje ? 'ATRASADO' : 'PENDENTE',
        treinamento_vinculado: tr,
        origem: 'treinamento',
      })
    }
  }

  // 3. Incluir Registros avulsos que possuam data_validade e não vieram de uma programação direta
  for (const rec of records) {
    if (!rec.data_validade) continue
    const dataVencStr = rec.data_validade.split('T')[0]
    const dataVenc = new Date(dataVencStr)

    if (dataVenc >= dataInicioFiltro && dataVenc <= dataFimFiltro) {
      const diffMs = dataVenc.getTime() - hoje.getTime()
      const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      const jaExiste = resultado.some(
        (it) => it.registro_executado?.id === rec.id && it.data_alvo === dataVencStr,
      )

      if (!jaExiste) {
        resultado.push({
          id: `venc_${rec.id}`,
          pop_codigo: rec.expand?.procedure?.codigo || 'AUTO CONTROLE',
          formulario_codigo: rec.formulario_codigo || 'REG-VENC',
          titulo: `Vencimento / Revalidação: ${rec.formulario_codigo} (Lote: ${rec.lote || '—'})`,
          data_alvo: dataVencStr,
          periodicidade: 'anual',
          status_operacional: dias < 0 ? 'ATRASADO' : 'PENDENTE',
          status_validade:
            dias < 0
              ? 'VENCIDO'
              : dias <= (rec.dias_lembrete_vencimento || 60)
                ? 'A_VENCER'
                : 'VIGENTE',
          data_vencimento: dataVencStr,
          dias_para_vencer: dias,
          registro_executado: rec,
          origem: 'vencimento',
        })
      }
    }
  }

  // Ordenar por data
  resultado.sort((a, b) => a.data_alvo.localeCompare(b.data_alvo))
  return resultado
}
