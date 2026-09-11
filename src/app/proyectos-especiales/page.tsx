import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import prisma from "@/lib/prisma"
import { Target, FileText, Download } from "lucide-react"

// Función auxiliar para detectar si una URL es una imagen
function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase())
}

export default async function ProyectosEspecialesPublicPage() {
  const projects = await prisma.specialProject.findMany({
    where: { isPublished: true },
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[#f9fafb] flex flex-col font-sans">
      <Header />
      
      <div className="bg-[#1f2937] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')] bg-repeat" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">Proyectos Especiales</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            Iniciativas únicas, investigaciones detalladas y colaboraciones extraordinarias que expanden los horizontes del Museo Scout Mendoza.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-20">
        {projects.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-lg">Próximamente estaremos compartiendo nuevos proyectos especiales.</p>
          </div>
        ) : (
          <div className="space-y-24">
            {projects.map((proj, idx) => (
              <article key={proj.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 md:p-12 lg:p-16">
                  <div className="max-w-3xl mb-12">
                    {proj.theme && (
                      <span className="inline-block px-4 py-1.5 bg-[#31573c] text-white text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                        {proj.theme}
                      </span>
                    )}
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{proj.name}</h2>
                    
                    {proj.objective && (
                      <div className="flex items-start gap-4 p-6 bg-[#f5f2eb] rounded-2xl mb-8">
                        <Target className="text-[#31573c] shrink-0 mt-1" size={28} />
                        <div>
                          <h4 className="text-sm font-bold text-[#31573c] uppercase tracking-wider mb-2">Objetivo del Proyecto</h4>
                          <p className="text-gray-800 text-lg leading-relaxed">{proj.objective}</p>
                        </div>
                      </div>
                    )}
                    
                    {proj.description && (
                      <div className="prose prose-lg prose-gray max-w-none">
                        <p className="whitespace-pre-line text-gray-600 leading-relaxed">{proj.description}</p>
                      </div>
                    )}
                  </div>

                  {proj.images && proj.images.length > 0 && (
                    <div className="mt-16">
                      <h4 className="text-xl font-bold text-gray-900 mb-8 border-b pb-4">Galería y Documentos Adjuntos</h4>
                      
                      {/* Documentos */}
                      {proj.images.filter(img => !isImage(img.url)).length > 0 && (
                        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {proj.images.filter(img => !isImage(img.url)).map(file => (
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

                      {/* Imágenes */}
                      {proj.images.filter(img => isImage(img.url)).length > 0 && (
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                          {proj.images.filter(img => isImage(img.url)).map((img, i) => (
                          <figure key={img.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-100">
                            <img 
                              src={img.url} 
                              alt={img.caption || `${proj.name} imagen ${i+1}`}
                              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {img.caption && (
                              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <p className="text-sm md:text-base font-medium">{img.caption}</p>
                              </figcaption>
                            )}
                          </figure>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
