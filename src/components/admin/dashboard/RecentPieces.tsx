import Link from "next/link"
import { ExternalLink } from "lucide-react"

export default function RecentPieces({ pieces }: { pieces: any[] }) {
  if (!pieces || pieces.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800">Últimas Incorporaciones</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No hay piezas registradas recientemente.
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Últimas Incorporaciones</h3>
          <p className="text-sm text-gray-500">Piezas añadidas recientemente al acervo</p>
        </div>
        <Link href="/admin/piezas" className="text-sm text-[#0B69CA] hover:underline font-medium">
          Ver todas
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium rounded-l-lg">Código</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium text-right rounded-r-lg">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pieces.map((piece) => {
              const dateObj = new Date(piece.date)
              return (
                <tr key={piece.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-4 py-3 font-medium text-gray-900">{piece.code}</td>
                  <td className="px-4 py-3 text-gray-600">{piece.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      piece.status === 'PUBLISHED' ? 'bg-[#01A187]/10 text-[#01A187]' :
                      piece.status === 'DRAFT' ? 'bg-[#FDD617]/20 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {piece.status === 'PUBLISHED' ? 'Publicada' : piece.status === 'DRAFT' ? 'Borrador' : 'Archivada'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {dateObj.toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link 
                      href={`/admin/piezas/${piece.id}/editar`}
                      className="inline-flex items-center text-gray-400 hover:text-[#0B69CA] transition-colors"
                      title="Abrir ficha"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
