"use client"

import { useState } from "react"
import { createSpecialProject, updateSpecialProject, deleteSpecialProject, uploadProjectImage } from "@/app/admin/(protected)/proyectos-especiales/actions"
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Sparkles } from "lucide-react"
import toast from "react-hot-toast"

type SpecialProject = any

export default function SpecialProjectsClient({ initialData }: { initialData: SpecialProject[] }) {
  const [projects, setProjects] = useState<SpecialProject[]>(initialData)
  const [isEditing, setIsEditing] = useState(false)
  const [current, setCurrent] = useState<Partial<SpecialProject> | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Form State
  const [name, setName] = useState("")
  const [theme, setTheme] = useState("")
  const [description, setDescription] = useState("")
  const [objective, setObjective] = useState("")
  const [images, setImages] = useState<{ url: string; caption: string; order: number }[]>([])

  const handleEdit = (proj: SpecialProject) => {
    setCurrent(proj)
    setName(proj.name)
    setTheme(proj.theme || "")
    setDescription(proj.description || "")
    setObjective(proj.objective || "")
    setImages(proj.images?.map((img: any) => ({ ...img, caption: img.caption || "" })) || [])
    setIsEditing(true)
  }

  const handleCreateNew = () => {
    setCurrent(null)
    setName("")
    setTheme("")
    setDescription("")
    setObjective("")
    setImages([])
    setIsEditing(true)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo excede el tamaño máximo de 5MB")
      return
    }

    setIsLoading(true)
    const formData = new FormData()
    formData.append("file", file)

    const res = await uploadProjectImage(formData)
    setIsLoading(false)

    if (res.error) {
      toast.error(res.error)
    } else if (res.url) {
      setImages([...images, { url: res.url, caption: "", order: images.length }])
      toast.success("Imagen subida")
    }
    
    // Reset input
    e.target.value = ""
  }

  const handleImageChange = (index: number, field: 'url' | 'caption', value: string) => {
    const newImages = [...images]
    newImages[index][field] = value
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
      description,
      objective,
      images: validImages
    }

    let res
    if (current?.id) {
      res = await updateSpecialProject(current.id, dataToSubmit)
    } else {
      res = await createSpecialProject(dataToSubmit)
    }

    setIsLoading(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(current?.id ? "Proyecto actualizado" : "Proyecto creado")
      setIsEditing(false)
      window.location.reload()
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto?")) return
    const res = await deleteSpecialProject(id)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Proyecto eliminado")
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {current ? "Editar Proyecto Especial" : "Nuevo Proyecto Especial"}
          </h2>
          <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Nombre" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Temática</label>
              <input type="text" value={theme} onChange={e => setTheme(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Temática general" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none min-h-[100px]" placeholder="Detalles del proyecto..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <textarea value={objective} onChange={e => setObjective(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none min-h-[80px]" placeholder="¿Qué se busca lograr con esto?" />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Imágenes (Cantidad Dinámica, max 5MB)</label>
              <div>
                <input 
                  type="file" 
                  id="project-image-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <button type="button" onClick={() => document.getElementById('project-image-upload')?.click()} className="text-sm bg-[#31573c] hover:bg-[#25422d] text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors disabled:opacity-50" disabled={isLoading}>
                  <Plus size={16} /> Subir Imagen
                </button>
              </div>
            </div>
            
            {images.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded text-gray-500 text-sm">
                No hay imágenes configuradas. Puedes subir tantas como desees.
              </div>
            ) : (
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 border rounded bg-gray-50">
                    <div className="w-20 h-20 bg-gray-200 rounded border shadow-sm flex-shrink-0 overflow-hidden">
                      {img.url ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="m-auto mt-6 text-gray-400" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-gray-600 truncate border border-transparent p-2 bg-white rounded shadow-sm">{img.url}</p>
                      <input type="text" value={img.caption} onChange={e => handleImageChange(idx, 'caption', e.target.value)} placeholder="Descripción / Texto sobre la imagen (opcional)" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none text-sm" />
                    </div>
                    <button type="button" onClick={() => handleRemoveImage(idx)} className="p-2 text-red-500 hover:bg-red-100 rounded mt-0.5 transition-colors">
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
              {isLoading ? "Guardando..." : "Guardar Proyecto"}
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
          <Plus size={18} /> Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {proj.images && proj.images.length > 0 ? (
              <div className="h-56 overflow-hidden bg-gray-100 relative">
                <img src={proj.images[0].url} alt={proj.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                  <h3 className="text-xl font-bold text-white mb-1">{proj.name}</h3>
                  <p className="text-sm text-gray-300">{proj.theme || "Sin temática"}</p>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {proj.images.length} fotos
                </div>
              </div>
            ) : (
              <div className="h-56 bg-gradient-to-br from-[#31573c] to-[#1f3a27] p-6 flex flex-col justify-end text-white">
                <h3 className="text-xl font-bold mb-1">{proj.name}</h3>
                <p className="text-sm text-gray-300">{proj.theme || "Sin temática"}</p>
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{proj.description}</p>
              
              <div className="mt-auto pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-gray-400">Creado {new Date(proj.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(proj)} className="p-2 text-gray-600 hover:text-[#31573c] hover:bg-[#e4decb]/30 rounded transition-colors" title="Editar">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(proj.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-xl">
            <Sparkles size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No hay proyectos especiales creados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
