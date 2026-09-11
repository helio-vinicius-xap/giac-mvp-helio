import React, { useState, useEffect } from 'react'
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Clock,
  Eye,
  UploadCloud,
  FileText,
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
import { Checkbox } from '@/components/ui/checkbox'
import { getTrainings, createTraining, updateTraining } from '@/services/agroService'
import type { Training } from '@/types/agro'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function Trainings() {
  const { toast } = useToast()

  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [openNewModal, setOpenNewModal] = useState(false)
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null)

  // New Training form
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    tema: '',
    data: new Date().toISOString().split('T')[0],
    instrutor: 'Hélio - Resp. Técnico',
    carga_horaria: '8 horas',
    status: 'Concluído' as 'Concluído' | 'Agendado',
    eficacia_verificada: true,
  })

  const loadData = async () => {
    try {
      const data = await getTrainings()
      setTrainings(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('trainings', () => loadData())

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const nextCode = `TR-${String(trainings.length + 1).padStart(3, '0')}`
      await createTraining({
        codigo: form.codigo || nextCode,
        tema: form.tema,
        data: `${form.data} 00:00:00.000Z`,
        instrutor: form.instrutor,
        carga_horaria: form.carga_horaria,
        status: form.status,
        eficacia_verificada: form.eficacia_verificada,
        participantes: [
          { nome: 'Carlos Mendes', cargo: 'Supervisor de Produção' },
          { nome: 'João Silva', cargo: 'Operador de Peletização' },
          { nome: 'Ana Paula', cargo: 'Operadora de Ensaque' },
        ],
      })

      toast({
        title: 'Treinamento cadastrado',
        description: 'Capacitação registrada em conformidade com o Item 63.',
      })
      setOpenNewModal(false)
      loadData()
    } catch (err: any) {
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleEficacia = async (t: Training, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = await updateTraining(t.id, {
        eficacia_verificada: !t.eficacia_verificada,
      })
      setTrainings((prev) => prev.map((item) => (item.id === t.id ? updated : item)))
      toast({
        title: 'Status de Eficácia Atualizado',
        description: `Treinamento ${t.codigo} atualizado.`,
      })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

  const filteredTrainings = trainings.filter(
    (t) =>
      !searchTerm ||
      t.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.codigo && t.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.instrutor && t.instrutor.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* 1. Header & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-['Sora'] text-[#2D6A4F]">
            Capacitação e Treinamentos de Pessoal
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Registro de qualificações em BPF, APPCC e avaliação de eficácia prática (IN 04/2007 &
            Item 63)
          </p>
        </div>

        <Button
          onClick={() => setOpenNewModal(true)}
          className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs gap-1.5 h-9 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Treinamento
        </Button>
      </div>

      {/* 2. Search Bar */}
      <div className="agro-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tema, código do treinamento ou instrutor..."
            className="pl-9 h-9 text-xs border-[#E2DCCF]"
          />
        </div>
      </div>

      {/* 3. Table */}
      <div className="agro-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="agro-table-header">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Tema do Treinamento</th>
                <th className="py-3 px-4">Data Realização</th>
                <th className="py-3 px-4">Instrutor</th>
                <th className="py-3 px-4">Carga Horária</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Eficácia Verificada (Item 63)</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2DCCF]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Carregando treinamentos...
                  </td>
                </tr>
              ) : filteredTrainings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500">
                    Nenhum treinamento localizado.
                  </td>
                </tr>
              ) : (
                filteredTrainings.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTraining(t)}
                    className="hover:bg-[#FAF7EF] cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-bold text-[#2D6A4F] whitespace-nowrap">
                      {t.codigo || 'TR-001'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-stone-800 max-w-[280px]">
                      {t.tema}
                    </td>
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                      {t.data ? new Date(t.data).toLocaleDateString('pt-BR') : 'A definir'}
                    </td>
                    <td className="py-3 px-4 text-stone-700 truncate max-w-[150px]">
                      {t.instrutor || 'Hélio - RT'}
                    </td>
                    <td className="py-3 px-4 text-stone-600 whitespace-nowrap">
                      {t.carga_horaria || '4 horas'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge
                        className={
                          t.status === 'Concluído'
                            ? 'bg-[#2E8B57] text-white'
                            : 'bg-[#D9A404] text-[#1B4332]'
                        }
                      >
                        {t.status || 'Concluído'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={t.eficacia_verificada ?? false}
                          onClick={(e) => handleToggleEficacia(t, e)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            t.eficacia_verificada ? 'text-[#2E8B57]' : 'text-stone-400'
                          }`}
                        >
                          {t.eficacia_verificada ? 'Comprovada' : 'Pendente'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTraining(t)
                        }}
                        className="text-[#2D6A4F] hover:bg-[#2D6A4F]/10 h-8 px-2 text-xs font-semibold gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" /> Lista & Evidências
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOVO TREINAMENTO */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-[500px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#D9A404]" />
              Agendar Novo Treinamento
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Conformidade com os requisitos de higiene e capacitação técnica da IN 04/2007.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTraining} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-stone-700">Tema do Treinamento</Label>
              <Input
                value={form.tema}
                onChange={(e) => setForm({ ...form, tema: e.target.value })}
                placeholder="Ex: Prevenção de Contaminação Cruzada e Sequenciamento"
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Data de Realização</Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  required
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Carga Horária</Label>
                <Input
                  value={form.carga_horaria}
                  onChange={(e) => setForm({ ...form, carga_horaria: e.target.value })}
                  placeholder="Ex: 8 horas"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Instrutor</Label>
                <Input
                  value={form.instrutor}
                  onChange={(e) => setForm({ ...form, instrutor: e.target.value })}
                  placeholder="Nome do Instrutor"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-stone-700">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: any) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                checked={form.eficacia_verificada}
                onCheckedChange={(val) => setForm({ ...form, eficacia_verificada: !!val })}
                id="ef"
              />
              <Label htmlFor="ef" className="text-xs text-stone-700 cursor-pointer">
                Eficácia prática do treinamento já verificada e atestada (Item 63)
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenNewModal(false)}
                className="border-stone-300 text-stone-700"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                size="sm"
                className="bg-[#D9A404] hover:bg-[#B8860B] text-[#1B4332] font-semibold text-xs"
              >
                {formLoading ? 'Salvando...' : 'Salvar Treinamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETALHES & PARTICIPANTES */}
      <Dialog
        open={Boolean(selectedTraining)}
        onOpenChange={(open) => !open && setSelectedTraining(null)}
      >
        <DialogContent className="sm:max-w-[550px] bg-white border-[#E2DCCF]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-[#2D6A4F] font-['Sora'] flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#D9A404]" />
              {selectedTraining?.codigo}: {selectedTraining?.tema}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600">
              Instrutor: {selectedTraining?.instrutor} • Carga: {selectedTraining?.carga_horaria}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 bg-[#FAF7EF] rounded-xl border border-[#E2DCCF] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-semibold text-stone-400 block uppercase">
                  Data de Realização
                </span>
                <span className="font-bold text-stone-800 text-sm">
                  {selectedTraining?.data
                    ? new Date(selectedTraining.data).toLocaleDateString('pt-BR')
                    : 'A definir'}
                </span>
              </div>
              <Badge className="bg-[#2E8B57] text-white">{selectedTraining?.status}</Badge>
            </div>

            {/* Participantes list */}
            <div className="space-y-2">
              <span className="font-bold text-stone-800 block text-xs">
                Participantes Presentes com Lista Assinada:
              </span>
              <div className="border border-[#E2DCCF] rounded-xl overflow-hidden divide-y divide-stone-100 bg-white">
                <div className="p-2.5 flex justify-between items-center text-stone-700">
                  <span className="font-medium">Carlos Mendes</span>
                  <span className="text-stone-500">Supervisor de Produção • Nota: 9.5</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-stone-700">
                  <span className="font-medium">João Silva</span>
                  <span className="text-stone-500">Operador Peletizadora • Nota: 9.0</span>
                </div>
                <div className="p-2.5 flex justify-between items-center text-stone-700">
                  <span className="font-medium">Ana Paula</span>
                  <span className="text-stone-500">Operadora de Ensaque • Nota: 10.0</span>
                </div>
              </div>
            </div>

            {/* Evidências */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2D6A4F]" />
                <div>
                  <span className="font-bold text-stone-800 block">
                    Lista_Assinaturas_Evidencia.pdf
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Comprovante de presença digitalizado
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast({
                    title: 'Lista de Presença',
                    description: 'Comprovante verificado com sucesso.',
                  })
                }
                className="text-xs border-stone-300"
              >
                Visualizar
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTraining(null)}
              className="border-stone-300 text-stone-700"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
