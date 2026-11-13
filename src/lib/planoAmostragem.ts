// Regras puras do Plano de Amostragem (Anexo II — matriz de risco)

export type Nivel = 'ALTA' | 'MEDIA' | 'BAIXA'
export type ClasseRisco = 'ALTO' | 'MEDIO' | 'BAIXO'

export const NIVEIS: Nivel[] = ['ALTA', 'MEDIA', 'BAIXA']

const PONTOS: Record<Nivel, number> = { ALTA: 3, MEDIA: 2, BAIXA: 1 }

export const FREQUENCIA_POR_CLASSE: Record<ClasseRisco, string> = {
  ALTO: 'Verificação por lote ou, no mínimo, mensal por família de produto ou ingrediente; monitoramento em 100% dos eventos críticos',
  MEDIO: 'Verificação trimestral; monitoramento documental em 100% dos recebimentos',
  BAIXO: 'Verificação semestral ou anual, ou controle documental por certificado do fornecedor com verificação amostral',
}

/**
 * Classifica o risco conforme o Anexo II.
 * Regra de prudência sanitária: severidade ALTA com probabilidade MÉDIA é sempre RISCO ALTO.
 * Demais casos: pontuação S x P (>= 6 ALTO; 3 a 4 MÉDIO; <= 2 BAIXO).
 */
export function classificarRisco(
  severidade: Nivel,
  probabilidade: Nivel,
): { pontuacao: number; classe: ClasseRisco; frequencia: string; prudencia: boolean } {
  const pontuacao = PONTOS[severidade] * PONTOS[probabilidade]
  const prudencia = severidade === 'ALTA' && probabilidade === 'MEDIA'
  let classe: ClasseRisco
  if (prudencia || pontuacao >= 6) classe = 'ALTO'
  else if (pontuacao >= 3) classe = 'MEDIO'
  else classe = 'BAIXO'
  return { pontuacao, classe, frequencia: FREQUENCIA_POR_CLASSE[classe], prudencia }
}

export const ROTULO_CLASSE: Record<ClasseRisco, string> = {
  ALTO: 'RISCO ALTO',
  MEDIO: 'RISCO MÉDIO',
  BAIXO: 'RISCO BAIXO',
}
