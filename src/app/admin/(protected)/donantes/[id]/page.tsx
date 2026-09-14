import { getDonor } from "../actions"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Edit, User, Mail, Phone, Calendar, Box } from "lucide-react"

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const donor = await getDonor(id)
  
  if (!donor) return notFound()

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/donantes" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Ficha de Donante
          </h1>
          <p className="text-gray-500">Detalles y piezas relacionadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Datos Personales</h2>
              <Link href={`/admin/donantes/${donor.id}/editar`} className="text-sm flex items-center gap-1 text-gray-500 hover:text-green-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                <Edit size={14} /> Editar
              </Link>
            </div>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
                  <User size={12} /> Apellido y Nombre
                </span>
                <div className="font-medium text-gray-900">{donor.displayName}</div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
                  <Mail size={12} /> Correo Electrónico
                </span>
                <div className="text-gray-900">{donor.email || <span className="text-gray-400 italic">No registrado</span>}</div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
                  <Phone size={12} /> Teléfono Móvil
                </span>
                <div className="text-gray-900">{donor.phone || <span className="text-gray-400 italic">No registrado</span>}</div>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
                  <Calendar size={12} /> Fecha de Registro
                </span>
                <div className="text-gray-900">{new Date(donor.createdAt).toLocaleDateString()}</div>
              </div>

              {donor.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider flex items-center gap-1 mb-1">
                    Notas / Observaciones
                  </span>
                  <div className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {donor.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Box size={18} /> Piezas Donadas ({donor.pieces.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Inventario</th>
                    <th className="px-4 py-3 font-medium">Categoría</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">Ver</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donor.pieces.map(piece => (
                    <tr key={piece.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{piece.registryCode}</td>
                      <td className="px-4 py-3 text-gray-600">{piece.category.name}</td>
                      <td className="px-4 py-3">
                        {piece.status === 'PUBLISHED' ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">Público</span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full font-medium">Borrador</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link 
                          href={`/admin/piezas/${piece.id}/editar`}
                          className="text-[#31573c] hover:underline"
                        >
                          Ir a la pieza
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {donor.pieces.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 italic">
                        Este donante no tiene piezas asociadas actualmente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
