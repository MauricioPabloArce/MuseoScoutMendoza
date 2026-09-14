"use client"

import { useState } from "react"
import { createDonor, checkPossibleDuplicates } from "../actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, AlertTriangle, User } from "lucide-react"

export default function NuevoDonantePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ displayName: "", email: "", phone: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [duplicates, setDuplicates] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault()
    if (!formData.displayName.trim()) return alert("El nombre es obligatorio")
    
    setLoading(true)
    if (!force) {
      const possibleDups = await checkPossibleDuplicates(formData.email, formData.phone, formData.displayName)
      if (possibleDups.length > 0) {
        setDuplicates(possibleDups)
        setLoading(false)
        return
      }
    }
    
    try {
      const newDonor = await createDonor(formData)
      router.push(`/admin/donantes/${newDonor.id}`)
    } catch (err: any) {
      alert("Error: " + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/donantes" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Nuevo Donante
          </h1>
          <p className="text-gray-500">Agrega un nuevo donante a la base de datos central.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        {duplicates.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
              <div>
                <h4 className="font-semibold text-amber-800 text-lg">¡Atención! Posibles duplicados</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Hemos encontrado registros con nombres, emails o teléfonos similares. ¿Seguro que quieres crear un nuevo donante?
                </p>
              </div>
            </div>
            
            <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
              {duplicates.map(donor => (
                <li key={donor.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800 flex items-center gap-2">
                      <User size={16}/> {donor.displayName}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-4 mt-2">
                      {donor.email && <span>{donor.email}</span>}
                      {donor.phone && <span>{donor.phone}</span>}
                    </div>
                  </div>
                  <Link 
                    href={`/admin/donantes/${donor.id}`}
                    className="text-sm font-medium text-green-700 hover:underline"
                  >
                    Ver ficha
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="pt-4 border-t flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setDuplicates([])}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300"
              >
                Cancelar y Editar datos
              </button>
              <button 
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="px-4 py-2 text-white bg-[#1d4328] hover:bg-[#15341c] rounded disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear de todas formas'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellido y Nombre *</label>
              <input 
                type="text" 
                required
                value={formData.displayName}
                onChange={e => setFormData(prev => ({...prev, displayName: e.target.value}))}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#31573c] focus:border-[#31573c]"
                placeholder="Ej. Pérez Pablo"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData(prev => ({...prev, email: e.target.value}))}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#31573c] focus:border-[#31573c]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Móvil</label>
                <input 
                  type="text" 
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({...prev, phone: e.target.value}))}
                  className="w-full border border-gray-300 rounded p-2 focus:ring-[#31573c] focus:border-[#31573c]"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full border border-gray-300 rounded p-2 focus:ring-[#31573c] focus:border-[#31573c]"
                rows={4}
                placeholder="Datos adicionales o anotaciones internas..."
              />
            </div>
            
            <div className="pt-6 flex justify-end gap-3 border-t mt-6">
              <Link
                href="/admin/donantes"
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded border border-gray-300"
              >
                Cancelar
              </Link>
              <button 
                type="submit"
                disabled={loading || !formData.displayName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-white bg-[#1d4328] hover:bg-[#15341c] rounded disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'Guardando...' : 'Guardar donante'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
