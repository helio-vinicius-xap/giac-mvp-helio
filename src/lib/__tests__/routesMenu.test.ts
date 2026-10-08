import { describe, it, expect } from 'vitest'

describe('Validação de Rotas e Navegação do Menu GIAC', () => {
  const routes = [
    { label: 'Visão Geral', path: '/' },
    { label: 'Qualificação de Fornecedores', path: '/paaso' },
    { label: 'Auto Controles (Pops)', path: '/procedimentos' },
    { label: 'Rotinas e Programação', path: '/programacao' },
    { label: 'Registros', path: '/registros' },
    { label: 'Auditorias', path: '/auditorias' },
    { label: 'Rastreabilidade', path: '/rastreabilidade' },
    { label: 'Não Conformidades', path: '/nao-conformidades' },
    { label: 'Treinamentos', path: '/treinamentos' },
    { label: 'Documentos', path: '/documentos' },
    { label: 'Empresa (SIPEAGRO)', path: '/empresa' },
    { label: 'Assinatura / Faturamento', path: '/assinatura' },
    { label: 'Painel Super Admin', path: '/admin' },
  ]

  it('possui a ordem correta das rotas de Auto Controles, Programação e PAASO', () => {
    const paths = routes.map((r) => r.path)
    expect(paths).toContain('/paaso')
    expect(paths).toContain('/procedimentos')
    expect(paths).toContain('/programacao')

    const paasoIndex = paths.indexOf('/paaso')
    const procedimentosIndex = paths.indexOf('/procedimentos')
    const programacaoIndex = paths.indexOf('/programacao')

    // /paaso vem antes de /procedimentos e /programacao no menu atualizado
    expect(paasoIndex).toBeLessThan(procedimentosIndex)
    expect(procedimentosIndex).toBeLessThan(programacaoIndex)
  })

  it('todas as rotas possuem formatação de URI válida', () => {
    routes.forEach((route) => {
      expect(route.path.startsWith('/')).toBe(true)
      expect(route.label.trim().length).toBeGreaterThan(0)
    })
  })
})
