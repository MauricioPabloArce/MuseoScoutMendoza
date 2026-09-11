import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function CategoryDistributionChart({ 
  data,
  onFilterChange,
  allCategories
}: { 
  data: any[];
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
  allCategories: any[];
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-gray-400 text-sm">
        No hay datos de categorías.
      </div>
    )
  }

  // Tomar solo el Top 10 para no saturar
  const chartData = data.slice(0, 10)

  const handleClick = (entry: any) => {
    if (entry && entry.activePayload && entry.activePayload.length > 0) {
      const catName = entry.activePayload[0].payload.name
      // Find category ID by name
      const cat = allCategories.find(c => c.name === catName)
      if (cat) {
        onFilterChange('categoryId', cat.id)
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Distribución por Categoría</h3>
        <p className="text-sm text-gray-500">Top 10 categorías con más piezas</p>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full -ml-4" onClick={handleClick} style={{ cursor: 'pointer' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#4b5563', width: 100 }} 
              width={100}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value) => [`${value} piezas`, 'Cantidad']}
            />
            <Bar 
              dataKey="count" 
              fill="#0B69CA" 
              radius={[0, 4, 4, 0]} 
              barSize={24}
              animationDuration={1000}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
