import React, { useState, useEffect } from 'react'
import {
  Building2,
  FileBadge,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Award,
  FileText,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getCompany, createCompany, updateCompany } from '@/services/agroService'
import type { Company } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function CompanySettings() {
  const { toast } = useToast()
  const { currentOrg } = useAuth()

  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<Partial<Company>>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    numero_registro_mapa: '',
    tipo_estabelecimento: 'Fábrica de Produtos para Alimentação Animal',
    atividades_autorizadas:
      'Fabricação com uso de medicamentos, Premixes, Rações e Suplementos para Ruminantes e Não-ruminantes',
    produtos_fabricados: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    municipio: '',
    uf: 'SP',
    cep: '',
    telefone: '',
    email: '',
    rt_nome: '',
    rt_registro_conselho: '',
    rt_cpf: '',
    rq_nome: '',
    rq_cpf: '',
    re_nome: '',
    re_cpf: '',
    re_cargo_mapa: 'RE - Responsável pelo Estabelecimento (MAPA)',
  })

  const loadCompanyData = async () => {
    try {
      const data = await getCompany()
      if (data) {
        setCompany(data)
        setForm(data)
      } else if (currentOrg) {
        // Se ainda não tem cadastro SIPEAGRO criado, herdar dados da organização do SaaS
        setForm((prev) => ({
          ...prev,
          razao_social: currentOrg.razao_social || '',
          nome_fantasia: currentOrg.nome_fantasia || '',
          cnpj: currentOrg.cnpj || '',
          telefone: currentOrg.billing_phone || '',
          email: currentOrg.billing_email || '',
        }))
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao carregar dados da empresa',
        description: err.message || 'Verifique sua conexão.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCompanyData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (company && company.id) {
        const updated = await updateCompany(company.id, form)
        setCompany(updated)
        toast({
          title: 'Dados da Empresa Atualizados',
          description: 'Cadastro sincronizado com sucesso no padrão SIPEAGRO/MAPA.',
        })
      } else {
        const created = await createCompany(form)
        setCompany(created)
        toast({
          title: 'Empresa Fabricante Cadastrada',
          description: 'Estabelecimento vinculado com sucesso às emissões e relatórios.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar cadastro',
        description: err.message || 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-stone-500 text-xs">
        Carregando dados do estabelecimento fabricante (SIPEAGRO)...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2DCCF] shadow-xs">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#2D6A4F] text-white flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="h-7 w-7 text-[#D9A404]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-bold text-white bg-[#D9A404] text-[#1B4332] px-2.5 py-0.5 rounded-full">
                SIPEAGRO / MAPA
              </span>
              <Badge variant="outline" className="border-emerald-300 text-[#2D6A4F] bg-emerald-50">
                Alimentação Animal (IN 04/2007)
              </Badge>
              {currentOrg && (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                  Organização SaaS: {currentOrg.razao_social}
                </span>
              )}
              {company?.numero_registro_mapa && (
                <span className="text-xs font-bold text-[#2D6A4F] bg-stone-100 px-2 py-0.5 rounded">
                  Registro: {company.numero_registro_mapa}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
              {company?.razao_social ||
                currentOrg?.razao_social ||
                'Cadastro da Empresa Fabricante'}
            </h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Dados oficiais do estabelecimento e dos responsáveis formais (RT, RQ e RE) para
              cabeçalhos e assinaturas eletrônicas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="border-stone-300 text-stone-700 hover:bg-stone-50 text-xs gap-1.5 h-9"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ficha
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 shadow-sm h-9"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Gravando...' : 'Salvar SIPEAGRO'}
          </Button>
        </div>
      </div>

      {/* 2. Form Tabs */}
      <form onSubmit={handleSave}>
        <Tabs defaultValue="estabelecimento" className="w-full space-y-6">
          <TabsList className="bg-[#FAF7EF] p-1 border border-[#E2DCCF] rounded-xl">
            <TabsTrigger
              value="estabelecimento"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              1. Dados do Estabelecimento
            </TabsTrigger>
            <TabsTrigger
              value="responsaveis"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              2. Responsáveis Formais (RT, RQ e RE)
            </TabsTrigger>
            <TabsTrigger
              value="atividades"
              className="text-xs font-semibold data-[state=active]:bg-[#2D6A4F] data-[state=active]:text-white rounded-lg"
            >
              3. Atividades & Produtos Fabricados
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ESTABELECIMENTO */}
          <TabsContent value="estabelecimento" className="agro-card p-6 space-y-6">
            <div className="border-b border-[#E2DCCF] pb-3">
              <h2 className="text-sm font-bold font-['Sora'] text-[#2D6A4F] flex items-center gap-2">
                <FileBadge className="h-4 w-4 text-[#D9A404]" />
                Identificação do Estabelecimento no MAPA (SIPEAGRO)
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Dados regulatórios oficiais exigidos pela Fiscalização Agropecuária Federal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Razão Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.razao_social || ''}
                  onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                  placeholder="Ex: NutriAgro Nutrição Animal e Premixes Ltda."
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">Nome Fantasia</Label>
                <Input
                  value={form.nome_fantasia || ''}
                  onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                  placeholder="Ex: NutriAgro"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.cnpj || ''}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Nº de Registro do Estabelecimento no MAPA <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.numero_registro_mapa || ''}
                  onChange={(e) => setForm({ ...form, numero_registro_mapa: e.target.value })}
                  placeholder="Ex: SP-00412-8 (conforme SIPEAGRO)"
                  required
                  className="h-9 text-xs font-bold text-[#2D6A4F]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700">
                  Tipo de Estabelecimento
                </Label>
                <Input
                  value={form.tipo_estabelecimento || ''}
                  onChange={(e) => setForm({ ...form, tipo_estabelecimento: e.target.value })}
                  placeholder="Fábrica de Produtos para Alimentação Animal"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2DCCF]">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#2D6A4F]" /> Localização Física
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Logradouro / Rodovia
                  </Label>
                  <Input
                    value={form.logradouro || ''}
                    onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                    placeholder="Ex: Rodovia Agroindustrial SP-330, KM 142"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Número</Label>
                  <Input
                    value={form.numero || ''}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="S/N ou nº"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Complemento</Label>
                  <Input
                    value={form.complemento || ''}
                    onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                    placeholder="Galpão, Distrito"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Bairro</Label>
                  <Input
                    value={form.bairro || ''}
                    onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                    placeholder="Zona Agroindustrial"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">Município</Label>
                  <Input
                    value={form.municipio || ''}
                    onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                    placeholder="Ribeirão Preto"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">UF / CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.uf || ''}
                      onChange={(e) => setForm({ ...form, uf: e.target.value })}
                      placeholder="SP"
                      className="h-9 text-xs w-16 uppercase text-center font-bold"
                    />
                    <Input
                      value={form.cep || ''}
                      onChange={(e) => setForm({ ...form, cep: e.target.value })}
                      placeholder="14075-000"
                      className="h-9 text-xs flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E2DCCF]">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#2D6A4F]" /> Telefone Institucional
                </Label>
                <Input
                  value={form.telefone || ''}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(16) 3600-4500"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#2D6A4F]" /> E-mail Oficial do Autocontrole
                </Label>
                <Input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="garantiadaqualidade@suaempresa.com.br"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: RESPONSÁVEIS FORMAIS (RT, RQ, RE) */}
          <TabsContent value="responsaveis" className="space-y-6">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-stone-700 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[#2D6A4F] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#2D6A4F] font-bold block mb-0.5">
                  Estrutura de Responsabilidade Técnica e Legal (IN 04/2007)
                </strong>
                Conforme exigência do MAPA, as emissões de POP são impressas e geradas pelo{' '}
                <strong>Responsável Técnico (RT)</strong> e pelo{' '}
                <strong>Responsável pelo Estabelecimento (RE)</strong> registrado no SIPEAGRO. Os
                registros de monitoramento são formalmente comprovados quando assinados pelo{' '}
                <strong>Responsável pela Qualidade (RQ)</strong> e pelo <strong>RE</strong>.
              </div>
            </div>

            {/* RT */}
            <div className="agro-card p-6 border-l-4 border-l-[#2D6A4F] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs">
                    RT
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#2D6A4F]">Responsável Técnico (RT)</h3>
                    <p className="text-[11px] text-stone-500">
                      Gera e imprime os POPs com anotação no conselho de classe
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#2D6A4F] text-white text-[10px]">Habilitado POP / PDF</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Nome Completo do RT
                  </Label>
                  <Input
                    value={form.rt_nome || ''}
                    onChange={(e) => setForm({ ...form, rt_nome: e.target.value })}
                    placeholder="Dr. Hélio Silva"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Registro de Classe (CRMV / CRQ)
                  </Label>
                  <Input
                    value={form.rt_registro_conselho || ''}
                    onChange={(e) => setForm({ ...form, rt_registro_conselho: e.target.value })}
                    placeholder="CRMV-SP 18.420"
                    className="h-9 text-xs font-semibold text-[#2D6A4F]"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CPF do RT</Label>
                  <Input
                    value={form.rt_cpf || ''}
                    onChange={(e) => setForm({ ...form, rt_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* RQ */}
            <div className="agro-card p-6 border-l-4 border-l-[#0D9488] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-[#0D9488] text-white flex items-center justify-center font-bold text-xs">
                    RQ
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#0D9488]">
                      Responsável pela Qualidade (RQ)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Assina registros de monitoramento e verificação de BPF/PCC
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#0D9488] text-white text-[10px]">
                  Assina Registros Diários
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Nome Completo do RQ
                  </Label>
                  <Input
                    value={form.rq_nome || ''}
                    onChange={(e) => setForm({ ...form, rq_nome: e.target.value })}
                    placeholder="Dra. Mariana Siqueira"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CPF do RQ</Label>
                  <Input
                    value={form.rq_cpf || ''}
                    onChange={(e) => setForm({ ...form, rq_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* RE */}
            <div className="agro-card p-6 border-l-4 border-l-[#D9A404] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-[#D9A404] text-[#1B4332] flex items-center justify-center font-bold text-xs">
                    RE
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1B4332]">
                      Responsável pelo Estabelecimento (RE)
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Representante legal registrado no SIPEAGRO / MAPA para validação oficial
                    </p>
                  </div>
                </div>
                <Badge className="bg-[#D9A404] text-[#1B4332] text-[10px] font-bold">
                  Assina POP & Registros
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Nome Completo do RE
                  </Label>
                  <Input
                    value={form.re_nome || ''}
                    onChange={(e) => setForm({ ...form, re_nome: e.target.value })}
                    placeholder="Carlos Eduardo Prado de Oliveira"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">CPF do RE</Label>
                  <Input
                    value={form.re_cpf || ''}
                    onChange={(e) => setForm({ ...form, re_cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-stone-700">
                    Cargo / Função no MAPA
                  </Label>
                  <Input
                    value={form.re_cargo_mapa || ''}
                    onChange={(e) => setForm({ ...form, re_cargo_mapa: e.target.value })}
                    placeholder="RE - Responsável pelo Estabelecimento (MAPA)"
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: ATIVIDADES & PRODUTOS */}
          <TabsContent value="atividades" className="agro-card p-6 space-y-4">
            <div className="border-b border-[#E2DCCF] pb-3">
              <h2 className="text-sm font-bold font-['Sora'] text-[#2D6A4F]">
                Atividades e Escopo de Fabricação
              </h2>
              <p className="text-xs text-[#6B6B6B]">
                Descreva os produtos e processos autorizados pelo Ministério da Agricultura.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Atividades Autorizadas pelo MAPA
              </Label>
              <Textarea
                rows={3}
                value={form.atividades_autorizadas || ''}
                onChange={(e) => setForm({ ...form, atividades_autorizadas: e.target.value })}
                placeholder="Ex: Fabricação com uso de medicamentos, Premixes, Rações e Suplementos para Ruminantes e Não-ruminantes"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-stone-700">
                Linhas e Produtos Fabricados
              </Label>
              <Textarea
                rows={3}
                value={form.produtos_fabricados || ''}
                onChange={(e) => setForm({ ...form, produtos_fabricados: e.target.value })}
                placeholder="Ex: Rações fareladas, rações peletizadas, concentrados, suplementos minerais e premixes"
                className="text-xs"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Submit footer */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#E2DCCF]">
          <Button
            type="submit"
            disabled={saving}
            className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-bold text-xs sm:text-sm px-6 h-10 shadow-md gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Gravando no SIPEAGRO...' : 'Salvar Dados da Empresa'}
          </Button>
        </div>
      </form>
    </div>
  )
}
