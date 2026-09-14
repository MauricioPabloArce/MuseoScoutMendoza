"use client"

import { useState } from "react"
import { Upload, Download, AlertTriangle, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import toast from "react-hot-toast"
import { generateTemplate } from "@/app/admin/(protected)/piezas/import-export"

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  categories: any[]
}

export default function ImportModal({ isOpen, onClose, categories }: ImportModalProps) {
  const [step, setStep] = useState(1)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  if (!isOpen) return null

  const leafCategories = categories.filter(c => !categories.some(child => child.parentId === c.id))

  const handleDownloadTemplate = async () => {
    if (!selectedCategoryId) return
    try {
      setIsGenerating(true)
      const res = await generateTemplate(selectedCategoryId)
      if (res.success && res.buffer) {
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.buffer}`
        link.download = res.fileName
        link.click()
        toast.success("Plantilla descargada")
        setStep(3)
      }
    } catch (err: any) {
      toast.error(err.message || "Error al generar plantilla")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && !selectedCategoryId) {
      toast.error("Debe seleccionar una categoría")
      return
    }
    setStep(s => s + 1)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Upload className="text-[#1d4328]" size={20} />
            Asistente de Importación
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="p-0 flex-1 overflow-y-auto">
          {/* Stepper Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between">
             {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-[#1d4328] font-bold' : step > s ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === s ? 'bg-[#1d4328] text-white' : step > s ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    {step > s ? <CheckCircle2 size={14} /> : s}
                  </div>
                </div>
             ))}
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="animate-in fade-in">
                <h4 className="text-lg font-semibold mb-4">Paso 1: Seleccionar Categoría</h4>
                <p className="text-sm text-gray-600 mb-4">Las piezas importadas serán creadas dentro de esta categoría. Solo se permiten categorías hoja.</p>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328]"
                >
                  <option value="">Seleccione una categoría...</option>
                  {leafCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.prefix})</option>
                  ))}
                </select>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in">
                <h4 className="text-lg font-semibold mb-4">Paso 2: Descargar Plantilla</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Antes de importar, necesitas descargar la plantilla Excel que contiene los campos exactos de la categoría seleccionada, junto con las instrucciones y opciones de campos.
                </p>
                <button 
                  onClick={handleDownloadTemplate}
                  disabled={isGenerating}
                  className="w-full py-4 border-2 border-dashed border-[#1d4328] text-[#1d4328] rounded-lg bg-green-50 hover:bg-green-100 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FileSpreadsheet size={24} />
                  {isGenerating ? "Generando..." : "Descargar plantilla XLSX"}
                </button>
                <div className="mt-4 text-center text-sm text-gray-500">
                  <button onClick={() => setStep(3)} className="underline">Ya tengo mi archivo preparado</button>
                </div>
              </div>
            )}

            {step === 3 && (
               <div className="animate-in fade-in">
                <h4 className="text-lg font-semibold mb-4">Paso 3: Subir Archivo</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-gray-500 bg-gray-50 hover:bg-gray-100 relative">
                  <Upload size={32} className="mb-2 text-gray-400" />
                  <p className="font-medium">Arrastra tu archivo aquí o haz clic para subir</p>
                  <p className="text-sm">Solo archivos .xlsx (max 10MB)</p>
                  <input 
                    type="file" 
                    accept=".xlsx"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  />
                </div>
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded flex justify-between items-center">
                    <span className="text-sm text-blue-800 font-medium flex items-center gap-2"><FileSpreadsheet size={16}/> {file.name}</span>
                    <button onClick={() => setFile(null)} className="text-red-500 text-sm">Quitar</button>
                  </div>
                )}
              </div>
            )}
            
            {step > 3 && (
              <div className="p-8 text-center text-gray-500">
                {/* Funcionalidad futura a implementar en la siguiente etapa */}
                <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
                <p>Las funcionalidades de validación e importación se están implementando en el backend.</p>
              </div>
            )}

          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between shrink-0">
          <button 
            type="button" 
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
          >
            {step > 1 ? "Volver" : "Cancelar"}
          </button>
          
          <button 
            type="button"
            onClick={handleNext}
            disabled={step === 3 && !file || step > 3}
            className="px-4 py-2 bg-[#1d4328] text-white rounded hover:bg-[#255633] text-sm font-medium disabled:opacity-50"
          >
            {step === 5 ? "Confirmar Importación" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  )
}
