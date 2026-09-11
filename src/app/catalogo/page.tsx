import prisma from "@/lib/prisma"
import Link from "next/link"
import Footer from "@/components/public/Footer"
import Header from "@/components/public/Header"

import CatalogFilters from "@/components/public/CatalogFilters"
import CatalogGrid from "@/components/public/CatalogGrid"
import CategorySidebar from "@/components/public/CategorySidebar"

export const dynamic = 'force-dynamic'

export default async function CatalogoPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;
  const categoria = typeof resolvedParams.categoria === 'string' ? resolvedParams.categoria : undefined;

  const allCategories = await prisma.category.findMany({
    where: { isPublished: true, isArchived: false },
    orderBy: { name: 'asc' },
    include: {
      leader: {
        include: {
          user: true
        }
      }
    }
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
  
  // Find subcategories to show
  const subcategoriesToShow = activeCategory 
    ? allCategories.filter(c => c.parentId === activeCategory.id)
    : allCategories.filter(c => !c.parentId);

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Top Search Bar */}
        <CatalogFilters initialQ={q} />

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
            <CategorySidebar categories={allCategories} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            {/* Category Banner */}
            {activeCategory && (
              <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {activeCategory.imageUrl && (
                  <div className="w-full h-48 sm:h-64 overflow-hidden bg-gray-100">
                    <img
                      src={activeCategory.imageUrl}
                      alt={activeCategory.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                )}
                <div className="p-6 sm:p-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-3">{activeCategory.name}</h2>
                  {activeCategory.leader && (
                    <div className="flex items-center gap-2 mb-4 bg-gray-50 inline-flex px-3 py-1.5 rounded-full border border-gray-200">
                      <div className="w-6 h-6 rounded-full bg-[#1d4328] flex items-center justify-center text-white text-xs font-bold">
                        {(activeCategory.leader.user?.name?.[0] || activeCategory.leader.user?.email?.[0] || 'L').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        Líder del proyecto: <span className="font-bold">{activeCategory.leader.user?.name || activeCategory.leader.user?.email}</span>
                      </span>
                    </div>
                  )}
                  {activeCategory.description && (
                    <p className="text-gray-600 leading-relaxed text-lg max-w-4xl">{activeCategory.description}</p>
                  )}
                </div>
              </div>
            )}
            {!activeCategory && !q && (
              <div className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Colecciones del Museo</h2>
                <p className="text-gray-600 text-lg">Explora nuestras categorías principales o busca piezas específicas.</p>
              </div>
            )}

            {/* Subcategories Grid */}
            {subcategoriesToShow.length > 0 && !q && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                  {activeCategory ? 'Subcategorías' : 'Categorías Principales'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subcategoriesToShow.map(sub => (
                    <Link href={`/catalogo?categoria=${sub.id}`} key={sub.id} className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all hover:-translate-y-1">
                      <div className="h-40 bg-gray-100 overflow-hidden relative">
                        {sub.imageUrl ? (
                          <img
                            src={sub.imageUrl}
                            alt={sub.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const el = e.target as HTMLImageElement
                              el.style.display = 'none'
                              el.parentElement!.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50"><span class="font-serif text-3xl font-bold opacity-30">${sub.prefix}</span></div>`
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 group-hover:bg-gray-100 transition-colors">
                            <span className="font-serif text-3xl font-bold opacity-30">{sub.prefix}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#1d4328] transition-colors">{sub.name}</h4>
                        {sub.leader && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-[10px] font-bold">
                              {(sub.leader.user?.name?.[0] || sub.leader.user?.email?.[0] || 'L').toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-600 font-medium truncate">
                              Líder: {sub.leader.user?.name || sub.leader.user?.email?.split('@')[0]}
                            </span>
                          </div>
                        )}
                        {sub.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{sub.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-2 w-full flex justify-between items-center">
                <span>Piezas {activeCategory ? `en ${activeCategory.name}` : (q ? 'Encontradas' : 'Destacadas')}</span>
                <span className="text-sm font-sans font-normal text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {pieces.length} pieza{pieces.length !== 1 ? 's' : ''}
                </span>
              </h3>
            </div>
            
            {pieces.length > 0 ? (
              <CatalogGrid pieces={pieces} />
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
                <p className="text-gray-500 text-lg">No hay piezas visibles en esta selección.</p>
              </div>
            )}
          </div>
          
        </div>
      </main>
      
      <Footer />
    </div>
  )
}
