import Link from "next/link"
import { auth, signOut } from "@/auth"
import { LogIn, LogOut, User as UserIcon } from "lucide-react"

export default async function Header() {
  const session = await auth()

  return (
    <header className="bg-[#1f2937] text-[#f5f2eb] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-serif font-bold tracking-wider hidden sm:block">MUSEO SCOUT MENDOZA</h1>
            <h1 className="text-xl font-serif font-bold tracking-wider sm:hidden">MSM</h1>
            <p className="text-xs text-gray-300 tracking-widest uppercase mt-0.5 hidden sm:block">"Hno Gris Cayetano Ponso"</p>
          </div>
        </Link>
      </div>
      <nav className="hidden md:flex gap-4 text-sm font-medium items-center">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <Link href="/catalogo" className="hover:text-white transition-colors">Acervo</Link>
        <Link href="/muestras" className="hover:text-white transition-colors">Muestras</Link>
        <Link href="/proyectos-especiales" className="hover:text-white transition-colors whitespace-nowrap">Proyectos Especiales</Link>
        
        {/* Dropdown for Sobre el Museo */}
        <div className="relative group">
          <button className="hover:text-white transition-colors py-2 flex items-center gap-1">
            Sobre el Museo
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <div className="absolute top-full left-0 mt-0 w-48 bg-white text-gray-800 shadow-lg rounded-b-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 flex flex-col">
            <Link href="/nosotros" className="block px-4 py-3 text-sm hover:bg-gray-100 border-b border-gray-100">
              Historia
            </Link>
            <Link href="/sobre-el-museo/equipo" className="block px-4 py-3 text-sm hover:bg-gray-100">
              Equipo del Museo
            </Link>
          </div>
        </div>
      </nav>
      
      <div className="flex items-center gap-4">
        {session?.user ? (
          <div className="relative group">
            <button className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-full md:rounded-lg transition-colors">
              {session.user.image ? (
                <img src={session.user.image} alt={session.user.name || "Usuario"} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserIcon size={16} />
                </div>
              )}
              <span className="text-sm font-medium hidden md:block">{session.user.name?.split(' ')[0]}</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white text-gray-800 shadow-xl rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-200 flex flex-col overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
              </div>
              <Link href="/mi-cuenta" className="px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2">
                <UserIcon size={16} className="text-gray-400" />
                Mi cuenta
              </Link>
              <form
                action={async () => {
                  'use server'
                  await signOut()
                }}
              >
                <button type="submit" className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100">
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        ) : (
          <Link href="/ingresar" className="text-sm bg-[#0B69CA] text-white px-4 py-2 rounded hover:bg-[#0957A8] transition-colors flex items-center gap-2 font-bold">
            <LogIn size={16} />
            <span className="hidden sm:inline">Ingresar</span>
          </Link>
        )}
      </div>
    </header>
  )
}
