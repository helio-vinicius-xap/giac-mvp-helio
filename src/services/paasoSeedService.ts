// Seed de demonstração do PAASO — 20 estabelecimentos SIPEAGRO fictícios,
// 5 fornecedores cadastrados, qualificações, devoluções e não conformidades.
// Marcados explicitamente como is_exemplo: true.

import {
  criarOuAtualizarFornecedor,
  salvarQualificacao,
  criarDevolucao,
  salvarNcFornecedor,
  getSipeagroList,
  getFornecedoresList,
  getDevolucoesList,
  getNcFornecedorList,
} from './paasoService'
import pb from '@/lib/pocketbase/client'
import { normalizarCNPJ } from '@/lib/cruzamentoEngine'
import type { SipeagroItem } from '@/types/paaso'
import { ESTABELECIMENTOS_ADAPTA_ONE_24 } from '@/types/paasoAdaptaData'

export async function carregarDadosExemploPaaso(onProgress?: (pct: number, msg: string) => void) {
  const orgId = pb.authStore.record?.organization || undefined

  onProgress?.(5, 'Preparando estabelecimentos modelo SIPEAGRO...')

  // 1. Estabelecimentos modelo no SIPEAGRO (combina base original + 24 do Adapta One 27)
  const baseOriginal: Omit<SipeagroItem, 'id'>[] = [
    {
      cnpj: '11222333000181',
      razao_social: 'Nutrição Animal do Cerrado Ltda.',
      registro_sipeagro: 'SP-00123-1',
      situacao: 'ATIVO',
      uf: 'SP',
      municipio: 'Ribeirão Preto',
      categoria: 'fabricante',
      tipos_produto: ['ração', 'concentrado', 'núcleo'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '22333444000192',
      razao_social: 'Agro Grãos e Farelos Brasil S.A.',
      registro_sipeagro: 'MT-00456-2',
      situacao: 'ATIVO',
      uf: 'MT',
      municipio: 'Rondonópolis',
      categoria: 'fabricante',
      tipos_produto: ['ingrediente', 'coproduto'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '33444555000103',
      razao_social: 'BioVitaminas e Minerais Indústria Ltda.',
      registro_sipeagro: 'PR-00789-3',
      situacao: 'ATIVO',
      uf: 'PR',
      municipio: 'Cascavel',
      categoria: 'fabricante',
      tipos_produto: ['premix', 'aditivo', 'suplemento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '44555666000114',
      razao_social: 'Importadora Agropecuária Oceânica Ltda.',
      registro_sipeagro: 'SC-00234-4',
      situacao: 'ATIVO',
      uf: 'SC',
      municipio: 'Itajaí',
      categoria: 'importador',
      tipos_produto: ['aditivo', 'premix'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '55666777000125',
      razao_social: 'Armazéns Gerais Grão de Ouro S.A.',
      registro_sipeagro: 'GO-00987-5',
      situacao: 'ATIVO',
      uf: 'GO',
      municipio: 'Rio Verde',
      categoria: 'armazenador',
      tipos_produto: ['ingrediente', 'alimento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '66777888000136',
      razao_social: 'Fracionadora de Nutrientes do Sul Ltda.',
      registro_sipeagro: 'RS-00567-6',
      situacao: 'ATIVO',
      uf: 'RS',
      municipio: 'Passo Fundo',
      categoria: 'fracionador',
      tipos_produto: ['suplemento', 'núcleo'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '77888999000147',
      razao_social: 'PetFood Snacks & Mastigáveis do Brasil',
      registro_sipeagro: 'MG-00812-7',
      situacao: 'ATIVO',
      uf: 'MG',
      municipio: 'Uberlândia',
      categoria: 'fabricante',
      tipos_produto: ['produto mastigável', 'alimento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '88999000000158',
      razao_social: 'Coprodutos Cervejeiros da Mantiqueira',
      registro_sipeagro: 'SP-00341-8',
      situacao: 'ATIVO',
      uf: 'SP',
      municipio: 'Campinas',
      categoria: 'fabricante',
      tipos_produto: ['coproduto', 'alimento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '99000111000169',
      razao_social: 'Aditivos Bioenzimáticos do Nordeste Ltda.',
      registro_sipeagro: 'BA-00192-9',
      situacao: 'ATIVO',
      uf: 'BA',
      municipio: 'Feira de Santana',
      categoria: 'fabricante',
      tipos_produto: ['aditivo'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '10111222000170',
      razao_social: 'Mineração e Calcários Pantanal Ltda.',
      registro_sipeagro: 'MS-00673-0',
      situacao: 'ATIVO',
      uf: 'MS',
      municipio: 'Campo Grande',
      categoria: 'fabricante',
      tipos_produto: ['ingrediente', 'suplemento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '12131415000181',
      razao_social: 'Fosfatos e Nutrição Mineral Vale do Sol',
      registro_sipeagro: 'MG-00441-1',
      situacao: 'ATIVO',
      uf: 'MG',
      municipio: 'Araxá',
      categoria: 'fabricante',
      tipos_produto: ['ingrediente', 'suplemento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '13141516000192',
      razao_social: 'Complexo Agroindustrial Noroeste S.A.',
      registro_sipeagro: 'RO-00219-2',
      situacao: 'ATIVO',
      uf: 'RO',
      municipio: 'Ji-Paraná',
      categoria: 'fabricante',
      tipos_produto: ['ração', 'concentrado'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '14151617000103',
      razao_social: 'Silos e Logística Portuária Santos Ltda.',
      registro_sipeagro: 'SP-00891-3',
      situacao: 'ATIVO',
      uf: 'SP',
      municipio: 'Santos',
      categoria: 'armazenador',
      tipos_produto: ['ingrediente'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '15161718000114',
      razao_social: 'Premixes & Especialidades Pecuárias Ltda.',
      registro_sipeagro: 'PR-00332-4',
      situacao: 'ATIVO',
      uf: 'PR',
      municipio: 'Maringá',
      categoria: 'fabricante',
      tipos_produto: ['premix', 'núcleo', 'aditivo'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '16171819000125',
      razao_social: 'Alimentos Peletizados Planalto Central',
      registro_sipeagro: 'DF-00101-5',
      situacao: 'ATIVO',
      uf: 'DF',
      municipio: 'Brasília',
      categoria: 'fabricante',
      tipos_produto: ['ração', 'concentrado', 'alimento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '17181920000136',
      razao_social: 'Fracionamento e Ensaque Pioneiro Ltda.',
      registro_sipeagro: 'TO-00712-6',
      situacao: 'ATIVO',
      uf: 'TO',
      municipio: 'Gurupi',
      categoria: 'fracionador',
      tipos_produto: ['ração', 'núcleo'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '18192021000147',
      razao_social: 'Importadora Animal Euro-Tech S.A.',
      registro_sipeagro: 'ES-00505-7',
      situacao: 'ATIVO',
      uf: 'ES',
      municipio: 'Vitória',
      categoria: 'importador',
      tipos_produto: ['aditivo', 'suplemento'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '19202122000158',
      razao_social: 'Mastigáveis Naturais Caninos Ltda.',
      registro_sipeagro: 'RS-00911-8',
      situacao: 'ATIVO',
      uf: 'RS',
      municipio: 'Caxias do Sul',
      categoria: 'fabricante',
      tipos_produto: ['produto mastigável'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '20212223000169',
      razao_social: 'Coprodutos da Mandioca e Milho do Vale',
      registro_sipeagro: 'SC-00488-9',
      situacao: 'ATIVO',
      uf: 'SC',
      municipio: 'Chapecó',
      categoria: 'fabricante',
      tipos_produto: ['coproduto', 'ingrediente'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
    {
      cnpj: '21222324000170',
      razao_social: 'Nutracêuticos e Imunoestimulantes Equinos',
      registro_sipeagro: 'SP-00622-0',
      situacao: 'ATIVO',
      uf: 'SP',
      municipio: 'Campinas',
      categoria: 'fabricante',
      tipos_produto: ['suplemento', 'premix'],
      arquivo_origem: 'Demonstração PAASO',
      importado_em: new Date().toISOString(),
      is_exemplo: true,
    },
  ]

  // Mesclar estabelecimentos sem duplicar CNPJs
  const todosEstabelecimentos: Omit<SipeagroItem, 'id'>[] = [...ESTABELECIMENTOS_ADAPTA_ONE_24]
  const cnpjsJaAdicionados = new Set(
    ESTABELECIMENTOS_ADAPTA_ONE_24.map((e) => normalizarCNPJ(e.cnpj)),
  )
  for (const b of baseOriginal) {
    const norm = normalizarCNPJ(b.cnpj)
    if (!cnpjsJaAdicionados.has(norm)) {
      todosEstabelecimentos.push(b)
      cnpjsJaAdicionados.add(norm)
    }
  }

  for (let i = 0; i < todosEstabelecimentos.length; i++) {
    const item = todosEstabelecimentos[i]
    try {
      const payload: any = { ...item }
      if (orgId) payload.organization = orgId
      await pb.collection('sipeagro').create(payload)
    } catch {
      // Ignora se já existir
    }
  }

  onProgress?.(35, 'Cadastrando 5 fornecedores modelo...')

  // 2. 5 fornecedores modelo
  const fornecedoresExemplo = [
    {
      cnpj: '11222333000181',
      razao_social: 'Nutrição Animal do Cerrado Ltda.',
      contato_nome: 'Marcos Vinícius de Castro',
      email: 'comercial@nutricaocerrado.ind.br',
      telefone: '(16) 3600-1122',
      uf: 'SP',
      municipio: 'Ribeirão Preto',
      observacoes: 'Fornecedor homologado grau ouro.',
      is_exemplo: true,
    },
    {
      cnpj: '22333444000192',
      razao_social: 'Agro Grãos e Farelos Brasil S.A.',
      contato_nome: 'Dra. Camila Toledo',
      email: 'qualidade@agrobraos.com.br',
      telefone: '(66) 3411-9988',
      uf: 'MT',
      municipio: 'Rondonópolis',
      observacoes: 'Fornecimento de farelo e grãos selecionados.',
      is_exemplo: true,
    },
    {
      cnpj: '33444555000103',
      razao_social: 'BioVitaminas e Minerais Indústria Ltda.',
      contato_nome: 'Roberto Antunes',
      email: 'roberto@biovitaminas.com.br',
      telefone: '(45) 3222-7711',
      uf: 'PR',
      municipio: 'Cascavel',
      observacoes: 'Premixes vitamínicos e aditivos minerais.',
      is_exemplo: true,
    },
    {
      cnpj: '44555666000114',
      razao_social: 'Importadora Agropecuária Oceânica Ltda.',
      contato_nome: 'Patrícia Mendes',
      email: 'patricia@oceanicaagro.com',
      telefone: '(47) 3348-5500',
      uf: 'SC',
      municipio: 'Itajaí',
      observacoes: 'Importação marítima de aditivos regulamentados.',
      is_exemplo: true,
    },
    {
      cnpj: '99999888000109', // CNPJ não registrado no SIPEAGRO para testar Pendente de Revisão
      razao_social: 'Fazenda e Moagem São Lourenço Ltda.',
      contato_nome: 'Geraldo Alencar',
      email: 'geraldo@saolourenco.agr.br',
      telefone: '(35) 3331-4422',
      uf: 'MG',
      municipio: 'São Lourenço',
      observacoes: 'Proponente novo sem registro localizado.',
      is_exemplo: true,
    },
  ]

  for (const f of fornecedoresExemplo) {
    await criarOuAtualizarFornecedor(f)
  }

  onProgress?.(60, 'Gerando qualificações com cruzamento automático...')

  // 3. Qualificações com resultados variados (APROVADO, COM_RESSALVA, REPROVADO, PENDENTE_REVISAO, VENCIDA)
  const hoje = new Date()
  const dataHojeStr = hoje.toISOString().split('T')[0]

  // Validade de 1 ano atrás para testar vencida
  const umAnoAtras = new Date(hoje)
  umAnoAtras.setFullYear(umAnoAtras.getFullYear() - 1)
  const dataAnoAtrasStr = umAnoAtras.toISOString().split('T')[0]

  const qualificacoesExemplo = [
    // 1. Aprovado Pleno (Nutrição Cerrado)
    {
      fornecedor_cnpj: '11222333000181',
      data_formulario: dataHojeStr,
      dados_declarados: {
        razao_social: 'Nutrição Animal do Cerrado Ltda.',
        registro_sipeagro: 'SP-00123-1',
        categoria: 'fabricante',
        tipos_produto: ['ração', 'concentrado'],
        uf: 'SP',
        municipio: 'Ribeirão Preto',
        contato_nome: 'Marcos Vinícius de Castro',
        email: 'comercial@nutricaocerrado.ind.br',
      },
      resultado: 'APROVADO' as const,
      score: 100,
      divergencias: [],
      validade: new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status_vigencia: 'VIGENTE' as const,
      is_exemplo: true,
    },
    // 2. Aprovado com Ressalva (BioVitaminas - divergência leve na razão social ou local)
    {
      fornecedor_cnpj: '33444555000103',
      data_formulario: dataHojeStr,
      dados_declarados: {
        razao_social: 'BioVitaminas e Minerais Indústria',
        registro_sipeagro: 'PR-00789-3',
        categoria: 'fabricante',
        tipos_produto: ['premix', 'aditivo'],
        uf: 'PR',
        municipio: 'Toledo', // Diverge de Cascavel
        contato_nome: 'Roberto Antunes',
        email: 'roberto@biovitaminas.com.br',
      },
      resultado: 'APROVADO_COM_RESSALVA' as const,
      score: 90,
      divergencias: ['Localização diverge: declarada Toledo/PR, no MAPA consta Cascavel/PR.'],
      validade: new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status_vigencia: 'VIGENTE' as const,
      is_exemplo: true,
    },
    // 3. Reprovado (Oceânica - declarou tipo não autorizado)
    {
      fornecedor_cnpj: '44555666000114',
      data_formulario: dataHojeStr,
      dados_declarados: {
        razao_social: 'Importadora Agropecuária Oceânica Ltda.',
        registro_sipeagro: 'SC-00234-4',
        categoria: 'importador',
        tipos_produto: ['aditivo', 'ração'], // Ração não consta na base para essa importadora
        uf: 'SC',
        municipio: 'Itajaí',
      },
      resultado: 'REPROVADO' as const,
      score: 0,
      divergencias: [
        'Incompatibilidade de produtos: declarou ração não autorizada na linha do MAPA.',
      ],
      validade: new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status_vigencia: 'VIGENTE' as const,
      is_exemplo: true,
    },
    // 4. Pendente de Revisão (São Lourenço - CNPJ não existe no SIPEAGRO)
    {
      fornecedor_cnpj: '99999888000109',
      data_formulario: dataHojeStr,
      dados_declarados: {
        razao_social: 'Fazenda e Moagem São Lourenço Ltda.',
        registro_sipeagro: 'MG-99999-0',
        categoria: 'fabricante',
        tipos_produto: ['ingrediente'],
        uf: 'MG',
        municipio: 'São Lourenço',
      },
      resultado: 'PENDENTE_REVISAO' as const,
      score: 50,
      divergencias: ['CNPJ não localizado na base oficial de estabelecimentos SIPEAGRO/MAPA.'],
      validade: new Date(hoje.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status_vigencia: 'VIGENTE' as const,
      is_exemplo: true,
    },
    // 5. Qualificação Vencida (Agro Grãos - realizada há mais de 12 meses)
    {
      fornecedor_cnpj: '22333444000192',
      data_formulario: '2024-02-15',
      dados_declarados: {
        razao_social: 'Agro Grãos e Farelos Brasil S.A.',
        registro_sipeagro: 'MT-00456-2',
        categoria: 'fabricante',
        tipos_produto: ['ingrediente', 'coproduto'],
        uf: 'MT',
        municipio: 'Rondonópolis',
      },
      resultado: 'APROVADO' as const,
      score: 100,
      divergencias: [],
      validade: '2025-02-15', // Já expirou
      status_vigencia: 'VENCIDA' as const,
      is_exemplo: true,
    },
  ]

  for (const q of qualificacoesExemplo) {
    await salvarQualificacao(q)
  }

  onProgress?.(80, 'Inserindo devoluções e não conformidades modelo...')

  // 4. Devoluções de exemplo
  const devolucoesExemplo = [
    {
      data: dataHojeStr,
      fornecedor_cnpj: '22333444000192',
      produto: 'Farelo de Soja 46%',
      lote: 'FS-2026-088',
      motivo: 'Teor de umidade acima do limite crítico (14,8%)',
      quantidade: 14000,
      valor: 32000,
      status: 'Concluída',
      is_exemplo: true,
    },
    {
      data: '2026-02-18',
      fornecedor_cnpj: '33444555000103',
      produto: 'Premix Mineral Bovino',
      lote: 'PM-2026-012',
      motivo: 'Embalagem violada e empedramento parcial',
      quantidade: 1200,
      valor: 8400,
      status: 'Concluída',
      is_exemplo: true,
    },
    {
      data: '2026-01-10',
      fornecedor_cnpj: '44555666000114',
      produto: 'Cloreto de Colina 60%',
      lote: 'COL-60-99',
      motivo: 'Certificado de análise ausente e laudo divergente',
      quantidade: 5000,
      valor: 18500,
      status: 'Em Análise',
      is_exemplo: true,
    },
  ]

  for (const d of devolucoesExemplo) {
    await criarDevolucao(d)
  }

  // 5. Não Conformidades do fornecedor (incluindo aberta com prazo estourado)
  const ncsExemplo = [
    {
      data: '2026-02-01',
      fornecedor_cnpj: '22333444000192',
      descricao: 'Carga entregue em caminhão com lona rasgada e indícios de chuva.',
      severidade: 'ALTA' as const,
      acao_corretiva: 'Notificação com exigência de checklist de transporte seguro.',
      prazo: '2026-02-15', // Prazo estourado!
      status: 'ABERTA' as const,
      is_exemplo: true,
    },
    {
      data: dataHojeStr,
      fornecedor_cnpj: '33444555000103',
      descricao: 'Atraso na apresentação da contraprova analítica de micotoxinas.',
      severidade: 'MEDIA' as const,
      acao_corretiva: 'Reunião de alinhamento com garantia da qualidade do fornecedor.',
      prazo: new Date(hoje.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'EM_TRATAMENTO' as const,
      is_exemplo: true,
    },
    {
      data: '2026-01-20',
      fornecedor_cnpj: '11222333000181',
      descricao: 'Etiqueta de rastreabilidade de sacaria com lote ilegível em 5 volumes.',
      severidade: 'BAIXA' as const,
      acao_corretiva: 'Substituição das etiquetas e calibração da impressora térmica.',
      prazo: '2026-02-05',
      status: 'ENCERRADA' as const,
      is_exemplo: true,
    },
    {
      data: '2026-02-20',
      fornecedor_cnpj: '44555666000114',
      descricao: 'Laudo de liberação alfandegária entregue fora do prazo estipulado.',
      severidade: 'CRITICA' as const,
      acao_corretiva: 'Bloqueio preventivo de novos pedidos até regularização.',
      prazo: '2026-03-01',
      status: 'ABERTA' as const,
      is_exemplo: true,
    },
  ]

  for (const nc of ncsExemplo) {
    await salvarNcFornecedor(nc)
  }

  onProgress?.(100, 'Dados de exemplo carregados com sucesso!')
}

/**
 * Remove apenas os registros marcados como is_exemplo: true
 */
export async function removerDadosExemploPaaso(onProgress?: (pct: number, msg: string) => void) {
  onProgress?.(10, 'Removendo não conformidades de exemplo...')
  const ncs = await pb.collection('nao_conformidades_fornecedor').getFullList<any>({
    filter: 'is_exemplo = true',
  })
  for (const n of ncs) {
    await pb.collection('nao_conformidades_fornecedor').delete(n.id)
  }

  onProgress?.(30, 'Removendo devoluções de exemplo...')
  const devols = await pb.collection('devolucoes').getFullList<any>({
    filter: 'is_exemplo = true',
  })
  for (const d of devols) {
    await pb.collection('devolucoes').delete(d.id)
  }

  onProgress?.(50, 'Removendo qualificações de exemplo...')
  const quals = await pb.collection('qualificacoes').getFullList<any>({
    filter: 'is_exemplo = true',
  })
  for (const q of quals) {
    try {
      const val = await pb
        .collection('fornecedores_validados')
        .getFirstListItem<any>(`origem_qualificacao = '${q.id}'`)
      await pb.collection('fornecedores_validados').delete(val.id)
    } catch {
      /* intentionally ignored */
    }
    await pb.collection('qualificacoes').delete(q.id)
  }

  onProgress?.(70, 'Removendo fornecedores de exemplo...')
  const forns = await pb.collection('fornecedores').getFullList<any>({
    filter: 'is_exemplo = true',
  })
  for (const f of forns) {
    await pb.collection('fornecedores').delete(f.id)
  }

  onProgress?.(90, 'Removendo estabelecimentos SIPEAGRO de exemplo...')
  const sipes = await pb.collection('sipeagro').getFullList<any>({
    filter: 'is_exemplo = true',
  })
  for (const s of sipes) {
    await pb.collection('sipeagro').delete(s.id)
  }

  onProgress?.(100, 'Dados de demonstração removidos com sucesso.')
}
