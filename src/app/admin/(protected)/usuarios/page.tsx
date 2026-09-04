import { getUsersWithPermissions, createDummyUser } from "./actions"
import { getCategories } from "@/app/admin/(protected)/categorias/actions"
import UserPermissionsClient from "@/components/admin/UserPermissionsClient"
import { Users, UserPlus } from "lucide-react"

export default async function UsuariosPage() {
  const users = await getUsersWithPermissions()
  const categories = await getCategories()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="bg-[#e4decb] p-2 rounded-lg">
            <Users className="text-[#31573c]" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Usuarios y Accesos</h1>
        </div>
        
        <form action={createDummyUser}>
          <button type="submit" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded flex items-center gap-2 text-sm shadow-sm">
            <UserPlus size={16} /> Crear Usuario de Prueba
          </button>
        </form>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Administra los roles del personal y asigna permisos específicos por ramas del árbol categórico.
      </p>

      <UserPermissionsClient users={users} categories={categories} />
    </div>
  )
}
