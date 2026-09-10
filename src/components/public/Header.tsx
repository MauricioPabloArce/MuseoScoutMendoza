import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-[#1f2937] text-[#f5f2eb] py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-serif font-bold tracking-wider">MUSEO SCOUT MENDOZA</h1>
            <p className="text-xs text-gray-300 tracking-widest uppercase mt-0.5">"Hno Gris Cayetano Ponso"</p>
          </div>
        </Link>
      </div>
      <nav className="hidden md:flex gap-6 text-sm font-medium items-center">
        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
        <Link href="/catalogo" className="hover:text-white transition-colors">Catálogo</Link>
        
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
      <Link href="/admin/login" className="text-xs border border-gray-400 px-3 py-1.5 rounded hover:bg-[#374151] transition-colors">
        Acceso Interno
      </Link>
    </header>
  )
}
