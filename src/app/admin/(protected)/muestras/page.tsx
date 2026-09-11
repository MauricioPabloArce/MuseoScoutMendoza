import { getExhibitions } from "./actions"
import ExhibitionsClient from "@/components/admin/ExhibitionsClient"
import { Presentation } from "lucide-react"

export default async function MuestrasPage() {
  const exhibitions = await getExhibitions()

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <Presentation className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Muestras</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Administra las muestras y exhibiciones del museo.
      </p>

      <ExhibitionsClient initialData={exhibitions} />
    </div>
  )
}
