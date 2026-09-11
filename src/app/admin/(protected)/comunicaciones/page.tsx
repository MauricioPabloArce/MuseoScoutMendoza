import prisma from "@/lib/prisma"
import { Users, Mail, CheckCircle, Plus } from "lucide-react"
import Link from "next/link"

export default async function ComunicacionesPage() {
  const [totalUsers, subscribedUsers, campaigns] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailMarketingConsent: true } }),
    prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' } })
  ])

  const sentCampaigns = campaigns.filter(c => c.status === 'ENVIADA').length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comunicaciones y Novedades</h1>
          <p className="text-gray-500 mt-1">Gestión de la comunidad y envíos masivos</p>
        </div>
        <Link href="/admin/comunicaciones/crear" className="bg-[#31573c] text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-[#23412c]">
          <Plus size={16} /> Crear Campaña
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Usuarios Registrados</p>
            <p className="text-2xl font-bold">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Suscriptos a Novedades</p>
            <p className="text-2xl font-bold">{subscribedUsers}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Mail size={24} /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Campañas Enviadas</p>
            <p className="text-2xl font-bold">{sentCampaigns}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-800">Historial de Campañas</h2>
        </div>
        
        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-lg mb-2">Todavía no realizaste ninguna campaña.</p>
            <p className="text-sm">Creá tu primera comunicación para mantener informada a la comunidad del museo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-sm text-gray-500 border-b border-gray-200">
                  <th className="px-6 py-3 font-medium">Campaña</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium">Destinatarios</th>
                  <th className="px-6 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{camp.internalName}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{camp.subject}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        camp.status === 'ENVIADA' ? 'bg-green-100 text-green-700' :
                        camp.status === 'BORRADOR' ? 'bg-gray-100 text-gray-700' :
                        camp.status === 'ENVIANDO' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{camp.totalRecipients}</p>
                      {camp.status === 'ENVIADA' && <p className="text-xs text-green-600">{camp.sentCount} entregados</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(camp.createdAt).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
