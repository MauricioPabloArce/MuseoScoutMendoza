import { AlertTriangle, X } from "lucide-react"

interface FileErrorModalProps {
  isOpen: boolean
  onClose: () => void
  maxSizeMB: number
}

export default function FileErrorModal({ isOpen, onClose, maxSizeMB }: FileErrorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="bg-red-100 p-3 rounded-full mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          
          <h3 className="text-xl font-bold text-red-900 mb-2">
            Archivo demasiado grande
          </h3>
          
          <p className="text-red-700">
            La imagen que intentas subir supera el límite máximo permitido de <strong>{maxSizeMB} MB</strong>. 
            Por favor, comprime la imagen o elige una más pequeña.
          </p>
        </div>
        
        <div className="bg-white p-4 flex justify-center">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-colors w-full"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
