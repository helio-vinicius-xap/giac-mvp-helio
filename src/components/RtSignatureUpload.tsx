import React, { useState } from 'react'
import {
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { uploadRtSignatureImage, getFileUrl } from '@/services/agroService'

interface RtSignatureUploadProps {
  currentSignatureUrl?: string
  rtName?: string
  rtCrmv?: string
  onSignatureChange?: (imageUrl: string) => void
  userId?: string
}

export function RtSignatureUpload({
  currentSignatureUrl,
  rtName,
  rtCrmv,
  onSignatureChange,
  userId,
}: RtSignatureUploadProps) {
  const { toast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentSignatureUrl)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo e tamanho (JPG ou PNG, até 5MB)
    if (!file.type.includes('jpeg') && !file.type.includes('png')) {
      toast({
        title: 'Formato inválido',
        description: 'Selecione uma imagem no formato JPG ou PNG da assinatura digitalizada.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'A imagem da assinatura deve ter no máximo 5MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      if (userId) {
        // Enviar para o perfil no backend PocketBase
        const updatedUser = await uploadRtSignatureImage(userId, file)
        const fileUrl = getFileUrl(updatedUser, updatedUser.assinatura_imagem)
        setPreviewUrl(fileUrl)
        if (onSignatureChange) onSignatureChange(fileUrl)
      } else {
        // Modo local DataURL
        const reader = new FileReader()
        reader.onload = () => {
          const res = reader.result as string
          setPreviewUrl(res)
          if (onSignatureChange) onSignatureChange(res)
        }
        reader.readAsDataURL(file)
      }

      toast({
        title: 'Assinatura digitalizada carregada',
        description:
          'A imagem da assinatura do RT foi salva e será inserida nos registros e no PDF.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro no upload da assinatura',
        description: err.message || 'Falha ao processar arquivo.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(undefined)
    if (onSignatureChange) onSignatureChange('')
    toast({
      title: 'Assinatura removida',
      description: 'Você pode enviar uma nova imagem da assinatura quando desejar.',
    })
  }

  return (
    <div className="p-4 rounded-xl border border-[#E2DCCF] bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-xs font-bold text-[#2D6A4F] flex items-center gap-1.5 uppercase tracking-wide">
            <ImageIcon className="h-4 w-4 text-[#D9A404]" />
            Assinatura Digitalizada do Responsável Técnico (RT)
          </Label>
          <p className="text-[11px] text-stone-500 mt-0.5">
            Arquivo de imagem digitalizada (JPG ou PNG). Utilizada nos formulários e relatórios
            oficiais.
          </p>
        </div>

        {previewUrl && (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Assinatura Ativa
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
        {previewUrl ? (
          <div className="relative border-2 border-dashed border-[#2D6A4F]/40 bg-[#FAF7EF] p-2 rounded-lg w-full sm:w-64 h-24 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Assinatura do RT"
              className="max-h-20 max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-stone-300 bg-stone-50 p-3 rounded-lg w-full sm:w-64 h-24 flex flex-col items-center justify-center text-stone-400 text-center">
            <ImageIcon className="h-6 w-6 mb-1 text-stone-400" />
            <span className="text-[11px]">Nenhuma assinatura carregada</span>
          </div>
        )}

        <div className="flex-1 space-y-2 w-full text-xs">
          <div className="text-stone-700">
            <strong>RT:</strong> {rtName || 'Dr. Hélio Silva'} | <strong>Registro:</strong>{' '}
            {rtCrmv || 'CRMV-SP 18.420'}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2D6A4F] hover:bg-[#1B4332] text-white transition shadow-xs">
                <Upload className="h-3.5 w-3.5" />
                {uploading
                  ? 'Carregando...'
                  : previewUrl
                    ? 'Trocar Imagem'
                    : 'Carregar Imagem (JPG/PNG)'}
              </span>
            </label>

            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-700 hover:text-red-800 hover:bg-red-50 text-xs h-8 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remover
              </Button>
            )}
          </div>
          <p className="text-[10px] text-stone-400">
            Recomendação: fundo branco ou transparente, resolução nítida e boa iluminação.
          </p>
        </div>
      </div>
    </div>
  )
}
