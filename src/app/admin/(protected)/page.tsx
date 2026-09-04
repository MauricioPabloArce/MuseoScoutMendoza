import { auth, signOut } from "@/auth"

export default async function AdminDashboard() {
  const session = await auth()
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Dashboard Administrativo</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-2">Bienvenido, {session?.user?.name}</h2>
        <p className="text-gray-600 mb-4">Has iniciado sesión correctamente con el correo: {session?.user?.email}</p>
        
        <form action={async () => {
          "use server"
          await signOut({ redirectTo: "/" })
        }}>
          <button type="submit" className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded transition-colors">
            Cerrar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}
