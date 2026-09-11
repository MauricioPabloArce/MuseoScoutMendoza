import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, Image as ImageIcon } from "lucide-react"

export default async function ProyectosEspecialesPublicPage() {
  const projects = await prisma.specialProject.findMany({
    where: { isPublished: true },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((proj) => (
              <Link key={proj.id} href={`/proyectos-especiales/${proj.id}`} className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col">
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden flex-shrink-0">
                  {proj.coverImage ? (
                    <img 
                      src={proj.coverImage} 
                      alt={proj.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={64} />
                    </div>
                  )}
                  {proj.theme && (
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-3 py-1 bg-[#31573c]/90 backdrop-blur text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-sm">
                        {proj.theme}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#31573c] transition-colors line-clamp-2">{proj.name}</h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
                    <span className="text-sm font-medium text-[#0B69CA]">Leer más</span>
                    <ArrowRight size={18} className="text-[#0B69CA] transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
