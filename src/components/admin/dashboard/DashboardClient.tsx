"use client"

import { useState, useEffect, useCallback } from "react"
import { getDashboardData, DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { RefreshCw, X, Filter } from "lucide-react"
import toast from "react-hot-toast"
import KpiCards from "./KpiCards"
import DashboardFiltersComponent from "./DashboardFilters"
import CollectionEvolutionChart from "./CollectionEvolutionChart"
import CategoryDistributionChart from "./CategoryDistributionChart"
import StatusChart from "./StatusChart"
import GeographicDistribution from "./GeographicDistribution"
import DataQuality from "./DataQuality"
import InsightsPanel from "./InsightsPanel"
import RecentPieces from "./RecentPieces"

export default function DashboardClient() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [filters, setFilters] = useState<DashboardFilters>({})

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true)
    try {
      const result = await getDashboardData(currentFilters)
      setData(result)
      setLastUpdated(new Date())
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar datos del dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(filters)
  }, [filters, fetchData])

  const handleFilterChange = (key: keyof DashboardFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== "")

  return (
    <div className="space-y-6">
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <DashboardFiltersComponent filters={filters} onFilterChange={handleFilterChange} categories={data?.allCategories || []} />
        <button 
          onClick={() => fetchData(filters)} 
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#00AAF2] hover:bg-[#00AAF2]/10 rounded-lg transition-colors whitespace-nowrap"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Badges de Filtros Activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-500 flex items-center gap-1"><Filter size={14}/> Filtros activos:</span>
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null
            let label = value
            if (key === 'categoryId') {
              const cat = data?.allCategories?.find((c: any) => c.id === value)
              label = cat ? cat.name : 'Categoría'
            }
            if (key === 'status') {
              if (value === 'PUBLISHED') label = 'Publicadas'
              if (value === 'DRAFT') label = 'Borradores'
              if (value === 'ARCHIVED') label = 'Archivadas'
            }
            return (
              <span key={key} className="bg-[#0B69CA]/10 text-[#0B69CA] text-xs px-3 py-1 rounded-full flex items-center gap-2 border border-[#0B69CA]/20">
                {label}
                <button onClick={() => handleFilterChange(key as keyof DashboardFilters, undefined)} className="hover:text-red-500">
                  <X size={12} />
                </button>
              </span>
            )
          })}
          <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-700 underline ml-2">
            Limpiar todos
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00AAF2]"></div>
        </div>
      ) : !data ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="mb-2">No se pudieron cargar los datos.</p>
          <button onClick={() => fetchData(filters)} className="text-[#00AAF2] hover:underline">Reintentar</button>
        </div>
      ) : (
        <>
          {/* Fila 1: KPIs Principales */}
          <KpiCards kpis={data.kpis} onFilterChange={handleFilterChange} />

          {/* Insights (Conclusiones automáticas) */}
          <InsightsPanel insights={data.insights} />

          {/* Fila 2: Gráficos Principales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <CollectionEvolutionChart data={data.evolutionData} onFilterChange={handleFilterChange} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <StatusChart data={data.statusCount} onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Fila 3: Distribución por Categorías e Información Geográfica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <CategoryDistributionChart data={data.categoryData} onFilterChange={handleFilterChange} allCategories={data.allCategories} />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <GeographicDistribution data={data.geoData} onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Fila 4: Calidad y Recientes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <DataQuality kpis={data.kpis} />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <RecentPieces pieces={data.recentPieces} />
            </div>
          </div>
          
          <div className="text-right text-xs text-gray-400 mt-8 pb-4">
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  )
}
