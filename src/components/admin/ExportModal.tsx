"use client"

import { useState } from "react"
import { Download, AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react"
import toast from "react-hot-toast"
import { exportPieces } from "@/app/admin/(protected)/piezas/import-export"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  categories: any[]
}

export default function ExportModal({ isOpen, onClose, categories }: ExportModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  // Solo categorías hoja
  const leafCategories = categories.filter(c => !categories.some(child => child.parentId === c.id))

  const handleExport = async () => {
    if (!selectedCategoryId) {
      toast.error("Selecciona una categoría hoja")
      return
    }

    try {
      setIsExporting(true)
      const res = await exportPieces(selectedCategoryId, 'ALL')
      
      if (res.success && res.buffer) {
        const link = document.createElement("a")
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.buffer}`
        link.download = res.fileName
        link.click()
        toast.success("Exportación completada")
        onClose()
      } else {
        toast.error("Error al exportar")
      }
    } catch (err: any) {
      toast.error(err.message || "Error al exportar")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Download className="text-[#1d4328]" size={20} />
            Exportar Acervo
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seleccionar Categoría (Solo hojas)
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
            >
              <option value="">Seleccione una categoría...</option>
              {leafCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.prefix})</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Las piezas se exportan agrupadas por su categoría final para mantener la estructura de campos correspondiente.
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded flex gap-3 text-sm text-blue-800 mb-4">
            <FileSpreadsheet className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-medium">Formato principal: Excel (.xlsx)</p>
              <p>El archivo generado incluirá los campos dinámicos específicos, instrucciones y valores permitidos en múltiples hojas.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
          >
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleExport}
            disabled={isExporting || !selectedCategoryId}
            className="px-4 py-2 bg-[#1d4328] text-white rounded hover:bg-[#255633] text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? "Generando Excel..." : "Exportar a Excel"}
          </button>
        </div>
      </div>
    </div>
  )
}
