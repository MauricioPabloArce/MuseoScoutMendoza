import prisma from "@/lib/prisma"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Compass, Calendar, Tag, Info } from "lucide-react"
import Footer from "@/components/public/Footer"

/** Convierte el valor almacenado al texto visible según el tipo de campo */
function formatFieldValue(fv: any): string {
  const type: string = (fv.field?.type || 'text').toLowerCase()
  const raw: string = fv.value || ''
  if (!raw) return '—'

  // Booleano
  if (type === 'boolean') {
    const lower = raw.toLowerCase()
    if (lower === 'true' || lower === 'si' || lower === 'sí' || lower === '1') return 'Sí'
    if (lower === 'false' || lower === 'no' || lower === '0') return 'No'
    return raw
  }

  // Select — busca el label entre las opciones del campo
  if (type === 'select' && fv.field?.options?.length > 0) {
    const found = fv.field.options.find((o: any) => o.value === raw || o.label === raw)
    return found ? found.label : raw
  }

  return raw
}

export default async function PieceDetailPage({ params }: { params: Promise<{ registryCode: string }> }) {
  const resolvedParams = await params
  
  const piece = await prisma.museumPiece.findUnique({
    where: { registryCode: resolvedParams.registryCode },
    include: {
      category: true,
      media: true,
      fieldValues: {
        include: {
          field: {
            include: {
              section: true,
              options: { orderBy: { order: 'asc' } }  // para resolver selects
            }
          }
        }
      }
    }
  })

  if (!piece || piece.status !== 'PUBLISHED') {
    notFound()
  }

  // Prioridad: campo 'nombre' > campo 'titulo' > primer campo con valor
  const titleField = 
    piece.fieldValues.find((fv: any) => fv.field?.internalKey === 'nombre') ||
    piece.fieldValues.find((fv: any) => fv.field?.internalKey === 'nombre_pieza') ||
    piece.fieldValues.find((fv: any) => fv.field?.internalKey === 'titulo') ||
    piece.fieldValues.find((fv: any) => fv.value && fv.value.trim() !== '')
  const title = titleField?.value || piece.registryCode || 'Sin título'

  const imageField = piece.fieldValues.find((fv: any) => fv.field?.internalKey === 'imagen_principal')
  const mainImageUrl = imageField?.value || null

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans pb-20">
      <header className="bg-[#1f2937] text-[#f5f2eb] py-4 px-6 flex justify-between items-center shadow-md">
        <Link href="/" className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h1 className="text-xl font-serif font-bold tracking-wider hidden sm:block">MUSEO SCOUT MENDOZA</h1>
        </Link>
        <Link href="/catalogo" className="text-sm border border-gray-400 px-4 py-2 rounded hover:bg-[#374151] transition-colors flex items-center gap-2">
          <ArrowLeft size={16} /> Volver al Catálogo
        </Link>
      </header>

      <main className="max-w-6xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row border border-[#d5cdbc]">
          {/* Columna Imágenes */}
          <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-[#d5cdbc] min-h-[400px]">
            {mainImageUrl || (piece.media && piece.media.length > 0) ? (
              <div className="space-y-6 w-full flex flex-col items-center">
                {mainImageUrl && (
                  <img 
                    src={mainImageUrl} 
                    alt={title} 
                    className="max-w-full max-h-[600px] object-contain drop-shadow-xl border-4 border-white"
                  />
                )}
                {piece.media && piece.media.map((m, index) => (
                  <img 
                    key={m.id}
                    src={m.url} 
                    alt={`${title} - Imagen adicional ${index + 1}`} 
                    className="max-w-full max-h-[600px] object-contain drop-shadow-xl border-4 border-white"
                  />
                ))}
              </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Compass size={64} className="opacity-20 mb-4" />
                <p>Pieza sin registro fotográfico</p>
              </div>
            )}
          </div>

          {/* Columna Datos */}
          <div className="w-full md:w-1/2 p-8 lg:p-12">
            <div className="mb-8">
              <span className="inline-block text-sm font-mono font-bold text-[#374151] bg-gray-100 px-3 py-1 rounded-full border border-gray-200 mb-4">
                {piece.registryCode}
              </span>
              <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-2">{title}</h1>
              <div className="flex items-center gap-2 text-[#374151] font-medium">
                <Tag size={16} /> {piece.category.name}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-800 border-b border-[#d5cdbc] pb-2 flex items-center gap-2">
                <Info size={18} className="text-[#374151]" /> Detalles de la Pieza
              </h3>
              
              <div className="mb-6">
                <div className="grid grid-cols-1 gap-y-4">
                  <div className="bg-[#f5f2eb] p-4 rounded-lg">
                    <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Fecha de Ingreso</span>
                    <span className="text-gray-900 flex items-center gap-2">
                      <Calendar size={16} className="text-[#374151]" /> 
                      {new Date(piece.registeredAt).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {Object.entries(
                piece.fieldValues
                  .filter((fv: any) => fv.value && fv.value.trim() !== '' && fv.field?.name)
                  .reduce((acc: Record<string, any[]>, fv: any) => {
                    const sectionName = fv.field.section?.name || (fv.field.isGeneral ? 'Datos generales' : 'Datos específicos')
                    if (!acc[sectionName]) acc[sectionName] = []
                    acc[sectionName].push(fv)
                    return acc
                  }, {})
              ).map(([sectionName, values]) => (
                <div key={sectionName} className="mb-6">
                  {/* Encabezado de sección */}
                  <h4 className="text-sm font-bold text-[#374151] uppercase tracking-wider mb-3 pb-1 border-b border-[#d5cdbc]">{sectionName}</h4>
                  <div className="grid grid-cols-1 gap-y-3">
                    {(values as any[]).map(fv => (
                      <div key={fv.id} className="bg-[#f5f2eb] p-4 rounded-lg">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {fv.field.name}
                        </span>
                        <span className="text-gray-900 break-words whitespace-pre-wrap">
                          {formatFieldValue(fv)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {piece.fieldValues.length === 0 && (
                <p className="text-gray-500 italic text-sm">No hay detalles adicionales registrados.</p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
