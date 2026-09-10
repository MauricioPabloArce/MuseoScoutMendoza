import { signIn } from "@/auth"
import { Tent } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#eae6df]">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1533630248439-5095368a5c37?auto=format&fit=crop&q=80")', // Placeholder de foto histórica
          opacity: 0.15,
          filter: 'sepia(60%)'
        }}
      />
      
      <div className="z-10 w-full max-w-md p-8 bg-[#f5f2eb] rounded-xl shadow-2xl border border-[#d5cdbc]">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-4">
            <img src="/logo.png" alt="Museo Scout Mendoza" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-gray-800 tracking-wide">
            MUSEO SCOUT MENDOZA
          </h1>
          <p className="text-gray-600 mt-1 italic text-sm">"Hno Gris Cayetano Ponso"</p>
          <p className="text-gray-500 mt-2 font-medium">Área Administrativa</p>
        </div>

        <div className="space-y-6">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/admin" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 bg-[#374151] hover:bg-[#4b5563] text-white py-3 px-4 rounded-md transition-colors font-medium shadow-sm"
            >
              <svg className="w-5 h-5 bg-white rounded-full p-[2px]" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Iniciar sesión con Google
            </button>
          </form>

          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#d5cdbc]" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#f5f2eb] text-gray-500">O para pruebas locales</span>
                </div>
              </div>

              <form
                action={async () => {
                  "use server"
                  await signIn("credentials", { redirectTo: "/admin" })
                }}
              >
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-md transition-colors font-medium shadow-sm"
                >
                  Entrar en Modo Desarrollo
                </button>
              </form>
            </>
          )}
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#d5cdbc]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#f5f2eb] text-gray-500">Acceso restringido</span>
              </div>
            </div>
          
          <div className="text-center text-sm text-gray-500">
            Si no tienes permisos de acceso, contacta a la administración del museo.
          </div>
        </div>
      </div>
      
      {/* Footer minimalista */}
      <div className="absolute bottom-4 text-center text-sm text-gray-500 w-full z-10">
        © {new Date().getFullYear()} Museo Scout Mendoza. Todos los derechos reservados.
      </div>
    </div>
  )
}
