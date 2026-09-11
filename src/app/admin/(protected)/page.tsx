import { auth } from "@/auth"
import DashboardClient from "@/components/admin/dashboard/DashboardClient"

export default async function AdminDashboard() {
  const session = await auth()
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 font-ubuntu bg-[#f9fafb] min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard del Acervo</h1>
          <p className="text-gray-500">Resumen general y análisis de la colección del Museo Scout Mendoza</p>
        </div>
      </div>
      
      <DashboardClient />
    </div>
  )
}
