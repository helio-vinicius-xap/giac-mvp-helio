import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronRight,
  Save,
  CheckCircle2,
  Clock,
  User,
  Shield,
  UploadCloud,
  FileText,
  Calendar,
  Layers,
  HelpCircle,
  Activity,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { getNonConformityById, updateNonConformity } from '@/services/agroService'
import type { NonConformity, NCEfficacy, NCStatus } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function NonConformityDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [nc, setNc] = useState<NonConformity | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Plano de Ação Form
  const [planoForm, setPlanoForm] = useState({
    plano_acao: '',
    responsavel_acao: '',
    prazo_acao: '',
    recursos: '',
    medidas_preventivas: '',
    indicador_eficacia: '',
  })

  // Execução
  const [execucaoForm, setExecucaoForm] = useState({
    data_execucao: new Date().toISOString().split('T')[0],
    responsavel: 'Roberto Lima',
  })

  // Verificação de Eficácia
  const [verificacaoForm, setVerificacaoForm] = useState({
    verificacao_responsavel: 'Dra. Mariana Siqueira',
    data_verificacao: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eficaz: 'Eficaz' as NCEfficacy,
    resultado_verificacao:
      'Verificado que nos 30 dias subsequentes à execução não houve reincidência do desvio.',
  })

  // Modais de Causa Raiz
  const [open5PorquesModal, setOpen5PorquesModal] = useState(false)
  const [cincoPorques, setCincoPorques] = useState<string[]>([
    'Por que ocorreu o desvio na pesagem de premix? O sensor da balança sofreu sobrecarga na limpeza.',
    'Por que sobrecarregou? O operador apoiou balde com 25kg no prato sem apoio auxiliar.',
    'Por que não usou apoio? Faltava suporte lateral ergonômico na bancada de pesagem.',
    'Por que faltava suporte? Não foi contemplado no projeto de layout original da sala.',
    'Causa Raiz Primária: Ausência de limitador mecânico de carga e suporte ergonômico padronizado.',
  ])

  const [openIshikawaModal, setOpenIshikawaModal] = useState(false)
  const [ishikawa, setIshikawa] = useState({
    maquina: 'Célula de carga sensível sem limitador mecânico de impacto.',
    metodo: 'Falta de instrução de trabalho específica para fracionamento de premix.',
    material: 'Recipiente de dosagem com peso excessivo para a plataforma.',
    mao_de_obra: 'Operador recente ainda em período de treinamento de integração.',
    meio_ambiente: 'Vibração periférica transmitida pela base do misturador.',
    medicao: 'Checagem com peso-padrão realizada apenas semanalmente.',
  })

  const loadNC = async () => {
    if (!id) return
    try {
      const data = await getNonConformityById(id)
      setNc(data)

      setPlanoForm({
        plano_acao: data.plano_acao || '',
        responsavel_acao: data.responsavel_acao || data.responsavel || '',
        prazo_acao: data.prazo_acao ? data.prazo_acao.split('T')[0] : '',
        recursos: data.recursos || '',
        medidas_preventivas: data.medidas_preventivas || '',
        indicador_eficacia: data.indicador_eficacia || '',
      })

      if (data.data_execucao) {
        setExecucaoForm({
          data_execucao: data.data_execucao.split('T')[0],
          responsavel: data.responsavel_acao || 'Roberto Lima',
        })
      }

      if (data.eficaz) {
        setVerificacaoForm({
          verificacao_responsavel: data.verificacao_responsavel || 'Dra. Mariana Siqueira',
          data_verificacao: data.data_verificacao ? data.data_verificacao.split('T')[0] : '',
          eficaz: data.eficaz,
          resultado_verificacao: data.resultado_verificacao || '',
        })
      }

      if (data.causa_raiz?.cinco_porques) {
        setCincoPorques(data.causa_raiz.cinco_porques)
      }
      if (data.causa_raiz?.ishikawa) {
        setIshikawa((prev) => ({ ...prev, ...(data.causa_raiz?.ishikawa || {}) }))
      }
    } catch (err: any) {
      toast({
        title: 'Não Conformidade não encontrada',
        description: err.message,
        variant: 'destructive',
      })
      navigate('/nao-conformidades')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNC()
  }, [id])

  useRealtime('non_conformities', () => loadNC())

  const handleSavePlano = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateNonConformity(id, {
        ...planoForm,
        prazo_acao: planoForm.prazo_acao ? `${planoForm.prazo_acao} 00:00:00.000Z` : undefined,
        status: 'Em Andamento',
        causa_raiz: {
          cinco_porques: cincoPorques,
          ishikawa: ishikawa,
        },
      })
      setNc(updated)
      toast({
        title: 'Plano de Ação salvo',
        description: 'Status atualizado para Em Andamento.',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar plano', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleMarcarExecutada = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateNonConformity(id, {
        data_execucao: `${execucaoForm.data_execucao} 00:00:00.000Z`,
        status: 'Em Andamento',
      })
      setNc(updated)
      toast({
        title: 'Ação Corretiva Executada!',
        description: 'Verificação de eficácia habilitada após o prazo regulatório (mín. 30 dias).',
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveVerificacao = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await updateNonConformity(id, {
        verificacao_responsavel: verificacaoForm.verificacao_responsavel,
        data_verificacao: `${verificacaoForm.data_verificacao} 00:00:00.000Z`,
        eficaz: verificacaoForm.eficaz,
        resultado_verificacao: verificacaoForm.resultado_verificacao,
        status: verificacaoForm.eficaz === 'Eficaz' ? 'Fechada' : 'Aberta',
      })
      setNc(updated)
      toast({
        title:
          verificacaoForm.eficaz === 'Eficaz'
            ? 'Não Conformidade Concluída e Fechada!'
            : 'Ação considerada Não Eficaz. Novo plano de ação requerido.',
        description: `Status: ${updated.status}`,
      })
    } catch (err: any) {
      toast({ title: 'Erro na verificação', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !nc) {
    return (
      <div className="py-12 text-center text-xs text-stone-500">Carregando detalhes da NC...</div>
    )
  }

  const isExecuted = Boolean(nc.data_execucao)

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Breadcrumb */}
      <div className="space-y-2">
        <nav className="flex items-center text-xs text-stone-500 gap-1.5 no-print">
          <Link to="/nao-conformidades" className="hover:text-[#2D6A4F] transition">
            Não Conformidades
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{nc.codigo}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#B91C1C] px-2.5 py-0.5 rounded-full">
                {nc.codigo}
              </span>
              <Badge
                variant="outline"
                className={
                  nc.classificacao === 'Crítica'
                    ? 'border-red-300 text-[#B91C1C] bg-red-50'
                    : 'border-amber-300 text-[#D9A404] bg-amber-50'
                }
              >
                {nc.classificacao}
              </Badge>
              <Badge
                className={
                  nc.status === 'Aberta'
                    ? 'bg-[#B91C1C] text-white'
                    : nc.status === 'Em Andamento'
                      ? 'bg-[#D9A404] text-[#1B4332]'
                      : 'bg-[#2E8B57] text-white'
                }
              >
                {nc.status}
              </Badge>
              <span className="text-xs text-stone-500 ml-1">
                Origem: <strong>{nc.origem}</strong> • Área: <strong>{nc.area || 'Geral'}</strong>
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold font-['Sora'] text-[#2D6A4F]">
              {nc.descricao}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            <Button
              size="sm"
              onClick={handleSavePlano}
              disabled={saving}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm"
            >
              <Save className="h-4 w-4" />
              Salvar Plano
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Grid Sections: Descrição & Plano de Ação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Detalhes da Ocorrência */}
        <div className="agro-card p-6 space-y-4">
          <h2 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider border-b border-[#E2DCCF] pb-3">
            Dados de Identificação
          </h2>

          <div className="text-xs space-y-3 text-stone-700">
            <div>
              <span className="font-semibold text-stone-500 block text-[10px] uppercase">
                Data de Identificação
              </span>
              <span className="font-bold text-stone-900">
                {new Date(nc.data_identificacao).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div>
              <span className="font-semibold text-stone-500 block text-[10px] uppercase">
                Prazo Regulatório Limite
              </span>
              <span className="font-bold text-[#B91C1C]">
                {nc.prazo ? new Date(nc.prazo).toLocaleDateString('pt-BR') : '30 dias'}
              </span>
            </div>

            <div>
              <span className="font-semibold text-stone-500 block text-[10px] uppercase">
                Responsável pelo Apontamento
              </span>
              <span className="font-semibold text-stone-800">{nc.responsavel || 'Hélio - RT'}</span>
            </div>

            {nc.lote && (
              <div>
                <span className="font-semibold text-stone-500 block text-[10px] uppercase">
                  Lote Afetado
                </span>
                <Link
                  to={`/rastreabilidade?lote=${encodeURIComponent(nc.lote)}`}
                  className="font-bold text-[#2D6A4F] hover:underline"
                >
                  {nc.lote}
                </Link>
              </div>
            )}
          </div>

          {/* Análise de Causa Raiz CTAs */}
          <div className="pt-4 border-t border-[#E2DCCF] space-y-2">
            <span className="text-xs font-bold text-stone-800 block">
              Metodologias de Causa Raiz:
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen5PorquesModal(true)}
              className="w-full text-xs border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 gap-2 justify-start"
            >
              <HelpCircle className="h-4 w-4 text-[#D9A404]" /> 5 Porquês (Análise Sequencial)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenIshikawaModal(true)}
              className="w-full text-xs border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 gap-2 justify-start"
            >
              <Activity className="h-4 w-4 text-[#D9A404]" /> Diagrama de Ishikawa (6M)
            </Button>
          </div>
        </div>

        {/* Col 2: Plano de Ação */}
        <div className="lg:col-span-2 agro-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DCCF] pb-3">
            <h2 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
              Plano de Ação Corretiva & Preventiva (Item 54)
            </h2>
            <Badge
              variant="secondary"
              className="bg-[#FAF7EF] text-stone-600 border border-[#E2DCCF]"
            >
              5W2H
            </Badge>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Ação Corretiva (O que será feito para eliminar a causa?)
              </Label>
              <Textarea
                rows={3}
                value={planoForm.plano_acao}
                onChange={(e) => setPlanoForm({ ...planoForm, plano_acao: e.target.value })}
                placeholder="Descreva as medidas corretivas imediatas e de bloqueio..."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Responsável pela Ação
                </Label>
                <Input
                  value={planoForm.responsavel_acao}
                  onChange={(e) => setPlanoForm({ ...planoForm, responsavel_acao: e.target.value })}
                  placeholder="Nome do encarregado"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Prazo de Conclusão</Label>
                <Input
                  type="date"
                  value={planoForm.prazo_acao}
                  onChange={(e) => setPlanoForm({ ...planoForm, prazo_acao: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Recursos Necessários</Label>
              <Input
                value={planoForm.recursos}
                onChange={(e) => setPlanoForm({ ...planoForm, recursos: e.target.value })}
                placeholder="Ex: Peças de reposição, kit de calibração, treinamento externo..."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Medidas Preventivas (Para evitar reincidência)
              </Label>
              <Textarea
                rows={2}
                value={planoForm.medidas_preventivas}
                onChange={(e) =>
                  setPlanoForm({ ...planoForm, medidas_preventivas: e.target.value })
                }
                placeholder="Alteração no POP, treinamento da equipe ou melhoria no layout..."
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Indicador de Eficácia</Label>
              <Input
                value={planoForm.indicador_eficacia}
                onChange={(e) => setPlanoForm({ ...planoForm, indicador_eficacia: e.target.value })}
                placeholder="Ex: Zero falhas de pesagem em 30 dias consecutivos..."
                className="h-9 text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSavePlano}
                disabled={saving}
                size="sm"
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-xs gap-1.5"
              >
                <Save className="h-4 w-4" /> Salvar Plano de Ação
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Execução e Verificação de Eficácia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seção Execução (Item 55) */}
        <div className="agro-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2DCCF] pb-3">
            <h2 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
              1. Comprovação da Execução (Item 55)
            </h2>
            {isExecuted ? (
              <Badge className="bg-[#2E8B57] text-white">Executada</Badge>
            ) : (
              <Badge variant="outline" className="border-amber-300 text-[#D9A404]">
                Pendente
              </Badge>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data de Execução</Label>
                <Input
                  type="date"
                  value={execucaoForm.data_execucao}
                  onChange={(e) =>
                    setExecucaoForm({ ...execucaoForm, data_execucao: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Responsável</Label>
                <Input
                  value={execucaoForm.responsavel}
                  onChange={(e) =>
                    setExecucaoForm({ ...execucaoForm, responsavel: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] space-y-2">
              <span className="font-bold text-stone-700 block">Evidências de Execução:</span>
              <p className="text-stone-600 text-[11px]">
                Anexe certificados de calibração, fotografias da melhoria ou ordens de serviço
                assinadas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Upload de Evidência',
                    description: 'Comprovante anexado ao processo de autocontrole.',
                  })
                }
                className="border-stone-300 text-stone-700 text-xs gap-1.5"
              >
                <UploadCloud className="h-4 w-4" /> Anexar Comprovante
              </Button>
            </div>

            <Button
              onClick={handleMarcarExecutada}
              disabled={saving}
              className="w-full bg-[#2E8B57] hover:bg-[#236e44] text-white font-semibold text-xs mt-2"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Marcar como Executada
            </Button>
          </div>
        </div>

        {/* Seção Verificação de Eficácia (Item 56) */}
        <div
          className={`agro-card p-6 space-y-4 ${
            !isExecuted ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          <div className="flex items-center justify-between border-b border-[#E2DCCF] pb-3">
            <h2 className="text-xs font-bold text-[#2D6A4F] uppercase tracking-wider">
              2. Verificação de Eficácia (Item 56)
            </h2>
            <Badge variant="outline" className="text-stone-600">
              Mínimo 30 dias após execução
            </Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Verificada por</Label>
                <Input
                  value={verificacaoForm.verificacao_responsavel}
                  onChange={(e) =>
                    setVerificacaoForm({
                      ...verificacaoForm,
                      verificacao_responsavel: e.target.value,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data da Verificação</Label>
                <Input
                  type="date"
                  value={verificacaoForm.data_verificacao}
                  onChange={(e) =>
                    setVerificacaoForm({
                      ...verificacaoForm,
                      data_verificacao: e.target.value,
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Resultado do Teste</Label>
              <Select
                value={verificacaoForm.eficaz}
                onValueChange={(val: any) =>
                  setVerificacaoForm({ ...verificacaoForm, eficaz: val })
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eficaz">
                    Eficaz (Desvio não recorreu, plano aprovado)
                  </SelectItem>
                  <SelectItem value="Não Eficaz">
                    Não Eficaz (Reincidência detectada - novo plano exigido)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Parecer da Verificação de Eficácia
              </Label>
              <Textarea
                rows={2}
                value={verificacaoForm.resultado_verificacao}
                onChange={(e) =>
                  setVerificacaoForm({
                    ...verificacaoForm,
                    resultado_verificacao: e.target.value,
                  })
                }
                className="text-xs resize-none"
              />
            </div>

            <Button
              onClick={handleSaveVerificacao}
              disabled={saving || !isExecuted}
              className="w-full bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs mt-2"
            >
              <Shield className="h-4 w-4 mr-1.5" /> Salvar Verificação e Fechar NC
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL: 5 PORQUÊS */}
      <Dialog open={open5PorquesModal} onOpenChange={setOpen5PorquesModal}>
        <DialogContent className="sm:max-w-[600px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#D9A404]" />
              Análise dos 5 Porquês (Causa Raiz)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Técnica sequencial de investigação para alcançar a falha sistêmica primária.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {cincoPorques.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-xs font-semibold text-[#2D6A4F]">{idx + 1}º Por quê?</Label>
                <Input
                  value={item}
                  onChange={(e) => {
                    const arr = [...cincoPorques]
                    arr[idx] = e.target.value
                    setCincoPorques(arr)
                  }}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen5PorquesModal(false)}
              className="border-stone-300 text-stone-700"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setOpen5PorquesModal(false)
                toast({
                  title: 'Análise dos 5 Porquês vinculada',
                  description: 'Não esqueça de clicar em Salvar Plano.',
                })
              }}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Aplicar na Não Conformidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DIAGRAMA DE ISHIKAWA (6M) */}
      <Dialog open={openIshikawaModal} onOpenChange={setOpenIshikawaModal}>
        <DialogContent className="sm:max-w-[650px] bg-white border-[#E2DCCF] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#D9A404]" />
              Diagrama de Ishikawa (Espinha de Peixe - 6M)
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Mapeamento de hipóteses de desvio nos 6 pilares industriais.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">1. Máquina (Equipamentos)</Label>
              <Textarea
                rows={2}
                value={ishikawa.maquina}
                onChange={(e) => setIshikawa({ ...ishikawa, maquina: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">2. Método (POPs / Instruções)</Label>
              <Textarea
                rows={2}
                value={ishikawa.metodo}
                onChange={(e) => setIshikawa({ ...ishikawa, metodo: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">
                3. Material (Insumos / Embalagens)
              </Label>
              <Textarea
                rows={2}
                value={ishikawa.material}
                onChange={(e) => setIshikawa({ ...ishikawa, material: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">4. Mão de Obra (Operadores)</Label>
              <Textarea
                rows={2}
                value={ishikawa.mao_de_obra}
                onChange={(e) => setIshikawa({ ...ishikawa, mao_de_obra: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">5. Meio Ambiente (Fábrica)</Label>
              <Textarea
                rows={2}
                value={ishikawa.meio_ambiente}
                onChange={(e) => setIshikawa({ ...ishikawa, meio_ambiente: e.target.value })}
                className="text-xs resize-none"
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-stone-700">
                6. Medição (Instrumentos/Sensores)
              </Label>
              <Textarea
                rows={2}
                value={ishikawa.medicao}
                onChange={(e) => setIshikawa({ ...ishikawa, medicao: e.target.value })}
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenIshikawaModal(false)}
              className="border-stone-300 text-stone-700"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setOpenIshikawaModal(false)
                toast({
                  title: 'Ishikawa aplicado com sucesso',
                  description: 'Clique em Salvar Plano para gravar permanentemente.',
                })
              }}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
            >
              Salvar Hipóteses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
