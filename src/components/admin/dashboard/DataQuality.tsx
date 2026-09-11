import { Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react"

export default function DataQuality({ kpis }: { kpis: any }) {
  const total = kpis.total || 0
  if (total === 0) return null

  const withImagePercent = Math.round((kpis.withImage / total) * 100)
  
  // Fórmula simple de completitud (por ahora usando imagenes)
  const completeness = withImagePercent

  return (
    <div className="w-full h-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">Calidad del Registro</h3>
        <p className="text-sm text-gray-500">Estado de completitud de datos</p>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#01A187] relative mb-2">
            <span className="text-2xl font-bold text-gray-800">{completeness}%</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Completitud general</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <ImageIcon size={18} className="text-[#00AAF2]" />
              <span className="text-sm text-gray-700">Con imagen</span>
            </div>
            <span className="font-semibold">{kpis.withImage}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              <span className="text-sm text-red-700 font-medium">Sin imagen</span>
            </div>
            <span className="font-bold text-red-600">{kpis.withoutImage}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
