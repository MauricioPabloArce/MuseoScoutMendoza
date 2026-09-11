import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import prisma from "@/lib/prisma"
import { Target, FileText, Download, User as UserIcon, ArrowLeft } from "lucide-react"
import ImageLightbox from "@/components/public/ImageLightbox"
import Link from "next/link"
import { notFound } from "next/navigation"

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase())
}

export default async function ProyectoEspecialDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const proj = await prisma.specialProject.findUnique({
    where: { id, isPublished: true },
    include: { 
      images: true,
      creator: {
        include: {
          user: true
        }
      }
    }
  })

  if (!proj) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
      <Header />
      
      <div className="bg-[#1f2937] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/proyectos-especiales" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8">
            <ArrowLeft size={20} /> Volver a proyectos
          </Link>
          
          {proj.theme && (
            <span className="inline-block px-4 py-1.5 bg-[#31573c] text-white text-xs font-bold uppercase tracking-widest rounded-full mb-6">
              {proj.theme}
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight">{proj.name}</h1>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-12 items-start relative z-20">
        
        {/* Main Content Area */}
        <div className="flex-1 max-w-4xl bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100">
          {proj.objective && (
            <div className="flex items-start gap-4 p-6 bg-[#f5f2eb] rounded-2xl mb-12">
              <Target className="text-[#31573c] shrink-0 mt-1" size={28} />
              <div>
                <h4 className="text-sm font-bold text-[#31573c] uppercase tracking-wider mb-2">Objetivo del Proyecto</h4>
                <p className="text-gray-800 text-lg leading-relaxed">{proj.objective}</p>
              </div>
            </div>
          )}
            
          {proj.content ? (
            <div className="mt-8 space-y-12">
              {JSON.parse(proj.content).map((block: any) => {
                if (block.type === 'text') {
                  return (
                    <div key={block.id} className="prose prose-lg prose-gray max-w-none">
                      <p className="whitespace-pre-line text-gray-600 leading-relaxed">{block.content}</p>
                    </div>
                  )
                }
                if (block.type === 'image') {
                  return (
                    <div key={block.id} className="w-14 h-14 rounded-md overflow-hidden shadow-sm bg-gray-100 mx-auto flex-shrink-0">
                      <ImageLightbox src={block.url} alt={block.caption || `${proj.name} imagen`} caption={block.caption} />
                    </div>
                  )
                }
                if (block.type === 'document') {
                  return (
                    <a 
                      key={block.id} 
                      href={block.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors group max-w-2xl mx-auto"
                    >
                      <div className="bg-white p-3 rounded-lg shadow-sm group-hover:shadow text-[#0B69CA]">
                        <FileText size={24} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-gray-800 line-clamp-1">{block.caption || "Documento Adjunto"}</h5>
                        <p className="text-sm text-gray-500 truncate">{block.url.split('/').pop()}</p>
                      </div>
                      <Download size={20} className="text-gray-400 group-hover:text-[#0B69CA] transition-colors" />
                    </a>
                  )
                }
                return null
              })}
            </div>
          ) : (
            <>
              {proj.description && (
                <div className="prose prose-lg prose-gray max-w-none">
                  <p className="whitespace-pre-line text-gray-600 leading-relaxed">{proj.description}</p>
                </div>
              )}

              {proj.images && proj.images.length > 0 && (
                <div className="mt-16">
                  <h4 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Galería y Documentos Adjuntos</h4>
                  
                  {proj.images.filter((img: any) => !isImage(img.url)).length > 0 && (
                    <div className="mb-10 grid grid-cols-1 gap-4">
                      {proj.images.filter((img: any) => !isImage(img.url)).map((file: any) => (
                        <a 
                          key={file.id} 
                          href={file.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors group"
                        >
                          <div className="bg-white p-3 rounded-lg shadow-sm group-hover:shadow text-[#0B69CA]">
                            <FileText size={24} />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-bold text-gray-800 line-clamp-1">{file.caption || "Documento Adjunto"}</h5>
                            <p className="text-sm text-gray-500 truncate">{file.url.split('/').pop()}</p>
                          </div>
                          <Download size={20} className="text-gray-400 group-hover:text-[#0B69CA] transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}

                  {proj.images.filter((img: any) => isImage(img.url)).length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {proj.images.filter((img: any) => isImage(img.url)).map((img: any, i: number) => (
                        <div key={img.id} className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 shadow-sm flex-shrink-0">
                          <ImageLightbox src={img.url} alt={img.caption || `${proj.name} imagen ${i+1}`} caption={img.caption || undefined} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar Info Area */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6 lg:sticky lg:top-24">
          {proj.creator?.user && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserIcon size={16} /> Responsable
              </h4>
              <div className="flex items-center gap-4">
                {proj.creator.user.image ? (
                  <img src={proj.creator.user.image} alt={proj.creator.user.name || "Usuario"} className="w-12 h-12 rounded-full border border-gray-200 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0B69CA]/10 text-[#0B69CA] flex items-center justify-center border border-[#0B69CA]/20">
                    <UserIcon size={24} />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">{proj.creator.user.name || "Miembro"}</p>
                  {proj.creator.teamPosition && (
                    <p className="text-sm text-[#0B69CA] font-medium">{proj.creator.teamPosition}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

      </main>

      <Footer />
    </div>
  )
}
