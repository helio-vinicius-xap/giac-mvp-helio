import React, { useState } from 'react'
import {
  Link2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  UploadCloud,
  FileCheck2,
  ArrowRight,
  Sparkles,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  Filter,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MonitoringRecord, Procedure } from '@/types/agro'
import {
  evaluatePopChain,
  type PopChainStatus,
  type PendenciaItem,
  type RecordChainItem,
} from '@/lib/recordFlow'
import { formatProcedureCode } from '@/lib/procedureNaming'

interface PopPendingPanelProps {
  procedure: Procedure
  records: MonitoringRecord[]
  onOpenRecord: (record: MonitoringRecord | { formulario_codigo: string; id?: string }) => void
  onOpenDemandModal: () => void
  onOpenRecordPdf?: (record: MonitoringRecord) => void
  customForms?: any[]
}

export function PopPendingPanel({
  procedure,
  records,
  onOpenRecord,
  onOpenDemandModal,
  onOpenRecordPdf,
  customForms,
}: PopPendingPanelProps) {
  const [filterPendingOnly, setFilterPendingOnly] = useState(false)

  // Avalia a integridade da cadeia e pendências
  const chainStatus: PopChainStatus = evaluatePopChain(
    procedure.id,
    procedure.codigo,
    records,
    customForms,
  )

  const displayedChain = filterPendingOnly
    ? chainStatus.cadeias.filter(
        (c) => c.status_execucao === 'Pendente' || c.status_execucao === 'Em Preenchimento',
      )
    : chainStatus.cadeias

  return (
    <div className="space-y-5 animate-fade-in text-stone-900">
      {/* 1. Header do Painel com Status de Comprovação da Cadeia */}
      <div className="p-5 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2DCCF]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                FLUXO DE REGISTROS OBRIGATÓRIOS
              </span>
              <h2 className="text-lg font-bold font-['Sora'] text-[#1B4332]">
                Cadeia de Comprovação e Pendências ({formatProcedureCode(procedure.codigo)})
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-1">
              Mapeamento do encadeamento obrigatório (Recebimento → Amostra → Laudo →
              Destinação/Ação Corretiva). O Auto Controle só é considerado{' '}
              <strong className="text-emerald-800">Comprovado</strong> quando todos os elos abertos
              estão preenchidos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={onOpenDemandModal}
              className="bg-[#D9A404] hover:bg-[#b8860b] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm h-9"
            >
              <PlusCircle className="h-4 w-4" />
              Gerar Registro por Demanda
            </Button>
          </div>
        </div>

        {/* Cartões de Indicador do Status da Cadeia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card Status da Cadeia */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              chainStatus.isComprovado
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">
                Status da Execução
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {chainStatus.isComprovado ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">Cadeia Comprovada</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-bold text-amber-900">Cadeia Incompleta</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5">
                {chainStatus.isComprovado
                  ? 'Sem pendências regulatórias abertas.'
                  : chainStatus.motivoIncompletude}
              </p>
            </div>
            <Badge
              className={
                chainStatus.isComprovado
                  ? 'bg-[#1B4332] text-white text-[11px] px-2.5 py-1'
                  : 'bg-[#D9A404] text-[#1B4332] text-[11px] font-bold px-2.5 py-1'
              }
            >
              {chainStatus.isComprovado ? 'COMPROVADO' : 'INCOMPLETO'}
            </Badge>
          </div>

          {/* Card Total de Registros Existentes */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF7EF] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">
                Total de Registros
              </span>
              <span className="text-xl font-bold font-mono text-stone-800">
                {chainStatus.totalRegistros}
              </span>
              <span className="text-[11px] text-stone-500 block">Registros emitidos na base</span>
            </div>
            <FileText className="h-7 w-7 text-stone-400" />
          </div>

          {/* Card Pendências da Cadeia */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              chainStatus.totalPendencias > 0
                ? 'bg-red-50/70 border-red-300'
                : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-500 block">
                Pendências Obrigatórias
              </span>
              <span
                className={`text-xl font-bold font-mono ${
                  chainStatus.totalPendencias > 0 ? 'text-red-700' : 'text-stone-700'
                }`}
              >
                {chainStatus.totalPendencias}
              </span>
              <span className="text-[11px] text-stone-500 block">
                {chainStatus.totalPendencias === 0
                  ? 'Nenhum próximo registro pendente'
                  : 'Aguardando ação técnica'}
              </span>
            </div>
            <Clock
              className={`h-7 w-7 ${
                chainStatus.totalPendencias > 0 ? 'text-red-500' : 'text-stone-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 2. Lista de Pendências em Destaque (Se houver) */}
      {chainStatus.pendenciasAbertas.length > 0 && (
        <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50/40 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
              <h3 className="text-sm font-bold font-['Sora'] text-amber-950 uppercase tracking-wide">
                Pendências Críticas que Bloqueiam a Comprovação (
                {chainStatus.pendenciasAbertas.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-semibold">
              Exigem preenchimento ou anexo de comprovante
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {chainStatus.pendenciasAbertas.map((pen) => {
              const matchedRecord = records.find((r) => r.id === pen.registroId)

              return (
                <div
                  key={pen.id}
                  className="p-3.5 rounded-xl border border-amber-200 bg-white shadow-2xs flex flex-col justify-between space-y-2.5 hover:border-amber-400 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          {pen.codigoFormulario}
                        </span>
                        {pen.origem === 'cliente' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-blue-300 text-blue-700 bg-blue-50"
                          >
                            Aviso do Cliente
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                          >
                            Encadeamento Sistema
                          </Badge>
                        )}
                      </div>

                      <span className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Há {pen.diasAberto} {pen.diasAberto === 1 ? 'dia' : 'dias'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 leading-snug">{pen.titulo}</h4>

                    <p className="text-[11px] text-stone-600 leading-relaxed">{pen.motivo}</p>

                    {pen.lote && (
                      <span className="text-[10px] text-stone-500 font-mono block">
                        Lote Vinculado: <strong>{pen.lote}</strong>
                      </span>
                    )}

                    {pen.registroAnterior && (
                      <span className="text-[10px] text-stone-500 block">
                        Registro Anterior (Pai):{' '}
                        <strong className="font-mono">{pen.registroAnterior}</strong>
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-red-700 font-semibold">
                      ● Bloqueia Comprovação
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (matchedRecord) {
                          onOpenRecord(matchedRecord)
                        } else {
                          onOpenRecord({ formulario_codigo: pen.codigoFormulario })
                        }
                      }}
                      className="bg-[#1B4332] hover:bg-[#122e22] text-white text-xs h-7 px-2.5 font-semibold gap-1"
                    >
                      Preencher / Parecer
                      <ArrowRight className="h-3 w-3 text-[#D9A404]" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 3. Mapa Visual da Cadeia Completa de Registros */}
      <div className="p-5 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DCCF]">
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#D9A404]" />
              Mapa Visual da Cadeia Completa de Registros
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Rastreabilidade detalhada: registro pai anterior, links de registros seguintes e
              status de execução.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={filterPendingOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterPendingOnly(!filterPendingOnly)}
              className={
                filterPendingOnly
                  ? 'bg-amber-600 text-white hover:bg-amber-700 text-xs h-8 gap-1'
                  : 'text-stone-700 border-stone-300 text-xs h-8 gap-1'
              }
            >
              <Filter className="h-3 w-3" />
              {filterPendingOnly ? 'Exibindo Apenas Pendentes' : 'Filtrar Pendentes'}
            </Button>
          </div>
        </div>

        {/* Timeline / Grid de Encadeamento */}
        {displayedChain.length === 0 ? (
          <div className="py-10 text-center text-xs text-stone-500 space-y-2">
            <p>Nenhum registro encontrado para a visualização selecionada.</p>
            <Button
              size="sm"
              onClick={onOpenDemandModal}
              className="bg-[#1B4332] text-white text-xs h-8"
            >
              Criar Primeiro Registro por Demanda
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedChain.map((item, idx) => {
              const matchedRecord = records.find((r) => r.id === item.id)
              const isPendente = item.status_execucao === 'Pendente'

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPendente
                      ? 'border-amber-300 bg-amber-50/30'
                      : 'border-[#E2DCCF] bg-[#FAF7EF] hover:border-[#1B4332]'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1B4332] text-white">
                        {item.codigo_formulario}
                      </span>

                      <Badge
                        className={
                          item.status === 'Conforme'
                            ? 'bg-emerald-600 text-white text-[10px]'
                            : 'bg-red-600 text-white text-[10px]'
                        }
                      >
                        {item.status}
                      </Badge>

                      <Badge
                        variant="outline"
                        className={
                          isPendente
                            ? 'border-amber-400 bg-amber-100 text-amber-900 text-[10px] font-bold'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-800 text-[10px]'
                        }
                      >
                        {item.status_execucao}
                      </Badge>

                      {item.origem_registro === 'demanda_cliente_anexo' && (
                        <Badge
                          variant="outline"
                          className="border-blue-300 bg-blue-50 text-blue-700 text-[10px]"
                        >
                          📎 Anexo do Cliente
                        </Badge>
                      )}

                      {item.origem_registro === 'demanda_cliente_formulario' && (
                        <Badge
                          variant="outline"
                          className="border-purple-300 bg-purple-50 text-purple-700 text-[10px]"
                        >
                          📝 Demanda do Cliente
                        </Badge>
                      )}

                      <span className="text-[10px] text-stone-500">
                        {new Date(item.data).toLocaleDateString('pt-BR')} •{' '}
                        {item.responsavel || 'Técnico'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900">{item.titulo}</h4>

                    {/* Subcampos de Encadeamento */}
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-600 flex-wrap">
                      {item.registro_anterior && (
                        <span className="flex items-center gap-1 text-stone-500">
                          <span className="font-semibold text-stone-700">Anterior:</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-stone-200">
                            {item.registro_anterior}
                          </span>
                        </span>
                      )}

                      {item.lote && (
                        <span>
                          Lote: <strong className="text-stone-800">{item.lote}</strong>
                        </span>
                      )}

                      {item.registros_seguintes && item.registros_seguintes.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-stone-700">Próximos exigidos:</span>
                          <div className="flex gap-1 flex-wrap">
                            {item.registros_seguintes.map((seg, sIdx) => (
                              <span
                                key={sIdx}
                                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  seg.registro_id
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                }`}
                              >
                                {seg.codigo_formulario} {seg.registro_id ? '✓' : '⚠️'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações Diretas */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenRecordPdf && matchedRecord && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenRecordPdf(matchedRecord)}
                        className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#1B4332]" />
                        PDF
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => {
                        if (matchedRecord) {
                          onOpenRecord(matchedRecord)
                        } else {
                          onOpenRecord({ formulario_codigo: item.codigo_formulario, id: item.id })
                        }
                      }}
                      className={
                        isPendente
                          ? 'bg-[#D9A404] hover:bg-[#b8860b] text-[#1B4332] font-semibold text-xs h-8 gap-1'
                          : 'bg-[#1B4332] hover:bg-[#122e22] text-white text-xs h-8 gap-1'
                      }
                    >
                      {isPendente ? 'Resolver Pendência' : 'Abrir Registro'}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
