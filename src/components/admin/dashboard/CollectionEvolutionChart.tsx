import { DashboardFilters } from "@/app/admin/(protected)/dashboard/actions"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts"

export default function CollectionEvolutionChart({ 
  data,
  onFilterChange 
}: { 
  data: any[];
  onFilterChange: (k: keyof DashboardFilters, v: string | undefined) => void;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center text-gray-400 text-sm">
        No hay datos suficientes para mostrar la evolución.
      </div>
    )
  }

  const handleBarClick = (entry: any) => {
    // If they click on a month, filter for that month
    // Example: entry.date is "2026-03"
    // We could set dateFrom=2026-03-01 and dateTo=2026-03-31
    if (entry && entry.activePayload && entry.activePayload.length > 0) {
      const dateStr = entry.activePayload[0].payload.date
      const year = parseInt(dateStr.split('-')[0])
      const month = parseInt(dateStr.split('-')[1])
      
      const lastDay = new Date(year, month, 0).getDate()
      onFilterChange("dateFrom", `${dateStr}-01`)
      onFilterChange("dateTo", `${dateStr}-${lastDay}`)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800">Evolución del Acervo</h3>
        <p className="text-sm text-gray-500">Incorporaciones de piezas por mes y total acumulado</p>
      </div>
      
      <div className="h-[300px] w-full" onClick={handleBarClick} style={{ cursor: 'pointer' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }} 
              dy={10}
            />
            <YAxis 
              yAxisId="left" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#888' }}
            />
            <Tooltip 
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label) => `Período: ${label}`}
            />
            <Bar 
              yAxisId="left"
              dataKey="count" 
              name="Incorporaciones" 
              fill="#00AAF2" 
              radius={[4, 4, 0, 0]} 
              barSize={32}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="accumulated" 
              name="Total Acumulado" 
              stroke="#FDD617" 
              strokeWidth={3} 
              dot={{ r: 4, fill: '#FDD617', strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
