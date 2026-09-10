import Image from "next/image"
import Link from "next/link"
import { Search, Compass, Shield, BookOpen } from "lucide-react"
import prisma from "@/lib/prisma"
import Footer from "@/components/public/Footer"
import Header from "@/components/public/Header"

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null, isPublished: true, isArchived: false },
    take: 4,
    include: { _count: { select: { pieces: true } } }
  })

  const recentPieces = await prisma.museumPiece.findMany({
    where: { status: 'PUBLISHED' },
    take: 3,
    orderBy: { registeredAt: 'desc' },
    include: { category: true }
  })

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans">
      {/* Header Público */}
      <Header />

      {/* Hero Section */}
      <section className="relative bg-[#374151] text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1533630248439-5095368a5c37?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6 leading-tight">
            Museo Scout Mendoza "Hno Gris Cayetano Ponso"
          </h2>
          <p className="text-lg md:text-xl mb-10 text-gray-300 max-w-2xl mx-auto font-medium">
            Nuestro principal objetivo es preservar el acervo histórico de los Scouts de Mendoza, Argentina y el Mundo. ¡Siempre Listos!
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base text-gray-200 mt-8 mb-4">
            <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">Fundado el 15 de Septiembre de 2001 🏛️</span>
            <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">Organismo N°9800</span>
            <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">Scouts de Argentina ⚜️</span>
            <span className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">Mendoza - Argentina 🇦🇷</span>
          </div>
        </div>
      </section>

      {/* Colecciones Principales */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <Shield className="text-[#1f2937]" size={28} />
          <h3 className="text-3xl font-serif font-bold text-[#1f2937]">Colecciones Principales</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link href={`/catalogo?categoria=${cat.id}`} key={cat.id} className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-[#374151] transition-all flex flex-col h-full">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#374151] group-hover:text-white transition-colors text-[#374151] shrink-0">
                <BookOpen size={32} />
              </div>
              <h4 className="font-bold text-gray-800 mb-2 text-center">{cat.name}</h4>
              <p className="text-sm text-gray-500 text-center font-medium mb-3">{cat._count.pieces} piezas catalogadas</p>
              {cat.description && (
                <p className="text-sm text-gray-600 text-center line-clamp-3 mt-auto">{cat.description}</p>
              )}
            </Link>
          ))}
          {categories.length === 0 && (
            <div className="col-span-4 text-center text-gray-500">Pronto se habilitarán las colecciones.</div>
          )}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/catalogo" className="inline-block border-2 border-[#1f2937] text-[#1f2937] hover:bg-[#1f2937] hover:text-white font-medium py-3 px-8 rounded-full transition-colors">
            Explorar todo el acervo
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
