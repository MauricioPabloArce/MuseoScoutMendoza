import prisma from "@/lib/prisma"
import Link from "next/link"
import Footer from "@/components/public/Footer"

import CatalogFilters from "@/components/public/CatalogFilters"
import CatalogGrid from "@/components/public/CatalogGrid"
import CategorySidebar from "@/components/public/CategorySidebar"

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

  // Get active category name for breadcrumb/title
  const activeCategory = categoria ? allCategories.find(c => c.id === categoria) : null;

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans flex flex-col">
      <header className="bg-[#1f2937] text-[#f5f2eb] py-4 px-6 flex justify-between items-center shadow-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-4 group">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <h1 className="text-xl font-serif font-bold tracking-wider hidden sm:block">MUSEO SCOUT MENDOZA</h1>
        </Link>
        <Link href="/" className="text-sm border border-gray-500 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-800 hover:text-white transition-colors">
          Volver al Inicio
        </Link>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Top Search Bar */}
        <CatalogFilters initialQ={q} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <CategorySidebar categories={allCategories} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {activeCategory ? `Explorando: ${activeCategory.name}` : 'Catálogo General'}
                <span className="ml-3 text-sm font-sans font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {pieces.length} pieza{pieces.length !== 1 ? 's' : ''}
                </span>
              </h2>
            </div>
            
            <CatalogGrid pieces={pieces} />
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
