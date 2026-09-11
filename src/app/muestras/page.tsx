import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import prisma from "@/lib/prisma"
import { Calendar, MapPin } from "lucide-react"

export default async function MuestrasPublicPage() {
  const exhibitions = await prisma.exhibition.findMany({
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="min-h-screen bg-[#f5f2eb] flex flex-col font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1f2937] mb-4">Muestras y Exhibiciones</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora las colecciones temporales y permanentes que cuentan la historia del escultismo a través de sus objetos y vivencias.
          </p>
        </div>

        {exhibitions.length === 0 ? (
          <div className="text-center py-24 bg-white/50 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-lg">Actualmente no hay muestras disponibles. Vuelve pronto.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {exhibitions.map((ex, idx) => (
              <article key={ex.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                {/* Image Gallery (showing first max 4 images for a dynamic look) */}
                {ex.images && ex.images.length > 0 && (
                  <div className={`grid gap-1 ${
                    ex.images.length === 1 ? 'grid-cols-1 h-[400px]' : 
                    ex.images.length === 2 ? 'grid-cols-2 h-[300px]' : 
                    ex.images.length === 3 ? 'grid-cols-2 h-[350px]' : 
                    'grid-cols-2 h-[400px]'
                  }`}>
                    {ex.images.slice(0, 4).map((img, i) => (
                      <div key={img.id} className={`relative overflow-hidden ${
                        ex.images.length === 3 && i === 0 ? 'row-span-2' : ''
                      } ${ex.images.length >= 4 && i === 0 ? 'row-span-2 col-span-1' : ''}`}>
                        <img 
                          src={img.url} 
                          alt={`${ex.name} - Imagen ${i+1}`} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Overlay for the 4th image if there are more */}
                        {i === 3 && ex.images.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">+{ex.images.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="p-8">
                  {ex.theme && (
                    <span className="inline-block px-3 py-1 bg-[#e4decb] text-[#31573c] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                      {ex.theme}
                    </span>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#31573c] transition-colors">{ex.name}</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mt-6 text-sm text-gray-600">
                    {ex.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={18} className="text-[#31573c]" />
                        <span>{ex.location}</span>
                      </div>
                    )}
                    {(ex.startDate || ex.endDate) && (
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-[#31573c]" />
                        <span>
                          {ex.startDate ? new Date(ex.startDate).toLocaleDateString() : 'Inicio indefinido'} 
                          {' - '}
                          {ex.endDate ? new Date(ex.endDate).toLocaleDateString() : 'Presente'}
                        </span>
                      </div>
                    )}
                  </div>
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
