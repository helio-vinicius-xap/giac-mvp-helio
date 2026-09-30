import React, { useState, useEffect } from 'react'
import {
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Building,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { formatarCNPJ, validarCNPJ } from '@/lib/pop01Validators'
import { normalizarCNPJ, executarCruzamentoSipeagro } from '@/lib/cruzamentoEngine'
import {
  findSipeagroByCnpj,
  salvarQualificacao,
  criarOuAtualizarFornecedor,
  getQualificacoesList,
} from '@/services/paasoService'
import {
  TIPOS_PRODUTO_MAPA,
  type FornecedorItem,
  type SipeagroItem,
  type QualificacaoItem,
  type ResultadoCruzamento,
  type CategoriaSipeagro,
} from '@/types/paaso'

interface QualificacaoViewProps {
  fornecedores: FornecedorItem[]
  estabelecimentosSipeagro: SipeagroItem[]
  fornecedorPreSelecionado?: FornecedorItem | null
  onDataChanged: () => void
}

export function QualificacaoView({
  fornecedores,
  estabelecimentosSipeagro,
  fornecedorPreSelecionado,
  onDataChanged,
}: QualificacaoViewProps) {
  const { toast } = useToast()

  // Histórico de qualificações
  const [historico, setHistorico] = useState<QualificacaoItem[]>([])
  const [loadingHistorico, setLoadingHistorico] = useState(false)

  // Formulário de qualificação
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [registroSipeagro, setRegistroSipeagro] = useState('')
  const [categoriaDeclarada, setCategoriaDeclarada] = useState<CategoriaSipeagro | ''>('fabricante')
  const [tiposDeclarados, setTiposDeclarados] = useState<string[]>([])
  const [uf, setUf] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [contatoNome, setContatoNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataFormulario, setDataFormulario] = useState(new Date().toISOString().split('T')[0])

  // Resultado do cruzamento
  const [processando, setProcessando] = useState(false)
  const [resultadoCruzamento, setResultadoCruzamento] = useState<ResultadoCruzamento | null>(null)
  const [estabelecimentoCorrespondente, setEstabelecimentoCorrespondente] =
    useState<SipeagroItem | null>(null)

  // Carregar histórico
  const carregarHistorico = async () => {
    setLoadingHistorico(true)
    const list = await getQualificacoesList()
    setHistorico(list)
    setLoadingHistorico(false)
  }

  useEffect(() => {
    carregarHistorico()
  }, [])

  // Quando vier fornecedor pré-selecionado (da aba Fornecedores)
  useEffect(() => {
    if (fornecedorPreSelecionado) {
      preencherComFornecedor(fornecedorPreSelecionado)
    }
  }, [fornecedorPreSelecionado])

  const preencherComFornecedor = (f: FornecedorItem) => {
    setCnpj(formatarCNPJ(f.cnpj))
    setRazaoSocial(f.razao_social || '')
    setUf(f.uf || '')
    setMunicipio(f.municipio || '')
    setContatoNome(f.contato_nome || '')
    setEmail(f.email || '')
    setTelefone(f.telefone || '')

    // Se já tiver qualificação vigente, preenche os dados declarados anteriores
    if (f.qualificacao_vigente?.dados_declarados) {
      const dd = f.qualificacao_vigente.dados_declarados
      if (dd.registro_sipeagro) setRegistroSipeagro(dd.registro_sipeagro)
      if (dd.categoria) setCategoriaDeclarada(dd.categoria as CategoriaSipeagro)
      if (dd.tipos_produto) setTiposDeclarados(dd.tipos_produto)
    }

    setResultadoCruzamento(null)
    setEstabelecimentoCorrespondente(null)
  }

  // Preenchimento rápido ao digitar CNPJ
  const handleCnpjBlur = async () => {
    const rawCnpj = normalizarCNPJ(cnpj)
    if (!rawCnpj || rawCnpj.length !== 14) return

    // 1. Procurar nos fornecedores cadastrados
    const fExistente = fornecedores.find((f) => normalizarCNPJ(f.cnpj) === rawCnpj)
    if (fExistente) {
      if (!razaoSocial) setRazaoSocial(fExistente.razao_social)
      if (!uf) setUf(fExistente.uf || '')
      if (!municipio) setMunicipio(fExistente.municipio || '')
      if (!contatoNome) setContatoNome(fExistente.contato_nome || '')
      if (!email) setEmail(fExistente.email || '')
    }

    // 2. Procurar na base SIPEAGRO para auto-ajuda
    const sItem = estabelecimentosSipeagro.find((s) => normalizarCNPJ(s.cnpj) === rawCnpj)
    if (sItem && !razaoSocial) {
      setRazaoSocial(sItem.razao_social)
      if (sItem.registro_sipeagro) setRegistroSipeagro(sItem.registro_sipeagro)
      if (sItem.uf) setUf(sItem.uf)
      if (sItem.municipio) setMunicipio(sItem.municipio)
      if (sItem.categoria) setCategoriaDeclarada(sItem.categoria)
      if (sItem.tipos_produto) setTiposDeclarados(sItem.tipos_produto)
    }
  }

  // Alterna tipo de produto selecionado
  const toggleTipoProduto = (tipo: string) => {
    setTiposDeclarados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
    )
  }

  // Submissão do formulário com cruzamento das 7 verificações
  const handleRodarCruzamento = async (e: React.FormEvent) => {
    e.preventDefault()

    const rawCnpj = normalizarCNPJ(cnpj)
    if (!rawCnpj || rawCnpj.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'Informe um CNPJ com 14 dígitos.',
        variant: 'destructive',
      })
      return
    }

    if (!validarCNPJ(rawCnpj)) {
      toast({
        title: 'CNPJ com dígitos inválidos',
        description: 'Verifique a numeração do CNPJ.',
        variant: 'destructive',
      })
      return
    }

    if (!razaoSocial.trim()) {
      toast({
        title: 'Razão social obrigatória',
        variant: 'destructive',
      })
      return
    }

    setProcessando(true)
    try {
      // 1. Buscar estabelecimento correspondente na base SIPEAGRO
      const estab =
        estabelecimentosSipeagro.find((s) => normalizarCNPJ(s.cnpj) === rawCnpj) ||
        (await findSipeagroByCnpj(rawCnpj))

      setEstabelecimentoCorrespondente(estab || null)

      // 2. Executar as 7 verificações do motor de cruzamento
      const dadosDeclarados = {
        razao_social: razaoSocial.trim(),
        registro_sipeagro: registroSipeagro.trim(),
        categoria: categoriaDeclarada,
        tipos_produto: tiposDeclarados,
        uf: uf.trim().toUpperCase(),
        municipio: municipio.trim(),
        contato_nome: contatoNome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      }

      const cruzamento = executarCruzamentoSipeagro(
        dadosDeclarados,
        rawCnpj,
        estab,
        estabelecimentosSipeagro.length === 0,
        dataFormulario,
      )

      setResultadoCruzamento(cruzamento)

      // 3. Persistir qualificação na base de dados
      await salvarQualificacao({
        fornecedor_cnpj: rawCnpj,
        data_formulario: dataFormulario,
        dados_declarados: dadosDeclarados,
        resultado: cruzamento.resultado,
        score: cruzamento.score,
        divergencias: cruzamento.divergencias,
        validade: cruzamento.validade,
        status_vigencia: cruzamento.status_vigencia,
      })

      // 4. Garantir que o fornecedor está cadastrado
      await criarOuAtualizarFornecedor({
        cnpj: rawCnpj,
        razao_social: razaoSocial.trim(),
        contato_nome: contatoNome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        uf: uf.trim().toUpperCase(),
        municipio: municipio.trim(),
      })

      toast({
        title: `Qualificação concluída: ${cruzamento.resultado.replace(/_/g, ' ')}`,
        description: `Score final: ${cruzamento.score} pontos. Validade até ${new Date(
          cruzamento.validade,
        ).toLocaleDateString('pt-BR')}.`,
      })

      await carregarHistorico()
      onDataChanged()
    } catch (err: any) {
      toast({
        title: 'Erro ao processar qualificação',
        description: err.message || 'Falha ao executar o cruzamento.',
        variant: 'destructive',
      })
    } finally {
      setProcessando(false)
    }
  }

  // Preenche dados do SIPEAGRO automaticamente (atalho útil)
  const handlePuxarDadosSipeagro = () => {
    const rawCnpj = normalizarCNPJ(cnpj)
    const estab = estabelecimentosSipeagro.find((s) => normalizarCNPJ(s.cnpj) === rawCnpj)
    if (!estab) {
      toast({
        title: 'Não localizado no SIPEAGRO',
        description: 'CNPJ não encontrado na base oficial importada.',
        variant: 'destructive',
      })
      return
    }

    setRazaoSocial(estab.razao_social)
    if (estab.registro_sipeagro) setRegistroSipeagro(estab.registro_sipeagro)
    if (estab.uf) setUf(estab.uf)
    if (estab.municipio) setMunicipio(estab.municipio)
    if (estab.categoria) setCategoriaDeclarada(estab.categoria)
    if (estab.tipos_produto) setTiposDeclarados(estab.tipos_produto)

    toast({
      title: 'Dados sincronizados do SIPEAGRO',
      description: 'Campos preenchidos conforme registro oficial do MAPA.',
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Header do Módulo */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F]">
              <FileCheck className="h-5 w-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold font-['Sora'] text-[#1B4332]">
              Formulário de Qualificação & Cruzamento Automático
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Auditoria técnica automática de 7 verificações contra a base oficial do SIPEAGRO/MAPA
            (CNPJ, situação cadastral, similaridade de razão social ≥ 90%, categoria, tipos de
            produtos e localização).
          </p>
        </div>

        {fornecedores.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                const found = fornecedores.find((f) => f.cnpj === e.target.value)
                if (found) preencherComFornecedor(found)
              }}
              className="h-9 text-xs px-2.5 rounded-lg border border-[#E2DCCF] bg-[#FAF7EF] text-stone-800"
              defaultValue=""
            >
              <option value="" disabled>
                Selecionar fornecedor cadastrado...
              </option>
              {fornecedores.map((f) => (
                <option key={f.cnpj} value={f.cnpj}>
                  {f.razao_social} ({formatarCNPJ(f.cnpj)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Formulário de Qualificação (7 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-[#E2DCCF]/60 pb-3">
            <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
              Dados Declarados pelo Fornecedor
            </h3>
            {cnpj && estabelecimentosSipeagro.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePuxarDadosSipeagro}
                className="h-7 text-[11px] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 gap-1 font-semibold"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#D9A404]" />
                Puxar do SIPEAGRO
              </Button>
            )}
          </div>

          <form onSubmit={handleRodarCruzamento} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">CNPJ (Obrigatório)</Label>
                <Input
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  onBlur={handleCnpjBlur}
                  placeholder="00.000.000/0000-00"
                  required
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-stone-400" />
                  Data Formulário
                </Label>
                <Input
                  type="date"
                  value={dataFormulario}
                  onChange={(e) => setDataFormulario(e.target.value)}
                  required
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Razão Social Declarada</Label>
              <Input
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Razão social como declarada pelo fornecedor"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">
                  Registro SIPEAGRO Declarado
                </Label>
                <Input
                  value={registroSipeagro}
                  onChange={(e) => setRegistroSipeagro(e.target.value)}
                  placeholder="Ex: SP-00123-1"
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Categoria Declarada</Label>
                <select
                  value={categoriaDeclarada}
                  onChange={(e) => setCategoriaDeclarada(e.target.value as CategoriaSipeagro)}
                  className="w-full h-9 text-xs px-2.5 rounded-md border border-stone-300 bg-white text-stone-800"
                >
                  <option value="fabricante">Fabricante</option>
                  <option value="fracionador">Fracionador</option>
                  <option value="importador">Importador</option>
                  <option value="armazenador">Armazenador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Município Declarado</Label>
                <Input
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Cidade"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">UF Declarada</Label>
                <Input
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="UF"
                  maxLength={2}
                  className="h-9 text-xs uppercase"
                />
              </div>
            </div>

            {/* Tipos de Produto Declarados (10 tipos fixos) */}
            <div className="space-y-2 pt-1">
              <Label className="text-xs font-semibold text-stone-700 block">
                Tipos de Produto Declarados (insumos fornecidos)
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#FAF7EF] p-3 rounded-xl border border-[#E2DCCF]">
                {TIPOS_PRODUTO_MAPA.map((tipo) => {
                  const isChecked = tiposDeclarados.includes(tipo)
                  return (
                    <label
                      key={tipo}
                      className="flex items-center gap-2 text-xs cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleTipoProduto(tipo)}
                      />
                      <span className="capitalize text-stone-800">{tipo}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Contato opcional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Contato</Label>
                <Input
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  placeholder="Responsável"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">E-mail</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="qualidade@..."
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Telefone</Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(00) 0000-0000"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={processando}
                className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs h-10 gap-2 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 text-[#D9A404]" />
                {processando
                  ? 'Executando 7 verificações...'
                  : 'Executar Cruzamento & Salvar Qualificação'}
              </Button>
            </div>
          </form>
        </div>

        {/* Painel de Resultados do Cruzamento (5 colunas) */}
        <div className="lg:col-span-5 space-y-5">
          {resultadoCruzamento ? (
            <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-[#E2DCCF]/60 pb-3">
                <h3 className="text-sm font-bold font-['Sora'] text-[#1B4332]">
                  Resultado da Qualificação
                </h3>
                <Badge
                  className={
                    resultadoCruzamento.resultado === 'APROVADO'
                      ? 'bg-emerald-700 text-white font-bold'
                      : resultadoCruzamento.resultado === 'APROVADO_COM_RESSALVA'
                        ? 'bg-amber-600 text-white font-bold'
                        : resultadoCruzamento.resultado === 'REPROVADO'
                          ? 'bg-red-700 text-white font-bold'
                          : 'bg-stone-500 text-white font-bold'
                  }
                >
                  {resultadoCruzamento.resultado.replace(/_/g, ' ')}
                </Badge>
              </div>

              {/* Score e Validade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAF7EF] p-3 rounded-xl border border-[#E2DCCF] text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">
                    Score Obtido
                  </span>
                  <span
                    className={`text-2xl font-black font-['Sora'] ${
                      resultadoCruzamento.score >= 80
                        ? 'text-emerald-700'
                        : resultadoCruzamento.score > 0
                          ? 'text-amber-700'
                          : 'text-red-700'
                    }`}
                  >
                    {resultadoCruzamento.score} pts
                  </span>
                </div>

                <div className="bg-[#FAF7EF] p-3 rounded-xl border border-[#E2DCCF] text-center">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold block">
                    Vigência (12 meses)
                  </span>
                  <span className="text-xs font-bold text-stone-800 block mt-1">
                    Até {new Date(resultadoCruzamento.validade).toLocaleDateString('pt-BR')}
                  </span>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[9px] ${
                      resultadoCruzamento.status_vigencia === 'VIGENTE'
                        ? 'border-emerald-300 text-emerald-800 bg-emerald-50'
                        : 'border-red-300 text-red-800 bg-red-50'
                    }`}
                  >
                    {resultadoCruzamento.status_vigencia}
                  </Badge>
                </div>
              </div>

              {/* Checklist das 7 Verificações */}
              <div className="space-y-2 text-xs pt-1">
                <span className="font-bold text-[#1B4332] block text-[11px] uppercase tracking-wider">
                  Checklist das 7 Verificações Técnicas
                </span>

                <div className="space-y-1.5 bg-[#FAF7EF] p-3 rounded-xl border border-[#E2DCCF]">
                  <div className="flex items-center justify-between">
                    <span>1. CNPJ cadastrado no SIPEAGRO</span>
                    {resultadoCruzamento.detalhes.cnpj_encontrado ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>2. Situação ATIVO no MAPA</span>
                    {resultadoCruzamento.detalhes.situacao_ativo ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>
                      3. Razão Social (simil. {resultadoCruzamento.detalhes.similaridade_razao}%)
                    </span>
                    {resultadoCruzamento.detalhes.razao_social_confere ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>4. Categoria compatível</span>
                    {resultadoCruzamento.detalhes.categoria_confere ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>5. Tipos de produtos autorizados</span>
                    {resultadoCruzamento.detalhes.tipos_produto_conferem ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>6. Registro SIPEAGRO oficial</span>
                    {resultadoCruzamento.detalhes.registro_confere ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span>7. Localização (UF / Cidade)</span>
                    {resultadoCruzamento.detalhes.localizacao_confere ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Lista de Divergências Encontradas */}
              {resultadoCruzamento.divergencias.length > 0 && (
                <div className="space-y-1.5 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Divergências Identificadas ({resultadoCruzamento.divergencias.length}):
                    </span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-stone-700 text-[11px]">
                    {resultadoCruzamento.divergencias.map((div, i) => (
                      <li key={i}>{div}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Registro no SIPEAGRO correspondente */}
              {estabelecimentoCorrespondente && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-[11px] space-y-1 text-stone-700">
                  <span className="font-bold text-[#1B4332] block">
                    Base Oficial MAPA Encontrada:
                  </span>
                  <p>
                    <strong>Razão:</strong> {estabelecimentoCorrespondente.razao_social}
                  </p>
                  <p>
                    <strong>Registro:</strong>{' '}
                    {estabelecimentoCorrespondente.registro_sipeagro || '—'} •{' '}
                    <strong>UF/Mun:</strong> {estabelecimentoCorrespondente.municipio}/
                    {estabelecimentoCorrespondente.uf}
                  </p>
                  <p>
                    <strong>Produtos Autorizados:</strong>{' '}
                    {estabelecimentoCorrespondente.tipos_produto?.join(', ') || 'Nenhum'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs text-center space-y-3">
              <div className="p-3 rounded-full bg-[#FAF7EF] w-12 h-12 flex items-center justify-center mx-auto text-[#2D6A4F]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-[#1B4332] font-['Sora']">
                Aguardando Execução do Cruzamento
              </h4>
              <p className="text-xs text-stone-600">
                Preencha os dados do fornecedor ao lado e clique em &quot;Executar Cruzamento&quot;.
                O motor irá validar instantaneamente os requisitos do MAPA e atribuir a nota de
                qualificação (score 0-100).
              </p>
            </div>
          )}

          {/* Histórico Recente de Qualificações */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-[#1B4332] uppercase tracking-wider font-['Sora']">
              Últimas Qualificações Registradas
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {historico.length === 0 ? (
                <p className="text-xs text-stone-500 py-4 text-center">
                  Nenhuma qualificação salva nesta organização.
                </p>
              ) : (
                historico.slice(0, 5).map((q) => (
                  <div
                    key={q.id}
                    className="p-2.5 rounded-lg border border-[#E2DCCF] bg-[#FAF7EF] text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-stone-800">
                        {q.dados_declarados?.razao_social || formatarCNPJ(q.fornecedor_cnpj)}
                      </p>
                      <span className="text-[10px] text-stone-500 block">
                        {new Date(q.data_formulario).toLocaleDateString('pt-BR')} • Score: {q.score}{' '}
                        pts
                      </span>
                    </div>
                    <Badge
                      className={
                        q.resultado === 'APROVADO'
                          ? 'bg-emerald-700 text-white text-[9px]'
                          : q.resultado === 'APROVADO_COM_RESSALVA'
                            ? 'bg-amber-600 text-white text-[9px]'
                            : q.resultado === 'REPROVADO'
                              ? 'bg-red-700 text-white text-[9px]'
                              : 'bg-stone-500 text-white text-[9px]'
                      }
                    >
                      {q.resultado.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
