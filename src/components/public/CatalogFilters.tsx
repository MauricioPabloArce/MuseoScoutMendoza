"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { useState, useEffect, useTransition } from "react"

export default function CatalogFilters({ initialQ }: { initialQ?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [q, setQ] = useState(initialQ || "")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== (searchParams.get("q") || "")) {
        updateFilters(q)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [q, searchParams])
  
  const updateFilters = (newQ: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (newQ) params.set("q", newQ)
    else params.delete("q")
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="w-full flex flex-col gap-4 mb-8">
      {/* Search Bar */}
      <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 flex items-center p-2 transition-all focus-within:shadow-md focus-within:border-[#1d4328]">
        <div className="pl-4 text-gray-400">
          <Search size={20} />
        </div>
        <div className="flex-1 relative flex items-center">
          <input 
            type="text" 
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar piezas por título, código o palabras clave..." 
            className="w-full bg-transparent py-3 px-4 text-gray-800 outline-none text-base placeholder-gray-400" 
          />
          {q && (
            <button onClick={() => setQ("")} className="absolute right-4 text-gray-400 hover:text-gray-700 bg-gray-100 p-1 rounded-full transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
        <button 
          className="bg-[#1f2937] text-white rounded-xl px-8 py-3 flex items-center gap-2 hover:bg-[#374151] transition-colors font-semibold shadow-sm"
          onClick={() => updateFilters(q)}
        >
          {isPending ? <Loader2 size={18} className="animate-spin" /> : <span>Buscar</span>}
        </button>
      </div>

      {/* Filter Status for Mobile / Clear All */}
      {searchParams.has("q") && (
        <div className="flex items-center gap-2 px-2 text-sm text-gray-600">
          <span>Resultados para: <strong>"{searchParams.get("q")}"</strong></span>
          <button 
            onClick={() => { setQ(""); updateFilters("") }}
            className="text-red-500 hover:underline font-medium text-xs ml-4"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}
    </div>
  )
}
