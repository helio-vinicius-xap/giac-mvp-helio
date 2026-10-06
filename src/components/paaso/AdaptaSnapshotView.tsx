import React, { useState } from 'react'
import {
  ExternalLink,
  Sparkles,
  Maximize2,
  RefreshCw,
  Info,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const ADAPTA_QUALIFICA_URL =
  'https://skip-artifacts-snapshots.application.production.adapta.tools/user_34VdgGqJz7xlMCZfXqrw4GPW3bE/peb65jn7j7gbvifwgaksxj7zcu/revisions/83c1ffe3-d2ff-4824-ac90-794dcbcb61f7/index.html'

interface AdaptaSnapshotViewProps {
  onIrParaQualificacaoNativa?: () => void
}

export function AdaptaSnapshotView({ onIrParaQualificacaoNativa }: AdaptaSnapshotViewProps) {
  const [iframeKey, setIframeKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleRecarregar = () => {
    setIframeKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-4">
      {/* Banner Informativo sobre a integração nativa */}
      <div className="bg-gradient-to-r from-emerald-50 via-[#FAF7EF] to-amber-50 p-4 sm:p-5 rounded-2xl border border-[#E2DCCF] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9A404] text-stone-900 tracking-wide uppercase">
              Adapta One 27
            </span>
            <Badge
              variant="outline"
              className="text-[10px] border-emerald-300 bg-emerald-50 text-emerald-800"
            >
              Iteração 1 • QualificaFornecedor
            </Badge>
            <Badge className="bg-[#2D6A4F] text-white text-[10px]">
              Portado Nativamente no GIAC
            </Badge>
          </div>
          <h3 className="text-sm sm:text-base font-bold font-['Sora'] text-[#1B4332]">
            Módulo Original de Qualificação do Fornecedor (Snapshot Interativo)
          </h3>
          <p className="text-xs text-stone-600 max-w-3xl">
            Este é o ambiente interativo original da Iteração 1 criado no Adapta One 27. Toda a sua
            lógica — as 7 verificações regulatórias do MAPA, os 24 estabelecimentos de referência, o
            questionário prévio e os 5 cenários de teste rápido — já foi incorporada nativamente no
            GIAC com persistência segura no PocketBase e isolamento por CNPJ.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onIrParaQualificacaoNativa && (
            <Button
              onClick={onIrParaQualificacaoNativa}
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs h-9 gap-1.5 shadow-sm font-semibold"
            >
              <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
              Abrir Qualificação Nativa
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRecarregar}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-9 gap-1.5"
            title="Recarregar snapshot"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recarregar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs h-9 gap-1.5"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            {isFullscreen ? 'Reduzir' : 'Expandir'}
          </Button>

          <a
            href={ADAPTA_QUALIFICA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[#2D6A4F] hover:underline font-semibold px-2 py-1"
          >
            Abrir Link Externo
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Destaque das Funcionalidades Portadas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-xl border border-[#E2DCCF] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-800 block">7 Verificações Regulatórias</strong>
            <span className="text-stone-500 text-[11px]">
              CNPJ, Situação ATIVO, Razão (≥ 90%), Categoria, 10 Tipos de Produto, SIPEAGRO e
              Localização.
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E2DCCF] text-xs flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-800 block">24 Estabelecimentos Oficiais</strong>
            <span className="text-stone-500 text-[11px]">
              Base modelo com estabelecimentos nos estados SP, PR, MG, SC, RS, GO, MT, MS e BA.
            </span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E2DCCF] text-xs flex items-start gap-2.5">
          <Sparkles className="h-4 w-4 text-[#D9A404] shrink-0 mt-0.5" />
          <div>
            <strong className="text-stone-800 block">Preenchimento Rápido (5 Testes)</strong>
            <span className="text-stone-500 text-[11px]">
              Simulação de 1 clique para Aprovado Total, Ressalva, Reprovado Cat/Tipo e Não
              Encontrado.
            </span>
          </div>
        </div>
      </div>

      {/* Container do Iframe Embutido */}
      <div
        className={`bg-white rounded-2xl border border-[#E2DCCF] overflow-hidden shadow-xs transition-all ${
          isFullscreen ? 'fixed inset-4 z-50 bg-white flex flex-col p-4 shadow-2xl' : 'h-[750px]'
        }`}
      >
        {isFullscreen && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-stone-200">
            <span className="font-bold text-sm text-[#1B4332]">
              Snapshot Iteração 1 — QualificaFornecedor (Adapta One 27)
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="text-xs h-8"
            >
              Fechar Tela Cheia
            </Button>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={ADAPTA_QUALIFICA_URL}
          title="QualificaFornecedor - Iteração 1 Adapta One 27"
          className="w-full h-full border-0 rounded-xl"
          sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          loading="lazy"
        />
      </div>

      <div className="text-[11px] text-stone-500 flex items-center gap-1.5 px-1">
        <Info className="h-3.5 w-3.5 text-stone-400 shrink-0" />
        <span>
          O snapshot acima roda de forma isolada em sandbox para visualização comparativa. Todos os
          cadastros e avaliações definitivas do seu autocontrole (POP 01) devem ser realizados na
          aba <strong>Qualificação & Cruzamento</strong> nativa, onde são salvos no banco
          PocketBase, auditados no trilho legal e vinculados ao CNPJ da sua organização.
        </span>
      </div>
    </div>
  )
}
