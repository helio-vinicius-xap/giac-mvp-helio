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

      {/* 8. Seção 6: Descrição Detalhada do Procedimento (6.1 a 6.11) */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <Layers className="h-4 w-4 text-[#D9A404]" />
          6. Descrição Detalhada do Procedimento (Subitens 6.1 a 6.11)
        </h3>

        <div className="space-y-4 text-xs text-stone-700">
          {/* 6.1 Qualificação */}
          <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-2">
            <h4 className="font-bold text-[#2D6A4F] text-xs">
              6.1 Qualificação de Fabricantes e Fornecedores
            </h4>
            <p className="leading-relaxed">
              O processo de qualificação de fornecedores é obrigatório para todos os parceiros
              comerciais antes da realização de qualquer ordem de compra ou recebimento de insumos:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              {norm.secao_6_procedimento.qualificacao_fornecedores.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
            <div className="p-2.5 bg-red-50 rounded-lg border border-red-200 mt-2">
              <strong className="text-red-900 block font-semibold mb-1">
                Critérios Limitantes (Mandatórios e Eliminatórios):
              </strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-950">
                {norm.secao_6_procedimento.criterios_limitantes.map((crit, idx) => (
                  <li key={idx}>{crit}</li>
                ))}
              </ul>
            </div>
            <p className="text-[11px] text-red-800 font-semibold mt-1">
              ⚠️ Atenção Regulatória: É estritamente vedada a aquisição ou recepção de qualquer
              matéria-prima, ingrediente ou embalagem cujo fornecedor ou produto não conste
              formalmente aprovado na Lista FR 14, sob pena de interdição cautelar imediata do lote
              na recepção.
            </p>
          </div>

          {/* 6.2 Recebimento e Inspeção */}
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-[#2D6A4F] text-xs">
              6.2 Recebimento e Inspeção de Matérias-Primas, Ingredientes e Embalagens
            </h4>
            <p className="leading-relaxed">
              O ato de recepção de insumos segue roteiro sistemático com preenchimento obrigatório
              do Registro de Recebimento de Mercadorias (FR 08 – Anexo A1):
            </p>
            <ul className="list-disc pl-4 space-y-1">
              {norm.secao_6_procedimento.recebimento_inspecao.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* 6.3 Amostragem */}
          <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-2">
            <h4 className="font-bold text-[#2D6A4F] text-xs">
              6.3 Procedimentos de Amostragem (Arts. 68 a 76 Decreto 12.031/2024)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <strong className="text-[#2D6A4F] block mb-0.5">
                  Macro-Ingredientes Ensacados:
                </strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.amostragem_procedimentos.macro_ingredientes}
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <strong className="text-[#2D6A4F] block mb-0.5">
                  Micro-Ingredientes e Medicamentos:
                </strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.amostragem_procedimentos.micro_ingredientes}
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <strong className="text-[#2D6A4F] block mb-0.5">
                  Granéis (Líquidos ou Sólidos):
                </strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.amostragem_procedimentos.graneis}
                </p>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <strong className="text-[#2D6A4F] block mb-0.5">
                  Amostra Composta e Contraprova:
                </strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.amostragem_procedimentos.amostra_composta}
                </p>
              </div>
            </div>
          </div>

          {/* 6.4 Ensaios Laboratoriais */}
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
            <h4 className="font-bold text-[#2D6A4F] text-xs">
              6.4 Ensaios Laboratoriais e Critérios de Liberação (IT 14 / Art. 76)
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              {norm.secao_6_procedimento.ensaios_laboratoriais.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 6.5 Segregação e Depósito de Não Aprovadas */}
          <div className="p-3.5 bg-red-50/40 rounded-xl border border-red-200 space-y-1.5">
            <h4 className="font-bold text-red-900 text-xs">
              6.5 Segregação, Rejeição e Gestão do Depósito de Não Aprovadas (Item 7.5 IN 04/2007)
            </h4>
            <ul className="list-disc pl-4 space-y-1 text-stone-800">
              {norm.secao_6_procedimento.segregacao_deposito.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 6.6 Armazenamento e Monitoramento Temp/UR */}
          <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2">
            <h4 className="font-bold text-[#2D6A4F] text-xs">
              6.6 Armazenamento e Monitoramento de Temperatura e Umidade (Item 6.8 IN 04/2007)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
              <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
                <strong className="text-[#2D6A4F] block mb-0.5">Sala de Medicamentos:</strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.armazenamento_temperatura.sala_medicamentos}
                </p>
              </div>
              <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
                <strong className="text-[#2D6A4F] block mb-0.5">Armazéns Gerais:</strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.armazenamento_temperatura.armazens_gerais}
                </p>
              </div>
              <div className="p-2.5 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
                <strong className="text-[#2D6A4F] block mb-0.5">Monitoramento Diário:</strong>
                <p className="text-stone-700">
                  {norm.secao_6_procedimento.armazenamento_temperatura.monitoramento_diario}
                </p>
              </div>
            </div>
          </div>

          {/* 6.7 e 6.8 Monitoramento Contínuo e Verificação Anual */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-1.5">
              <h4 className="font-bold text-[#2D6A4F] text-xs">
                6.7 Monitoramento Contínuo dos Fornecedores
              </h4>
              <p className="leading-relaxed text-[11px]">
                {norm.secao_6_procedimento.monitoramento_continuo}
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-1.5">
              <h4 className="font-bold text-[#2D6A4F] text-xs">
                6.8 Verificação Anual e Requalificação
              </h4>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {norm.secao_6_procedimento.verificacao_anual.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* 6.9 Desqualificação */}
          <div className="p-3.5 bg-red-50/50 rounded-xl border border-red-200 space-y-1.5">
            <h4 className="font-bold text-red-900 text-xs">
              6.9 Critérios de Desqualificação de Fornecedores
            </h4>
            <p className="text-[11px] text-stone-700">
              A desqualificação com cancelamento do cadastro e veto comercial ocorre
              compulsoriamente diante de:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-950 font-medium">
              {norm.secao_6_procedimento.desqualificacao_criterios.map((c, idx) => (
                <li key={idx}>{c}</li>
              ))}
            </ul>
          </div>

          {/* 6.10 e 6.11 Rastreabilidade e Contaminação Cruzada */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
              <h4 className="font-bold text-[#2D6A4F] text-xs">
                6.10 Sistema de Rastreabilidade à Montante e Jusante
              </h4>
              <p className="leading-relaxed text-[11px] text-stone-700">
                {norm.secao_6_procedimento.rastreabilidade_montante_jusante}
              </p>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
              <h4 className="font-bold text-[#2D6A4F] text-xs">
                6.11 Prevenção de Contaminação Cruzada e Substâncias Proibidas
              </h4>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-stone-700">
                {norm.secao_6_procedimento.contaminacao_cruzada_substancias_proibidas.map(
                  (item, idx) => (
                    <li key={idx}>{item}</li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Seção 7: Materiais e Equipamentos Necessários */}
      <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
          <Briefcase className="h-4 w-4 text-[#D9A404]" />
          7. Materiais e Equipamentos Necessários (Item 7.2 IN 04/2007)
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-700 list-disc pl-4">
          {norm.materiais_equipamentos.map((m, idx) => (
            <li key={idx} className="leading-relaxed pr-2">
              {m}
            </li>
          ))}
        </ul>
      </div>

      {/* 10. Seção 9 e 10: Sistemática de Monitoramento e Verificação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
            <CheckCircle2 className="h-4 w-4 text-[#D9A404]" />
            9. Sistemática de Monitoramento
          </h3>
          <ul className="space-y-2 text-xs text-stone-700 list-disc pl-4">
            {norm.sistematica_monitoramento.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
            <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
            10. Procedimentos de Verificação
          </h3>
          <ul className="space-y-2 text-xs text-stone-700 list-disc pl-4">
            {norm.procedimentos_verificacao.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 11. Seção 13, 14 e 15: Treinamento, Indicadores e Documentação Relacionada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
            <Users className="h-4 w-4 text-[#D9A404]" />
            13. Programa de Treinamento e Capacitação
          </h3>
          <ul className="space-y-1.5 text-xs text-stone-700 list-disc pl-4">
            {norm.treinamento_capacitacao.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-[#E2DCCF] bg-white shadow-xs space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#2D6A4F] flex items-center gap-2 pb-2 border-b border-stone-100">
            <FileText className="h-4 w-4 text-[#D9A404]" />
            15. Documentação Relacionada
          </h3>
          <ul className="space-y-1.5 text-xs text-stone-700 list-disc pl-4">
            {norm.documentacao_relacionada.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {replacePlaceholders(item)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 12. Seção 12: Gestão de Registros e Prazos de Retenção */}
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

      {/* 13. BLOCO FINAL DE APROVAÇÃO FORMAL DO DOCUMENTO (Direção, Coord CQ, RT) */}
      <div className="p-6 rounded-2xl border-2 border-[#2D6A4F] bg-white shadow-sm space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Aprovação e Homologação Compulsória
          </span>
          <h3 className="text-base font-bold font-['Sora'] text-[#1B4332]">
            Aprovação Formal do Procedimento Operacional Padrão (POP 01)
          </h3>
          <p className="text-xs text-stone-600 max-w-2xl mx-auto">
            O presente POP 01 foi revisado, aprovado tecnicamente e homologado para aplicação
            compulsória em todas as unidades fabris do estabelecimento{' '}
            {replacePlaceholders('{{EMPRESA}}')}, em estrito cumprimento ao item 7.2 da Instrução
            Normativa MAPA nº 04/2007 e ao Decreto nº 12.031/2024.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Direção */}
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF7EF] text-center flex flex-col justify-between min-h-[140px]">
            <span className="text-[10px] font-bold uppercase text-stone-400">
              Aprovado pela Direção
            </span>
            <div className="my-2 border-b border-dashed border-stone-400 w-3/4 mx-auto" />
            <div>
              <strong className="text-xs text-stone-900 block">
                {replacePlaceholders('{{APROVADO_POR}}')}
              </strong>
              <span className="text-[10px] text-stone-500 block">Direção Executiva da Empresa</span>
            </div>
          </div>

          {/* Coord CQ */}
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FAF7EF] text-center flex flex-col justify-between min-h-[140px]">
            <span className="text-[10px] font-bold uppercase text-stone-400">Aprovado pelo CQ</span>
            <div className="my-2 border-b border-dashed border-stone-400 w-3/4 mx-auto" />
            <div>
              <strong className="text-xs text-stone-900 block">
                {replacePlaceholders('{{APROVADO_POR_CQ}}')}
              </strong>
              <span className="text-[10px] text-stone-500 block">
                Coordenador do Controle da Qualidade
              </span>
            </div>
          </div>

          {/* RT */}
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 text-center flex flex-col justify-between min-h-[140px]">
            <span className="text-[10px] font-bold uppercase text-emerald-700">
              Homologação Técnica (RT)
            </span>
            {procedure.assinaturas_pop?.rt?.imagem_url ? (
              <div className="my-1 p-1 bg-white rounded border border-emerald-200 flex items-center justify-center">
                <img
                  src={procedure.assinaturas_pop.rt.imagem_url}
                  alt="Assinatura RT"
                  className="max-h-12 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="my-2 border-b border-dashed border-emerald-400 w-3/4 mx-auto" />
            )}
            <div>
              <strong className="text-xs text-stone-900 block">
                {replacePlaceholders('{{RESPONSAVEL_TECNICO}}')}
              </strong>
              <span className="text-[10px] text-stone-600 block">
                Responsável Técnico — {replacePlaceholders('{{REGISTRO_PROFISSIONAL}}')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-stone-400 text-center pt-2 border-t border-stone-100">
          Local e Data: {replacePlaceholders('{{ENDERECO}}')}, 15 de setembro de 2026. A retenção
          deste documento obedece ao prazo regulatório de 2 anos para alimentação geral e de 3 anos
          para produtos com medicamentos veterinários.
        </div>
      </div>
    </div>
  )
}
