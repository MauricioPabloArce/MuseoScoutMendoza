import { getPieces } from "./actions"
import { getCategories } from "@/app/admin/(protected)/categorias/actions"
import { PackageSearch } from "lucide-react"
import PieceExplorer from "@/components/admin/PieceExplorer"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export default async function PiezasPage() {
  const pieces = await getPieces()
  const categories = await getCategories()
  const session = await auth()
  let userRole = 'VIEWER'
  if (session?.user?.id) {
    const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
    userRole = member?.role || 'VIEWER'
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#e4decb] p-2 rounded-lg">
            <PackageSearch className="text-[#31573c]" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Acervo Museológico</h1>
            <p className="text-gray-600">Gestión de piezas y códigos de registro.</p>
          </div>
        </div>
      </div>

      <PieceExplorer categories={categories} pieces={pieces} userRole={userRole} />
    </div>
  )
}
