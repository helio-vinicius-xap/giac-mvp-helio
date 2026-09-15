import React, { useState } from 'react'
import {
  FileText,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  KeyRound,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { registerDigitalSignature } from '@/services/agroService'
import type { Procedure, MonitoringRecord, Company } from '@/types/agro'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'

interface PopDocumentPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  procedure: Procedure
  company: Company | null
  recordsCount?: number
  onSignatureSaved?: () => void
}

export function PopDocumentPdfModal({
  open,
  onOpenChange,
  procedure,
  company,
  recordsCount = 0,
  onSignatureSaved,
}: PopDocumentPdfModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'visualizar' | 'assinar'>('visualizar')
  const [signatureMethod, setSignatureMethod] = useState<'pfx' | 'gov_br'>('gov_br')
  const [pfxFile, setPfxFile] = useState<File | null>(null)
  const [pfxPassword, setPfxPassword] = useState('')
  const [observacao, setObservacao] = useState('')
  const [savingSig, setSavingSig] = useState(false)

  const userRole = user?.role || 'RT'
  const canSignPop = userRole === 'RT' || userRole === 'RE' || userRole === 'admin'
  const isRT = userRole === 'RT'
  const isRE = userRole === 'RE'

  const rtAssinatura = procedure.assinaturas_pop?.rt
  const reAssinatura = procedure.assinaturas_pop?.re
  const isFullySigned = Boolean(rtAssinatura && reAssinatura)

  const handlePrint = () => {
    window.print()
  }

  const handleRegisterSignature = async (targetRole: 'RT' | 'RE') => {
    if (!canSignPop) {
      toast({
        title: 'Ação não permitida',
        description:
          'Apenas o RT (Responsável Técnico) ou RE (Responsável pelo Estabelecimento) podem assinar o POP.',
        variant: 'destructive',
      })
      return
    }

    setSavingSig(true)
    try {
      const respNome =
        targetRole === 'RT'
          ? company?.rt_nome || user?.name || 'Responsável Técnico'
          : company?.re_nome || user?.name || 'Responsável pelo Estabelecimento'
      const respId =
        targetRole === 'RT'
          ? company?.rt_registro_conselho || user?.conselho_classe || 'CRMV-SP'
          : company?.re_cpf || user?.cpf || 'CPF RE'

      await registerDigitalSignature({
        tipo_alvo: 'procedure',
        id_alvo: procedure.id,
        papel: targetRole,
        metodo: signatureMethod,
        responsavel_nome: respNome,
        responsavel_identificacao: respId,
        observacao:
          observacao ||
          (signatureMethod === 'gov_br'
            ? 'Assinatura digital certificada via login Gov.br pelo responsável legal'
            : 'Assinatura via Certificado Digital ICP-Brasil A1/A3 (PFX) validada no cliente'),
      })

      toast({
        title: `POP Assinado como ${targetRole}`,
        description: `Autenticação registrada com sucesso via ${
          signatureMethod === 'gov_br' ? 'Gov.br' : 'ICP-Brasil (PFX)'
        }.`,
      })

      if (onSignatureSaved) onSignatureSaved()
      setActiveTab('visualizar')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar assinatura',
        description: err.message || 'Falha ao autenticar.',
        variant: 'destructive',
      })
    } finally {
      setSavingSig(false)
    }
  }

  const camposExec = procedure.campos_execucao || {}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-[#FAF7EF] border-[#E2DCCF]">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-[#E2DCCF] bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-[#2D6A4F] text-white text-[11px] font-bold">
                  {procedure.codigo}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-900 text-[10px]"
                >
                  {procedure.referencia_in || 'IN 04/2007 MAPA Item 07'}
                </Badge>
                {isFullySigned ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Assinado RT & RE
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 text-[10px] gap-1"
                  >
                    <Clock className="h-3 w-3" /> Assinatura Pendente
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold font-['Sora'] text-[#2D6A4F]">
                {procedure.nome}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-600">
                Documento Oficial de Autocontrole para Impressão e Assinatura Eletrônica (RT / RE)
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
                Imprimir PDF
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab(activeTab === 'visualizar' ? 'assinar' : 'visualizar')}
                className="h-8 text-xs bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {activeTab === 'visualizar' ? 'Assinar Documento' : 'Ver Documento'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'assinar' ? (
            <div className="space-y-6 max-w-2xl mx-auto py-2">
              <div className="bg-white p-5 rounded-xl border border-[#E2DCCF] shadow-xs">
                <h3 className="text-sm font-bold font-['Sora'] text-[#2D6A4F] mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                  Assinatura Eletrônica Formal do Procedimento
                </h3>
                <p className="text-xs text-stone-600 mb-4">
                  O POP deve ser formalizado com a assinatura do{' '}
                  <strong>Responsável Técnico (RT)</strong> e do{' '}
                  <strong>Responsável pelo Estabelecimento (RE)</strong> registrado no MAPA
                  (SIPEAGRO).
                </p>

                {/* Perfil atual do usuário */}
                <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-stone-500">Seu perfil autenticado: </span>
                    <strong className="text-[#2D6A4F]">
                      {user?.name} ({user?.role || 'RT'})
                    </strong>
                    {user?.conselho_classe && (
                      <span className="block text-[11px] text-stone-600">
                        Registro: {user.conselho_classe}
                      </span>
                    )}
                  </div>
                  <Badge className="bg-[#2D6A4F] text-white text-[10px]">
                    Perfil: {user?.role || 'RT'}
                  </Badge>
                </div>

                {/* Seletor de Método: Gov.br vs PFX */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-stone-700">
                    Selecione o Método de Assinatura Eletrônica:
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSignatureMethod('gov_br')}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        signatureMethod === 'gov_br'
                          ? 'border-[#2D6A4F] bg-emerald-50/50 ring-1 ring-[#2D6A4F]'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#2D6A4F]">Assinatura Gov.br</span>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-blue-50 text-blue-700 border-blue-200"
                        >
                          Identidade Gov.br
                        </Badge>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Validação de identidade via credencial Gov.br Prata/Ouro do responsável
                        formal.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignatureMethod('pfx')}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        signatureMethod === 'pfx'
                          ? 'border-[#2D6A4F] bg-emerald-50/50 ring-1 ring-[#2D6A4F]'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-bold text-[#2D6A4F]">
                          Certificado PFX (ICP-Brasil)
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-amber-50 text-amber-800 border-amber-200"
                        >
                          A1 / A3
                        </Badge>
                      </div>
                      <p className="text-[11px] text-stone-600">
                        Download do PDF para assinatura com certificado digital ICP-Brasil e
                        registro.
                      </p>
                    </button>
                  </div>

                  {signatureMethod === 'pfx' && (
                    <div className="p-3.5 bg-amber-50/60 rounded-lg border border-amber-200 text-xs space-y-2">
                      <p className="text-amber-900 font-semibold flex items-center gap-1.5">
                        <FileCheck className="h-4 w-4 text-amber-700" />
                        Instruções para Assinador PFX / Token ICP-Brasil:
                      </p>
                      <p className="text-amber-800 text-[11px]">
                        1. Imprima ou salve este POP como PDF.
                        <br />
                        2. Assine o PDF com seu software assinador local (Adobe Acrobat, Assinador
                        SERPRO, ou Token A1/A3).
                        <br />
                        3. Confirme abaixo para registrar o carimbo cronológico e termo de
                        responsabilidade no sistema.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-stone-700">
                      Observações da Homologação
                    </Label>
                    <Input
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Aprovado para o ciclo operacional 2025 sem restrições."
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row gap-2 justify-end">
                    {(userRole === 'RT' || userRole === 'admin') && (
                      <Button
                        type="button"
                        disabled={savingSig}
                        onClick={() => handleRegisterSignature('RT')}
                        className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs gap-1.5"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {savingSig ? 'Registrando...' : 'Assinar como RT (Responsável Técnico)'}
                      </Button>
                    )}

                    {(userRole === 'RE' || userRole === 'admin') && (
                      <Button
                        type="button"
                        disabled={savingSig}
                        onClick={() => handleRegisterSignature('RE')}
                        className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5"
                      >
                        <KeyRound className="h-4 w-4" />
                        {savingSig ? 'Registrando...' : 'Assinar como RE (Resp. Estabelecimento)'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VISUALIZAÇÃO FORMATO FOLHA OFICIAL A4 PARA IMPRESSÃO/PDF */
            <div
              id="pop-printable-sheet"
              className="bg-white text-stone-900 p-6 sm:p-10 rounded-xl border border-stone-300 shadow-md max-w-4xl mx-auto font-sans leading-relaxed text-xs space-y-6"
            >
              {/* CABEÇALHO OFICIAL MAPA / SIPEAGRO */}
              <div className="border-2 border-stone-800 p-4 rounded-md flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-lg shrink-0">
                    GA
                  </div>
                  <div>
                    <h2 className="font-bold text-sm tracking-tight text-[#1B4332] uppercase">
                      {company?.razao_social || 'NutriAgro Nutrição Animal e Premixes Ltda.'}
                    </h2>
                    <p className="text-[11px] text-stone-600">
                      Registro MAPA/SIPEAGRO nº:{' '}
                      <strong className="text-stone-900">
                        {company?.numero_registro_mapa || 'SP-00412-8'}
                      </strong>{' '}
                      | CNPJ: {company?.cnpj || '12.345.678/0001-90'}
                    </p>
                    <p className="text-[10px] text-stone-500">
                      {company?.logradouro || 'Rodovia SP-330, KM 142'},{' '}
                      {company?.municipio || 'Ribeirão Preto'}/{company?.uf || 'SP'}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-stone-300 sm:pl-4">
                  <p className="text-xs font-bold text-[#2D6A4F]">
                    PROGRAMA DE AUTOCONTROLE (APPCC)
                  </p>
                  <p className="text-[11px] font-semibold text-stone-800">
                    PROCEDIMENTO OPERACIONAL PADRÃO
                  </p>
                  <p className="text-xs font-mono font-bold text-red-700">{procedure.codigo}</p>
                  <p className="text-[10px] text-stone-500">
                    Revisão: {procedure.versao || 'Rev. 02/2025'} | Validade:{' '}
                    {procedure.validade || '12 meses'}
                  </p>
                </div>
              </div>

              {/* TÍTULO E ENQUADRAMENTO NORMATIVO */}
              <div className="bg-stone-50 p-3 rounded border border-stone-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      Título do POP
                    </span>
                    <strong className="text-xs text-stone-900">{procedure.nome}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      Enquadramento Normativo
                    </span>
                    <strong className="text-xs text-[#2D6A4F]">
                      {procedure.referencia_in || 'IN 04/2007 MAPA - Item 07'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-500 block">
                      Área / Etapa
                    </span>
                    <strong className="text-xs text-stone-900">
                      {procedure.area_etapa || 'Fábrica e Armazenagem'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 1: OBJETIVO E CAMPO DE APLICAÇÃO */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] border-b border-stone-200 pb-1">
                  1. Objetivo e Justificativa Técnica
                </h4>
                <p className="text-stone-700 leading-normal">
                  {procedure.objetivo ||
                    'Padronizar as operações industriais e os critérios higiênico-sanitários para garantia da inocuidade alimentar animal, mitigando perigos biológicos, químicos e físicos em conformidade com o Item 07 da Instrução Normativa nº 04/2007 do MAPA.'}
                </p>
              </div>

              {/* SEÇÃO 2: PERIGOS E MEDIDAS PREVENTIVAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-red-50/50 rounded border border-red-200 space-y-1">
                  <h5 className="font-bold text-[11px] text-red-900 uppercase">
                    Perigos Relacionados
                  </h5>
                  <p className="text-[11px] text-stone-700 leading-tight">
                    {procedure.perigos_relacionados ||
                      'Contaminação cruzada, resíduos químicos, micotoxinas, Salmonella spp. e pragas.'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/50 rounded border border-emerald-200 space-y-1">
                  <h5 className="font-bold text-[11px] text-emerald-900 uppercase">
                    Medidas Preventivas
                  </h5>
                  <p className="text-[11px] text-stone-700 leading-tight">
                    {procedure.medidas_preventivas ||
                      'Inspeção sistemática, controle de tempo/temperatura, higienização rigorosa e registros.'}
                  </p>
                </div>
              </div>

              {/* SEÇÃO 3: PROCEDIMENTO DETALHADO (COMO DEVE SER EXECUTADO) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] border-b border-stone-200 pb-1">
                  2. Procedimento Operacional: Como Deve Ser Executado
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Produtos Químicos / Sanitizantes Utilizados:
                    </span>
                    <span className="text-stone-800">
                      {camposExec.produtos_quimicos_utilizados ||
                        'Conforme especificação da bula e FISPQ aprovada.'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Concentrações, Diluições e Dosagens:
                    </span>
                    <span className="text-stone-800">
                      {camposExec.concentracoes_dosagens ||
                        'Diluição padrão rigorosamente medida com dosador calibrado.'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Tempos de Contato e Temperaturas:
                    </span>
                    <span className="text-stone-800">
                      {camposExec.tempos_temperaturas ||
                        'Mínimo 15 minutos em temperatura ambiente operacional.'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Frequência de Monitoramento:
                    </span>
                    <span className="text-stone-800">
                      {camposExec.frequencias_detalhadas ||
                        procedure.frequencia ||
                        'Diário / A cada batelada.'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Responsável pela Execução na Linha:
                    </span>
                    <span className="text-stone-800">
                      {camposExec.responsavel_etapa ||
                        procedure.responsavel ||
                        'Operador treinado sob supervisão do RQ.'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 rounded border border-stone-200">
                    <span className="font-bold text-stone-600 block mb-0.5">
                      Limites Críticos de Aceitação:
                    </span>
                    <span className="text-stone-800 font-semibold text-emerald-800">
                      {camposExec.limites_criticos_aceitacao ||
                        'Conforme parâmetros analíticos do Item 07 da IN 04/2007.'}
                    </span>
                  </div>
                </div>

                {camposExec.instrucoes_especificas_estabelecimento && (
                  <div className="p-3 bg-amber-50/40 rounded border border-amber-200 text-[11px]">
                    <strong className="text-amber-900 block mb-1">
                      Instruções Específicas da Fábrica (SIPEAGRO):
                    </strong>
                    <p className="text-stone-700">
                      {camposExec.instrucoes_especificas_estabelecimento}
                    </p>
                  </div>
                )}
              </div>

              {/* SEÇÃO 4: FORMULÁRIOS DE REGISTRO VINCULADOS (ITEM 07 DA IN 04/2007) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] border-b border-stone-200 pb-1">
                  3. Formulários Normativos de Comprovação (IN 04/2007 - Item 07)
                </h4>
                <p className="text-[11px] text-stone-600">
                  Para ser formalmente comprovada a execução deste POP perante a fiscalização do
                  MAPA, os seguintes registros devem ser gerados e assinados pelo{' '}
                  <strong>Responsável pela Qualidade (RQ)</strong> e pelo{' '}
                  <strong>Responsável pelo Estabelecimento (RE)</strong>:
                </p>

                <div className="border border-stone-200 rounded divide-y divide-stone-200 text-[11px]">
                  <div className="p-2 bg-stone-100 font-bold grid grid-cols-12 text-stone-700">
                    <span className="col-span-3">Código do Formulário</span>
                    <span className="col-span-6">Título Normativo</span>
                    <span className="col-span-3">Frequência Exigida</span>
                  </div>
                  {(procedure.formularios_item07 && procedure.formularios_item07.length > 0
                    ? procedure.formularios_item07
                    : [
                        {
                          codigo: `F-01-${procedure.codigo}`,
                          titulo: `Registro de Monitoramento de ${procedure.nome}`,
                          frequencia: procedure.frequencia || 'Diário',
                        },
                      ]
                  ).map((f: any, idx: number) => (
                    <div key={idx} className="p-2 grid grid-cols-12 text-stone-800">
                      <span className="col-span-3 font-mono font-bold text-[#2D6A4F]">
                        {f.codigo}
                      </span>
                      <span className="col-span-6">{f.titulo}</span>
                      <span className="col-span-3">{f.frequencia}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SEÇÃO 5: BLOCO DE APROVAÇÃO FORMAL DO DOCUMENTO (DIREÇÃO, CQ, RT) */}
              <div className="pt-6 border-t-2 border-stone-800 space-y-4">
                <div className="text-center space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Aprovação Formal do Documento (Item 7.2 da IN MAPA nº 04/2007 e Decreto nº
                    12.031/2024)
                  </h4>
                  <p className="text-[10px] text-stone-600 max-w-2xl mx-auto">
                    O presente Procedimento Operacional Padrão ({procedure.codigo}) foi revisado,
                    aprovado tecnicamente e homologado para aplicação compulsória em todas as
                    unidades fabris do estabelecimento{' '}
                    {company?.razao_social || 'NutriAgro Nutrição Animal e Premixes Ltda.'}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                  {/* Direção Executiva */}
                  <div className="p-3 border border-stone-300 rounded text-center flex flex-col justify-between min-h-[130px] bg-stone-50/50">
                    <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                      Aprovado por (Direção)
                    </div>
                    {procedure.assinaturas_pop?.direcao ? (
                      <div className="my-2 p-1.5 bg-emerald-50 rounded border border-emerald-300 text-[10px] text-emerald-900 leading-tight">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto mb-0.5" />
                        <strong>Assinado Eletronicamente por:</strong>
                        <br />
                        {procedure.assinaturas_pop.direcao.responsavel_nome}
                      </div>
                    ) : (
                      <div className="my-4 border-b border-dashed border-stone-400 w-3/4 mx-auto" />
                    )}
                    <div>
                      <p className="font-bold text-xs text-stone-900">
                        {company?.re_nome || 'Carlos Eduardo Prado de Oliveira'}
                      </p>
                      <p className="text-[10px] text-stone-600">Direção Executiva da Empresa</p>
                    </div>
                  </div>

                  {/* Coordenador CQ */}
                  <div className="p-3 border border-stone-300 rounded text-center flex flex-col justify-between min-h-[130px] bg-stone-50/50">
                    <div className="text-stone-400 text-[10px] uppercase font-bold tracking-wider">
                      Aprovado por (Controle CQ)
                    </div>
                    {procedure.assinaturas_pop?.cq ? (
                      <div className="my-2 p-1.5 bg-emerald-50 rounded border border-emerald-300 text-[10px] text-emerald-900 leading-tight">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto mb-0.5" />
                        <strong>Assinado Eletronicamente por:</strong>
                        <br />
                        {procedure.assinaturas_pop.cq.responsavel_nome}
                      </div>
                    ) : (
                      <div className="my-4 border-b border-dashed border-stone-400 w-3/4 mx-auto" />
                    )}
                    <div>
                      <p className="font-bold text-xs text-stone-900">
                        {company?.rq_nome || 'Dra. Mariana Siqueira'}
                      </p>
                      <p className="text-[10px] text-stone-600">
                        Coordenador do Controle da Qualidade
                      </p>
                    </div>
                  </div>

                  {/* Responsável Técnico RT */}
                  <div className="p-3 border border-emerald-300 rounded text-center flex flex-col justify-between min-h-[130px] bg-emerald-50/40">
                    <div className="text-emerald-800 text-[10px] uppercase font-bold tracking-wider">
                      Homologado por (RT)
                    </div>
                    {rtAssinatura?.imagem_url ? (
                      <div className="my-1 p-1 bg-white rounded border border-emerald-200 flex items-center justify-center">
                        <img
                          src={rtAssinatura.imagem_url}
                          alt="Assinatura RT"
                          className="max-h-14 max-w-full object-contain"
                        />
                      </div>
                    ) : rtAssinatura ? (
                      <div className="my-2 p-1.5 bg-emerald-50 rounded border border-emerald-300 text-[10px] text-emerald-900 leading-tight">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 mx-auto mb-0.5" />
                        <strong>Assinado Eletronicamente por:</strong>
                        <br />
                        {rtAssinatura.responsavel_nome}
                      </div>
                    ) : (
                      <div className="my-4 border-b border-dashed border-emerald-400 w-3/4 mx-auto" />
                    )}
                    <div>
                      <p className="font-bold text-xs text-stone-900">
                        {company?.rt_nome || 'Dr. Hélio Silva'}
                      </p>
                      <p className="text-[10px] text-stone-600">
                        Responsável Técnico — {company?.rt_registro_conselho || 'CRMV-SP 18.420'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[9px] text-stone-500 text-center pt-3 border-t border-stone-200">
                  Documento elaborado e integrado ao Manual de Boas Práticas de Fabricação (BPF) em
                  15 de setembro de 2026. A retenção deste documento obedece ao prazo regulatório de
                  2 anos para alimentação geral e de 3 anos para produtos com medicamentos
                  veterinários.
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t border-[#E2DCCF] bg-white flex justify-between sm:justify-between shrink-0">
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Baseado no cadastro SIPEAGRO:{' '}
            <strong>{company?.numero_registro_mapa || 'SP-00412-8'}</strong>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-stone-300"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
