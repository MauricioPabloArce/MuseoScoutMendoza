import { Lightbulb, Info, AlertTriangle, TrendingUp } from "lucide-react"

export default function InsightsPanel({ insights }: { insights: { type: string, text: string }[] }) {
  if (!insights || insights.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="text-[#FDD617]" size={20} />
        <h3 className="text-lg font-bold text-gray-800">Hallazgos del Acervo</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, idx) => {
          let Icon = Info
          let colorClass = "bg-blue-50 text-blue-800 border-blue-100"
          let iconColor = "text-blue-500"
          
          if (insight.type === 'warning') {
            Icon = AlertTriangle
            colorClass = "bg-red-50 text-red-800 border-red-100"
            iconColor = "text-red-500"
          } else if (insight.type === 'success') {
            Icon = TrendingUp
            colorClass = "bg-green-50 text-green-800 border-green-100"
            iconColor = "text-green-500"
          }

          return (
            <div key={idx} className={`p-4 rounded-lg border ${colorClass} flex gap-3 items-start`}>
              <Icon size={18} className={`shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm font-medium">{insight.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
