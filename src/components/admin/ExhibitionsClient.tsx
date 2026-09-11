"use client"

import { useState } from "react"
import { createExhibition, updateExhibition, deleteExhibition, uploadExhibitionImage } from "@/app/admin/(protected)/muestras/actions"
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Presentation } from "lucide-react"
import toast from "react-hot-toast"

type Exhibition = any

export default function ExhibitionsClient({ initialData }: { initialData: Exhibition[] }) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialData)
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<Partial<Exhibition> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [theme, setTheme] = useState("")
  const [location, setLocation] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [images, setImages] = useState<{ url: string; order: number }[]>([])

  const handleEdit = (ex: Exhibition) => {
    setCurrent(ex)
    setName(ex.name)
    setTheme(ex.theme || "")
    setLocation(ex.location || "")
    setStartDate(ex.startDate ? new Date(ex.startDate).toISOString().split('T')[0] : "")
    setEndDate(ex.endDate ? new Date(ex.endDate).toISOString().split('T')[0] : "")
    setImages(ex.images || [])
    setIsEditing(true)
  }

  const handleCreateNew = () => {
    setCurrent(null)
    setName("")
    setTheme("")
    setLocation("")
    setStartDate("")
    setEndDate("")
    setImages([])
    setIsEditing(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (images.length >= 10) {
      toast.error("Máximo 10 imágenes permitidas")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo excede el tamaño máximo de 5MB")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await uploadExhibitionImage(formData)
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.url) {
      setImages([...images, { url: res.url, order: images.length }])
      toast.success("Imagen subida")
    }
    
    // Reset input
    e.target.value = ""
  }

  const handleImageChange = (index: number, url: string) => {
    const newImages = [...images]
    newImages[index].url = url
    setImages(newImages)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages.map((img, i) => ({ ...img, order: i })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setIsLoading(true)
    const validImages = images.filter(i => i.url.trim() !== "")

    const dataToSubmit = {
      name,
      theme,
      location,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      images: validImages
    }

    let res
    if (current?.id) {
      res = await updateExhibition(current.id, dataToSubmit)
    } else {
      res = await createExhibition(dataToSubmit)
    }

    setIsLoading(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(current?.id ? "Muestra actualizada" : "Muestra creada")
      setIsEditing(false)
      // refresh is handled by Server Actions revalidatePath, 
      // but we might need to refresh the page to get the new initialData props
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta muestra?")) return
    const res = await deleteExhibition(id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Muestra eliminada")
      setExhibitions(exhibitions.filter(e => e.id !== id))
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {current ? "Editar Muestra" : "Nueva Muestra"}
          </h2>
          <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Nombre de la muestra" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temática</label>
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Ej. Historia, Insignias" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Lugar físico" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Imágenes (Máximo 10, max 5MB)</label>
              <div>
                <input 
                  type="file" 
                  id="exhibition-image-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button type="button" onClick={() => document.getElementById('exhibition-image-upload')?.click()} className="text-sm bg-[#31573c] hover:bg-[#25422d] text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:opacity-50" disabled={isLoading}>
                  <Plus size={16} /> Subir Imagen
                </button>
              </div>
            </div>
            
            {images.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded text-gray-500 text-sm">
                No hay imágenes configuradas. Sube imágenes para esta muestra.
              </div>
            ) : (
              <div className="space-y-3">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-gray-50 p-2 rounded border border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {img.url ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={16} className="m-auto mt-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm text-gray-600 truncate">{img.url}</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-0.5">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[#31573c] hover:bg-[#25422d] text-white rounded disabled:opacity-50 flex items-center gap-2">
              {isLoading ? "Guardando..." : "Guardar Muestra"}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button onClick={handleCreateNew} className="bg-[#31573c] hover:bg-[#25422d] text-white px-4 py-2 rounded flex items-center gap-2 shadow-sm transition-colors">
          <Plus size={18} /> Nueva Muestra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exhibitions.map((ex) => (
          <div key={ex.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {ex.images && ex.images.length > 0 ? (
              <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img src={ex.images[0].url} alt={ex.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {ex.images.length} fotos
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                <ImageIcon size={32} />
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-1">{ex.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{ex.theme || "Sin temática"}</p>
              
              <div className="mt-auto pt-4 border-t flex justify-end gap-2">
                <button onClick={() => handleEdit(ex)} className="p-2 text-gray-600 hover:text-[#31573c] hover:bg-[#e4decb]/30 rounded transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(ex.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {exhibitions.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <Presentation size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay muestras creadas.</p>
            <p className="text-gray-400 text-sm mt-1">Las muestras creadas aparecerán aquí y en la página pública.</p>
          </div>
        )}
      </div>
    </div>
  )
}
