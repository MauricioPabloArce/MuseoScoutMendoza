import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { Archive, Landmark, FolderTree, Eye, FileBox, FileX } from "lucide-react"

export default function KpiCards({ 
  kpis,
  onFilterChange 
}: { 
  kpis: any;
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
}) {
  const publishedPercent = kpis.total > 0 ? ((kpis.published / kpis.total) * 100).toFixed(1) : 0
  const draftPercent = kpis.total > 0 ? ((kpis.draft / kpis.total) * 100).toFixed(1) : 0
  const archivedPercent = kpis.total > 0 ? ((kpis.archived / kpis.total) * 100).toFixed(1) : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Acervo */}
      <div 
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group cursor-pointer hover:border-[#0252AA] transition-colors"
        onClick={() => onFilterChange('status', undefined)}
      >
        <div className="absolute -right-6 -top-6 text-gray-50 opacity-50 group-hover:scale-110 transition-transform">
          <Landmark size={120} />
        </div>
        <div className="relative z-10">
          <p className="text-gray-500 font-medium text-sm mb-1 uppercase tracking-wide">Total del Acervo</p>
          <p className="text-4xl font-bold text-[#0252AA] mb-2">{kpis.total}</p>
          <p className="text-sm text-gray-400">Piezas registradas</p>
        </div>
      </div>

      {/* Publicadas */}
      <div 
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-[#01A187] transition-colors"
        onClick={() => onFilterChange('status', 'PUBLISHED')}
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">Publicadas</p>
          <Eye size={20} className="text-[#01A187]" />
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-1">{kpis.published}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-[#01A187]/10 text-[#01A187] px-2 py-0.5 rounded">{publishedPercent}%</span>
          <span className="text-xs text-gray-400">del total</span>
        </div>
      </div>

      {/* Borrador */}
      <div 
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-[#FDD617] transition-colors"
        onClick={() => onFilterChange('status', 'DRAFT')}
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">En Borrador</p>
          <FileBox size={20} className="text-[#FDD617]" />
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-1">{kpis.draft}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-[#FDD617]/20 text-yellow-700 px-2 py-0.5 rounded">{draftPercent}%</span>
          <span className="text-xs text-gray-400">del total</span>
        </div>
      </div>

      {/* Archivadas */}
      <div 
        className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => onFilterChange('status', 'ARCHIVED')}
      >
        <div className="flex justify-between items-start mb-2">
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">Archivadas</p>
          <Archive size={20} className="text-gray-400" />
        </div>
        <p className="text-3xl font-bold text-gray-800 mb-1">{kpis.archived}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{archivedPercent}%</span>
          <span className="text-xs text-gray-400">del total</span>
        </div>
      </div>

      {/* Categorías */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <p className="text-gray-500 font-medium text-sm uppercase tracking-wide">Categorías</p>
          <FolderTree size={20} className="text-[#791FBF]" />
        </div>
        <p className="text-3xl font-bold text-[#791FBF] mb-1">{kpis.totalCategories}</p>
        <p className="text-sm text-gray-400">En la jerarquía</p>
      </div>
    </div>
  )
}
