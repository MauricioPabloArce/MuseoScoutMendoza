import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { MapPin } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function GeographicDistribution({ 
  data,
  onFilterChange
}: { 
  data: any[];
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
        <MapPin className="text-gray-300 mb-3" size={32} />
        <h3 className="text-sm font-medium text-gray-700 mb-1">Sin datos geográficos</h3>
        <p className="text-xs max-w-[200px]">
          No hay suficientes datos geográficos (campos de provincia o procedencia) para generar esta visualización.
        </p>
      </div>
    )
  }

  // Tomamos top 5 orígenes
  const chartData = data.slice(0, 5)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Procedencia del Acervo</h3>
        <p className="text-sm text-gray-500">Distribución geográfica registrada</p>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#4b5563', width: 90 }} 
              width={90}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => [`${value} piezas`, 'Cantidad']}
            />
            <Bar 
              dataKey="count" 
              fill="#791FBF" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
