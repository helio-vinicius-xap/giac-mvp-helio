import React from 'react'
import { Printer, Building2, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatarCNPJ } from '@/lib/pop01Validators'
import type { AutoAvaliacaoFornecedorItem } from '@/types/autoAvaliacaoFornecedor'

interface AutoAvaliacaoPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  avaliacao: AutoAvaliacaoFornecedorItem | null
}

export function AutoAvaliacaoPdfModal({
  open,
  onOpenChange,
  avaliacao,
}: AutoAvaliacaoPdfModalProps) {
  if (!avaliacao) return null

  const handlePrint = () => {
    window.print()
  }

  const c: any = avaliacao.dados_cadastrais || {}
  const tf: any = avaliacao.tipo_fornecedor || {}
  const respostas = avaliacao.respostas || []
  const ass: any = avaliacao.assinaturas || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#1B4332] text-white text-[11px] font-bold font-mono">
                  {avaliacao.numero_registro}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#2D6A4F] text-[#2D6A4F] bg-emerald-50 text-[10px]"
                >
                  {avaliacao.codigo_doc || 'POP 01-AC01'} • AUTO AVALIAÇÃO DO FORNECEDOR
                </Badge>
              </div>
              <DialogTitle className="text-base font-bold font-['Sora'] text-[#1B4332]">
                Formulário de Auto Avaliação do Fornecedor
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Visualização oficial para impressão ou exportação de PDF (Padrão IN 04/2007 MAPA).
              </DialogDescription>
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
            {/* Cabeçalho Oficial */}
            <div className="border-b-2 border-[#1B4332] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 text-[#1B4332]">
                  <Building2 className="h-5 w-5 text-[#2D6A4F]" />
                  <h2 className="text-base font-bold uppercase tracking-tight font-['Sora'] text-[#1B4332]">
                    PAC-01_R0001 - QUALIFICAÇÃO DE FORNECEDORES
                  </h2>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Módulo de Homologação e Auto Avaliação Técnica de Fornecedores
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  Registro: <strong>{avaliacao.numero_registro}</strong>
                </p>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto">
                <span className="inline-block px-3 py-1 rounded bg-[#1B4332] text-white font-mono font-bold text-xs">
                  {avaliacao.codigo_doc || 'POP 01-AC01'}
                </span>
                <p className="text-[10px] text-stone-500 mt-1 font-semibold">
                  Revisão: {avaliacao.revisao_doc || 'Rev.01'}
                </p>
                <p className="text-[10px] text-stone-500">
                  Data Avaliação:{' '}
                  {avaliacao.data_avaliacao
                    ? new Date(avaliacao.data_avaliacao).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            </div>

            {/* Título do Registro */}
            <div className="text-center py-2 bg-[#FAF7EF] rounded-lg border border-[#E2DCCF]">
              <h1 className="text-sm sm:text-base font-bold uppercase text-[#1B4332] font-['Sora']">
                QUESTIONÁRIO DE AUTO AVALIAÇÃO DE FORNECEDORES
              </h1>
              <div className="flex justify-center items-center gap-4 text-[10px] text-stone-600 mt-1">
                <span>
                  Código: <strong>{avaliacao.codigo_doc || 'POP 01-AC01'}</strong>
                </span>
                {avaliacao.data_elaboracao && (
                  <span>
                    Elaboração:{' '}
                    <strong>
                      {new Date(avaliacao.data_elaboracao).toLocaleDateString('pt-BR')}
                    </strong>
                  </span>
                )}
                {avaliacao.data_edicao && (
                  <span>
                    Edição:{' '}
                    <strong>{new Date(avaliacao.data_edicao).toLocaleDateString('pt-BR')}</strong>
                  </span>
                )}
                <span>
                  Revisão: <strong>{avaliacao.revisao_doc || 'Rev.01'}</strong>
                </span>
              </div>
            </div>

            {/* SEÇÃO 1: DADOS CADASTRAIS */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                1 - Dados Cadastrais
              </div>
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <strong>Data da Avaliação:</strong>{' '}
                  {c.data_avaliacao ? new Date(c.data_avaliacao).toLocaleDateString('pt-BR') : '—'}
                </div>
                <div>
                  <strong>CNPJ:</strong> <span className="font-mono">{formatarCNPJ(c.cnpj)}</span>
                </div>
                <div>
                  <strong>Razão Social:</strong> {c.razao_social || '—'}
                </div>
                <div>
                  <strong>Nome Fantasia:</strong> {c.nome_fantasia || '—'}
                </div>
                <div className="sm:col-span-2">
                  <strong>Endereço:</strong> {c.endereco || '—'}
                </div>
                <div>
                  <strong>Cidade:</strong> {c.cidade || '—'}
                </div>
                <div>
                  <strong>Estado:</strong> {c.estado || '—'}
                </div>
                <div>
                  <strong>CEP:</strong> {c.cep || '—'}
                </div>
                <div>
                  <strong>Contato:</strong> {c.contato || '—'}
                </div>
                <div>
                  <strong>E-mail:</strong> {c.email || '—'}
                </div>
                <div>
                  <strong>Telefone:</strong> {c.telefone || '—'}
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: TIPO DE FORNECEDOR */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                2 - Tipo de Fornecedor & Qualidade
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <strong>Tipo:</strong> {tf.tipo || '—'}
                  {tf.tipo_outro_especificar && (
                    <span className="text-stone-600 block text-[11px]">
                      Outro especificado: {tf.tipo_outro_especificar}
                    </span>
                  )}
                </div>
                <div>
                  <strong>Área de Atuação:</strong> {tf.area_atuacao || '—'}
                  <span className="text-stone-600 block text-[11px]">
                    Nº Registro: {tf.numero_registro || 'Isento / Não informado'}
                    {tf.isento_registro_especificar ? ` (${tf.isento_registro_especificar})` : ''}
                  </span>
                </div>
                <div>
                  <strong>Categorias de Insumo:</strong>
                  <p className="text-[11px] text-stone-700 mt-0.5">
                    {Array.isArray(tf.categorias) && tf.categorias.length > 0
                      ? tf.categorias.join(', ')
                      : 'Nenhuma selecionada'}
                  </p>
                </div>
                <div>
                  <strong>Programas de Qualidade Implementados:</strong>
                  <p className="text-[11px] text-stone-700 mt-0.5">
                    {Array.isArray(tf.programas_qualidade) && tf.programas_qualidade.length > 0
                      ? tf.programas_qualidade.join(', ')
                      : 'Nenhum'}
                    {tf.programas_outro_especificar
                      ? ` | Outro: ${tf.programas_outro_especificar}`
                      : ''}
                  </p>
                </div>
                {tf.sipeagro_situacao && (
                  <div className="sm:col-span-2 pt-2 border-t border-stone-100 text-[11px]">
                    <strong>Confirmação Oficial SIPEAGRO:</strong> Situação{' '}
                    <span className="font-bold text-emerald-700">{tf.sipeagro_situacao}</span>
                    {Array.isArray(tf.sipeagro_categorias_estabelecimento) && (
                      <span>
                        {' '}
                        | Categorias: {tf.sipeagro_categorias_estabelecimento.join(', ')}
                      </span>
                    )}
                    {Array.isArray(tf.sipeagro_tipos_produto) && (
                      <span> | Tipos MAPA: {tf.sipeagro_tipos_produto.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SEÇÃO 3: QUESTIONÁRIO DE ITENS AVALIADOS */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase flex justify-between items-center">
                <span>3 - Itens Avaliados (C=1, NC=0, NA=1)</span>
                <span className="text-[10px] text-stone-500 font-normal">
                  Total de 20 perguntas
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 text-[10px]">
                      <th className="py-2 px-2.5 w-10 text-center">Nº</th>
                      <th className="py-2 px-3">Pergunta / Descrição</th>
                      <th className="py-2 px-2 text-center w-12">C</th>
                      <th className="py-2 px-2 text-center w-12">NC</th>
                      <th className="py-2 px-2 text-center w-12">NA</th>
                      <th className="py-2 px-3 w-40">Arquivo / Evidência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {respostas.map((item) => (
                      <tr key={item.numero} className="hover:bg-stone-50/50">
                        <td className="py-2 px-2.5 text-center font-mono font-semibold text-stone-700">
                          {item.numero}
                        </td>
                        <td className="py-2 px-3 text-stone-800">
                          {item.texto || `Pergunta #${item.numero}`}
                        </td>
                        <td className="py-2 px-2 text-center font-bold">
                          {item.resposta === 'C' ? '1' : ''}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-red-600">
                          {item.resposta === 'NC' ? '0' : ''}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-stone-500">
                          {item.resposta === 'NA' ? '1' : ''}
                        </td>
                        <td className="py-2 px-3 text-[10px] text-stone-600 truncate max-w-[160px]">
                          {item.nome_arquivo || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totais e Nota */}
              <div className="bg-[#FAF7EF] p-3 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span>
                    Total C: <strong>{avaliacao.total_c}</strong>
                  </span>
                  <span>
                    Total NC: <strong>{avaliacao.total_nc}</strong>
                  </span>
                  <span>
                    Total NA: <strong>{avaliacao.total_na}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-600">
                    Fórmula: (Total C + Total NA) / 20 × 100
                  </span>
                  <div className="px-3 py-1 bg-white rounded border border-[#E2DCCF] font-bold text-sm text-[#1B4332]">
                    NOTA FINAL: {avaliacao.nota_final}%
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 4: AVALIAÇÃO FINAL DO CONTROLE DE QUALIDADE */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <div className="bg-[#FAF7EF] px-3 py-1.5 font-bold text-[#1B4332] text-xs border-b border-stone-200 uppercase">
                4 - Avaliação Final (Uso Exclusivo do Controle de Qualidade)
              </div>
              <div className="p-3 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <strong>AVALIAÇÃO FINAL:</strong>
                  {avaliacao.avaliacao_final === 'APROVADO' ? (
                    <Badge className="bg-emerald-700 text-white font-bold text-xs gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> APROVADO
                    </Badge>
                  ) : avaliacao.avaliacao_final === 'REPROVADO' ? (
                    <Badge className="bg-red-700 text-white font-bold text-xs gap-1">
                      <XCircle className="h-3.5 w-3.5" /> REPROVADO
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-600 text-white font-bold text-xs">PENDENTE</Badge>
                  )}
                  <span className="text-stone-500 text-[11px]">
                    Status Régua:{' '}
                    <strong>{avaliacao.status_assinatura || 'Pendente Assinatura'}</strong>
                  </span>
                </div>

                {avaliacao.observacoes && (
                  <div>
                    <strong>OBSERVAÇÕES:</strong>
                    <p className="mt-1 p-2 bg-stone-50 rounded border border-stone-200 text-[11px] text-stone-700 whitespace-pre-wrap">
                      {avaliacao.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BLOCO DE ASSINATURAS HIERÁRQUICAS */}
            <div className="border-t-2 border-stone-300 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-2">
                <div className="h-14 border-b border-stone-400 flex flex-col justify-end pb-1">
                  {ass.preenchimento?.assinatura_imagem ? (
                    <img
                      src={ass.preenchimento.assinatura_imagem}
                      alt="Assinatura"
                      className="max-h-12 mx-auto object-contain"
                    />
                  ) : (
                    <span className="font-mono text-stone-600 font-semibold text-[11px]">
                      {ass.preenchimento?.nome || '_________________________________'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold uppercase text-stone-800">
                    Responsável pelo Preenchimento
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {ass.preenchimento?.nome
                      ? `${ass.preenchimento.nome}`
                      : 'Qualquer usuário autenticado'}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Função: {ass.preenchimento?.funcao || 'Não especificada'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-14 border-b border-stone-400 flex flex-col justify-end pb-1">
                  {ass.aprovacao?.assinatura_imagem ? (
                    <img
                      src={ass.aprovacao.assinatura_imagem}
                      alt="Assinatura"
                      className="max-h-12 mx-auto object-contain"
                    />
                  ) : (
                    <span className="font-mono text-stone-600 font-semibold text-[11px]">
                      {ass.aprovacao?.nome || '_________________________________'}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-bold uppercase text-stone-800 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2D6A4F]" />
                    Responsável pela Aprovação
                  </p>
                  <p className="text-[11px] text-stone-600">
                    {ass.aprovacao?.nome ? `${ass.aprovacao.nome}` : 'Exige perfil RT ou RE'}
                  </p>
                  <p className="text-[10px] text-stone-500">
                    Função:{' '}
                    {ass.aprovacao?.funcao ||
                      'Responsável Técnico / Responsável pelo Estabelecimento'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
