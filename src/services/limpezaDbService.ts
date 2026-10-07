import pb from '@/lib/pocketbase/client'
import { registrarAuditoriaLog } from './autoAvaliacaoService'

export interface LimpezaSetor {
  id: string
  organization?: string
  codigo: string
  nome: string
  descricao?: string
  tipo_area?: string // 'Seca', 'Úmida', 'Externa', 'Depósito'
  responsavel_setor?: string
  is_ativo?: boolean
  created?: string
  updated?: string
}

export interface LimpezaProduto {
  id: string
  organization?: string
  nome_comercial: string
  principio_ativo?: string
  categoria: 'Detergente Alcalino' | 'Detergente Neutro' | 'Sanitizante' | 'Desengraxante' | 'Outro'
  concentracao_recomendada?: string
  tempo_contato_minutos?: number
  superficies_aplicacao?: string[]
  registro_anvisa_mapa?: string
  is_ativo?: boolean
  created?: string
  updated?: string
}

export interface LimpezaEquipamento {
  id: string
  organization?: string
  tag: string
  nome: string
  setor_nome?: string
  tipo_superficie?: string
  metodos_limpeza_permitidos?: string[] | string
  cuidados_especiais?: string
  is_ativo?: boolean
  created?: string
  updated?: string
}

export interface LimpezaProcedimentoMatriz {
  id: string
  organization?: string
  codigo_procedimento: string
  setor: string
  equipamento_ou_area: string
  tipo_superficie?: string
  tipo_limpeza: string
  produto_utilizado?: string
  dosagem_diluicao?: string
  frequencia?: string
  tempo_contato?: string
  criterio_aprovacao?: string
  is_ativo?: boolean
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

// 1. SETORES
export async function getLimpezaSetores(): Promise<LimpezaSetor[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const list = await pb.collection('limpeza_setores').getFullList<LimpezaSetor>({
      filter,
      sort: 'codigo',
    })
    if (list.length === 0) {
      // Seed inicial
      const seeds = [
        {
          codigo: 'SET-REC',
          nome: 'Moega e Recebimento de Grãos',
          tipo_area: 'Seca',
          responsavel_setor: 'Supervisor de Recebimento',
        },
        {
          codigo: 'SET-MOAG',
          nome: 'Moagem e Peneiramento',
          tipo_area: 'Seca',
          responsavel_setor: 'Operador Líder de Moagem',
        },
        {
          codigo: 'SET-MIST',
          nome: 'Dosagem de Micropacotes e Mistura',
          tipo_area: 'Seca',
          responsavel_setor: 'Operador de Mistura',
        },
        {
          codigo: 'SET-ENS',
          nome: 'Linha de Ensaque e Costura',
          tipo_area: 'Seca',
          responsavel_setor: 'Operador de Ensaque',
        },
        {
          codigo: 'SET-EXP',
          nome: 'Armazém de Produto Acabado e Expedição',
          tipo_area: 'Seca',
          responsavel_setor: 'Encarregado de Logística',
        },
      ]
      for (const s of seeds) {
        const payload: any = { ...s, is_ativo: true }
        if (orgId) payload.organization = orgId
        await pb.collection('limpeza_setores').create(payload)
      }
      return await pb
        .collection('limpeza_setores')
        .getFullList<LimpezaSetor>({ filter, sort: 'codigo' })
    }
    return list
  } catch (err) {
    console.warn('Erro ao carregar limpeza_setores:', err)
    return []
  }
}

export async function createLimpezaSetor(data: Partial<LimpezaSetor>): Promise<LimpezaSetor> {
  const orgId = getCurrentOrgId()
  const payload: any = { ...data, is_ativo: true }
  if (orgId) payload.organization = orgId
  const created = await pb.collection('limpeza_setores').create<LimpezaSetor>(payload)
  await registrarAuditoriaLog({
    action: 'CRIAR_SETOR_LIMPEZA',
    target: 'limpeza_setores',
    target_id: created.id,
    details: data,
  }).catch(() => {})
  return created
}

export async function deleteLimpezaSetor(id: string): Promise<boolean> {
  await pb.collection('limpeza_setores').delete(id)
  return true
}

