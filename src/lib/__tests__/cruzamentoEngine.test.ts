import { describe, it, expect } from 'vitest'
import {
  calcularSimilaridade,
  normalizarTexto,
  normalizarCNPJ,
  executarCruzamentoSipeagro,
  verificarStatusVigencia,
} from '@/lib/cruzamentoEngine'
import type { SipeagroItem, DadosDeclaradosQualificacao } from '@/types/paaso'

describe('Motor de Cruzamento SIPEAGRO — 7 Verificações', () => {
  const estabBase: SipeagroItem = {
    cnpj: '11222333000181',
    razao_social: 'Nutrição Animal do Cerrado Ltda.',
    registro_sipeagro: 'SP-00123-1',
    situacao: 'ATIVO',
    uf: 'SP',
    municipio: 'Ribeirão Preto',
    categoria: 'fabricante',
    tipos_produto: ['ração', 'concentrado', 'núcleo'],
  }

  it('deve normalizar texto removendo acentos, pontuação e convertendo para minúsculo', () => {
    expect(normalizarTexto('Ração & Nutrição')).toBe('racao nutricao')
    expect(normalizarTexto('S.A. / LTDA.')).toBe('s a ltda')
  })

  it('deve normalizar CNPJ para 14 dígitos numéricos', () => {
    expect(normalizarCNPJ('11.222.333/0001-81')).toBe('11222333000181')
    expect(normalizarCNPJ('222333000181')).toBe('00222333000181')
  })

  it('deve calcular similaridade Levenshtein corretamente', () => {
    expect(calcularSimilaridade('Nutrição Animal', 'Nutricao Animal')).toBe(100)
    expect(
      calcularSimilaridade('Nutrição Animal do Cerrado Ltda.', 'Nutricao Animal do Cerrado Ltda'),
    ).toBeGreaterThanOrEqual(95)
  })

  it('deve aprovar 100% (score 100, resultado APROVADO) quando todos os dados conferem', () => {
    const dados: DadosDeclaradosQualificacao = {
      razao_social: 'Nutrição Animal do Cerrado Ltda.',
      registro_sipeagro: 'SP-00123-1',
      categoria: 'fabricante',
      tipos_produto: ['ração', 'concentrado'],
      uf: 'SP',
      municipio: 'Ribeirão Preto',
    }

    const resultado = executarCruzamentoSipeagro(
      dados,
      '11222333000181',
      estabBase,
      false,
      '2026-03-01',
    )

    expect(resultado.resultado).toBe('APROVADO')
    expect(resultado.score).toBe(100)
    expect(resultado.divergencias.length).toBe(0)
    expect(resultado.status_vigencia).toBe('VIGENTE')
  })

  it('deve gerar APROVADO_COM_RESSALVA quando divergir razão social (< 90%), registro ou localização', () => {
    const dados: DadosDeclaradosQualificacao = {
      razao_social: 'Cerrado Nutrição Agropecuária', // Razão social diferente
      registro_sipeagro: 'SP-00123-1',
      categoria: 'fabricante',
      tipos_produto: ['ração'],
      uf: 'SP',
      municipio: 'Franca', // Cidade diferente (-10)
    }

    const resultado = executarCruzamentoSipeagro(
      dados,
      '11222333000181',
      estabBase,
      false,
      '2026-03-01',
    )

    expect(resultado.resultado).toBe('APROVADO_COM_RESSALVA')
    expect(resultado.score).toBeLessThan(100)
    expect(resultado.divergencias.length).toBeGreaterThan(0)
  })

  it('deve REPROVAR e zerar score quando produtos declarados não constam no SIPEAGRO', () => {
    const dados: DadosDeclaradosQualificacao = {
      razao_social: 'Nutrição Animal do Cerrado Ltda.',
      registro_sipeagro: 'SP-00123-1',
      categoria: 'fabricante',
      tipos_produto: ['aditivo', 'ração'], // aditivo NÃO consta em estabBase
      uf: 'SP',
      municipio: 'Ribeirão Preto',
    }

    const resultado = executarCruzamentoSipeagro(
      dados,
      '11222333000181',
      estabBase,
      false,
      '2026-03-01',
    )

    expect(resultado.resultado).toBe('REPROVADO')
    expect(resultado.score).toBe(0)
    expect(resultado.divergencias.some((d) => d.includes('Incompatibilidade de produtos'))).toBe(
      true,
    )
  })

  it('deve REPROVAR e zerar score quando a situação cadastral no SIPEAGRO não for ATIVO', () => {
    const estabInativo: SipeagroItem = {
      ...estabBase,
      situacao: 'SUSPENSO',
    }

    const dados: DadosDeclaradosQualificacao = {
      razao_social: 'Nutrição Animal do Cerrado Ltda.',
      registro_sipeagro: 'SP-00123-1',
      categoria: 'fabricante',
      tipos_produto: ['ração'],
      uf: 'SP',
      municipio: 'Ribeirão Preto',
    }

    const resultado = executarCruzamentoSipeagro(
      dados,
      '11222333000181',
      estabInativo,
      false,
      '2026-03-01',
    )

    expect(resultado.resultado).toBe('REPROVADO')
    expect(resultado.score).toBe(0)
    expect(resultado.divergencias.some((d) => d.includes('Situação cadastral'))).toBe(true)
  })

  it('deve definir PENDENTE_REVISAO quando o CNPJ não for encontrado na base SIPEAGRO', () => {
    const dados: DadosDeclaradosQualificacao = {
      razao_social: 'Fornecedor Novo Não Cadastrado',
      categoria: 'fabricante',
      tipos_produto: ['ingrediente'],
    }

    const resultado = executarCruzamentoSipeagro(dados, '99999999000199', null, false, '2026-03-01')

    expect(resultado.resultado).toBe('PENDENTE_REVISAO')
    expect(resultado.score).toBe(50)
  })

  it('deve marcar status_vigencia como VENCIDA quando validade for anterior a hoje', () => {
    expect(verificarStatusVigencia('2024-01-01')).toBe('VENCIDA')
    expect(verificarStatusVigencia('2029-01-01')).toBe('VIGENTE')
  })
})
