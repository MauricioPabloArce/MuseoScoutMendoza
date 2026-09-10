import prisma from "@/lib/prisma"
import Header from "@/components/public/Header"
import Footer from "@/components/public/Footer"
import { Users, User, Shield } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function EquipoPage() {
  const teamMembers = await prisma.museumMember.findMany({
    where: { isTeamMember: true },
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return (
    <div className="min-h-screen bg-[#eae6df] font-sans flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto py-12 px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1f2937] text-white rounded-full mb-6 shadow-md">
            <Users size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
            Equipo del Museo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            Conoce a los voluntarios y profesionales que dedican su tiempo a preservar y catalogar el acervo histórico Scout.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-[#374151] relative">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1533630248439-5095368a5c37?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
              </div>
              <div className="px-6 pb-8 text-center relative -mt-16">
                <div className="w-32 h-32 bg-white rounded-full p-2 mx-auto mb-4 shadow-sm inline-block">
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl text-gray-400 border border-gray-200">
                    {/* Placeholder Avatar */}
                    {member.user.image ? (
                      <img src={member.user.image} alt={member.user.name || ''} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="font-bold text-gray-500 text-3xl">
                        {(member.user.name?.[0] || member.user.email?.[0] || 'S').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.user.name || 'Voluntario'}</h3>
                
                {member.teamPosition ? (
                  <p className="text-[#1d4328] font-semibold text-sm uppercase tracking-wider">
                    {member.teamPosition}
                  </p>
                ) : (
                  <p className="text-gray-500 font-medium text-sm">
                    Miembro del Equipo
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {teamMembers.length === 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Pronto presentaremos a los miembros del equipo.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
