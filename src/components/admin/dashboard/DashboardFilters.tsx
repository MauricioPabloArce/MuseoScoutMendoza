import { useState, useEffect } from "react"
import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { Search, Calendar, Folder, CheckCircle } from "lucide-react"

export default function DashboardFiltersComponent({ 
  filters, 
  onFilterChange,
  categories 
}: { 
  filters: DashboardFilters;
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
  categories: any[];
}) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "")

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange("search", searchTerm || undefined)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, filters.search, onFilterChange])

  return (
    <div className="flex flex-col md:flex-row gap-3 w-full max-w-4xl">
      {/* Buscador */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar código de pieza..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAF2] text-sm"
        />
      </div>

      {/* Categoría */}
      <div className="relative md:w-48">
        <Folder className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <select
          value={filters.categoryId || ""}
          onChange={(e) => onFilterChange("categoryId", e.target.value || undefined)}
          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAF2] text-sm appearance-none cursor-pointer text-gray-700"
        >
          <option value="">Todas las categorías</option>
          {categories.filter(c => !c.parentId).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Estado */}
      <div className="relative md:w-40">
        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <select
          value={filters.status || ""}
          onChange={(e) => onFilterChange("status", e.target.value || undefined)}
          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAF2] text-sm appearance-none cursor-pointer text-gray-700"
        >
          <option value="">Todos los estados</option>
          <option value="PUBLISHED">Publicadas</option>
          <option value="DRAFT">Borradores</option>
          <option value="ARCHIVED">Archivadas</option>
        </select>
      </div>

      {/* Fechas */}
      <div className="relative md:w-40">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="date"
          value={filters.dateFrom || ""}
          onChange={(e) => onFilterChange("dateFrom", e.target.value || undefined)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AAF2] text-sm text-gray-700"
          title="Desde fecha"
        />
      </div>
    </div>
  )
}
