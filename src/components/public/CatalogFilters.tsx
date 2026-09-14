"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { useState, useEffect, useTransition } from "react"

export default function CatalogFilters({ 
  initialQ, 
  categoryFields = [], 
  currentSort = "recent",
  searchParams = {} 
}: { 
  initialQ?: string, 
  categoryFields?: any[],
  currentSort?: string,
  searchParams?: any
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParamsObj = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [q, setQ] = useState(initialQ || "")
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== (searchParamsObj.get("q") || "")) {
        updateFilters(q)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [q, searchParamsObj])
  
  const updateFilters = (newQ: string, customParams?: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParamsObj.toString())
    if (newQ !== undefined) {
      if (newQ) params.set("q", newQ)
      else params.delete("q")
    }

    if (customParams) {
      Object.entries(customParams).forEach(([k, v]) => {
        if (v === null || v === "") params.delete(k)
        else params.set(k, v)
      })
    }
    
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
            onKeyDown={(e) => e.key === 'Enter' && updateFilters(q)}
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

      {/* Dynamic Filters & Order */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Ordenar por:</span>
          <select 
            className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4328] focus:border-[#1d4328]"
            value={currentSort}
            onChange={(e) => updateFilters(q, { sort: e.target.value })}
          >
            <option value="recent">Más recientes</option>
            <option value="name_asc">Nombre (A-Z)</option>
            <option value="name_desc">Nombre (Z-A)</option>
            <option value="code_asc">Código / N° Inv (A-Z)</option>
            <option value="code_desc">Código / N° Inv (Z-A)</option>
            {categoryFields.filter(f => f.type === 'NUMBER' || f.type === 'TEXT').map(f => (
              <option key={f.id} value={`field_${f.id}`}>{f.name} (Ascendente)</option>
            ))}
          </select>
        </div>

        {/* Dynamic Select Filters */}
        {categoryFields.filter(f => f.type === 'SELECT' || f.type === 'MULTISELECT').map(f => {
          const paramKey = `field_${f.id}`;
          const currentVal = searchParams[paramKey] || "";
          
          return (
            <div key={f.id} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{f.name}:</span>
              <select 
                className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#1d4328] focus:border-[#1d4328] max-w-[200px]"
                value={currentVal}
                onChange={(e) => updateFilters(q, { [paramKey]: e.target.value })}
              >
                <option value="">Todos</option>
                {[...(f.options || [])]
                  .sort((a, b) => a.label.localeCompare(b.label, 'es', { sensitivity: 'base' }))
                  .map((opt: any) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {/* Filter Status for Mobile / Clear All */}
      {(searchParamsObj.has("q") || Object.keys(searchParams).some(k => k.startsWith('field_'))) && (
        <div className="flex items-center gap-2 px-2 text-sm text-gray-600">
          <span>Filtros activos</span>
          <button 
            onClick={() => { 
              setQ(""); 
              const clearParams: Record<string, string | null> = {};
              Object.keys(searchParams).filter(k => k.startsWith('field_')).forEach(k => clearParams[k] = null);
              updateFilters("", clearParams) 
            }}
            className="text-red-500 hover:underline font-medium text-xs ml-4"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
