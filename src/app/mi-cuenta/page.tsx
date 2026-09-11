import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { User as UserIcon, Calendar, Mail, CheckCircle2 } from "lucide-react"
import { revalidatePath } from "next/cache"

export default async function MiCuentaPage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/ingresar?callbackUrl=/mi-cuenta')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) {
    redirect('/ingresar')
  }

  const dateJoined = new Intl.DateTimeFormat('es-AR', {
    month: 'long',
    year: 'numeric'
  }).format(user.createdAt)

  async function updatePreferences(formData: FormData) {
    'use server'
    const session = await auth()
    if (!session?.user?.id) return

    const wantsEmails = formData.get('emailMarketingConsent') === 'on'
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailMarketingConsent: wantsEmails,
        emailMarketingConsentAt: wantsEmails ? new Date() : null,
        emailMarketingConsentSource: wantsEmails ? 'MI_CUENTA' : null,
        emailUnsubscribedAt: wantsEmails ? null : new Date(),
      }
    })

    revalidatePath('/mi-cuenta')
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
      <Header />
      
      <div className="bg-[#1f2937] text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h1 className="text-3xl font-serif font-bold mb-2">Mi Cuenta</h1>
          <p className="text-gray-400">Gestioná tu perfil y tus preferencias</p>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative z-20">
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-8 sm:p-12">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              {user.image ? (
                <img src={user.image} alt={user.name || 'Perfil'} className="w-32 h-32 rounded-full shadow-md object-cover border-4 border-white" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-[#0B69CA]/10 text-[#0B69CA] flex items-center justify-center border-4 border-white shadow-md">
                  <UserIcon size={48} />
                </div>
              )}
              
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{user.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 mb-2 justify-center sm:justify-start">
                  <Mail size={16} />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 justify-center sm:justify-start">
                  <Calendar size={16} />
                  <span>Miembro de la comunidad desde {dateJoined}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Mail className="text-[#31573c]" /> Preferencias de Comunicación
            </h3>
            
            <p className="text-gray-600 mb-8">
              Queremos mantenerte informado sobre nuevas incorporaciones al acervo, eventos especiales y proyectos del Museo Scout Mendoza. ¡No te enviaremos spam!
            </p>

            <form action={updatePreferences} className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="flex items-center h-6 mt-1">
                  <input
                    id="emailMarketingConsent"
                    name="emailMarketingConsent"
                    type="checkbox"
                    defaultChecked={user.emailMarketingConsent}
                    className="h-5 w-5 text-[#31573c] focus:ring-[#31573c] border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="emailMarketingConsent" className="font-medium text-gray-900 text-lg cursor-pointer select-none">
                    Quiero recibir novedades del Museo Scout Mendoza
                  </label>
                  <p className="text-gray-500 mt-1">
                    Recibirás correos electrónicos periódicos. Podés darte de baja en cualquier momento.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#31573c] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#23412c] transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Guardar Preferencias
                </button>
              </div>
            </form>

          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
