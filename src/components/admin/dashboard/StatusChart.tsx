import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

const STATUS_COLORS = {
  PUBLISHED: "#01A187", // Verde Scout
  DRAFT: "#FDD617",     // Amarillo
  ARCHIVED: "#9CA3AF"   // Gris
}

export default function StatusChart({ 
  data,
  onFilterChange 
}: { 
  data: { PUBLISHED: number, DRAFT: number, ARCHIVED: number };
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
}) {
  const chartData = [
    { name: 'Publicadas', value: data.PUBLISHED, rawStatus: 'PUBLISHED', color: STATUS_COLORS.PUBLISHED },
    { name: 'Borrador', value: data.DRAFT, rawStatus: 'DRAFT', color: STATUS_COLORS.DRAFT },
    { name: 'Archivadas', value: data.ARCHIVED, rawStatus: 'ARCHIVED', color: STATUS_COLORS.ARCHIVED }
  ].filter(d => d.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-gray-400 text-sm">
        No hay datos de estado.
      </div>
    )
  }

  const handleClick = (entry: any) => {
    if (entry && entry.rawStatus) {
      onFilterChange('status', entry.rawStatus)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-gray-800">Estado del Acervo</h3>
        <p className="text-sm text-gray-500">Distribución por visibilidad</p>
      </div>
      
      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} piezas`, 'Cantidad']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
