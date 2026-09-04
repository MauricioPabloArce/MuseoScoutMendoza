import { getCategories } from "./actions"
import { getFields } from "@/app/admin/(protected)/campos/actions"
import CategoryTree from "@/components/admin/CategoryTree"
import { Layers } from "lucide-react"

export default async function CategoriasPage() {
  const categories = await getCategories()
  const allFields = await getFields()
  const specificFields = allFields.filter(f => !f.isGeneral)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <Layers className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Categorías y Taxonomía</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Administra la estructura jerárquica del acervo del museo.
      </p>

      <CategoryTree data={categories} availableFields={specificFields} />
    </div>
  )
}
