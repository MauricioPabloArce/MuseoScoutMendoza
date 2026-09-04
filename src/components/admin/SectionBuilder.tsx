"use client"

import { useState, useEffect } from "react"
import { Layers, Save, X } from "lucide-react"
import { createSection, updateSection } from "@/app/admin/(protected)/campos/actions"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function SectionBuilder({ initialData }: { initialData?: any }) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const router = useRouter()

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description || "")
    } else {
      setName("")
      setDescription("")
    }
  }, [initialData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error("El nombre de la sección es obligatorio")
    
    const res = initialData 
      ? await updateSection(initialData.id, { name, description })
      : await createSection({ name, description })
      
    if (res.success) {
      toast.success(initialData ? "Sección actualizada" : "Sección creada")
      if (initialData) {
        router.push("/admin/campos")
      } else {
        setName("")
        setDescription("")
      }
    } else {
      toast.error(res.error || "Error al guardar la sección")
    }
  }

  const handleCancel = () => {
    router.push("/admin/campos")
  }

  return (
    <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-[#374151] flex items-center gap-2">
        <Layers size={20} /> {initialData ? "Editar Sección" : "Crear Nueva Sección"}
      </h3>
      <p className="text-sm text-gray-500 mb-6">Agrupa los campos dinámicos en contenedores visuales dentro de la Ficha Museológica.</p>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sección</label>
          <input 
            required
            type="text" 
            className="w-full border border-gray-300 rounded p-2 focus:ring-[#374151] focus:border-[#374151]"
            placeholder="Ej: Datos del Donante"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (Opcional)</label>
          <textarea 
            className="w-full border border-gray-300 rounded p-2 text-sm"
            placeholder="Breve descripción interna..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200 gap-2">
        {initialData && (
          <button type="button" onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center gap-2 font-medium">
            <X size={16} /> Cancelar
          </button>
        )}
        <button type="submit" className="bg-[#374151] hover:bg-[#4b5563] text-white px-4 py-2 rounded flex items-center gap-2 font-medium">
          <Save size={16} /> {initialData ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </form>
  )
}
