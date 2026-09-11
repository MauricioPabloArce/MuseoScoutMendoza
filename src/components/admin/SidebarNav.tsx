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
    </ul>
  )
}
