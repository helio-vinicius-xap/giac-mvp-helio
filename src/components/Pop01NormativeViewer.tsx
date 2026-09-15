import React from 'react'
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  BookOpen,
  Calendar,
  Briefcase,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { POP01_NORMATIVE_DATA } from '@/types/pop01NormativeContent'
import type { Procedure, Company } from '@/types/agro'

interface Pop01NormativeViewerProps {
  procedure: Procedure
  company: Company | null
}

export function Pop01NormativeViewer({ procedure, company }: Pop01NormativeViewerProps) {
  const norm = POP01_NORMATIVE_DATA
  const meta = procedure.metadados_saas || {}

  // Placeholders substituídos
  const replacePlaceholders = (text: string) => {
    if (!text) return ''
    return text
      .replace(
        /{{EMPRESA}}/g,
        company?.razao_social || 'NutriAgro Nutrição Animal e Premixes Ltda.',
      )
      .replace(/{{CNPJ}}/g, company?.cnpj || '12.345.678/0001-90')
      .replace(/{{REGISTRO_MAPA}}/g, company?.numero_registro_mapa || 'SP-00412-8')
      .replace(
        /{{ENDERECO}}/g,
        `${company?.logradouro || 'Rodovia SP-330, KM 142'}, ${company?.municipio || 'Ribeirão Preto'}/${company?.uf || 'SP'}`,
      )
      .replace(/{{RESPONSAVEL_TECNICO}}/g, company?.rt_nome || 'Dr. Hélio Silva')
      .replace(/{{REGISTRO_PROFISSIONAL}}/g, company?.rt_registro_conselho || 'CRMV-SP 18.420')
      .replace(/{{REVISAO}}/g, procedure.versao || '01/2026')
      .replace(/{{DATA_VIGOR}}/g, '15/09/2026')
      .replace(/{{DATA_ELABORACAO}}/g, '15/09/2026')
      .replace(/{{STATUS}}/g, procedure.status || 'Ativo')
      .replace(/{{CLASSIFICACAO_RISCO}}/g, 'Risco Alto (RI)')
      .replace(/{{ELABORADO_POR}}/g, 'Mariana Siqueira (Garantia da Qualidade)')
      .replace(
        /{{APROVADO_POR}}/g,
        company?.re_nome || 'Carlos Eduardo Prado de Oliveira (Direção)',
      )
      .replace(
        /{{APROVADO_POR_CQ}}/g,
        company?.rq_nome || 'Dra. Mariana Siqueira (Controle da Qualidade)',
      )
  }

  return (
    <div className="space-y-6 animate-fade-in text-stone-800">
      {/* 1. Bloco de IDENTIFICAÇÃO DO DOCUMENTO (conforme docx) */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2DCCF]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SISTEMA DE GESTÃO DO AUTOCONTROLE — PROGRAMA DE BOAS PRÁTICAS DE FABRICAÇÃO
            </span>
            <h2 className="text-lg font-bold font-['Sora'] text-[#2D6A4F] mt-1.5">
              Identificação do Documento Normativo: POP 01
            </h2>
          </div>
          <Badge className="bg-[#2D6A4F] text-white self-start sm:self-auto font-mono">
            Código: POP-01
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Estabelecimento
            </span>
            <strong className="text-stone-900">{replacePlaceholders('{{EMPRESA}}')}</strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">CNPJ</span>
            <strong className="text-stone-900">{replacePlaceholders('{{CNPJ}}')}</strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Registro MAPA
            </span>
            <strong className="text-[#2D6A4F]">{replacePlaceholders('{{REGISTRO_MAPA}}')}</strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Classificação de Risco
            </span>
            <strong className="text-red-700">
              {replacePlaceholders('{{CLASSIFICACAO_RISCO}}')}
            </strong>
          </div>

          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Responsável Técnico (RT)
            </span>
            <strong className="text-stone-900">
              {replacePlaceholders('{{RESPONSAVEL_TECNICO}}')}
            </strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Registro de Classe
            </span>
            <strong className="text-stone-900">
              {replacePlaceholders('{{REGISTRO_PROFISSIONAL}}')}
            </strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Data de Vigor
            </span>
            <strong className="text-stone-900">{replacePlaceholders('{{DATA_VIGOR}}')}</strong>
          </div>
          <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Revisão e Status
            </span>
            <strong className="text-emerald-700">
              Rev. {procedure.versao || '01/2026'} • {procedure.status || 'Aprovado'}
            </strong>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
            <span className="text-[10px] text-stone-400 font-bold uppercase block">
              Endereço Fabril
            </span>
            <span className="text-stone-700">{replacePlaceholders('{{ENDERECO}}')}</span>
          </div>
        </div>
      </div>

      {/* 2. Seção 1 e 2: Objetivo e Campo de Aplicação */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
            <BookOpen className="h-4 w-4 text-[#D9A404]" />
            1. Objetivo e 2. Campo de Aplicação
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed mt-2 text-justify">
            {norm.titulo}: O presente Procedimento Operacional Padrão (POP) tem por finalidade
            estabelecer e padronizar a metodologia executiva para a qualificação, homologação,
            monitoramento contínuo, verificação periódica e desqualificação de fabricantes,
            armazenadores e fornecedores comerciais de matérias-primas, macro e micro-ingredientes,
            aditivos, premixes, núcleos, concentrados, produtos com medicamentos e materiais de
            embalagem primária e secundária. O procedimento disciplina ainda as etapas de recepção,
            conferência documental, inspeção física e higiênico-sanitária dos veículos
            transportadores, amostragem representativa, ensaios laboratoriais de liberação,
            armazenamento segregado e destinação de itens não conformes, garantindo a
            rastreabilidade total, integridade, conformidade regulatória e inocuidade dos produtos
            acabados, atendendo estritamente ao disposto no item 7.1, alínea &quot;a&quot;, e item
            7.5 da Instrução Normativa MAPA nº 04/2007 e aos preceitos de autocontrole,
            rastreabilidade e responsabilidade técnica estabelecidos no Decreto nº 12.031/2024.
          </p>
          <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-xs text-stone-700 mt-3 leading-relaxed">
            <strong>Campo de Aplicação:</strong> Aplica-se integralmente a todas as matérias-primas
            de origem vegetal, animal ou mineral, ingredientes ativos e inativos, veículos, aditivos
            tecnológicos, sensoriais, nutricionais, zootécnicos e anticoccidianos, produtos com
            medicamentos, materiais de embalagens primárias e secundárias recebidos, fracionados,
            armazenados, manipulados ou processados no estabelecimento fabril de{' '}
            <strong>{replacePlaceholders('{{EMPRESA}}')}</strong>. Abrange insumos nacionais e
            importados, a granel, ensacados ou envasados em contêineres e big bags, estendendo-se a
            todos os parceiros comerciais categorizados como fabricantes, fracionadores,
            armazenadores e distribuidores (art. 10 do Decreto nº 12.031/2024).
          </div>
        </div>
      </div>

      {/* 3. Seção 3: Referências Normativas */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
          3. Referências Normativas
        </h3>
        <ol className="space-y-2 text-xs text-stone-700 list-decimal pl-4">
          {norm.referencias_normativas.map((r) => (
            <li key={r.item} className="leading-relaxed pl-1">
              {r.texto}
            </li>
          ))}
        </ol>
      </div>

      {/* 4. Seção 4: Definições e Conceitos Técnicos */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <Layers className="h-4 w-4 text-[#D9A404]" />
          4. Definições e Conceitos Técnicos (Legislação Consolidada)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {norm.definicoes.map((d, idx) => (
            <div key={idx} className="p-2.5 rounded-lg border border-stone-200 bg-stone-50/50">
              <strong className="text-[#2D6A4F] block font-semibold mb-0.5">{d.termo}:</strong>
              <p className="text-stone-600 text-[11px] leading-tight">{d.conceito}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Seção 5: Matriz RACI de Responsabilidades */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2">
            <Users className="h-4 w-4 text-[#D9A404]" />
            5. Responsabilidades — Matriz RACI
          </h3>
          <span className="text-[10px] text-stone-500">
            R = Execução | A = Aprovação Final | C = Consultado | I = Informado
          </span>
        </div>
        <p className="text-xs text-stone-600 leading-relaxed">
          O aval final da qualificação técnica de fornecedores é privativo da Garantia e Controle da
          Qualidade com homologação do Responsável Técnico (item 19 do Módulo I do Manual de
          Fiscalização de Autocontroles do MAPA e Decreto nº 12.031/2024).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] bg-[#FAF7EF] text-stone-700 font-bold">
                <th className="py-2 px-3">Atividade / Processo Operacional</th>
                <th className="py-2 px-2 text-center">Suprim.</th>
                <th className="py-2 px-2 text-center">Nutrição</th>
                <th className="py-2 px-2 text-center text-[#2D6A4F]">RT</th>
                <th className="py-2 px-2 text-center text-[#2D6A4F]">Coord. CQ</th>
                <th className="py-2 px-2 text-center">Enc. CQ</th>
                <th className="py-2 px-2 text-center">Almox.</th>
                <th className="py-2 px-2 text-center">Oper.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {norm.matriz_raci.map((r, i) => (
                <tr key={i} className="hover:bg-stone-50 transition">
                  <td className="py-2 px-3 text-stone-800 font-medium">{r.atividade}</td>
                  <td className="py-2 px-2 text-center font-bold text-stone-600">
                    {r.suprimentos}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-stone-600">{r.nutricao}</td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-800 bg-emerald-50/60">
                    {r.rt}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-emerald-800 bg-emerald-50/60">
                    {r.coord_cq}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-stone-600">
                    {r.encarregado_cq}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-stone-600">{r.almoxarife}</td>
                  <td className="py-2 px-2 text-center font-bold text-stone-600">{r.operadores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Seção 8: Matriz de Frequência de Operações */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <Calendar className="h-4 w-4 text-[#D9A404]" />
          8. Matriz de Frequência de Operações
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] bg-[#FAF7EF] text-stone-700 font-bold">
                <th className="py-2 px-3">Atividade Operacional</th>
                <th className="py-2 px-3">Frequência</th>
                <th className="py-2 px-3">Responsável</th>
                <th className="py-2 px-3">Registro Auditável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[11px]">
              {norm.matriz_frequencia.map((f, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="py-2 px-3 font-semibold text-stone-900">{f.atividade}</td>
                  <td className="py-2 px-3 text-stone-700">{f.frequencia}</td>
                  <td className="py-2 px-3 text-stone-600">{f.responsavel}</td>
                  <td className="py-2 px-3 font-mono font-bold text-[#2D6A4F]">{f.registro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Seção 11: Ações Corretivas e Preventivas */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          11. Ações Corretivas e Preventivas Diante de Desvios
        </h3>
        <div className="space-y-2.5">
          {norm.acoes_corretivas_preventivas.map((ac, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-red-200 bg-red-50/30 space-y-1.5 text-xs"
            >
              <strong className="text-red-900 font-bold block">{ac.desvio}</strong>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-white border border-red-100">
                  <span className="font-bold text-red-800 block">Ação Corretiva Imediata:</span>
                  <span className="text-stone-700">{ac.acao_imediata}</span>
                </div>
                <div className="p-2 rounded bg-white border border-emerald-100">
                  <span className="font-bold text-emerald-800 block">
                    Ação Preventiva Sistemática:
                  </span>
                  <span className="text-stone-700">{ac.acao_preventiva}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Seção 12: Gestão de Registros e Prazos de Retenção */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <Clock className="h-4 w-4 text-[#D9A404]" />
          12. Gestão de Registros e Prazos Regulamentares de Retenção
        </h3>
        <p className="text-xs text-stone-600">
          Prazos em atendimento estrito ao item 8.3 da IN MAPA nº 04/2007 (mínimo de 2 anos para
          alimentação geral e de 3 anos para produtos com medicamentos veterinários), mantendo o
          sistema digital permanentemente disponível à fiscalização federal agropecuária (item 20 do
          Manual).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2DCCF] bg-[#FAF7EF] text-stone-700 font-bold">
                <th className="py-2 px-3">Registro / Formulário</th>
                <th className="py-2 px-3">Formato / Sistema</th>
                <th className="py-2 px-3">Prazo Mínimo de Retenção</th>
                <th className="py-2 px-3">Responsável pela Custódia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[11px]">
              {norm.gestao_registros_retencao.map((g, i) => (
                <tr key={i} className="hover:bg-stone-50">
                  <td className="py-2 px-3 font-semibold text-stone-900">{g.registro}</td>
                  <td className="py-2 px-3 text-stone-600">{g.formato}</td>
                  <td className="py-2 px-3 font-bold text-emerald-800">{g.retencao}</td>
                  <td className="py-2 px-3 text-stone-700">{g.custodia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
