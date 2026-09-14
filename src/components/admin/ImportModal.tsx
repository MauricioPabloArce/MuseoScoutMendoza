"use client"

import { useState } from "react"
import { Upload, Download, AlertTriangle, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { generateTemplate, validateImportFile, executeImport } from "@/app/admin/(protected)/piezas/import-export"

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
  
  const [validationResult, setValidationResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)

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

  const handleNext = async () => {
    if (step === 1 && !selectedCategoryId) {
      toast.error("Debe seleccionar una categoría")
      return
    }
    
    if (step === 3 && file) {
      // Proceder a validar
      try {
        setIsProcessing(true)
        const formData = new FormData()
        formData.append("file", file)
        formData.append("categoryId", selectedCategoryId)
        const result = await validateImportFile(formData)
        setValidationResult(result)
        setStep(4)
      } catch (err: any) {
        toast.error(err.message || "Error al validar el archivo")
      } finally {
        setIsProcessing(false)
      }
      return
    }

    if (step === 4) {
      if (validationResult?.errorCount > 0) {
        toast.error("El archivo contiene errores. Corríjalos y vuelva a subirlo.")
        return
      }
      setStep(5)
      return
    }

    if (step === 5) {
      // Ejecutar importación
      try {
        setIsProcessing(true)
        const formData = new FormData()
        formData.append("file", file as File)
        formData.append("categoryId", selectedCategoryId)
        const res = await executeImport(formData)
        toast.success(`Importación exitosa. ${res.imported} piezas guardadas.`)
        onClose()
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "Error durante la importación")
      } finally {
        setIsProcessing(false)
      }
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
            
            {step === 4 && validationResult && (
              <div className="animate-in fade-in">
                <h4 className="text-lg font-semibold mb-4">Paso 4: Validación</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">{validationResult.validCount}</span>
                    <span className="text-sm text-green-800">Filas válidas</span>
                  </div>
                  <div className={`border p-4 rounded-lg flex flex-col items-center justify-center ${validationResult.errorCount > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <span className={`text-2xl font-bold ${validationResult.errorCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>{validationResult.errorCount}</span>
                    <span className={`text-sm ${validationResult.errorCount > 0 ? 'text-red-800' : 'text-gray-600'}`}>Filas con errores</span>
                  </div>
                </div>

                {validationResult.errorCount > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg mb-6 flex gap-3">
                    <AlertTriangle size={24} className="shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Se encontraron errores en el archivo</p>
                      <p className="text-sm mb-3">No es posible importar. Descarga el reporte para ver qué celdas fallaron, arréglalo y vuelve al paso anterior para subir el archivo corregido.</p>
                      <button 
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${validationResult.errorReportBase64}`
                          link.download = `reporte_errores_${new Date().getTime()}.xlsx`
                          link.click()
                        }}
                        className="text-sm bg-white border border-amber-300 px-3 py-1.5 rounded hover:bg-amber-100 font-medium"
                      >
                        Descargar Reporte de Errores (.xlsx)
                      </button>
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-xs font-semibold text-gray-500">
                    Vista previa (primeras {validationResult.preview.length} filas)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Fila</th>
                          <th className="px-3 py-2 font-medium">Estado</th>
                          <th className="px-3 py-2 font-medium">Código</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {validationResult.preview.map((row: any, i: number) => (
                          <tr key={i} className={!row.isValid ? "bg-red-50/50" : ""}>
                            <td className="px-3 py-2 flex items-center gap-2">
                              {row.isValid ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                              {row.index}
                            </td>
                            <td className="px-3 py-2">{row.originalRow["Estado"]}</td>
                            <td className="px-3 py-2">{row.originalRow["Código de registro"] || "Automático"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-in fade-in text-center p-8">
                <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-bold mb-2">Todo listo para importar</h4>
                <p className="text-gray-600 mb-6">
                  Se importarán <strong>{validationResult?.validCount}</strong> piezas a la categoría seleccionada.
                </p>
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3 text-left">
                  <AlertTriangle size={20} className="shrink-0 text-blue-500" />
                  <p>Por favor no cierres esta ventana durante el proceso. Dependiendo de la cantidad de registros, la importación podría demorar unos segundos.</p>
                </div>
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
            disabled={(step === 3 && !file) || isProcessing || (step === 4 && validationResult?.errorCount > 0)}
            className="px-4 py-2 bg-[#1d4328] text-white rounded hover:bg-[#255633] text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {step === 3 ? "Validar Archivo" : step === 4 ? "Continuar" : step === 5 ? "Ejecutar Importación" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  )
}
