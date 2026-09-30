import { describe, it, expect } from 'vitest'
import {
  extractProcedureNumber,
  formatProcedureCode,
  getProcedureShortTitle,
  formatProcedureDisplayName,
  replacePopReferences,
} from '../procedureNaming'

describe('procedureNaming helper', () => {
  it('extracts procedure numbers correctly', () => {
    expect(extractProcedureNumber('POP-01')).toBe('01')
    expect(extractProcedureNumber('POP-001')).toBe('01')
    expect(extractProcedureNumber('POP 01')).toBe('01')
    expect(extractProcedureNumber('POP 1')).toBe('01')
    expect(extractProcedureNumber('POP-009')).toBe('09')
    expect(extractProcedureNumber('POP-010')).toBe('10')
    expect(extractProcedureNumber(null)).toBeNull()
  })

  it('formats procedure codes as Auto Controle XX', () => {
    expect(formatProcedureCode('POP-01')).toBe('Auto Controle 01')
    expect(formatProcedureCode('POP-001')).toBe('Auto Controle 01')
    expect(formatProcedureCode('POP-002')).toBe('Auto Controle 02')
    expect(formatProcedureCode('POP-009')).toBe('Auto Controle 09')
  })

  it('formats full display name: Auto Controle 01 – Nome Resumido', () => {
    expect(
      formatProcedureDisplayName({
        codigo: 'POP-01',
        nome: 'Qualificação de Fornecedores e Controle de Matérias-Primas, Ingredientes e de Embalagens',
      }),
    ).toBe('Auto Controle 01 – Qualificação de Fornecedores')

    expect(
      formatProcedureDisplayName({
        codigo: 'POP-002',
        nome: 'Limpeza e Higienização de Instalações, Linhas e Equipamentos',
      }),
    ).toBe('Auto Controle 02 – Limpeza e Higienização')

    expect(formatProcedureDisplayName('POP-009', 'Rastreabilidade de Lotes e Recolhimento')).toBe(
      'Auto Controle 09 – Rastreabilidade e Recolhimento',
    )
  })

  it('handles custom / non-official procedures gracefully', () => {
    expect(
      formatProcedureDisplayName({
        codigo: 'POP-010',
        nome: 'Procedimento Personalizado Especial de Teste da Fábrica',
      }),
    ).toBe('Auto Controle 10 – Procedimento Personalizado Especial de Teste...')
  })

  it('replaces textual references without breaking other acronyms like RT, RE, RQ, RNC', () => {
    const text = 'Verificar conformidade no POP 01 e acionar o RT e RE para assinar o POP.'
    const result = replacePopReferences(text)
    expect(result).toBe(
      'Verificar conformidade no Auto Controle 01 e acionar o RT e RE para assinar o Auto Controle.',
    )
  })
})
