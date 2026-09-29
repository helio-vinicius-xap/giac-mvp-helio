// Serviço de Integração dos Anexos do POP 01 com o PocketBase
import pb from '@/lib/pocketbase/client'
import type { MonitoringRecord, Procedure, Company } from '@/types/agro'
import type {
  AnexoIQualificacaoData,
  AnexoIIListaData,
  AnexoIIFornecedorItem,
  AnexoIIIRecebimentoData,
  AnexoIVColetaAmostraData,
  AnexoVAnaliseLaboratorialData,
  AnexoVIDestinacaoData,
  AnexoVIIAcaoCorretivaData,
} from '@/types/pop01Forms'
import { gerarCodigoRegistro } from '@/lib/pop01Validators'

// Busca a lista consolidada de fornecedores do Anexo II
export async function getFornecedoresQualificados(
  procedureId?: string,
): Promise<AnexoIIFornecedorItem[]> {
  try {
    // Busca registros com formulario_codigo = 'FR 14' ou 'ANEXO II'
    const records = await pb.collection('records').getFullList<MonitoringRecord>({
      filter: `formulario_codigo = 'FR 14' || formulario_codigo = 'ANEXO II'`,
      sort: '-created',
    })

    const fornecedores: AnexoIIFornecedorItem[] = []
    const seenIds = new Set<string>()

    for (const r of records) {
      const d = r.dados_formulario as any
      if (!d) continue

      // Caso seja registro individual de fornecedor (ou tabela inteira salva)
      if (Array.isArray(d.fornecedores)) {
        for (const item of d.fornecedores) {
          if (item && item.cnpj && !seenIds.has(item.cnpj)) {
            seenIds.add(item.cnpj)
            fornecedores.push({
              ...item,
              id: item.id || r.id,
            })
          }
        }
      } else if (d.razao_social) {
        if (!seenIds.has(d.cnpj || r.id)) {
          seenIds.add(d.cnpj || r.id)
          fornecedores.push({
            id: r.id,
            id_fornecedor: d.id_fornecedor || d.codigo || `FOR-${r.id.slice(0, 6)}`,
            razao_social: d.razao_social,
            cnpj: d.cnpj || '',
            produtos_fornecidos: d.produtos_fornecidos || d.materia_prima_insumo || '',
            data_qualificacao: d.data_qualificacao || r.data.split('T')[0],
            data_validade: d.data_validade || d.validade_qualificacao || '',
            status: d.status || d.status_cadastral || 'Ativo',
            responsavel_tecnico: d.responsavel_tecnico || '',
            telefone: d.telefone || '',
            email: d.email || '',
            ultima_revisao: d.ultima_revisao || r.updated.split('T')[0],
            motivo_desqualificacao: d.motivo_desqualificacao,
          })
        }
      }
    }

    return fornecedores
  } catch {
    return []
  }
}

// Salva ou atualiza um fornecedor no Anexo II (gerando/atualizando registro do FR 14)
export async function salvarFornecedorNoAnexoII(
  procedureId: string,
  fornecedor: Partial<AnexoIIFornecedorItem>,
  userName: string,
): Promise<MonitoringRecord> {
  const dados = {
    ...fornecedor,
    ultima_revisao: new Date().toISOString().split('T')[0],
  }

  // Verifica se já existe um registro para este fornecedor (pelo CNPJ ou ID)
  if (fornecedor.id && fornecedor.id.length === 15) {
    try {
      return await pb.collection('records').update<MonitoringRecord>(fornecedor.id, {
        dados_formulario: dados,
        valor_medido: `Fornecedor: ${fornecedor.razao_social} - ${fornecedor.status}`,
        status: fornecedor.status === 'Ativo' ? 'Conforme' : 'Não Conforme',
        observacoes: fornecedor.motivo_desqualificacao || '',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  // Criar novo
  return await pb.collection('records').create<MonitoringRecord>({
    procedure: procedureId,
    formulario_codigo: 'FR 14',
    dados_formulario: dados,
    data: `${new Date().toISOString().split('T')[0]} 08:00:00.000Z`,
    turno: 'Manhã',
    valor_medido: `Fornecedor: ${fornecedor.razao_social} - ${fornecedor.status || 'Ativo'}`,
    status: fornecedor.status === 'Ativo' ? 'Conforme' : 'Não Conforme',
    responsavel: userName,
    lote: fornecedor.cnpj || '',
    status_assinatura: 'Pendente Assinatura',
  })
}

// Conta quantas NCs um fornecedor teve nos últimos 12 meses (para Seção 8 do Anexo VII e Alertas)
export async function countNcsFornecedor12Meses(razaoSocial: string): Promise<number> {
  if (!razaoSocial) return 0
  try {
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    // Buscar em records e non_conformities
    const records = await pb.collection('records').getFullList<MonitoringRecord>({
      filter: `(formulario_codigo = 'FR 01' || formulario_codigo = 'ANEXO VII' || formulario_codigo = 'FR 08') && status = 'Não Conforme' && data >= '${twelveMonthsAgo}'`,
    })

    let count = 0
    for (const r of records) {
      const d = r.dados_formulario as any
      if (
        d &&
        (d.fornecedor_razao_social?.toLowerCase().includes(razaoSocial.toLowerCase()) ||
          d.fornecedor?.toLowerCase().includes(razaoSocial.toLowerCase()))
      ) {
        count++
      }
    }
    return count
  } catch {
    return 0
  }
}

// Busca todos os usuários do sistema para preenchimento de dropdowns de responsáveis/assinaturas
export async function getSystemUsersList(): Promise<
  Array<{ id: string; name: string; role: string; cargo?: string; assinatura_imagem?: string }>
> {
  try {
    const users = await pb.collection('users').getFullList({
      sort: 'name',
    })
    return users.map((u: any) => ({
      id: u.id,
      name: u.name || u.email,
      role: u.role || 'operador',
      cargo: u.cargo || '',
      assinatura_imagem: u.assinatura_imagem ? pb.files.getURL(u, u.assinatura_imagem) : undefined,
    }))
  } catch {
    return [
      { id: '1', name: 'Dr. Hélio Silva', role: 'RT', cargo: 'Responsável Técnico' },
      { id: '2', name: 'Dra. Mariana Siqueira', role: 'RQ', cargo: 'Coordenadora CQ' },
      {
        id: '3',
        name: 'Carlos Eduardo Prado de Oliveira',
        role: 'RE',
        cargo: 'Responsável pelo Estabelecimento (MAPA)',
      },
      { id: '4', name: 'João Carlos', role: 'operador', cargo: 'Operador de Recebimento' },
    ]
  }
}
