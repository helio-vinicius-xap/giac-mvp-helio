import React, { useState, useEffect } from 'react'
import {
  FolderTree,
  Folder,
  FolderOpen,
  FileText,
  UploadCloud,
  Search,
  Download,
  Plus,
  FileCheck2,
  BookOpen,
  Shield,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDocuments, createDocument } from '@/services/agroService'
import type { DocumentItem } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function Documents() {
  const { toast } = useToast()

  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Expanded folders in tree
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'plano-appcc': true,
    'manual-bpf': true,
    pops: true,
    registros: false,
    acoes: false,
    verificacao: false,
  })

  // Modal: Novo Documento
  const [openUploadModal, setOpenUploadModal] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [targetCategory, setTargetCategory] = useState<string>('Plano APPCC')
  const [docName, setDocName] = useState('')
  const [refPop, setRefPop] = useState('POP-001')

  const loadData = async () => {
    try {
      const data = await getDocuments()
      setDocuments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('documents', () => loadData())

  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }))
  }

  const handleOpenUploadForCategory = (cat: string) => {
    setTargetCategory(cat)
    setDocName('')
    setOpenUploadModal(true)
  }

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploadLoading(true)
    try {
      await createDocument({
        nome: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
        categoria: targetCategory as any,
        referencia_pop: refPop,
      })

      toast({
        title: 'Documento Adicionado',
        description: 'Arquivo catalogado com sucesso no repositório.',
      })
      setOpenUploadModal(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao catalogar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setUploadLoading(false)
    }
  }

  // Structured Repository Categories matching Módulo VII
  const treeNodes = [
    {
      key: 'plano-appcc',
      title: 'Plano APPCC Formal (Alimentação Animal)',
      categoria: 'Plano APPCC',
      description:
        'Fluxogramas de processo, Matriz de perigos, Árvore de decisão e Limites críticos.',
      subitems: [
        'Fluxograma de Processo Fabril - Moagem a Ensaque.pdf',
        'Matriz de Análise de Perigos e Pontos Críticos.pdf',
        'Árvore Decisória de Seleção de PCCs.pdf',
        'Validação Científica dos Limites Críticos Térmicos.pdf',
      ],
    },
    {
      key: 'manual-bpf',
      title: 'Manual de Boas Práticas de Fabricação - BPF (IN 04/2007)',
      categoria: 'Manual BPF',
      description: 'Estrutura predial, organograma, atribuições técnicas e políticas de qualidade.',
      subitems: [
        'Manual de Boas Práticas de Fabricação Integrado - Revisão 2025.pdf',
        'Memorial Descritivo de Instalações e Equipamentos.pdf',
        'Organograma e Responsabilidades Técnicas (CRMV).pdf',
      ],
    },
    {
      key: 'pops',
      title: 'Auto Controles Oficiais (Auto Controles 01 a 09)',
      categoria: 'POP',
      description:
        'Os 9 programas de autocontrole obrigatórios da alimentação animal rigorosamente documentados.',
      subitems: [
        'Auto Controle 01 – Qualificação de Fornecedores e Matérias-Primas.pdf',
        'Auto Controle 02 – Limpeza e Higienização de Linhas e Equipamentos.pdf',
        'Auto Controle 03 – Higiene e Saúde do Pessoal Operacional.pdf',
        'Auto Controle 04 – Potabilidade da Água e Higienização de Reservatórios.pdf',
        'Auto Controle 05 – Prevenção de Contaminação Cruzada e Sequenciamento.pdf',
        'Auto Controle 06 – Manutenção Preventiva e Calibração Metrológica.pdf',
        'Auto Controle 07 – Controle Integrado de Pragas e Vetores Urbanos.pdf',
        'Auto Controle 08 – Controle de Resíduos Sólidos e Efluentes.pdf',
        'Auto Controle 09 – Rastreabilidade e Procedimento de Recolhimento (Recall).pdf',
      ],
    },
    {
      key: 'registros',
      title: 'Registros de Monitoramento de Campo',
      categoria: 'Registro',
      description: 'Checklists diários agrupados por procedimento operacional e PCC.',
      subitems: [
        'Registros Consolidados de Higienização de Linha (Auto Controle 02).pdf',
        'Registros Contínuos de Tratamento Térmico (Auto Controle 05).pdf',
        'Planilhas Mensais de Cloração e Potabilidade da Água (Auto Controle 04).pdf',
      ],
    },
    {
      key: 'acoes',
      title: 'Registros de Ações Corretivas e Desvios',
      categoria: 'Ação Corretiva',
      description: 'Planos de ação, investigações de causa raiz (5 Porquês) e Ishikawa.',
      subitems: [
        'Dossiê de Calibração Balança de Micronutrientes (NC-001).pdf',
        'Relatório de Bloqueio e Segregação Preventiva de Lote.pdf',
      ],
    },
    {
      key: 'verificacao',
      title: 'Registros de Verificação e Auditorias',
      categoria: 'Verificação',
      description: 'TF-Autocontroles MAPA, auditorias internas, calibrações e laudos externos.',
      subitems: [
        'Termo de Fiscalização TF-Autocontroles Módulo I e VII AUD-001.pdf',
        'Certificados RBC de Aferição de Balanças e Termômetros.pdf',
        'Laudos Físico-Químicos e Microbiológicos Oficiais (MAPA).pdf',
      ],
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Repositório Central de Documentos do Autocontrole
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Estrutura hierárquica completa em conformidade com o Artigo 8º da IN 04/2007 (Guarda
            mínima de 2 anos)
          </p>
        </div>

        <Button
          onClick={() => handleOpenUploadForCategory('Plano APPCC')}
          className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
        >
          <UploadCloud className="h-4 w-4" />
          Catalogar Novo Documento
        </Button>
      </div>

      {/* 2. Global Search */}
      <div className="agro-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar documento por título ou palavra-chave em todo o repositório..."
            className="pl-9 h-9 text-xs border-[#E2DCCF]"
          />
        </div>
      </div>

      {/* 3. Hierarchical Tree View */}
      <div className="space-y-4">
        {treeNodes.map((node) => {
          const isExpanded = expandedNodes[node.key] || Boolean(searchTerm)
          const customDocs = documents.filter((d) => d.categoria === node.categoria)

          // Combine predefined and uploaded docs
          const allItems = [
            ...node.subitems.map((name) => ({ name, size: '1.2 MB', date: '15/01/2025' })),
            ...customDocs.map((d) => ({
              name: d.nome,
              size: '950 KB',
              date: new Date(d.created).toLocaleDateString('pt-BR'),
            })),
          ].filter((item) =>
            !searchTerm ? true : item.name.toLowerCase().includes(searchTerm.toLowerCase()),
          )

          if (searchTerm && allItems.length === 0) return null

          return (
            <div key={node.key} className="agro-card overflow-hidden transition-all duration-200">
              {/* Folder Header */}
              <div
                onClick={() => toggleNode(node.key)}
                className="p-4 bg-white hover:bg-[#FAF7EF] cursor-pointer flex items-center justify-between transition border-b border-[#E2DCCF]"
              >
                <div className="flex items-center gap-3">
                  <div className="text-[#2D6A4F]">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-[#2D6A4F] flex items-center justify-center">
                    {isExpanded ? (
                      <FolderOpen className="h-5 w-5" />
                    ) : (
                      <Folder className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-['Sora'] text-[#2D6A4F]">{node.title}</h3>
                    <p className="text-[11px] text-[#6B6B6B]">{node.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-[11px] border-emerald-300 text-[#2D6A4F]"
                  >
                    {allItems.length} documento(s)
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenUploadForCategory(node.categoria)
                    }}
                    className="text-[#2D6A4F] text-xs h-7 px-2 hover:bg-[#2D6A4F]/10 gap-1"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </Button>
                </div>
              </div>

              {/* Subitems List */}
              {isExpanded && (
                <div className="p-3 bg-[#FAF7EF]/40 divide-y divide-[#E2DCCF]/60">
                  {allItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 hover:bg-white rounded-lg transition flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-[#2D6A4F] shrink-0" />
                        <div>
                          <span className="font-semibold text-stone-800 group-hover:text-[#2D6A4F] transition">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-stone-400 block">
                            Formato PDF • {item.size} • Atualizado em {item.date}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast({
                            title: 'Download de Documento',
                            description: `Iniciando download de: ${item.name}`,
                          })
                        }
                        className="text-stone-500 hover:text-[#2D6A4F] h-7 px-2 text-xs gap-1"
                      >
                        <Download className="h-3.5 w-3.5" /> Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* MODAL: CATALOGAR DOCUMENTO */}
      <Dialog open={openUploadModal} onOpenChange={setOpenUploadModal}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#D9A404]" />
              Catalogar Documento no Repositório
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Inclusão de arquivo em pasta temática do plano de autocontrole.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDocument} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Categoria do Repositório
              </Label>
              <Select value={targetCategory} onValueChange={setTargetCategory}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plano APPCC">Plano APPCC</SelectItem>
                  <SelectItem value="Manual BPF">Manual BPF</SelectItem>
                  <SelectItem value="POP">Auto Controle</SelectItem>
                  <SelectItem value="Registro">Registro de Monitoramento</SelectItem>
                  <SelectItem value="Ação Corretiva">Ação Corretiva</SelectItem>
                  <SelectItem value="Verificação">Verificação & Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Nome do Documento</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Ex: Laudo_Analise_Aflatoxina_Lote_42.pdf"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">
                Referência ao Auto Controle
              </Label>
              <Select value={refPop} onValueChange={setRefPop}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POP-001">
                    Auto Controle 01 – Qualificação de Fornecedores
                  </SelectItem>
                  <SelectItem value="POP-002">Auto Controle 02 – Limpeza e Higienização</SelectItem>
                  <SelectItem value="POP-003">
                    Auto Controle 03 – Higiene e Saúde do Pessoal
                  </SelectItem>
                  <SelectItem value="POP-004">Auto Controle 04 – Potabilidade da Água</SelectItem>
                  <SelectItem value="POP-005">Auto Controle 05 – Contaminação Cruzada</SelectItem>
                  <SelectItem value="POP-006">
                    Auto Controle 06 – Manutenção e Calibração
                  </SelectItem>
                  <SelectItem value="POP-007">Auto Controle 07 – Controle de Pragas</SelectItem>
                  <SelectItem value="POP-008">Auto Controle 08 – Controle de Resíduos</SelectItem>
                  <SelectItem value="POP-009">
                    Auto Controle 09 – Rastreabilidade e Recolhimento
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] text-xs text-stone-600">
              <span className="font-bold text-[#2D6A4F] block">Armazenamento Seguro:</span>
              Os arquivos anexados são salvos com data de criação e versão imutável para efeitos de
              fiscalização do MAPA.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenUploadModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={uploadLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
              >
                {uploadLoading ? 'Catalogando...' : 'Salvar Documento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
