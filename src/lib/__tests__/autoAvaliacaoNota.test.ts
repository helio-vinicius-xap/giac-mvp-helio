import { describe, it, expect } from 'vitest'
import {
  calcularNotaFinalAutoAvaliacao,
  avaliarAprovacaoFinal,
} from '@/types/autoAvaliacaoFornecedor'

describe('Cálculo da NOTA FINAL e Aprovação - Auto Avaliação Fornecedor (POP 01-AC01)', () => {
  it('calcula corretamente o caso da especificação: 10 C + 2 NA em 20 perguntas -> 60%', () => {
    // Exemplo do usuário no prompt: 10 C + 2 NA -> 60%
    // NOTA = ((10 + 2) / 20) * 100 = 60.0
    const nota = calcularNotaFinalAutoAvaliacao(10, 2, 20)
    expect(nota).toBe(60)
  })

  it('calcula 100% quando todas as respostas são C ou NA', () => {
    const nota = calcularNotaFinalAutoAvaliacao(18, 2, 20)
    expect(nota).toBe(100)
    expect(avaliarAprovacaoFinal(nota, 70)).toBe('APROVADO')
  })

  it('calcula 0% quando não há C nem NA (apenas NC ou não respondidas)', () => {
    const nota = calcularNotaFinalAutoAvaliacao(0, 0, 20)
    expect(nota).toBe(0)
    expect(avaliarAprovacaoFinal(nota, 70)).toBe('REPROVADO')
  })

  it('avalia aprovação no limiar de corte exato (70%)', () => {
    // 14 C + 0 NA = 14 / 20 * 100 = 70%
    const nota = calcularNotaFinalAutoAvaliacao(14, 0, 20)
    expect(nota).toBe(70)
    expect(avaliarAprovacaoFinal(nota, 70)).toBe('APROVADO')
  })

  it('avalia reprovação imediatamente abaixo do limiar (65% < 70%)', () => {
    // 13 C + 0 NA = 13 / 20 * 100 = 65%
    const nota = calcularNotaFinalAutoAvaliacao(13, 0, 20)
    expect(nota).toBe(65)
    expect(avaliarAprovacaoFinal(nota, 70)).toBe('REPROVADO')
  })

  it('respeita limiar customizado configurado pelo admin (ex: 80%)', () => {
    // 15 C / 20 = 75% -> aprovado no default (70%), mas reprovado com limiar 80%
    const nota = calcularNotaFinalAutoAvaliacao(15, 0, 20)
    expect(nota).toBe(75)
    expect(avaliarAprovacaoFinal(nota, 70)).toBe('APROVADO')
    expect(avaliarAprovacaoFinal(nota, 80)).toBe('REPROVADO')
  })

  it('lida com divisão segura quando total de perguntas for zero', () => {
    const nota = calcularNotaFinalAutoAvaliacao(5, 2, 0)
    expect(nota).toBe(0)
  })
})
