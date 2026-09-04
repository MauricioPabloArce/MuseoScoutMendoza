import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { updateProfile, uploadProfilePicture } from "./actions"
import { User, Save, Upload, Image as ImageIcon } from "lucide-react"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) return <div className="p-8 text-center text-red-500">No autorizado. Inicie sesión.</div>

  let user = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <h2 className="text-xl font-bold">Error de Base de Datos</h2>
        <p>No se pudieron cargar tus datos. Es probable que la base de datos no esté actualizada.</p>
        <p className="mt-4 text-sm text-gray-500">Asegúrate de ejecutar <code>npx prisma db push</code> en el servidor con la aplicación apagada.</p>
      </div>
    )
  }

  if (!user) return <div className="p-8 text-center text-red-500">Usuario no encontrado en la base de datos.</div>

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <User className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Actualiza tu información personal, foto de perfil y datos de contacto.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Foto de perfil */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 mb-4 bg-gray-50 flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-gray-300" />
              )}
            </div>
            
            <form action={uploadProfilePicture} className="w-full flex flex-col gap-2">
              <label className="cursor-pointer bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded w-full flex items-center justify-center gap-2 text-sm transition-colors text-center">
                <Upload size={16} /> Seleccionar Foto
                <input type="file" name="file" accept="image/*" className="hidden" />
              </label>
              <button type="submit" className="bg-[#31573c] text-white py-1.5 px-4 rounded text-sm hover:bg-[#25452d]">
                Subir
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2 text-center">Soporta JPG, PNG o WebP. Máx 5MB.</p>
          </div>
        </div>

        {/* Datos de contacto */}
        <div className="col-span-2">
          <form action={updateProfile} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" 
                  name="name"
                  defaultValue={user.name || ""}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  disabled
                  defaultValue={user.email || ""}
                  className="w-full border border-gray-200 rounded p-2 bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input 
                  type="tel" 
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="+54 9 261 ..."
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección / Localidad</label>
                <input 
                  type="text" 
                  name="address"
                  defaultValue={user.address || ""}
                  placeholder="Mendoza, Argentina"
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Biografía / Notas</label>
                <textarea 
                  name="bio"
                  rows={4}
                  defaultValue={user.bio || ""}
                  placeholder="Escribe algo sobre ti, tu rol en el museo o tu experiencia Scout..."
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit" 
                className="bg-[#1d4328] hover:bg-[#255633] text-white px-6 py-2 rounded flex items-center gap-2 font-medium shadow-sm transition-colors"
              >
                <Save size={18} /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
