"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, ChevronDown, X } from "lucide-react"
import { useState, useEffect, useTransition } from "react"

export default function CatalogFilters({ categories, initialQ }: { categories: any[], initialQ?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [q, setQ] = useState(initialQ || "")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== (searchParams.get("q") || "")) {
        updateFilters(q, searchParams.get("categoria"))
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [q, searchParams])
  
  const updateFilters = (newQ: string, newCategoria: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newQ) params.set("q", newQ)
    else params.delete("q")
    
    if (newCategoria) params.set("categoria", newCategoria)
    else params.delete("categoria")
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const hasFilters = searchParams.has("q") || searchParams.has("categoria")

  return (
    <div className="w-full max-w-4xl mx-auto mb-10 flex flex-col items-center gap-6">
      {/* Search Pill */}
      <div className="w-full bg-white rounded-full shadow-md flex items-center p-2 border border-gray-100 transition-shadow focus-within:shadow-lg">
        
        {/* Category Select (Left) */}
        <div className="relative border-r border-gray-200 min-w-[200px] hidden sm:block">
          <select 
            value={searchParams.get("categoria") || ""}
            onChange={(e) => updateFilters(q, e.target.value)}
            className="w-full bg-transparent appearance-none py-3 pl-6 pr-10 text-gray-700 outline-none cursor-pointer text-sm font-medium"
          >
            <option value="">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.indentName}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>

        {/* Text Input (Center) */}
        <div className="flex-1 relative flex items-center">
          <input 
            type="text" 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar piezas, códigos o palabras clave..." 
            className="w-full bg-transparent py-3 px-6 text-gray-700 outline-none text-sm placeholder-gray-400" 
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-4 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Button (Right) */}
        <button 
          className="bg-[#1f2937] text-white rounded-full px-6 py-3 flex items-center gap-2 hover:bg-[#374151] transition-colors font-medium text-sm ml-2"
          onClick={() => updateFilters(q, searchParams.get("categoria"))}
        >
          <Search size={16} />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>

      {/* Mobile Category Select */}
      <div className="w-full relative sm:hidden">
        <select 
          value={searchParams.get("categoria") || ""}
          onChange={(e) => updateFilters(q, e.target.value)}
          className="w-full bg-white rounded-xl shadow-sm border border-gray-200 py-3 pl-4 pr-10 text-gray-700 outline-none text-sm font-medium"
        >
          <option value="">Todas las categorías</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.indentName}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Filter Status */}
      <div className="flex items-center justify-between w-full px-2">
        <div className="text-sm text-gray-500">
          {isPending ? (
            <span className="animate-pulse">Actualizando resultados...</span>
          ) : (
            <span>Explora nuestro catálogo completo</span>
          )}
        </div>
        {hasFilters && (
          <button 
            onClick={() => { setQ(""); updateFilters("", null) }}
            className="text-sm text-[#1f2937] hover:underline font-medium"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  )
}
