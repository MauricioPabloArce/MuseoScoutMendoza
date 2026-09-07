"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronRight, ChevronDown, List, Tag } from "lucide-react"
import { useState } from "react"

export default function CategorySidebar({ categories }: { categories: any[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCat = searchParams.get("categoria") || ""

  const [expanded, setExpanded] = useState<Set<string>>(new Set([selectedCat]))

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExp = new Set(expanded)
    if (newExp.has(id)) newExp.delete(id)
    else newExp.add(id)
    setExpanded(newExp)
  }

  const selectCategory = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (id === selectedCat) {
      params.delete("categoria")
    } else {
      params.set("categoria", id)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const buildTree = (parentId: string | null) => {
    return categories.filter(c => c.parentId === parentId).map(cat => {
      const children = categories.filter(c => c.parentId === cat.id)
      const hasChildren = children.length > 0
      
      // Auto expand if selected or child is selected
      const isSelected = selectedCat === cat.id
      const isExpanded = expanded.has(cat.id) || isSelected

      return (
        <div key={cat.id} className="w-full">
          <div 
            onClick={() => selectCategory(cat.id)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[#1d4328] text-white shadow-sm' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Tag size={14} className={`flex-shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
              <span className={`text-sm truncate ${isSelected ? 'font-medium' : ''}`}>{cat.name}</span>
            </div>
            {hasChildren && (
              <div 
                className={`p-1 rounded-full transition-colors flex-shrink-0 ml-2 ${isSelected ? 'hover:bg-[#2a5d38]' : 'hover:bg-gray-200'}`}
                onClick={(e) => toggleExpand(cat.id, e)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-3 mt-1 pl-3 border-l-2 border-gray-100 space-y-1">
              {buildTree(cat.id)}
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 h-full md:sticky md:top-24">
      <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 uppercase tracking-wider text-sm border-b border-gray-100 pb-3">
        <List size={18} className="text-[#1d4328]" />
        Explorar Colección
      </h3>
      
      <div className="space-y-1 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        <div 
          onClick={() => selectCategory("")}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-lg cursor-pointer transition-all ${!selectedCat ? 'bg-[#1d4328] text-white shadow-sm font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <Tag size={14} className={!selectedCat ? 'text-white' : 'text-gray-400'} />
          <span className="text-sm">Ver Todas las Piezas</span>
        </div>
        
        <div className="my-3 border-t border-gray-100"></div>
        
        {buildTree(null)}
      </div>
      
      {categories.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-4">No hay categorías disponibles.</p>
      )}
    </div>
  )
}
