import { getCategories } from "@/app/admin/(protected)/categorias/actions"
import PieceForm from "@/components/admin/PieceForm"
import { PackagePlus } from "lucide-react"

type FlatCat = { id: string; name: string; prefix: string; depth: number; hasChildren: boolean }

function flattenCategories(categories: any[], parentId: string | null = null, depth = 0): FlatCat[] {
  let result: FlatCat[] = []
  const children = categories.filter(c => c.parentId === parentId)
  
  for (const child of children) {
    const hasChildren = categories.some(c => c.parentId === child.id)
    result.push({
      id: child.id,
      name: `${'— '.repeat(depth)}${child.name}`,
      prefix: child.prefix,
      depth,
      hasChildren
    })
    result = result.concat(flattenCategories(categories, child.id, depth + 1))
  }
  return result
}

export default async function CreatePiecePage({ searchParams }: { searchParams: Promise<{ categoryId?: string }> }) {
  const allCategories = await getCategories()
  const structuredCategories = flattenCategories(allCategories)
  const resolvedParams = await searchParams

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <PackagePlus className="text-[#31573c]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Registrar Nueva Pieza</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Completa el formulario para ingresar un nuevo objeto al acervo histórico. El código registral se generará automáticamente.
      </p>

      <PieceForm categories={structuredCategories as any} initialCategoryId={resolvedParams.categoryId} />
    </div>
  )
}
