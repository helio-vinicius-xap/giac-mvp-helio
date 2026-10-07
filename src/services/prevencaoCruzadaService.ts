import pb from '@/lib/pocketbase/client'
import { registrarAuditoriaLog } from './autoAvaliacaoService'

export type TemaPrevencaoCruzada =
  | 'qualificacao_fornecedores'
  | 'materias_primas'
  | 'limpeza_materiais_utensilios'
  | 'equipamentos'
  | 'limpeza_linha'
  | 'producao_ensaque'

export interface MetodoPrevencaoItem {
  id: string
  organization?: string
  tema: TemaPrevencaoCruzada
  titulo: string
  referencia_normativa?: string
  metodo_procedimento: string
  parametros_criticos?: Array<{ parametro: string; limite: string; frequencia: string }>
  pontos_inspecao?: string[]
  acoes_corretivas_imediatas?: string
  assinaturas?: {
    rt_re?: {
      nome: string
      papel: string
      data_hora: string
      cpf?: string
    }
    rq?: {
      nome: string
      papel: string
      data_hora: string
      cpf?: string
    }
  }
  status_assinatura?: string
  versao?: string
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

export const METODOS_PADRAO_IN04: Array<Omit<MetodoPrevencaoItem, 'id'>> = [
  {
    tema: 'qualificacao_fornecedores',
    titulo: 'Método 01: Qualificação Sanitária e Homologação de Fornecedores e Transportadores',
    referencia_normativa: 'IN 04/2007 Anexo II Item 07 Subitem 7.1 / TF-Autocontroles',
    metodo_procedimento:
      'Homologação prévia obrigatória via SIPEAGRO com verificação de vigência e cruzamento cadastral (POP 01-AC01). Monitoramento de veículos transportadores na descarga para garantir ausência de cargas prévias incompatíveis (ex: ruminantes, fertilizantes químicos, agrotóxicos ou produtos de origem animal não autorizados). Todo fornecedor deve comprovar programa BPF e controle de carreadores.',
    parametros_criticos: [
      {
        parametro: 'Cadastro SIPEAGRO',
        limite: 'Ativo e Válido no MAPA',
        frequencia: 'A cada lote recebido',
      },
      {
        parametro: 'Termo de Limpeza do Caminhão / Laudo Carga Anterior',
        limite: 'Ausência de contaminantes químicos/biológicos',
        frequencia: 'Por caminhão',
      },
    ],
    pontos_inspecao: [
      'Plataforma de descarga',
      'Conferência de NFe x SIPEAGRO',
      'Checklist de transporte na portaria',
    ],
    acoes_corretivas_imediatas:
      'Recusa sumária do lote e abertura imediata de RNC com devolução e notificação ao fornecedor.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
  {
    tema: 'materias_primas',
    titulo: 'Método 02: Segregação e Manejo Seguro de Matérias-Primas e Aditivos Críticos',
    referencia_normativa: 'IN 04/2007 Item 07 Subitem 7.2 / Decreto 6.296/2007',
    metodo_procedimento:
      'Armazenamento segregado com demarcação física entre matérias-primas com restrição de uso (ex: medicamentos, coccidiostáticos, promotores, ureia e farinhas de origem animal quando autorizadas). Uso de estrados ou silos dedicados, com identificação visual codificada por cores. Proibição absoluta de cruzamento entre insumos destinados a ruminantes e não-ruminantes.',
    parametros_criticos: [
      {
        parametro: 'Distância física entre lotes incompatíveis',
        limite: 'Segregação mínima com barreiras físicas ou silos estanques',
        frequencia: 'Contínua',
      },
      {
        parametro: 'Rotulagem de risco e advertência',
        limite: 'Etiqueta legível com lote, validade e restrição de espécie',
        frequencia: 'No recebimento',
      },
    ],
    pontos_inspecao: [
      'Almoxarifado de micropacotes',
      'Silos verticais',
      'Área de fracionamento de premix',
    ],
    acoes_corretivas_imediatas:
      'Interdição física do lote com etiqueta vermelha e retenção de produto para contra-prova laboratorial.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
  {
    tema: 'limpeza_materiais_utensilios',
    titulo: 'Método 03: Higienização e Controle de Ferramentas, Utensílios e Pás de Pesagem',
    referencia_normativa: 'IN 04/2007 Item 07 Subitem 7.3 / POP 02',
    metodo_procedimento:
      'Utensílios de pesagem (baldes, pás, dosadores e espátulas) identificados por código de cores de acordo com a toxicidade e classe do ingrediente (Azul: macroingredientes neutros; Amarelo: minerais/vitaminas; Vermelho: medicamentos e aditivos de dosagem controlada). Higienização a seco ou úmida com sanitizante homologado antes e após cada pesagem fracionada.',
    parametros_criticos: [
      {
        parametro: 'Controle de resíduos aderidos em pás',
        limite: 'Zero resíduo visível',
        frequencia: 'A cada batelada pesada',
      },
      {
        parametro: 'Esterilização / Sanitização de recipientes',
        limite: 'Solução de álcool 70% ou quaternário de amônio',
        frequencia: 'Troca de turno',
      },
    ],
    pontos_inspecao: [
      'Bancada de micropesagem',
      'Suportes de ferramentas',
      'Estação de lavagem de utensílios',
    ],
    acoes_corretivas_imediatas:
      'Lavagem imediata do utensílio, descarte da amostra contaminada e re-pesagem sob supervisão.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
  {
    tema: 'equipamentos',
    titulo: 'Método 04: Desenho Sanitário, Pontos Mortos e Descontaminação de Equipamentos Fabris',
    referencia_normativa: 'IN 04/2007 Item 07 Subitem 7.4 / POP 06',
    metodo_procedimento:
      'Inspeção periódica de pontos de retenção de massa (pés de elevadores de canecas, roscas transportadoras helicoidais, registros gaveta e portas de descarga do misturador). Manutenção preventiva para eliminar frestas, soldas rugosas ou desgastes mecânicos que propiciem acúmulo de produto residual entre bateladas distintas.',
    parametros_criticos: [
      {
        parametro: 'Inspeção de fundo falso do misturador',
        limite: 'Folga máxima de fita helicoidal < 5 mm',
        frequencia: 'Semanal',
      },
      {
        parametro: 'Fundo dos elevadores de caneca',
        limite: 'Abertura das portas de inspeção e limpeza de pé',
        frequencia: 'Por batelada com princípio ativo',
      },
    ],
    pontos_inspecao: [
      'Elevadores de canecas',
      'Misturador horizontal/vertical',
      'Filtros de manga de despoeiramento',
    ],
    acoes_corretivas_imediatas:
      'Parada da linha para aspiração industrial e ajuste mecânico das folgas antes de liberar a produção.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
  {
    tema: 'limpeza_linha',
    titulo: 'Método 05: Sequenciamento de Produção e Limpeza de Linha (Flushing e Validação)',
    referencia_normativa: 'IN 04/2007 Item 07 Subitem 7.5 / Critério Oficial MAPA',
    metodo_procedimento:
      'Definição de matriz rigorosa de sequenciamento de produção: alimentos livres de medicamentos precedem formulações medicamentosas; formulações com medicamentos são seguidas obrigatoriamente de processo de flushing (arrasto físico com veículo inerte, ex: farelo de trigo ou milho moído grosso) em volume calibrado (mínimo 15% a 20% da capacidade do misturador). Todo material de flushing deve ser segregado e destinado conforme regulamentado.',
    parametros_criticos: [
      {
        parametro: 'Volume de carga de flushing de linha',
        limite: 'Mínimo 15% do volume nominal do misturador',
        frequencia: 'Após cada lote com medicamento',
      },
      {
        parametro: 'Carryover (contaminação residual)',
        limite: '< 1.0% de princípio ativo carreado para a batelada subsequente',
        frequencia: 'Validação semestral com traçador',
      },
    ],
    pontos_inspecao: [
      'Painel CLP de sequenciamento',
      'Destino do lote de arraste / flushing',
      'Registros de bateladas F-SEQ-01',
    ],
    acoes_corretivas_imediatas:
      'Execução de segundo ciclo de flushing e quarentena do produto subsequente até resultado cromatográfico.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
  {
    tema: 'producao_ensaque',
    titulo: 'Método 06: Boas Práticas na Linha de Produção, Embalagens e Ensaque Final',
    referencia_normativa: 'IN 04/2007 Item 07 Subitem 7.6 / POP 05',
    metodo_procedimento:
      'Esgotamento completo de silos pulmão e bicas de ensacadeiras antes da transição de formulação. Utilização exclusiva de embalagens novas e impermeáveis devidamente rotuladas. Proibição de reaproveitamento de sacarias para produtos com princípios ativos diferentes. Marcação indelével de lote e data de fabricação para total rastreabilidade até o lote de matérias-primas.',
    parametros_criticos: [
      {
        parametro: 'Esgotamento da moega da ensacadeira',
        limite: 'Vazio total verificado visualmente e por sensor',
        frequencia: 'Troca de produto',
      },
      {
        parametro: 'Rótulo x Produto contido no saco',
        limite: '100% de conferência antes da costura/selagem',
        frequencia: 'Início de cada ordem de ensaque',
      },
    ],
    pontos_inspecao: [
      'Bico da ensacadeira',
      'Esteira de transporte de sacos',
      'Armazém de produto acabado expedido',
    ],
    acoes_corretivas_imediatas:
      'Bloqueio imediato do lote ensacado erroneamente, re-ensaque sob supervisão da Garantia da Qualidade.',
    status_assinatura: 'Pendente Assinatura',
    versao: 'Rev. 01/2025',
  },
]

export async function getMetodosPrevencao(): Promise<MetodoPrevencaoItem[]> {
  const orgId = getCurrentOrgId()
  const filter = orgId ? `organization = '${orgId}'` : ''

  try {
    const list = await pb
      .collection('prevencao_contaminacao_cruzada')
      .getFullList<MetodoPrevencaoItem>({
        filter,
        sort: 'tema',
      })

    if (list.length === 0) {
      // Auto-inicializar com os 6 métodos legais da IN 04/2007
      for (const m of METODOS_PADRAO_IN04) {
        const payload: any = { ...m, is_ativo: true }
        if (orgId) payload.organization = orgId
        await pb.collection('prevencao_contaminacao_cruzada').create(payload)
      }
      return await pb
        .collection('prevencao_contaminacao_cruzada')
        .getFullList<MetodoPrevencaoItem>({
          filter,
          sort: 'tema',
        })
    }
    return list
  } catch (err) {
    console.warn('Erro ao carregar prevencao_contaminacao_cruzada:', err)
    return []
  }
}

export async function updateMetodoPrevencao(
  id: string,
  data: Partial<MetodoPrevencaoItem>,
): Promise<MetodoPrevencaoItem> {
  const updated = await pb
    .collection('prevencao_contaminacao_cruzada')
    .update<MetodoPrevencaoItem>(id, data)
  await registrarAuditoriaLog({
    action: 'ATUALIZAR_METODO_PREVENCAO_CRUZADA',
    target: 'prevencao_contaminacao_cruzada',
    target_id: id,
    details: data,
  }).catch(() => {})
  return updated
}

export async function assinarMetodoPrevencao(
  id: string,
  user: { name?: string; role?: string; cpf?: string },
  tipoAssinatura: 'rt_re' | 'rq',
): Promise<MetodoPrevencaoItem> {
  const item = await pb.collection('prevencao_contaminacao_cruzada').getOne<MetodoPrevencaoItem>(id)
  const assinaturas = { ...(item.assinaturas || {}) }

  const novaAssinatura = {
    nome: user.name || 'Responsável',
    papel: user.role || 'Garantia',
    data_hora: new Date().toISOString(),
    cpf: user.cpf,
  }

  if (tipoAssinatura === 'rt_re') {
    assinaturas.rt_re = novaAssinatura
  } else {
    assinaturas.rq = novaAssinatura
  }

  const fullySigned = Boolean(assinaturas.rt_re && assinaturas.rq)
  const status_assinatura = fullySigned ? 'Comprovado (Assinado RT e RQ)' : 'Pendente de Assinatura'

  const updated = await pb
    .collection('prevencao_contaminacao_cruzada')
    .update<MetodoPrevencaoItem>(id, {
      assinaturas,
      status_assinatura,
    })

  await registrarAuditoriaLog({
    action: 'ASSINAR_METODO_PREVENCAO_CRUZADA',
    target: 'prevencao_contaminacao_cruzada',
    target_id: id,
    details: {
      tipoAssinatura,
      assinante: user.name,
      papel: user.role,
      fullySigned,
    },
  }).catch(() => {})

  return updated
}
