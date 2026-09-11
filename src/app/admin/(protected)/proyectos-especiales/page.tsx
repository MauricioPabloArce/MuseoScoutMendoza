import { getSpecialProjects } from "./actions"
import SpecialProjectsClient from "@/components/admin/SpecialProjectsClient"
import { Sparkles } from "lucide-react"

export default async function SpecialProjectsPage() {
  const projects = await getSpecialProjects()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <Sparkles className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Proyectos Especiales</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Administra los proyectos especiales. Solo tú (el creador) o los administradores pueden editar o eliminar tus proyectos.
      </p>

      <SpecialProjectsClient initialData={projects} />
    </div>
  )
}
