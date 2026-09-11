import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import { ShieldAlert, LogIn, ArrowRight } from "lucide-react"
import { signIn } from "@/auth"

export default function IngresarPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const callbackUrl = typeof searchParams?.callbackUrl === 'string' ? searchParams.callbackUrl : '/'

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-w-2xl w-full">
          <div className="p-8 md:p-12 text-center">
            
            <div className="mx-auto w-20 h-20 bg-[#f5f2eb] rounded-full flex items-center justify-center mb-8">
              <ShieldAlert size={40} className="text-[#31573c]" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4 leading-tight">
              DESCUBRÍ EL ACERVO DEL<br />MUSEO SCOUT MENDOZA
            </h1>
            
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Para explorar nuestra colección digital y los proyectos especiales necesitás ingresar con tu cuenta de Google.
            </p>

            <form
              action={async () => {
                'use server'
                await signIn('google', { redirectTo: callbackUrl })
              }}
            >
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-[#0B69CA] text-white font-bold py-4 px-8 rounded-xl hover:bg-[#0957A8] transition-colors shadow-md text-lg"
              >
                <LogIn size={24} />
                Continuar con Google
                <ArrowRight size={20} className="ml-2" />
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-gray-100 text-sm text-gray-500 max-w-sm mx-auto">
              <p className="mb-2 font-medium text-gray-700">Registrarte es gratuito.</p>
              <p>Al registrarte podrás acceder al acervo digital, conocer nuestros proyectos y próximamente participar de nuevas experiencias dentro del Museo Scout Mendoza.</p>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
