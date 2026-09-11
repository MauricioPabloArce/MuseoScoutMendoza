import prisma from "@/lib/prisma"
import CrearCampanaClient from "./CrearCampanaClient"

export default async function CrearCampanaPage() {
  const countSuscriptos = await prisma.user.count({ 
    where: { emailMarketingConsent: true } 
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Crear Campaña de Correo</h1>
        <p className="text-gray-500 mt-1">Construí tu mensaje y envialo a los suscriptores activos</p>
      </div>

      <CrearCampanaClient countSuscriptos={countSuscriptos} />
    </div>
  )
}
