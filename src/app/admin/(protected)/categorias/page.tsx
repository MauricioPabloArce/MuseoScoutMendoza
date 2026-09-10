import { getCategories, getCollaborators } from "./actions"
import { getSections } from "@/app/admin/(protected)/campos/actions"
import CategoryTree from "@/components/admin/CategoryTree"
import { Layers } from "lucide-react"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function CategoriasPage() {
  const categories = await getCategories()
  const allSections = await getSections()
  const members = await getCollaborators()
  const session = await auth()
  let userRole = 'VIEWER'
  if (session?.user?.id) {
    const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
    userRole = member?.role || 'VIEWER'
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <Layers className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Proyectos (Categorías)</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Administra la estructura de proyectos y su taxonomía jerárquica.
      </p>

      <CategoryTree data={categories} availableSections={allSections} members={members} userRole={userRole} />
    </div>
  )
}
