import { getSections } from "./actions"
import SectionManager from "@/components/admin/SectionManager"
import { Layers } from "lucide-react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function CamposPage() {
  const sections = await getSections()
  const session = await auth()
  let userId = ''
  let userRole = 'VIEWER'
  if (session?.user?.id) {
    userId = session.user.id
    const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
    userRole = member?.role || 'VIEWER'
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <Layers className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Secciones y Campos</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Diseña las Secciones y los Campos Dinámicos que conforman la Ficha Museológica. Agrega y quita campos dentro de cada sección de forma ordenada.
      </p>

      <SectionManager sections={sections} userId={userId} userRole={userRole} />
    </div>
  )
}
