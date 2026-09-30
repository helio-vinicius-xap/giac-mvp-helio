import React from 'react'
import {
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Company } from '@/types/agro'

interface Pop01PrintPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  titulo: string
  codigoAnexo: string
  subtitulo?: string
  company: Company | null
  dados: any
  rtSignatureImage?: string
}

export function Pop01PrintPdfModal({
  open,
  onOpenChange,
  titulo,
  codigoAnexo,
  subtitulo,
  company,
  dados,
  rtSignatureImage,
}: Pop01PrintPdfModalProps) {
  if (!dados) return null

  const handlePrint = () => {
    window.print()
  }

  // Estilo formal de documento MAPA / Autocontrole no tema do app (Verde Floresta #1B4332 / Âmbar #D9A404)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#1B4332] text-white text-[11px] font-bold font-mono">
                  {codigoAnexo}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#2D6A4F] text-[#2D6A4F] bg-emerald-50 text-[10px]"
                >
                  Auto Controle 01 • IN 04/2007 MAPA
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold font-['Sora'] text-[#1B4332]">
                {titulo}
              </DialogTitle>
              {subtitulo && (
                <DialogDescription className="text-xs text-stone-600">
                  {subtitulo}
                </DialogDescription>
              )}
            </div>

            <div className="flex items-center gap-2 print:hidden shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 text-xs border-stone-300 text-stone-700 hover:bg-stone-50 gap-1.5"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir / Salvar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Corpo do Documento Imprimível */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="bg-white p-6 sm:p-10 rounded-xl border border-stone-300 shadow-sm max-w-3xl mx-auto text-xs text-stone-800 space-y-6 print:p-0 print:border-none print:shadow-none">
            {/* Cabeçalho Oficial do Estabelecimento */}
            <div className="border-b-2 border-[#1B4332] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#1B4332]">
                  <Building2 className="h-5 w-5 text-[#2D6A4F]" />
                  <h2 className="text-base font-bold uppercase tracking-tight font-['Sora'] text-[#1B4332]">
                    {company?.razao_social || 'NutriAgro Nutrição Animal e Premixes Ltda.'}
                  </h2>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Registro MAPA: <strong>{company?.numero_registro_mapa || 'SP-00412-8'}</strong> |
                  CNPJ: {company?.cnpj || '12.345.678/0001-90'}
                </p>
                <p className="text-[10px] text-stone-500">
                  {company?.logradouro
                    ? `${company.logradouro}, ${company.numero || 'S/N'}`
                    : 'Rodovia Agroindustrial SP-330, KM 142'}{' '}
                  — {company?.municipio || 'Ribeirão Preto'}/{company?.uf || 'SP'}
                </p>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="inline-block px-3 py-1 rounded bg-[#1B4332] text-white font-mono font-bold text-xs">
                  {codigoAnexo}
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-semibold">
                  Versão: {dados.versao || '01-2026'}
                </p>
                <p className="text-[10px] text-stone-500">
                  Data:{' '}
                  {dados.data_qualificacao ||
                    dados.data_recebimento ||
                    dados.data_coleta ||
                    dados.data_emissao ||
                    dados.data_registro ||
                    dados.data_abertura ||
                    new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Título do Registro */}
            <div className="text-center py-2 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
              <h1 className="text-sm sm:text-base font-bold uppercase text-[#1B4332] font-['Sora']">
                {titulo}
              </h1>
              <p className="text-[10px] text-stone-600 mt-0.5">
                Auto Controle 01 – Qualificação de Fornecedores e Controle de Matérias-Primas,
                Ingredientes e Embalagens
              </p>
            </div>

            {/* RENDERIZADOR ESPECÍFICO CONFORME O ANEXO */}

            {/* ANEXO I: QUALIFICAÇÃO DE FORNECEDOR */}
            {codigoAnexo.includes('ANEXO I') && (
              <div className="space-y-4">
                {/* Seção 1 */}
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Seção 1 – Dados do Fornecedor
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Razão Social:</strong> {dados.razao_social || '—'}
                    </div>
                    <div>
                      <strong>CNPJ:</strong> {dados.cnpj || '—'}
                    </div>
                    {dados.cpf && (
                      <div>
                        <strong>CPF:</strong> {dados.cpf}
                      </div>
                    )}
                    <div>
                      <strong>Endereço Completo:</strong> {dados.endereco_completo || '—'}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {dados.telefone || '—'}
                    </div>
                    <div>
                      <strong>E-mail:</strong> {dados.email || '—'}
                    </div>
                    <div>
                      <strong>Responsável Técnico:</strong> {dados.responsavel_tecnico || '—'}
                    </div>
                    <div>
                      <strong>Inscrição Profissional:</strong> {dados.inscricao_profissional || '—'}
                    </div>
                  </div>
                </div>

                {/* Seção 2 */}
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Seção 2 – Documentação Apresentada
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>{dados.doc_cnpj_cpf ? '☑' : '☐'} Cópia do CNPJ/CPF</div>
                    <div>{dados.doc_registro_mapa ? '☑' : '☐'} Registro/Cadastro no MAPA</div>
                    <div>
                      {dados.doc_regularidade_fiscal ? '☑' : '☐'} Comprovante de Regularidade Fiscal
                    </div>
                    <div>
                      {dados.doc_manual_bpf ? '☑' : '☐'} Manual de BPF ou Resumo de Procedimentos
                    </div>
                    <div>
                      {dados.doc_autocontrole ? '☑' : '☐'} Descrição do Programa de Autocontrole
                    </div>
                    <div>
                      {dados.doc_especificacao_tecnica ? '☑' : '☐'} Especificação Técnica dos
                      Produtos
                    </div>
                    <div>
                      {dados.doc_certificado_analise_recente ? '☑' : '☐'} Certificado de Análise
                      Recente (máx 12 meses)
                    </div>
                    <div>
                      {dados.doc_certificado_origem_animal ? '☑' : '☐'} Certificado de Origem
                      (Produtos de Origem Animal)
                    </div>
                    <div>
                      {dados.doc_licenca_mapa_medicamentos ? '☑' : '☐'} Licença MAPA (Medicamentos)
                    </div>
                    <div>
                      {dados.doc_certificado_conformidade_embalagens ? '☑' : '☐'} Certificado de
                      Conformidade (Embalagens)
                    </div>
                  </div>
                  {dados.documentacao_complementar && (
                    <div className="px-3 pb-3 text-[11px] text-stone-600 border-t border-stone-100 pt-2">
                      <strong>Documentação Complementar:</strong> {dados.documentacao_complementar}
                    </div>
                  )}
                </div>

                {/* Seção 3 */}
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Seção 3 – Critérios de Qualificação
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Registro no MAPA:</strong> {dados.criterio_registro_mapa}
                    </div>
                    <div>
                      <strong>Conformidade BPF:</strong> {dados.criterio_bpf}
                    </div>
                    <div>
                      <strong>Programa Autocontrole:</strong> {dados.criterio_autocontrole}
                    </div>
                    <div>
                      <strong>Histórico Conformidade:</strong> {dados.criterio_historico}
                    </div>
                    <div>
                      <strong>Capacidade Técnica:</strong> {dados.criterio_capacidade_tecnica}
                    </div>
                    <div>
                      <strong>Produtos Origem Animal:</strong> {dados.criterio_origem_animal}
                    </div>
                    <div>
                      <strong>Medicamentos:</strong> {dados.criterio_medicamentos}
                    </div>
                    <div>
                      <strong>Produtos Importados:</strong> {dados.criterio_produtos_importados}
                    </div>
                  </div>
                </div>

                {/* Seção 4 */}
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Seção 4 – Parecer Final
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-3">
                      <strong>Parecer da Comissão:</strong>
                      <Badge
                        className={
                          dados.parecer_final === 'Aprovado'
                            ? 'bg-emerald-600 text-white'
                            : dados.parecer_final === 'Reprovado'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                        }
                      >
                        {dados.parecer_final}
                      </Badge>
                      <span className="text-stone-500 text-[11px]">
                        Validade da Qualificação:{' '}
                        <strong>
                          {dados.data_validade_qualificacao
                            ? new Date(dados.data_validade_qualificacao).toLocaleDateString('pt-BR')
                            : '—'}
                        </strong>{' '}
                        (2 anos)
                      </span>
                    </div>
                    {dados.motivo_rejeicao && (
                      <div className="text-red-700 bg-red-50 p-2 rounded">
                        <strong>Motivo da Rejeição:</strong> {dados.motivo_rejeicao}
                      </div>
                    )}
                    {dados.condicoes_aprovacao_condicional && (
                      <div className="text-amber-800 bg-amber-50 p-2 rounded">
                        <strong>Condições para Aprovação Condicional:</strong>{' '}
                        {dados.condicoes_aprovacao_condicional}
                      </div>
                    )}
                    {dados.observacoes_gerais && (
                      <div>
                        <strong>Observações Gerais:</strong> {dados.observacoes_gerais}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO III: RECEBIMENTO */}
            {codigoAnexo.includes('ANEXO III') && (
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Identificação do Recebimento & Fornecedor
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Nº Recebimento:</strong>{' '}
                      <span className="font-mono font-bold text-[#1B4332]">
                        {dados.numero_recebimento}
                      </span>
                    </div>
                    <div>
                      <strong>Data/Hora:</strong> {dados.data_recebimento}
                    </div>
                    <div>
                      <strong>Responsável:</strong> {dados.responsavel_recebimento}
                    </div>
                    <div>
                      <strong>Fornecedor:</strong> {dados.fornecedor_razao_social}
                    </div>
                    <div>
                      <strong>CNPJ Fornecedor:</strong> {dados.fornecedor_cnpj}
                    </div>
                    <div>
                      <strong>Contato/Tel:</strong> {dados.fornecedor_contato || '—'}{' '}
                      {dados.fornecedor_telefone ? `(${dados.fornecedor_telefone})` : ''}
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Identificação do Produto e Lote
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Produto:</strong> {dados.produto_nome}
                    </div>
                    <div>
                      <strong>Lote/Partida:</strong>{' '}
                      <span className="font-mono font-bold">{dados.lote_partida}</span>
                    </div>
                    <div>
                      <strong>Nota Fiscal:</strong> {dados.numero_nota_fiscal}
                    </div>
                    <div>
                      <strong>Qtd Recebida:</strong> {dados.quantidade_recebida} {dados.unidade}
                    </div>
                    <div>
                      <strong>Fabricação:</strong>{' '}
                      {dados.data_fabricacao
                        ? new Date(dados.data_fabricacao).toLocaleDateString('pt-BR')
                        : '—'}
                    </div>
                    <div>
                      <strong>Validade:</strong>{' '}
                      {dados.data_validade
                        ? new Date(dados.data_validade).toLocaleDateString('pt-BR')
                        : '—'}{' '}
                      {dados.dias_ate_vencimento !== undefined
                        ? `(${dados.dias_ate_vencimento} dias)`
                        : ''}
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Inspeção Visual e Documental
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div>{dados.insp_embalagem_integra ? '☑' : '☐'} Embalagem Íntegra</div>
                    <div>
                      {dados.insp_rotulo_legivel ? '☑' : '☐'} Rótulo Legível (Decreto 12.031/2024)
                    </div>
                    <div>{dados.insp_sem_contaminacao ? '☑' : '☐'} Sem Sinais de Contaminação</div>
                    <div>{dados.insp_sem_vazamento ? '☑' : '☐'} Sem Sinais de Vazamento</div>
                    <div>{dados.insp_sem_infestacao ? '☑' : '☐'} Sem Sinais de Infestação</div>
                    <div>{dados.insp_temperatura_adequada ? '☑' : '☐'} Temperatura Adequada</div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Resultado da Inspeção & Armazenamento
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-3">
                      <strong>Parecer do Recebimento:</strong>
                      <Badge
                        className={
                          dados.resultado === 'Aprovado'
                            ? 'bg-emerald-600 text-white'
                            : dados.resultado === 'Reprovado'
                              ? 'bg-red-600 text-white'
                              : 'bg-amber-600 text-white'
                        }
                      >
                        {dados.resultado}
                      </Badge>
                      {dados.coleta_amostra && (
                        <span className="text-[11px] text-stone-600">
                          • Amostra Coletada:{' '}
                          <strong className="font-mono text-[#1B4332]">
                            {dados.amostra_numero}
                          </strong>
                        </span>
                      )}
                    </div>
                    {dados.descricao_motivo_rejeicao && (
                      <div className="text-red-700 bg-red-50 p-2 rounded">
                        <strong>Motivo Rejeição ({dados.motivo_rejeicao}):</strong>{' '}
                        {dados.descricao_motivo_rejeicao}
                      </div>
                    )}
                    <div>
                      <strong>Armazenamento:</strong> {dados.local_armazenamento || 'Armazém Geral'}{' '}
                      • Posição: {dados.posicao_armazem || '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO IV: COLETA DE AMOSTRA */}
            {codigoAnexo.includes('ANEXO IV') && (
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Identificação da Amostra & Vínculo ao Recebimento
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Nº da Amostra:</strong>{' '}
                      <span className="font-mono font-bold text-[#1B4332]">
                        {dados.numero_amostra}
                      </span>
                    </div>
                    <div>
                      <strong>Nº Recebimento:</strong>{' '}
                      <span className="font-mono">{dados.recebimento_numero}</span>
                    </div>
                    <div>
                      <strong>Data/Hora Coleta:</strong> {dados.data_coleta} {dados.hora_coleta}
                    </div>
                    <div>
                      <strong>Fornecedor:</strong> {dados.fornecedor_razao_social}
                    </div>
                    <div>
                      <strong>Produto:</strong> {dados.produto_nome}
                    </div>
                    <div>
                      <strong>Lote:</strong> {dados.lote_partida}
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Parâmetros da Coleta & Triplicata
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <strong>Qtd Total Recebida:</strong> {dados.quantidade_total_recebida}{' '}
                        {dados.unidade}
                      </div>
                      <div>
                        <strong>Qtd Coletada:</strong> {dados.quantidade_coletada} {dados.unidade}
                      </div>
                      <div>
                        <strong>Método:</strong> {dados.metodo_coleta}
                      </div>
                    </div>
                    {dados.amostra_em_triplicata && (
                      <div className="pt-2 border-t border-stone-100">
                        <strong className="block mb-1 text-[11px] text-stone-700">
                          Subdivisão em Triplicata:
                        </strong>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          {dados.amostras?.map((a: any, i: number) => (
                            <div
                              key={i}
                              className="p-1.5 bg-stone-50 rounded border border-stone-200"
                            >
                              <strong>Amostra {i + 1}:</strong> {a.identificacao} ({a.quantidade}{' '}
                              {dados.unidade})<br />
                              Destino:{' '}
                              <span className="font-semibold text-[#1B4332]">{a.destino}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Acondicionamento e Análises Solicitadas
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div>
                      <strong>Embalagem:</strong> {dados.tipo_embalagem}{' '}
                      {dados.lacre_selo ? `• Lacre nº ${dados.numero_lacre}` : '• Sem lacre'} •
                      Temp: {dados.temperatura_armazenamento_c}°C ({dados.local_armazenamento})
                    </div>
                    <div className="pt-2 border-t border-stone-100 text-[11px]">
                      <strong>Análises Requisitadas:</strong>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 mt-1">
                        {dados.analises?.micro_mesofilos && <span>• Mesófilos</span>}
                        {dados.analises?.micro_coliformes && <span>• Coliformes Totais</span>}
                        {dados.analises?.micro_salmonella && <span>• Salmonella sp.</span>}
                        {dados.analises?.micro_listeria && <span>• Listeria</span>}
                        {dados.analises?.fq_umidade && <span>• Umidade</span>}
                        {dados.analises?.fq_proteina && <span>• Proteína Bruta</span>}
                        {dados.analises?.fq_gordura && <span>• Gordura Bruta</span>}
                        {dados.analises?.microscopica_contaminantes && (
                          <span>• Microscopia (Contaminantes)</span>
                        )}
                        {dados.analises?.residuos_pesticidas && (
                          <span>• Pesticidas / Agrotóxicos</span>
                        )}
                        {dados.analises?.residuos_metais && <span>• Metais Pesados</span>}
                        {dados.analises?.molecular_ogm && <span>• OGM / Transgênicos</span>}
                      </div>
                      {dados.analises?.outras_analises && (
                        <p className="mt-1 text-stone-600">
                          Outras: {dados.analises.outras_analises}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO V: RELATÓRIO DE ANÁLISE LABORATORIAL */}
            {codigoAnexo.includes('ANEXO V') && (
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Dados da Amostra & Laboratório Credenciado
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Nº Relatório:</strong>{' '}
                      <span className="font-mono font-bold text-[#1B4332]">
                        {dados.numero_relatorio}
                      </span>
                    </div>
                    <div>
                      <strong>Nº Amostra:</strong>{' '}
                      <span className="font-mono">{dados.numero_amostra}</span>
                    </div>
                    <div>
                      <strong>Fornecedor:</strong> {dados.fornecedor_razao_social}
                    </div>
                    <div>
                      <strong>Produto / Lote:</strong> {dados.produto_nome} (Lote:{' '}
                      {dados.lote_partida})
                    </div>
                    <div>
                      <strong>Laboratório:</strong> {dados.laboratorio_nome}
                    </div>
                    <div>
                      <strong>RT Laboratório:</strong> {dados.responsavel_tecnico_laboratorio}
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Resultados dos Ensaios Analíticos
                  </div>
                  <div className="p-2 overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-600 text-left">
                          <th className="py-1 px-2">Ensaio / Parâmetro</th>
                          <th className="py-1 px-2">Grupo</th>
                          <th className="py-1 px-2">Resultado</th>
                          <th className="py-1 px-2">Limite Especificação</th>
                          <th className="py-1 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {dados.ensaios?.map((e: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-1 px-2 font-medium">{e.analise}</td>
                            <td className="py-1 px-2 text-stone-500">{e.grupo}</td>
                            <td className="py-1 px-2 font-mono font-bold">
                              {e.resultado} {e.unidade}
                            </td>
                            <td className="py-1 px-2 text-stone-600">{e.limite_especificacao}</td>
                            <td className="py-1 px-2">
                              <span
                                className={
                                  e.status === 'Conforme'
                                    ? 'text-emerald-700 font-bold'
                                    : e.status === 'Não Conforme'
                                      ? 'text-red-700 font-bold'
                                      : 'text-stone-500'
                                }
                              >
                                {e.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Resumo de Conformidade & Parecer Técnico
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        Total: <strong>{dados.total_analises || 0}</strong>
                      </div>
                      <div>
                        Conformes:{' '}
                        <strong className="text-emerald-700">
                          {dados.analises_conformes || 0}
                        </strong>
                      </div>
                      <div>
                        Não Conformes:{' '}
                        <strong className="text-red-700">
                          {dados.analises_nao_conformes || 0}
                        </strong>
                      </div>
                      <div>
                        % Conformidade: <strong>{dados.percentual_conformidade || 0}%</strong>
                      </div>
                      <div>
                        Resultado:{' '}
                        <Badge
                          className={
                            dados.resultado_geral === 'Aprovado'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-red-600 text-white'
                          }
                        >
                          {dados.resultado_geral}
                        </Badge>
                      </div>
                    </div>
                    {dados.parecer_laboratorio && (
                      <div className="pt-2 border-t border-stone-100 text-[11px]">
                        <strong>Parecer Técnico:</strong> {dados.parecer_laboratorio}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO VI: DESTINAÇÃO */}
            {codigoAnexo.includes('ANEXO VI') && (
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Identificação do Produto Não Aprovado
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Nº Registro:</strong>{' '}
                      <span className="font-mono font-bold text-[#1B4332]">
                        {dados.numero_registro}
                      </span>
                    </div>
                    <div>
                      <strong>Recebimento:</strong>{' '}
                      <span className="font-mono">{dados.numero_recebimento}</span>
                    </div>
                    <div>
                      <strong>Fornecedor:</strong> {dados.fornecedor_razao_social}
                    </div>
                    <div>
                      <strong>Produto:</strong> {dados.produto_nome}
                    </div>
                    <div>
                      <strong>Lote:</strong> {dados.lote_partida}
                    </div>
                    <div>
                      <strong>Qtd Rejeitada:</strong> {dados.quantidade} {dados.unidade}
                    </div>
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Motivo e Destinação Final
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div>
                      <strong>Motivo da Rejeição:</strong> {dados.motivo_rejeicao} —{' '}
                      {dados.descricao_motivo}
                    </div>
                    <div>
                      <strong>Tipo de Destinação:</strong>{' '}
                      <Badge className="bg-[#D9A404] text-[#1B4332] font-bold">
                        {dados.tipo_destinacao}
                      </Badge>
                    </div>
                    {dados.tipo_destinacao === 'Devolução ao Fornecedor' && (
                      <div className="text-[11px] text-stone-600">
                        Data Devolução: {dados.devolucao_data} | Transportadora:{' '}
                        {dados.devolucao_transportadora} | Rastreamento:{' '}
                        {dados.devolucao_rastreamento}
                      </div>
                    )}
                    {dados.tipo_destinacao === 'Destruição/Inutilização' && (
                      <div className="text-[11px] text-stone-600">
                        Método: {dados.destruicao_metodo} | Local: {dados.destruicao_local} | Data:{' '}
                        {dados.destruicao_data}
                      </div>
                    )}
                    {dados.tipo_destinacao === 'Aproveitamento Condicional' && (
                      <div className="text-[11px] text-stone-600">
                        Ação Corretiva: {dados.aproveitamento_acao_corretiva} | Resultado:{' '}
                        {dados.aproveitamento_resultado}
                      </div>
                    )}
                    <div className="pt-2 border-t border-stone-100 text-[11px]">
                      <strong>Conformidade Ambiental:</strong>{' '}
                      {dados.conformidade_ambiental ? 'Atendida integralmente' : 'Pendente'}{' '}
                      {dados.referencia_legislacao ? `(${dados.referencia_legislacao})` : ''}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANEXO VII: AÇÃO CORRETIVA */}
            {codigoAnexo.includes('ANEXO VII') && (
              <div className="space-y-4">
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Dados da Não Conformidade
                  </div>
                  <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <strong>Nº Ação Corretiva:</strong>{' '}
                      <span className="font-mono font-bold text-[#1B4332]">
                        {dados.numero_acao_corretiva}
                      </span>
                    </div>
                    <div>
                      <strong>Tipo NC:</strong> {dados.tipo_nc}
                    </div>
                    <div>
                      <strong>Impacto:</strong>{' '}
                      <span
                        className={
                          dados.impacto_potencial === 'Alto'
                            ? 'text-red-700 font-bold'
                            : 'text-stone-700 font-semibold'
                        }
                      >
                        {dados.impacto_potencial}
                      </span>
                    </div>
                    <div>
                      <strong>Fornecedor:</strong> {dados.fornecedor_razao_social}
                    </div>
                    <div>
                      <strong>Produto:</strong> {dados.produto_nome}
                    </div>
                    <div>
                      <strong>Lote:</strong> {dados.lote_partida}
                    </div>
                  </div>
                  <div className="px-3 pb-3 text-[11px] text-stone-700 border-t border-stone-100 pt-2">
                    <strong>Descrição do Desvio:</strong> {dados.descricao_detalhada}
                  </div>
                </div>

                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                    Causa Raiz & Plano de Ações
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div>
                      <strong>Causa Raiz ({dados.metodo_analise}):</strong>{' '}
                      {dados.causa_raiz_identificada}
                    </div>
                    <div className="pt-2 border-t border-stone-100">
                      <strong>Ações Corretivas:</strong>
                      <div className="space-y-1 mt-1 text-[11px]">
                        {dados.acoes_corretivas?.map((a: any, i: number) => (
                          <div
                            key={i}
                            className="p-1.5 bg-stone-50 rounded border border-stone-200 flex justify-between"
                          >
                            <span>
                              {i + 1}. {a.descricao} (Resp: {a.responsavel})
                            </span>
                            <span className="font-bold">
                              {a.status} • Prazo: {a.data_conclusao_prevista}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {dados.impacto_qualificacao_fornecedor && (
                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900">
                    <strong>Impacto no Fornecedor:</strong> {dados.acao_recomendada_fornecedor} —{' '}
                    {dados.justificativa_impacto_fornecedor} (NCs anteriores:{' '}
                    {dados.ncs_anteriores_contagem || 0})
                  </div>
                )}
              </div>
            )}

            {/* Bloco de Assinaturas Oficiais (RQ / RT / RE conforme anexo) */}
            <div className="pt-6 border-t-2 border-[#1B4332] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 text-center font-['Sora']">
                Bloco de Validação & Assinaturas Oficiais do Autocontrole
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Assinatura RQ / Executor */}
                <div className="p-3 border border-stone-300 rounded-lg text-center flex flex-col justify-between min-h-[130px] bg-stone-50">
                  <span className="text-[10px] font-bold text-[#1B4332] uppercase">
                    Responsável pela Qualidade / Execução (RQ)
                  </span>
                  <div className="my-2 text-[11px] text-stone-600">
                    <p className="font-semibold text-stone-800">
                      {dados.assinado_rq_nome ||
                        dados.assinado_por_nome ||
                        company?.rq_nome ||
                        'Dra. Mariana Siqueira'}
                    </p>
                    <p className="text-[9px] text-stone-500">
                      Data:{' '}
                      {dados.assinado_rq_data ||
                        dados.assinado_data ||
                        new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="border-t border-stone-300 pt-1 text-[9px] text-stone-500">
                    Controle de Qualidade (CQ/RQ)
                  </div>
                </div>

                {/* Assinatura RT (com foto se disponível) */}
                <div className="p-3 border border-stone-300 rounded-lg text-center flex flex-col justify-between min-h-[130px] bg-stone-50">
                  <span className="text-[10px] font-bold text-[#1B4332] uppercase">
                    Responsável Técnico (RT)
                  </span>
                  {rtSignatureImage || dados.rt_assinatura_imagem ? (
                    <div className="my-1 flex items-center justify-center">
                      <img
                        src={rtSignatureImage || dados.rt_assinatura_imagem}
                        alt="Assinatura RT"
                        className="max-h-12 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="border-b border-dashed border-stone-400 w-3/4 mx-auto my-3" />
                  )}
                  <div>
                    <p className="font-bold text-[11px] text-stone-900">
                      {dados.assinado_rt_nome || company?.rt_nome || 'Dr. Hélio Silva'}
                    </p>
                    <p className="text-[9px] text-stone-500">
                      {company?.rt_registro_conselho || 'CRMV-SP 18.420'}
                    </p>
                    <p className="text-[8px] text-stone-400">
                      Data: {dados.assinado_rt_data || new Date().toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé normativo */}
            <div className="pt-3 border-t border-stone-200 flex justify-between items-center text-[9px] text-stone-400">
              <span>NutriAgro SaaS • Módulo de Autocontrole IN 04/2007</span>
              <span>Documento sujeito à fiscalização federal agropecuária (MAPA)</span>
            </div>
          </div>
        </div>

        <DialogFooter className="p-3 sm:p-4 border-t border-[#E2DCCF] bg-white flex justify-between shrink-0">
          <span className="text-xs text-stone-500">Formato auditável pelo MAPA (IN 04/2007)</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
