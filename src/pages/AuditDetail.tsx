import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Save,
  UserCheck,
  ArrowRight,
  ClipboardList,
  UploadCloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getAuditById,
  updateAudit,
  getNonConformities,
  createNonConformity,
} from '@/services/agroService'
import type { Audit, NonConformity, AuditConclusion } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [audit, setAudit] = useState<Audit | null>(null)
  const [linkedNCs, setLinkedNCs] = useState<NonConformity[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<
    'planejamento' | 'execucao' | 'ncs' | 'acoes' | 'conclusao'
  >('execucao')

  // Form states mirroring TF-Autocontroles Módulo I (itens 1-47)
  const [checklist, setChecklist] = useState<any>({
    planejamento: {
      item48_programa_documentado: true,
      item49_equipe_qualificada: true,
      auditoria_conforme_cronograma: true,
      registros_data_hora_coletados: true,
    },
    itens: {},
  })

  const [conclusaoForm, setConclusaoForm] = useState<{
    conclusao: AuditConclusion
    relatorio_achados: string
    dec1: boolean
    dec2: boolean
    dec3: boolean
    rt_nome: string
    rt_doc: string
    auditor_nome: string
    auditor_doc: string
  }>({
    conclusao: 'Conforme com Ressalvas',
    relatorio_achados: '',
    dec1: true,
    dec2: true,
    dec3: false,
    rt_nome: 'Hélio Silva',
    rt_doc: 'CRMV-SP 18.420',
    auditor_nome: 'Hélio Silva',
    auditor_doc: 'Auditor Líder Certificado',
  })

  const [saving, setSaving] = useState(false)

  // Grouped official items from TF-Autocontroles Módulo I (itens 1-47)
  const tfSections = [
    {
      code: 'A',
      title: 'A. DOCUMENTAÇÃO E REGISTRO',
      itens: [
        {
          num: '1',
          desc: 'Estabelecimento opera em atividades/categorias autorizadas no certificado de registro.',
        },
        {
          num: '2',
          desc: 'Dispõe de responsável técnico (cite nome e inscrição no Conselho profissional).',
        },
        { num: '3', desc: 'Planos de ação anteriores a essa fiscalização foram cumpridos (RR).' },
        {
          num: '4',
          desc: 'A empresa fornece os dados de fabricação, importação, exportação e comercialização no SipeAgro.',
        },
        {
          num: '5',
          desc: 'A formulação aprovada ou composição declarada na rotulagem guarda correlação com registros de fabricação (RR).',
        },
        {
          num: '6',
          desc: 'Os produtos acabados atendem à legislação vigente quanto a registro, rotulagem e propaganda (RR).',
        },
        {
          num: '7',
          desc: 'Ampliação ou remodelação de dependências foram aprovadas previamente pelo serviço oficial.',
        },
        { num: '8', desc: 'Comunicou alterações de elementos informativos e documentais.' },
      ],
    },
    {
      code: 'B',
      title: 'B. CONDIÇÕES GERAIS DA ÁREA EXTERNA',
      itens: [
        {
          num: '9',
          desc: 'As condições externas da indústria atendem aos critérios de Boas Práticas de Fabricação.',
        },
      ],
    },
    {
      code: 'C',
      title: 'C. CONDIÇÕES GERAIS DA ÁREA INTERNA',
      itens: [
        {
          num: '10',
          desc: 'Estruturas e materiais utilizados nas áreas internas e fluxos são condizentes com as BPF.',
        },
        {
          num: '11',
          desc: 'Áreas, locais e estruturas são compatíveis com volume de produção e armazenamento exigidos.',
        },
        {
          num: '12',
          desc: 'Equipamentos da linha de produção são compatíveis e em número adequado à atividade.',
        },
      ],
    },
    {
      code: 'D',
      title: 'D. TREINAMENTOS',
      itens: [
        {
          num: '13',
          desc: 'Existe programa de treinamento relativo à higiene pessoal e aspectos higiênico-sanitários com eficácia comprovada.',
        },
      ],
    },
    {
      code: 'E',
      title: 'E. CONTROLE DO PROCESSO PRODUTIVO',
      itens: [
        {
          num: '14',
          desc: 'O monitoramento dos parâmetros de processo é feito dentro da frequência prevista e capaz de identificar falhas (RR).',
        },
        {
          num: '15',
          desc: 'Ingredientes ou aditivos de matérias-primas brutas são monitorados por meio de análises laboratoriais (RR).',
        },
        {
          num: '16',
          desc: 'A verificação da eficiência do misturador é feita por meio de testes de homogeneidade de mistura (RR).',
        },
        {
          num: '17',
          desc: 'Realiza o controle do processo produtivo por análises laboratoriais para avaliação da conformidade (RR).',
        },
      ],
    },
    {
      code: 'F',
      title: 'F. AVALIAÇÃO DOS ELEMENTOS DE CONTROLE (POPs 1-9)',
      itens: [
        {
          num: '18',
          desc: 'Dispõe de programa de autocontrole estruturado em manuais e procedimentos escritos (POPs).',
        },
        {
          num: '19',
          desc: 'POP-001 define critérios e procedimentos para qualificação de fornecedores e autocorreção (RR).',
        },
        {
          num: '20',
          desc: 'POP-001 define parâmetros para recebimento de matérias-primas e embalagens (RR).',
        },
        {
          num: '21',
          desc: 'Matérias-primas e ingredientes estão rigorosamente dentro do prazo de validade (RR).',
        },
        {
          num: '22',
          desc: 'Adquire e utiliza apenas produtos permitidos por legislação conforme espécie animal atendida (RR).',
        },
        {
          num: '23',
          desc: 'POP-002 relaciona todas as áreas, instalações, equipamentos e utensílios para higienização.',
        },
        {
          num: '24',
          desc: 'Critérios, frequências e procedimentos de limpeza/higienização são atendidos na prática (RR).',
        },
        {
          num: '25',
          desc: 'POP-003 especifica condutas de higiene pessoal, uniformes e saúde ocupacional.',
        },
        {
          num: '26',
          desc: 'POP-004 descreve todas as etapas desde a captação até o destino da água utilizada.',
        },
        {
          num: '27',
          desc: 'POP-004 especifica padrão de potabilidade da água conforme Portaria GM/MS 888/2021.',
        },
        {
          num: '28',
          desc: 'POP-004 especifica procedimentos de limpeza e higienização semestral de reservatórios.',
        },
        {
          num: '29',
          desc: 'POP-005 identifica perigos em cada etapa e estabelece medidas preventivas de contaminação cruzada.',
        },
        {
          num: '30',
          desc: 'Análise laboratorial é capaz de detectar perigos relacionados a resíduos e contaminantes (RR).',
        },
        {
          num: '31',
          desc: 'Caso utilize sequenciamento de produção, descreve os critérios determinantes da sequência (RR).',
        },
        {
          num: '32',
          desc: 'Registros de produção permitem comprovar o sequenciamento real executado na fábrica (RR).',
        },
        {
          num: '33',
          desc: 'Caso a limpeza de linha (arraste/flushing) seja empregada, o procedimento foi validado (RR).',
        },
        {
          num: '34',
          desc: 'O procedimento validado de limpeza de linha é rigorosamente respeitado nas bateladas.',
        },
        {
          num: '35',
          desc: 'Registros permitem determinar a destinação segura do resíduo de arraste/flushing.',
        },
        {
          num: '36',
          desc: 'Em caso de reprocessamento do arraste, este é seguro e possui rastreabilidade documentada.',
        },
        {
          num: '37',
          desc: 'POP-006 relaciona todas as balanças e equipamentos sujeitos a manutenção e calibração.',
        },
        {
          num: '38',
          desc: 'Critérios e frequências de calibração metrológica (RBC) de instrumentos são atendidos (RR).',
        },
        {
          num: '39',
          desc: 'POP-007 especifica controle integrado de pragas com armadilhas monitoradas (RR).',
        },
        {
          num: '40',
          desc: 'POP-008 especifica controle de resíduos sólidos e destinação adequada de efluentes industriais.',
        },
        {
          num: '41',
          desc: 'Foi possível realizar teste de rastreabilidade completa do produto acabado em até 4 horas (RR).',
        },
        {
          num: '42',
          desc: 'Mantém registros e tratamento formal a reclamações de clientes/consumidores.',
        },
      ],
    },
    {
      code: 'G',
      title: 'G. OUTRAS CONSTATAÇÕES & CONFORMIDADE LEGAL',
      itens: [
        {
          num: '43',
          desc: 'Omitiu ou declarou informações falsas, fraudou ou simulou a legalidade de documentos (RR).',
        },
        {
          num: '44',
          desc: 'Impediu ou causou embaraço aos trabalhos de auditoria e fiscalização (RR).',
        },
        { num: '45', desc: 'Descumpriu medida de suspensão cautelar determinada pelo MAPA (RR).' },
        {
          num: '46',
          desc: 'Subtraiu, substituiu ou comercializou produtos apreendidos cautelarmente (RR).',
        },
        {
          num: '47',
          desc: 'Se fabrica produto com medicamentos ou premixes medicamentosos, possui autorização vigente.',
        },
      ],
    },
  ]

  const loadAll = async () => {
    if (!id) return
    try {
      const a = await getAuditById(id)
      setAudit(a)

      if (a.checklist) {
        setChecklist((prev: any) => ({
          ...prev,
          ...a.checklist,
          planejamento: {
            ...prev.planejamento,
            ...(a.checklist.planejamento || {}),
          },
          itens: {
            ...prev.itens,
            ...(a.checklist.itens || {}),
          },
        }))
      }

      if (a.conclusao) {
        setConclusaoForm((prev) => ({
          ...prev,
          conclusao: a.conclusao || 'Conforme com Ressalvas',
          relatorio_achados: a.relatorio_achados || '',
        }))
      }

      if (a.assinaturas) {
        setConclusaoForm((prev) => ({
          ...prev,
          rt_nome: a.assinaturas.responsavel_estabelecimento || prev.rt_nome,
          auditor_nome: a.assinaturas.auditor || prev.auditor_nome,
        }))
      }

      // Linked NCs
      const ncs = await getNonConformities(`audit = '${id}'`)
      setLinkedNCs(ncs)
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar auditoria',
        description: err.message,
        variant: 'destructive',
      })
      navigate('/auditorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [id])

  useRealtime('audits', () => loadAll())
  useRealtime('non_conformities', () => {
    if (id)
      getNonConformities(`audit = '${id}'`)
        .then(setLinkedNCs)
        .catch(() => {})
  })

  const handleItemStatusChange = async (num: string, status: 'C' | 'NC' | 'NA', desc: string) => {
    const updatedItens = {
      ...(checklist.itens || {}),
      [num]: {
        ...(checklist.itens?.[num] || {}),
        status,
        evidencia: checklist.itens?.[num]?.evidencia || '',
      },
    }

    const newChecklist = { ...checklist, itens: updatedItens }
    setChecklist(newChecklist)

    // If marked NC, create or prefill linked NC automatically
    if (status === 'NC') {
      const existing = linkedNCs.find((n) => n.descricao.includes(`Item ${num}`))
      if (!existing && id) {
        try {
          const newNC = await createNonConformity({
            codigo: '', // Auto-generate NC-xxx
            descricao: `Não conformidade constatada no Item ${num} do TF-Autocontroles: ${desc}`,
            classificacao: num === '21' || num === '38' || num === '41' ? 'Crítica' : 'Maior',
            origem: 'Auditoria',
            area: audit?.area_processo || 'Produção',
            data_identificacao: new Date().toISOString(),
            prazo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'Aberta',
            responsavel: audit?.auditor || 'Auditor Líder',
            audit: id,
          })
          setLinkedNCs((prev) => [...prev, newNC])
          toast({
            title: `Não Conformidade vinculada ao Item ${num}`,
            description: `Código ${newNC.codigo || 'NC'} registrado automaticamente.`,
          })
        } catch (err: any) {
          console.error(err)
        }
      }
    }
  }

  const handleEvidenceChange = (num: string, text: string) => {
    setChecklist({
      ...checklist,
      itens: {
        ...(checklist.itens || {}),
        [num]: {
          ...(checklist.itens?.[num] || {}),
          evidencia: text,
        },
      },
    })
  }

  const handleSaveAudit = async (conclude = false) => {
    if (!id || !audit) return
    setSaving(true)
    try {
      const payload: Partial<Audit> = {
        checklist,
        conclusao: conclusaoForm.conclusao,
        relatorio_achados: conclusaoForm.relatorio_achados,
        status: conclude ? 'Concluída' : 'Em Andamento',
        assinaturas: {
          responsavel_estabelecimento: `${conclusaoForm.rt_nome} (${conclusaoForm.rt_doc})`,
          auditor: `${conclusaoForm.auditor_nome} (${conclusaoForm.auditor_doc})`,
        },
      }

      const updated = await updateAudit(id, payload)
      setAudit(updated)
      toast({
        title: conclude ? 'Auditoria Concluída com Sucesso!' : 'Auditoria Salva',
        description: `Status atual: ${updated.status}`,
      })
      if (conclude) {
        setActiveStep('conclusao')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar auditoria',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !audit) {
    return <div className="py-12 text-center text-xs text-stone-500">Carregando auditoria...</div>
  }

  const steps = [
    { key: 'planejamento', label: '1. Planejamento' },
    { key: 'execucao', label: '2. Execução (Itens 1-47)' },
    { key: 'ncs', label: `3. Não Conformidades (${linkedNCs.length})` },
    { key: 'acoes', label: '4. Ações Corretivas' },
    { key: 'conclusao', label: '5. Conclusão & Assinaturas' },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Stepper */}
      <div className="space-y-3">
        <nav className="flex items-center text-xs text-stone-500 gap-1.5 no-print">
          <Link to="/auditorias" className="hover:text-[#2D6A4F] transition">
            Auditorias
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-stone-800">{audit.codigo}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#2D6A4F] px-2.5 py-0.5 rounded-full">
                {audit.codigo}
              </span>
              <Badge variant="outline" className="border-amber-300 text-[#1B4332] bg-amber-50">
                {audit.tipo || 'Interna'}
              </Badge>
              <Badge
                className={
                  audit.status === 'Concluída'
                    ? 'bg-[#2E8B57] text-white'
                    : audit.status === 'Em Andamento'
                      ? 'bg-[#D9A404] text-[#1B4332]'
                      : 'bg-stone-300 text-stone-700'
                }
              >
                {audit.status}
              </Badge>
              <span className="text-xs text-stone-500 ml-1">
                Data: {audit.data ? new Date(audit.data).toLocaleDateString('pt-BR') : 'Hoje'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
              TF-Autocontroles MAPA: {audit.area_processo || 'Geral BPF'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            <Button
              size="sm"
              onClick={() => handleSaveAudit(false)}
              disabled={saving}
              variant="outline"
              className="border-[#2D6A4F] text-[#2D6A4F] text-xs gap-1.5"
            >
              <Save className="h-4 w-4" />
              Salvar Progresso
            </Button>

            <Button
              size="sm"
              onClick={() => handleSaveAudit(true)}
              disabled={saving}
              className="bg-[#2E8B57] hover:bg-[#236e44] text-white font-semibold text-xs gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Concluir Auditoria
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-stone-300 text-stone-700 text-xs gap-1.5"
            >
              <Printer className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* Stepper Horizontal */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-white p-2.5 rounded-xl border border-[#E2DCCF] no-print">
          {steps.map((st) => (
            <button
              key={st.key}
              onClick={() => setActiveStep(st.key as any)}
              className={`p-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 text-center ${
                activeStep === st.key
                  ? 'bg-[#D9A404] text-[#1B4332] shadow-xs'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
            >
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. SECTION CONTENT */}

      {/* STEP 1: PLANEJAMENTO (SEÇÃO A / ITENS 48-49) */}
      {activeStep === 'planejamento' && (
        <div className="agro-card p-6 space-y-6">
          <div className="border-b border-[#E2DCCF] pb-4">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
              Seção A: Planejamento e Estrutura da Auditoria Interna
            </h2>
            <p className="text-xs text-stone-600">
              Verificação dos requisitos mandatórios conforme Módulo VII (Itens 48 a 51).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-3">
              <span className="text-xs font-bold text-[#2D6A4F] block">
                Dados Gerais do Agendamento
              </span>
              <div className="text-xs space-y-1.5 text-stone-700">
                <p>
                  <strong>Auditor Líder:</strong> {audit.auditor}
                </p>
                <p>
                  <strong>Área / Escopo:</strong> {audit.area_processo}
                </p>
                <p>
                  <strong>Tipo:</strong> {audit.tipo}
                </p>
                <p>
                  <strong>Data Prevista:</strong>{' '}
                  {audit.data ? new Date(audit.data).toLocaleDateString('pt-BR') : 'Em andamento'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-3">
              <span className="text-xs font-bold text-[#2D6A4F] block">
                Verificação de Conformidade Inicial
              </span>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                  <Checkbox
                    checked={checklist.planejamento?.item48_programa_documentado ?? true}
                    onCheckedChange={(val) =>
                      setChecklist({
                        ...checklist,
                        planejamento: {
                          ...checklist.planejamento,
                          item48_programa_documentado: !!val,
                        },
                      })
                    }
                  />
                  <span>
                    <strong>Item 48:</strong> Programa de auditoria interna documentado e aprovado.
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                  <Checkbox
                    checked={checklist.planejamento?.item49_equipe_qualificada ?? true}
                    onCheckedChange={(val) =>
                      setChecklist({
                        ...checklist,
                        planejamento: {
                          ...checklist.planejamento,
                          item49_equipe_qualificada: !!val,
                        },
                      })
                    }
                  />
                  <span>
                    <strong>Item 49:</strong> Equipe de auditoria qualificada e independente da
                    área.
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-stone-800">
                  <Checkbox
                    checked={checklist.planejamento?.auditoria_conforme_cronograma ?? true}
                    onCheckedChange={(val) =>
                      setChecklist({
                        ...checklist,
                        planejamento: {
                          ...checklist.planejamento,
                          auditoria_conforme_cronograma: !!val,
                        },
                      })
                    }
                  />
                  <span>
                    <strong>Item 51:</strong> Auditoria realizada conforme cronograma anual
                    previsto.
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setActiveStep('execucao')}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5"
            >
              Ir para Execução do Checklist <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: EXECUÇÃO (ITENS 1 A 47 DO TF-AUTOCONTROLES) */}
      {activeStep === 'execucao' && (
        <div className="agro-card p-6 space-y-6">
          <div className="border-b border-[#E2DCCF] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
                Seção B: Execução do Termo de Fiscalização de Autocontroles (Itens 1 a 47)
              </h2>
              <p className="text-xs text-stone-600">
                Avaliação de cada item oficial com C (Conforme), NC (Não Conforme) ou NA (Não
                Aplicável) e evidências.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => handleSaveAudit(false)}
              className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5"
            >
              <Save className="h-4 w-4" /> Salvar Respostas
            </Button>
          </div>

          <div className="space-y-6">
            {tfSections.map((sec) => (
              <div
                key={sec.code}
                className="border border-[#E2DCCF] rounded-xl overflow-hidden bg-white"
              >
                <div className="bg-[#2D6A4F] text-white px-4 py-2.5 font-bold text-xs uppercase tracking-wide flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className="text-[11px] font-normal text-emerald-200">
                    {sec.itens.length} requisitos
                  </span>
                </div>

                <div className="divide-y divide-[#E2DCCF]">
                  {sec.itens.map((item) => {
                    const currentStatus = checklist.itens?.[item.num]?.status || 'C'
                    const currentEvidencia = checklist.itens?.[item.num]?.evidencia || ''

                    return (
                      <div
                        key={item.num}
                        className={`p-3.5 transition flex flex-col md:flex-row gap-3 items-start md:items-center justify-between ${
                          currentStatus === 'NC' ? 'bg-red-50/70' : 'hover:bg-[#FAF7EF]'
                        }`}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2D6A4F] text-xs">
                              Item {item.num}.
                            </span>
                            <p className="text-xs font-semibold text-stone-800">{item.desc}</p>
                          </div>

                          <div className="pt-1">
                            <Input
                              value={currentEvidencia}
                              onChange={(e) => handleEvidenceChange(item.num, e.target.value)}
                              placeholder="Descreva a evidência objetiva (documento, foto, lote, registro)..."
                              className="h-7 text-[11px] bg-white border-stone-300"
                            />
                          </div>
                        </div>

                        {/* Status Select Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleItemStatusChange(item.num, 'C', item.desc)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                              currentStatus === 'C'
                                ? 'bg-[#2E8B57] text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            C
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemStatusChange(item.num, 'NC', item.desc)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                              currentStatus === 'NC'
                                ? 'bg-[#B91C1C] text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            NC
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemStatusChange(item.num, 'NA', item.desc)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                              currentStatus === 'NA'
                                ? 'bg-stone-600 text-white shadow-xs'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            NA
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: NÃO CONFORMIDADES (SEÇÃO C) */}
      {activeStep === 'ncs' && (
        <div className="agro-card p-6 space-y-6">
          <div className="border-b border-[#E2DCCF] pb-4">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
              Seção C: Não Conformidades Identificadas na Auditoria
            </h2>
            <p className="text-xs text-stone-600">
              Registros automáticos derivados dos itens avaliados como NC durante o checklist.
            </p>
          </div>

          <div className="space-y-3">
            {linkedNCs.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
                Nenhuma não conformidade identificada nesta auditoria até o momento.
              </div>
            ) : (
              linkedNCs.map((nc) => (
                <div
                  key={nc.id}
                  onClick={() => navigate(`/nao-conformidades/${nc.id}`)}
                  className="p-4 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="space-y-1 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#B91C1C] text-xs">{nc.codigo}</span>
                      <Badge
                        variant="outline"
                        className={
                          nc.classificacao === 'Crítica'
                            ? 'bg-red-100 text-[#B91C1C] border-red-300'
                            : 'bg-amber-100 text-[#D9A404] border-amber-300'
                        }
                      >
                        {nc.classificacao}
                      </Badge>
                      <Badge className="bg-[#B91C1C] text-white text-[10px]">{nc.status}</Badge>
                    </div>
                    <p className="text-xs font-semibold text-stone-800">{nc.descricao}</p>
                    <span className="text-[11px] text-stone-500">
                      Prazo regulatório de correção:{' '}
                      {new Date(nc.prazo || '').toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <Button variant="ghost" size="sm" className="text-[#2D6A4F] text-xs gap-1">
                    Abrir Plano <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 4: AÇÕES CORRETIVAS (SEÇÃO D) */}
      {activeStep === 'acoes' && (
        <div className="agro-card p-6 space-y-6">
          <div className="border-b border-[#E2DCCF] pb-4">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
              Seção D: Ações Corretivas e Verificação de Eficácia (Módulo VII)
            </h2>
            <p className="text-xs text-stone-600">
              Acompanhamento de planos de ação, causas raiz e verificação após no mínimo 30 dias.
            </p>
          </div>

          <div className="space-y-4">
            {linkedNCs.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-500 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF]">
                Não há ações corretivas pendentes para esta auditoria.
              </div>
            ) : (
              linkedNCs.map((nc) => (
                <div
                  key={nc.id}
                  className="p-4 rounded-xl border border-[#E2DCCF] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#2D6A4F]">
                      {nc.codigo}: {nc.descricao}
                    </span>
                    <Badge variant="outline">{nc.classificacao}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#FAF7EF] p-3 rounded-lg">
                    <div>
                      <strong className="text-stone-700 block">Ação Corretiva:</strong>
                      <span className="text-stone-600">
                        {nc.plano_acao || 'Aguardando preenchimento do plano'}
                      </span>
                    </div>
                    <div>
                      <strong className="text-stone-700 block">Responsável & Prazo:</strong>
                      <span className="text-stone-600">
                        {nc.responsavel_acao || nc.responsavel || 'Roberto Lima'} (
                        {nc.prazo_acao
                          ? new Date(nc.prazo_acao).toLocaleDateString('pt-BR')
                          : '30 dias'}
                        )
                      </span>
                    </div>
                    <div>
                      <strong className="text-stone-700 block">Eficácia (Mín. 30 dias):</strong>
                      <span
                        className={`font-semibold ${
                          nc.eficaz === 'Eficaz' ? 'text-[#2E8B57]' : 'text-stone-500'
                        }`}
                      >
                        {nc.eficaz || 'Pendente de verificação'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/nao-conformidades/${nc.id}`)}
                      className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] text-xs font-semibold gap-1"
                    >
                      Preencher Análise de Causa Raiz / 5 Porquês <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 5: CONCLUSÃO (SEÇÃO E / MÓDULO I) */}
      {activeStep === 'conclusao' && (
        <div className="agro-card p-6 space-y-6">
          <div className="border-b border-[#E2DCCF] pb-4">
            <h2 className="text-base font-bold font-['Sora'] text-[#2D6A4F]">
              Seção E: Conclusão sobre Boas Práticas e Elementos de Controle
            </h2>
            <p className="text-xs text-stone-600">
              Parecer conclusivo oficial do auditor e formalização das assinaturas.
            </p>
          </div>

          <div className="space-y-4">
            {/* 3 Radio options from MAPA form */}
            <div className="p-4 rounded-xl border border-[#E2DCCF] bg-[#FAF7EF] space-y-3">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                Parecer Conclusivo do Estabelecimento
              </span>

              <RadioGroup
                value={conclusaoForm.conclusao}
                onValueChange={(val: any) => setConclusaoForm({ ...conclusaoForm, conclusao: val })}
                className="space-y-2 text-xs"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Conforme" id="c1" />
                  <Label htmlFor="c1" className="cursor-pointer font-medium text-stone-800">
                    O estabelecimento aplica as Boas Práticas de Fabricação conforme os
                    procedimentos avaliados.
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Conforme com Ressalvas" id="c2" />
                  <Label htmlFor="c2" className="cursor-pointer font-medium text-stone-800">
                    O estabelecimento aplica as Boas Práticas de Fabricação, com as ressalvas
                    apontadas acima.
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Não Conforme" id="c3" />
                  <Label htmlFor="c3" className="cursor-pointer font-medium text-stone-800">
                    O estabelecimento não implementou efetivamente as Boas Práticas de Fabricação de
                    acordo com os apontamentos acima (RR).
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Descrição de Achados */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-stone-700">
                Relatório Sintético de Achados e Observações Finais
              </Label>
              <Textarea
                rows={3}
                value={conclusaoForm.relatorio_achados}
                onChange={(e) =>
                  setConclusaoForm({ ...conclusaoForm, relatorio_achados: e.target.value })
                }
                placeholder="Descreva as constatações gerais da auditoria, prazos de envio de plano ao SIPOA..."
                className="text-xs"
              />
            </div>

            {/* Checkboxes das declarações oficiais */}
            <div className="space-y-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <Checkbox
                  checked={conclusaoForm.dec1}
                  onCheckedChange={(val) => setConclusaoForm({ ...conclusaoForm, dec1: !!val })}
                />
                <span>
                  O estabelecimento tem ciência de que possui 30 dias para enviar plano de ação ao
                  SIPOA com medidas e prazos.
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <Checkbox
                  checked={conclusaoForm.dec2}
                  onCheckedChange={(val) => setConclusaoForm({ ...conclusaoForm, dec2: !!val })}
                />
                <span>
                  O envio do plano e comprovantes será realizado eletronicamente via peticionamento
                  no sistema SEI do MAPA.
                </span>
              </label>
            </div>

            {/* Assinaturas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white space-y-2">
                <span className="text-xs font-bold text-[#2D6A4F] block">
                  Responsável pelo Estabelecimento (RT)
                </span>
                <Input
                  value={conclusaoForm.rt_nome}
                  onChange={(e) => setConclusaoForm({ ...conclusaoForm, rt_nome: e.target.value })}
                  placeholder="Nome do Responsável Técnico"
                  className="h-8 text-xs"
                />
                <Input
                  value={conclusaoForm.rt_doc}
                  onChange={(e) => setConclusaoForm({ ...conclusaoForm, rt_doc: e.target.value })}
                  placeholder="CRMV / CPF"
                  className="h-8 text-xs"
                />
              </div>

              <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white space-y-2">
                <span className="text-xs font-bold text-[#2D6A4F] block">
                  Auditor Fiscal / Auditor Líder
                </span>
                <Input
                  value={conclusaoForm.auditor_nome}
                  onChange={(e) =>
                    setConclusaoForm({ ...conclusaoForm, auditor_nome: e.target.value })
                  }
                  placeholder="Nome do Auditor Líder"
                  className="h-8 text-xs"
                />
                <Input
                  value={conclusaoForm.auditor_doc}
                  onChange={(e) =>
                    setConclusaoForm({ ...conclusaoForm, auditor_doc: e.target.value })
                  }
                  placeholder="Registro / Carteira Fiscal"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => handleSaveAudit(true)}
                disabled={saving}
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs gap-1.5 shadow-md"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Gravando...' : 'Salvar Conclusão e Formalizar Auditoria'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
