import { getDonors } from "./actions"
import Link from "next/link"
import { Search, Plus, Eye, CheckCircle, XCircle } from "lucide-react"

export default async function DonorsPage({ searchParams }: { searchParams: Promise<{ q?: string, page?: string }> }) {
  const params = await searchParams
  const q = params.q || ""
  const page = parseInt(params.page || "1")

  const { donors, total, pages } = await getDonors(page, 20, q)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maestro de Donantes</h1>
          <p className="text-gray-500">Gestiona los donantes y sus piezas relacionadas ({total} en total)</p>
        </div>
        <Link 
          href="/admin/donantes/nuevo" 
          className="flex items-center gap-2 px-4 py-2 bg-[#1d4328] hover:bg-[#15341c] text-white rounded-md font-medium transition-colors"
        >
          <Plus size={18} /> Nuevo donante
        </Link>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4">
        <form className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre, email o teléfono..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-[#31573c] focus:border-[#31573c]"
            />
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Donante</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Piezas Donadas</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donors.map(donor => (
                <tr key={donor.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {donor.displayName}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {donor.email && <div className="text-xs">{donor.email}</div>}
                    {donor.phone && <div className="text-xs">{donor.phone}</div>}
                    {!donor.email && !donor.phone && <span className="text-gray-400 italic">Sin contacto</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-green-800 bg-green-100 rounded-full">
                      {donor._count.pieces} piezas
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {donor.active ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium text-xs">
                        <CheckCircle size={14} /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 font-medium text-xs">
                        <XCircle size={14} /> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link 
                      href={`/admin/donantes/${donor.id}`}
                      className="inline-flex items-center justify-center p-2 text-green-700 bg-green-50 hover:bg-green-100 rounded transition-colors"
                      title="Ver ficha"
                    >
                      <Eye size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
              {donors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron donantes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {pages > 1 && (
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <Link 
              key={p} 
              href={`?page=${p}${q ? `&q=${q}` : ''}`}
              className={`w-8 h-8 flex items-center justify-center rounded ${p === page ? 'bg-[#31573c] text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
