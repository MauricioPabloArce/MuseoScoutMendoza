import prisma from "@/lib/prisma"
import Link from "next/link"
import Footer from "@/components/public/Footer"
import Header from "@/components/public/Header"

import CatalogFilters from "@/components/public/CatalogFilters"
import CatalogGrid from "@/components/public/CatalogGrid"
import CategorySidebar from "@/components/public/CategorySidebar"
import SafeImage from "@/components/public/SafeImage"
import { getFieldsForCategory } from "@/app/admin/(protected)/piezas/actions"

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

  // Fetch dynamic fields for the selected category
  let dynamicFields: any[] = []
  if (categoria) {
    dynamicFields = await getFieldsForCategory(categoria)
  }

  // Generate dynamic where clause for fieldValues
  const dynamicFilters = Object.keys(resolvedParams).filter(k => k.startsWith('field_'))
  const fieldFilters = dynamicFilters.map(k => ({
    fieldValues: {
      some: {
        fieldId: k.replace('field_', ''),
        value: resolvedParams[k] as string
      }
    }
  }))

  const whereClause: any = { status: 'PUBLISHED' };
  if (categoria) {
    const descendantIds = getDescendantIds(categoria)
    whereClause.categoryId = { in: [categoria, ...descendantIds] }
  }
  
  const searchConditions = []
  if (q) {
    searchConditions.push({
      OR: [
        { registryCode: { contains: q } },
        {
          fieldValues: {
            some: {
              value: { contains: q }
            }
          }
        }
      ]
    })
  }

  if (fieldFilters.length > 0 || searchConditions.length > 0) {
    whereClause.AND = [...searchConditions, ...fieldFilters]
  }

  const sortBy = typeof resolvedParams.sort === 'string' ? resolvedParams.sort : 'recent';

  let pieces = await prisma.museumPiece.findMany({
    where: whereClause,
    include: { 
      category: {
        include: {
          sections: {
            orderBy: { order: 'asc' }
          }
        }
      }, 
      media: true,
      fieldValues: {
        include: { 
          field: {
            include: { options: true }
          }
        }
      }
    }
  })

  // Extract piece title logic for sorting
  const getPieceTitleString = (piece: any) => {
    let fv = piece.fieldValues?.find((fv: any) => {
      const key = fv.field?.internalKey?.toLowerCase() || '';
      const name = fv.field?.name?.toLowerCase() || '';
      return ['nombre', 'nombre_pieza', 'titulo', 'título'].includes(key) ||
             ['nombre', 'nombre de la pieza', 'titulo', 'título'].includes(name);
    });

    if (!fv) {
      fv = piece.fieldValues?.find((fv: any) => {
        const name = fv.field?.name?.toLowerCase() || '';
        return name.includes('nombre') || name.includes('titulo') || name.includes('título');
      });
    }

    if (!fv) {
      fv = piece.fieldValues?.find((fv: any) =>
        fv.value && fv.value.trim() !== '' && isNaN(Number(fv.value.trim()))
      );
    }
    
    return fv?.value || piece.registryCode || "Sin Título"
  }

  // Apply JS sorting
  if (sortBy === 'name_asc') {
    pieces.sort((a, b) => getPieceTitleString(a).localeCompare(getPieceTitleString(b), 'es', { sensitivity: 'base' }))
  } else if (sortBy === 'name_desc') {
    pieces.sort((a, b) => getPieceTitleString(b).localeCompare(getPieceTitleString(a), 'es', { sensitivity: 'base' }))
  } else if (sortBy === 'code_asc') {
    pieces.sort((a, b) => a.registryCode.localeCompare(b.registryCode))
  } else if (sortBy === 'code_desc') {
    pieces.sort((a, b) => b.registryCode.localeCompare(a.registryCode))
  } else if (sortBy.startsWith('field_')) {
    const fieldId = sortBy.replace('field_', '')
    pieces.sort((a, b) => {
      const valA = a.fieldValues?.find((fv: any) => fv.fieldId === fieldId)?.value || ''
      const valB = b.fieldValues?.find((fv: any) => fv.fieldId === fieldId)?.value || ''
      const numA = Number(valA)
      const numB = Number(valB)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return valA.localeCompare(valB, 'es', { sensitivity: 'base' })
    })
  } else {
    // Default to recent
    pieces.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
  }

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
        <CatalogFilters initialQ={q} categoryFields={dynamicFields} currentSort={sortBy} searchParams={resolvedParams} />

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
                  <div className="w-full h-48 sm:h-64 overflow-hidden bg-white">
                    <SafeImage
                      src={activeCategory.imageUrl}
                      alt={activeCategory.name}
                      className="w-full h-full object-contain p-4"
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
                          <SafeImage
                            src={sub.imageUrl}
                            alt={sub.name}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 bg-white"
                            fallbackPrefix={sub.prefix}
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