// 2. PRODUTOS
export async function getLimpezaProdutos(): Promise<LimpezaProduto[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const list = await pb.collection('limpeza_produtos').getFullList<LimpezaProduto>({
      filter,
      sort: 'nome_comercial',
    })
    if (list.length === 0) {
      const seeds = [
        {
          nome_comercial: 'Alcoquatt 70% Plus',
          principio_ativo: 'Álcool Etílico 70° + Quaternário 5ª Geração',
          categoria: 'Sanitizante' as const,
          concentracao_recomendada: 'Puro (Pronto Uso)',
          tempo_contato_minutos: 10,
          superficies_aplicacao: ['Inox 304/316', 'Pás de pesagem', 'Balanças analíticas'],
          registro_anvisa_mapa: 'MAPA nº 8.231/2021',
        },
        {
          nome_comercial: 'DeterClean Alcalino Clorado',
          principio_ativo: 'Hipoclorito de Sódio + Hidróxido de Sódio',
          categoria: 'Detergente Alcalino' as const,
          concentracao_recomendada: '2.0% a 3.0%',
          tempo_contato_minutos: 15,
          superficies_aplicacao: ['Pisos epóxi', 'Canaletas de drenagem', 'Paredes laváveis'],
          registro_anvisa_mapa: 'ANVISA nº 3.2514.0041',
        },
        {
          nome_comercial: 'SanitPeracetic 15',
          principio_ativo: 'Ácido Peracético 15% + Peróxido de Hidrogênio',
          categoria: 'Sanitizante' as const,
          concentracao_recomendada: '0.2% a 0.5%',
          tempo_contato_minutos: 15,
          superficies_aplicacao: ['Tanques de mistura', 'Tubulações', 'Bicos de dosagem'],
          registro_anvisa_mapa: 'MAPA nº 9.112/2022',
        },
      ]
      for (const p of seeds) {
        const payload: any = { ...p, is_ativo: true }
        if (orgId) payload.organization = orgId
        await pb.collection('limpeza_produtos').create(payload)
      }
      return await pb
        .collection('limpeza_produtos')
        .getFullList<LimpezaProduto>({ filter, sort: 'nome_comercial' })
    }
    return list
  } catch (err) {
    console.warn('Erro ao carregar limpeza_produtos:', err)
    return []
  }
}

export async function createLimpezaProduto(data: Partial<LimpezaProduto>): Promise<LimpezaProduto> {
  const orgId = getCurrentOrgId()
  const payload: any = { ...data, is_ativo: true }
  if (orgId) payload.organization = orgId
  const created = await pb.collection('limpeza_produtos').create<LimpezaProduto>(payload)
  await registrarAuditoriaLog({
    action: 'CRIAR_PRODUTO_LIMPEZA',
    target: 'limpeza_produtos',
    target_id: created.id,
    details: data,
  }).catch(() => {})
  return created
}

export async function deleteLimpezaProduto(id: string): Promise<boolean> {
  await pb.collection('limpeza_produtos').delete(id)
  return true
}

// 3. EQUIPAMENTOS
export async function getLimpezaEquipamentos(): Promise<LimpezaEquipamento[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const list = await pb.collection('limpeza_equipamentos').getFullList<LimpezaEquipamento>({
      filter,
      sort: 'tag',
    })
    if (list.length === 0) {
      const seeds = [
        {
          tag: 'EQ-MOE-01',
          nome: 'Moega de Descarga Rodoviária',
          setor_nome: 'Moega e Recebimento de Grãos',
          tipo_superficie: 'Aço Carbono e Grelha de Ferro Fundido',
          metodos_limpeza_permitidos: ['Limpeza a Seco / Varrição', 'Aspiração Industrial'],
          cuidados_especiais: 'Desligar sensor de nível e travar cadeado LOTO antes de adentrar.',
        },
        {
          tag: 'EQ-MIS-01',
          nome: 'Misturador Helicoidal Horizontal (1000 kg)',
          setor_nome: 'Dosagem de Micropacotes e Mistura',
          tipo_superficie: 'Aço Inox 304',
          metodos_limpeza_permitidos: [
            'Limpeza a Seco / Aspiração',
            'Flushing Mecânico',
            'Higienização Álcool 70%',
          ],
          cuidados_especiais:
            'Remoção obrigatória de resíduos de fundo falso e bordas do eixo central.',
        },
        {
          tag: 'EQ-ENS-01',
          nome: 'Ensacadeira Automática com Balança Eletrônica',
          setor_nome: 'Linha de Ensaque e Costura',
          tipo_superficie: 'Aço Inox e Borracha Sanitária',
          metodos_limpeza_permitidos: [
            'Ar Comprimido com Filtro de Óleo',
            'Aspiração',
            'Sanitização c/ Pano Úmido',
          ],
          cuidados_especiais: 'Não molhar células de carga da balança de precisão.',
        },
      ]
      for (const eq of seeds) {
        const payload: any = { ...eq, is_ativo: true }
        if (orgId) payload.organization = orgId
        await pb.collection('limpeza_equipamentos').create(payload)
      }
      return await pb
        .collection('limpeza_equipamentos')
        .getFullList<LimpezaEquipamento>({ filter, sort: 'tag' })
    }
    return list
  } catch (err) {
    console.warn('Erro ao carregar limpeza_equipamentos:', err)
    return []
  }
}

