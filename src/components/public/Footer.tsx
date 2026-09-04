import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <h4 className="text-lg font-serif font-bold text-gray-200 tracking-wider">MUSEO SCOUT MENDOZA</h4>
          </div>
          <p className="mb-2">Fundado el 15 de Septiembre de 2001 🏛️</p>
          <p>Organismo N°9800 - Scouts de Argentina ⚜️</p>
          <p>Mendoza - Argentina 🇦🇷</p>
        </div>
        
        <div>
          <h4 className="text-lg font-bold text-gray-200 mb-4">Contacto</h4>
          <ul className="space-y-3">
            <li>
              <a href="https://wa.me/542615675865" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <span>📱</span> WhatsApp: +54 261 567-5865
              </a>
            </li>
            <li>
              <a href="mailto:museo.mendoza@scouts.org.ar" className="hover:text-white transition-colors flex items-center gap-2">
                <span>✉️</span> museo.mendoza@scouts.org.ar
              </a>
            </li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-lg font-bold text-gray-200 mb-4">Redes Sociales</h4>
          <ul className="space-y-3">
            <li>
              <a href="https://www.facebook.com/p/Museo-Scout-Mendoza-Hno-Cayetano-Ponso-100082353130723/?locale=es_LA" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <span>📘</span> Facebook
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/museo.scout.mendoza/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                <span>📸</span> Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-500">
        <p className="mb-1">© {new Date().getFullYear()} Museo Scout Mendoza. Todos los derechos reservados.</p>
        <p>¡Siempre Listos!</p>
      </div>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/542615675865" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-all z-50 flex items-center justify-center group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="absolute right-full mr-4 bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Contactar por WhatsApp
        </span>
      </a>
    </footer>
  )
}
