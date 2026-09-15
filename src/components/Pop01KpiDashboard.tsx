import React from 'react'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Truck,
  Users,
  Thermometer,
  Trash2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { POP01PainelResumo } from '@/types/pop01Forms'

interface Pop01KpiDashboardProps {
  summary: POP01PainelResumo
  onOpenFormTab?: (tabName: string) => void
}

export function Pop01KpiDashboard({ summary, onOpenFormTab }: Pop01KpiDashboardProps) {
  const { kpis, visao_geral } = summary

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumo Executivo em Cards Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Conf. Recebimento
            </span>
            <Truck className="h-4 w-4 text-[#2D6A4F]" />
          </div>
          <div className="text-xl font-bold font-['Sora'] text-[#2D6A4F]">
            {visao_geral.conformidade_recebimento_percent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            Meta: &gt; 98,5% ({visao_geral.total_recebimentos_fr08} lotes)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total de RNCs</span>
            <AlertTriangle className="h-4 w-4 text-[#D9A404]" />
          </div>
          <div className="text-xl font-bold font-['Sora'] text-stone-800">
            {visao_geral.total_rncs_fr01}
          </div>
          <p className="text-[10px] text-red-600 font-semibold mt-1">
            {visao_geral.rncs_criticas} Crítica(s)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Fornecedores Ativos
            </span>
            <Users className="h-4 w-4 text-[#2D6A4F]" />
          </div>
          <div className="text-xl font-bold font-['Sora'] text-stone-800">
            {visao_geral.fornecedores_ativos}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            de {visao_geral.fornecedores_cadastrados_fr14} homologados
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Doc. Vencida</span>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </div>
          <div
            className={`text-xl font-bold font-['Sora'] ${
              visao_geral.fornecedores_vencidos > 0 ? 'text-amber-700' : 'text-stone-800'
            }`}
          >
            {visao_geral.fornecedores_vencidos}
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {visao_geral.fornecedores_suspensos} Suspenso(s)
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Descartado</span>
            <Trash2 className="h-4 w-4 text-stone-600" />
          </div>
          <div className="text-xl font-bold font-['Sora'] text-stone-800">
            {visao_geral.descartes_kg.toLocaleString('pt-BR')} kg
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {visao_geral.total_descartes_fr18} registro(s) FR 18
          </p>
        </div>

        <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Conf. Térmica</span>
            <Thermometer className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-['Sora'] text-emerald-700">
            {visao_geral.conformidade_termica_percent.toFixed(1)}%
          </div>
          <p className="text-[10px] text-stone-500 mt-1">
            {visao_geral.monitoramentos_temp_fr15} medições FR 15
          </p>
        </div>
      </div>

      {/* Tabela dos Indicadores Oficiais de Gestão do Autocontrole (Seção 14 do POP 01) */}
      <div className="p-5 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DCCF]">
          <div>
            <h3 className="text-sm font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#D9A404]" />
              Painel de Indicadores — Seção 14 do POP 01
            </h3>
            <p className="text-xs text-stone-500">
              Métricas calculadas automaticamente em tempo real a partir dos formulários digitais
              (FR 08, FR 14, FR 15, FR 18 e FR 01).
            </p>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] border-[#2D6A4F] text-[#2D6A4F] self-start sm:self-auto"
          >
            Auditável pelo MAPA (IN 04/2007)
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] text-stone-500 uppercase tracking-wider text-[10px] bg-[#FAF7EF]">
                <th className="py-2.5 px-3">Indicador (POP 01)</th>
                <th className="py-2.5 px-3">Fórmula / Métrica</th>
                <th className="py-2.5 px-3 text-center">Periodicidade</th>
                <th className="py-2.5 px-3 text-center">Meta Estabelecida</th>
                <th className="py-2.5 px-3 text-center">Valor Calculado</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {kpis.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-stone-50/70 transition">
                  <td className="py-3 px-3">
                    <strong className="text-stone-900 block font-semibold">{kpi.nome}</strong>
                    <span className="text-[10px] font-mono text-[#2D6A4F] font-bold">
                      {kpi.codigo}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-stone-600 font-mono text-[11px]">{kpi.formula}</td>
                  <td className="py-3 px-3 text-center text-stone-600">{kpi.periodicidade}</td>
                  <td className="py-3 px-3 text-center font-bold text-stone-800">{kpi.meta}</td>
                  <td className="py-3 px-3 text-center font-bold font-mono text-sm text-stone-900">
                    {kpi.valor_formatado}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {kpi.status_meta === 'dentro' ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Na Meta
                      </Badge>
                    ) : kpi.status_meta === 'alerta' ? (
                      <Badge className="bg-amber-500 text-white text-[10px] gap-1">
                        <AlertCircle className="h-3 w-3" /> Atenção
                      </Badge>
                    ) : (
                      <Badge className="bg-red-600 text-white text-[10px] gap-1">
                        <XCircle className="h-3 w-3" /> Fora da Meta
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-[11px] text-stone-600 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#2D6A4F] shrink-0 mt-0.5" />
          <span>
            Os indicadores acima são gerados com base estrita nos dados cadastrados nas abas dos
            formulários do POP 01. Os registros digitais devem permanecer permanentemente
            disponíveis à fiscalização federal agropecuária (item 20 do Manual de Fiscalização de
            Autocontroles – MAPA/SDA).
          </span>
        </div>
      </div>
    </div>
  )
}
