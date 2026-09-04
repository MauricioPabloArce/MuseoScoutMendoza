"use client"

import { useState } from "react"
import { X } from "lucide-react"

export default function CatalogGrid({ pieces }: { pieces: any[] }) {
  const [selectedPiece, setSelectedPiece] = useState<any | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {pieces.map(piece => (
          <div 
            key={piece.id} 
            onClick={() => setSelectedPiece(piece)}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#374151] transition-all group cursor-pointer flex flex-col"
          >
            <div className="h-48 bg-gray-200 relative overflow-hidden flex items-center justify-center text-gray-400">
              {piece.media && piece.media.length > 0 ? (
                <img 
                  src={piece.media[0].url} 
                  alt={piece.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <span className="text-sm">Sin imagen</span>
              )}
            </div>
            <div className="p-4 flex-1">
              <span className="text-xs font-mono font-bold text-[#374151] bg-gray-100 border border-gray-200 px-2 py-1 rounded">
                {piece.registryCode}
              </span>
              <h3 className="font-bold text-gray-900 mt-2 line-clamp-1 group-hover:text-[#374151] transition-colors">{piece.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{piece.category.name}</p>
            </div>
          </div>
        ))}
        {pieces.length === 0 && (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-gray-500">
            No se encontraron piezas que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Piece Detail Modal */}
      {selectedPiece && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setSelectedPiece(null)}
              className="absolute right-4 top-4 z-10 bg-white/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
            >
              <X size={20} className="text-gray-700" />
            </button>

            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Media Section */}
              <div className="w-full md:w-1/2 bg-gray-100 flex-shrink-0 relative overflow-hidden flex items-center justify-center h-64 md:h-auto min-h-[300px]">
                {selectedPiece.media && selectedPiece.media.length > 0 ? (
                  <img 
                    src={selectedPiece.media[0].url} 
                    alt={selectedPiece.title} 
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <span className="text-gray-400">Sin imagen disponible</span>
                )}
              </div>

              {/* Details Section */}
              <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 bg-[#1f2937] text-white text-xs font-bold rounded-full mb-3 tracking-widest font-mono">
                    {selectedPiece.registryCode}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                    {selectedPiece.title}
                  </h2>
                  <p className="text-[#374151] font-medium border-b border-gray-200 pb-4">
                    {selectedPiece.category.name}
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider mb-2">Ficha Museológica</h3>
                  {selectedPiece.fieldValues && selectedPiece.fieldValues.length > 0 ? (
                    <div className="grid grid-cols-1 gap-y-4">
                      {selectedPiece.fieldValues.map((fv: any) => (
                        <div key={fv.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            {fv.field.name}
                          </span>
                          <span className="text-gray-800 break-words">
                            {fv.value || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No hay datos adicionales registrados.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
