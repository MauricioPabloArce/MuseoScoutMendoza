import { getCategories } from "@/app/admin/(protected)/categorias/actions"
import { getPiece } from "@/app/admin/(protected)/piezas/actions"
import PieceForm from "@/components/admin/PieceForm"
import { PackagePlus } from "lucide-react"
import { notFound } from "next/navigation"

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

export default async function EditPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  
  const piece = await getPiece(resolvedParams.id)
  
  if (!piece) {
    notFound()
  }

  const allCategories = await getCategories()
  const structuredCategories = flattenCategories(allCategories)

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e4decb] p-2 rounded-lg">
          <PackagePlus className="text-[#31573c]" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Editar Pieza</h1>
          <p className="text-gray-500 font-mono mt-1">{piece.registryCode}</p>
        </div>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Modifica los datos de la pieza. Nota: si cambias la categoría taxonómica, se conservarán los valores de los campos pero podrían no mostrarse si no aplican a la nueva categoría.
      </p>

      <PieceForm categories={structuredCategories as any} initialData={piece} />
    </div>
  )
}
