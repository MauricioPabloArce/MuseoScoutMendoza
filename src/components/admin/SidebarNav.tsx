"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function SidebarNav() {
  const pathname = usePathname()

  const navItems = [
    { name: "Dashboard", href: "/admin" },
    { name: "Acervo (Piezas)", href: "/admin/piezas" },
    { name: "Categorías", href: "/admin/categorias" },
    { name: "Campos Dinámicos", href: "/admin/campos" },
    { name: "Muestras", href: "/admin/muestras" },
    { name: "Proyectos Especiales", href: "/admin/proyectos-especiales" },
    { name: "Comunicaciones", href: "/admin/comunicaciones" },
    { name: "Usuarios y Roles", href: "/admin/usuarios" },
    { name: "Mi Perfil", href: "/admin/perfil" },
  ]

  return (
    <ul className="space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
        return (
          <li key={item.href}>
            <Link 
              href={item.href} 
              className={`block p-2 rounded transition-colors ${
                isActive 
                ? "bg-[#374151] font-medium border-l-2 border-white pl-2" 
                : "hover:bg-[#374151]"
              }`}
            >
              {item.name}
            </Link>
          </li>
        )
      })}
      
      <li className="pt-4 mt-4 border-t border-gray-700">
        <Link 
          href="/" 
          className="block p-2 rounded transition-colors hover:bg-green-700 text-green-300 hover:text-white font-medium flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
          Ver Sitio Público
        </Link>
      </li>
    </ul>
  )
}