export async function createLimpezaEquipamento(
  data: Partial<LimpezaEquipamento>,
): Promise<LimpezaEquipamento> {
  const orgId = getCurrentOrgId()
  const payload: any = { ...data, is_ativo: true }
  if (orgId) payload.organization = orgId
  const created = await pb.collection('limpeza_equipamentos').create<LimpezaEquipamento>(payload)
  await registrarAuditoriaLog({
    action: 'CRIAR_EQUIPAMENTO_LIMPEZA',
    target: 'limpeza_equipamentos',
    target_id: created.id,
    details: data,
  }).catch(() => {})
  return created
}

export async function deleteLimpezaEquipamento(id: string): Promise<boolean> {
  await pb.collection('limpeza_equipamentos').delete(id)
  return true
}

// 4. MATRIZ SETOR × EQUIPAMENTO × PRODUTO × LIMPEZA
export async function getLimpezaProcedimentosMatriz(): Promise<LimpezaProcedimentoMatriz[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''
  try {
    const list = await pb
      .collection('limpeza_procedimentos_matriz')
      .getFullList<LimpezaProcedimentoMatriz>({
        filter,
        sort: 'codigo_procedimento',
      })
    if (list.length === 0) {
      const seeds = [
        {
          codigo_procedimento: 'POP02-PR-01',
          setor: 'Dosagem de Micropacotes e Mistura',
          equipamento_ou_area: 'EQ-MIS-01 — Misturador Helicoidal Horizontal',
          tipo_superficie: 'Aço Inox 304',
          tipo_limpeza: 'Limpeza a Seco / Aspiração',
          produto_utilizado: 'Alcoquatt 70% Plus',
          dosagem_diluicao: 'Pronto Uso com Borrifador',
          frequencia: 'A cada troca de produto / diário',
          tempo_contato: '10 minutos',
          criterio_aprovacao: 'Visual sem poeira / ATP bioluminescência < 30 RLU',
        },
        {
          codigo_procedimento: 'POP02-PR-02',
          setor: 'Moega e Recebimento de Grãos',
          equipamento_ou_area: 'EQ-MOE-01 — Moega de Descarga Rodoviária',
          tipo_superficie: 'Aço Carbono e Concreto',
          tipo_limpeza: 'Limpeza a Seco / Aspiração',
          produto_utilizado: 'Sem produto químico (varrição/aspiração mecânica)',
          dosagem_diluicao: 'N/A',
          frequencia: 'Ao final de cada turno de recebimento',
          tempo_contato: 'Imediato',
          criterio_aprovacao: 'Piso e grelha isentos de grãos estagnados e poeira acumulada',
        },
        {
          codigo_procedimento: 'POP02-PR-03',
          setor: 'Linha de Ensaque e Costura',
          equipamento_ou_area: 'EQ-ENS-01 — Ensacadeira Automática',
          tipo_superficie: 'Aço Inox e Borracha',
          tipo_limpeza: 'Flushing Mecânico',
          produto_utilizado: 'Farelo de Trigo Inerte (Arrasto)',
          dosagem_diluicao: '100 kg no circuito',
          frequencia: 'Troca de batelada com princípio ativo',
          tempo_contato: '3 ciclos completos',
          criterio_aprovacao: 'Ausência total de medicamento residual no lote subsequente',
        },
      ]
      for (const m of seeds) {
        const payload: any = { ...m, is_ativo: true }
        if (orgId) payload.organization = orgId
        await pb.collection('limpeza_procedimentos_matriz').create(payload)
      }
      return await pb
        .collection('limpeza_procedimentos_matriz')
        .getFullList<LimpezaProcedimentoMatriz>({ filter, sort: 'codigo_procedimento' })
    }
    return list
  } catch (err) {
    console.warn('Erro ao carregar limpeza_procedimentos_matriz:', err)
    return []
  }
}

export async function createLimpezaProcedimentoMatriz(
  data: Partial<LimpezaProcedimentoMatriz>,
): Promise<LimpezaProcedimentoMatriz> {
  const orgId = getCurrentOrgId()
  const payload: any = { ...data, is_ativo: true }
  if (orgId) payload.organization = orgId
  const created = await pb
    .collection('limpeza_procedimentos_matriz')
    .create<LimpezaProcedimentoMatriz>(payload)
  await registrarAuditoriaLog({
    action: 'CRIAR_MATRIZ_LIMPEZA',
    target: 'limpeza_procedimentos_matriz',
    target_id: created.id,
    details: data,
  }).catch(() => {})
  return created
}

export async function deleteLimpezaProcedimentoMatriz(id: string): Promise<boolean> {
  await pb.collection('limpeza_procedimentos_matriz').delete(id)
  return true
}
