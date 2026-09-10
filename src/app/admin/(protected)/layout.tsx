import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SidebarNav from "@/components/admin/SidebarNav"
import Image from "next/image"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-[#1f2937] text-white hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto custom-scrollbar">
        <div className="p-4 border-b border-[#374151] flex flex-col items-center text-center shrink-0">
          <img src="/logo.png" alt="Museo Scout Mendoza" className="w-16 h-16 object-contain mb-3" />
          <span className="font-bold leading-tight">Museo Scout Mendoza</span>
          <span className="text-xs text-gray-300 mt-1 italic">"Hno Gris Cayetano Ponso"</span>
        </div>
        <nav className="p-4">
          <SidebarNav />
        </nav>
      </aside>
      
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
