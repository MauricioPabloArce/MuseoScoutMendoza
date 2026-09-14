"use client"

import { useState } from "react"
import { updateDonor } from "@/app/admin/(protected)/donantes/actions"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"

export default function EditDonorForm({ donor }: { donor: any }) {
  const router = useRouter()
  const [formData, setFormData] = useState({ 
    displayName: donor.displayName || "", 
    email: donor.email || "", 
    phone: donor.phone || "", 
    notes: donor.notes || "" 
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.displayName.trim()) return alert("El nombre es obligatorio")
    
    setLoading(true)
    
    try {
      await updateDonor(donor.id, formData)
      router.push(`/admin/donantes/${donor.id}`)
      router.refresh()
    } catch (err: any) {
      alert("Error: " + err.message)
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/donantes/${donor.id}`} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 text-gray-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            Editar Donante
          </h1>
          <p className="text-gray-500">Modifica los datos de {donor.displayName}.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Apellido y Nombre *</label>
            <input 
              type="text" 
              required
              value={formData.displayName}
              onChange={e => setFormData(prev => ({...prev, displayName: e.target.value}))}
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#31573c] focus:border-[#31573c]"
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
            />
          </div>
          
          <div className="pt-6 flex justify-end gap-3 border-t mt-6">
            <Link
              href={`/admin/donantes/${donor.id}`}
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
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
