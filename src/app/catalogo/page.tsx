import prisma from "@/lib/prisma"
import Link from "next/link"
import Footer from "@/components/public/Footer"

import CatalogFilters from "@/components/public/CatalogFilters"
import CatalogGrid from "@/components/public/CatalogGrid"

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categoria = typeof resolvedParams.categoria === 'string' ? resolvedParams.categoria : undefined;

  const allCategories = await prisma.category.findMany({
    where: { isPublished: true, isArchived: false },
    orderBy: { name: 'asc' }
  })

  const getDescendantIds = (parentId: string): string[] => {
    const children = allCategories.filter(c => c.parentId === parentId)
    return children.reduce((acc, child) => {
      return [...acc, child.id, ...getDescendantIds(child.id)]
    }, [] as string[])
  }

  // Generar indentación en lugar de rutas completas para el dropdown
  const getCategoryIndentName = (categoryId: string, level = 0): string => {
    const cat = allCategories.find(c => c.id === categoryId)
    if (!cat) return ""
    if (!cat.parentId) return cat.name
    return getCategoryIndentName(cat.parentId, level + 1)
  }

  const structuredCategories = allCategories.map(cat => {
    let depth = 0
    let curr = cat
    while (curr.parentId) {
      depth++
      const parent = allCategories.find(c => c.id === curr.parentId)
      if (parent) curr = parent
      else break
    }
    return {
      ...cat,
      indentName: `${'\u00A0\u00A0\u00A0\u00A0'.repeat(depth)}${cat.name}`,
      depth
    }
  }).sort((a, b) => {
    // Para mantener el orden jerárquico, necesitamos reconstruir la ruta completa
    const getPath = (id: string): string => {
      const c = allCategories.find(x => x.id === id)
      if(!c) return ""
      if(!c.parentId) return c.name
      return getPath(c.parentId) + " > " + c.name
    }
    return getPath(a.id).localeCompare(getPath(b.id))
  })

  const whereClause: any = { status: 'PUBLISHED' };
  if (categoria) {
    const descendantIds = getDescendantIds(categoria)
    whereClause.categoryId = { in: [categoria, ...descendantIds] }
  }
  
  if (q) {
    whereClause.OR = [
      { title: { contains: q } },
      { registryCode: { contains: q } }
    ];
  }

  const pieces = await prisma.museumPiece.findMany({
    where: whereClause,
    orderBy: { registeredAt: 'desc' },
    include: { 
      category: true, 
      media: true,
      fieldValues: {
        include: { field: true }
      }
    }
  })

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans">
      <header className="bg-[#1f2937] text-[#f5f2eb] py-4 px-6 flex justify-between items-center shadow-md">
        <Link href="/" className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-serif font-bold tracking-wider hidden sm:block">MUSEO SCOUT MENDOZA</h1>
        </Link>
        <Link href="/" className="text-sm border border-gray-400 px-4 py-2 rounded hover:bg-[#374151] transition-colors">
          Volver al Inicio
        </Link>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6 flex flex-col">
        <CatalogFilters categories={structuredCategories} initialQ={q} />
        
        <div>
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 hidden">Catálogo General</h2>
          <CatalogGrid pieces={pieces} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
