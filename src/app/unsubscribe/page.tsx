import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { MailX, ArrowRight, ShieldCheck } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams?: { email?: string; t?: string }
}) {
  const email = searchParams?.email
  const token = searchParams?.t

  let success = false
  let errorMsg = ""

  if (!email || !token) {
    errorMsg = "Enlace inválido o incompleto."
  } else {
    // Basic verification token using Auth.js secret or standard NEXTAUTH_SECRET
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "default_secret"
    const expectedToken = crypto.createHash('sha256').update(email + secret).digest('hex')

    if (token !== expectedToken) {
      errorMsg = "El enlace de seguridad no es válido o ha expirado."
    } else {
      try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (user) {
          await prisma.user.update({
            where: { email },
            data: {
              emailMarketingConsent: false,
              emailUnsubscribedAt: new Date(),
            }
          })
          success = true
        } else {
          errorMsg = "No se encontró ningún usuario con este correo electrónico."
        }
      } catch (e) {
        errorMsg = "Ocurrió un error al intentar procesar la baja."
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-24 flex items-center justify-center relative z-20">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 max-w-2xl w-full">
          <div className="p-8 md:p-12 text-center">
            
            {success ? (
              <>
                <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-8">
                  <ShieldCheck size={40} className="text-green-600" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4">
                  Baja Exitosa
                </h1>
                
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  El correo <strong>{email}</strong> ha sido removido de nuestra lista de novedades. Ya no recibirás más comunicaciones masivas de nuestra parte.
                </p>
              </>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-8">
                  <MailX size={40} className="text-red-500" />
                </div>
                
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-4">
                  No pudimos procesar la baja
                </h1>
                
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  {errorMsg}
                </p>
              </>
            )}

            <div className="mt-8 flex justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-[#0B69CA] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#0957A8] transition-colors shadow-sm"
              >
                Volver al Inicio
                <ArrowRight size={18} />
              </Link>
            </div>
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
