"use client"

import { useState } from "react"
import { createSpecialProject, updateSpecialProject, deleteSpecialProject, uploadProjectImage } from "@/app/admin/(protected)/proyectos-especiales/actions"
import FileErrorModal from "./FileErrorModal"
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Sparkles, Eye, Target, FileText, ArrowUp, ArrowDown, Type, Paperclip } from "lucide-react"

// Función auxiliar para detectar si una URL es una imagen
function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url.toLowerCase())
}
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
  const [objective, setObjective] = useState("")
  const [isPublished, setIsPublished] = useState(false)
  const [blocks, setBlocks] = useState<any[]>([])
  
  // Error Modal State
  const [showSizeError, setShowSizeError] = useState(false)

  // Preview State
  const [previewProject, setPreviewProject] = useState<SpecialProject | null>(null)

  const handleEdit = (proj: SpecialProject) => {
    setCurrent(proj)
    setName(proj.name)
    setTheme(proj.theme || "")
    setObjective(proj.objective || "")
    setIsPublished(proj.isPublished || false)
    
    // Parse existing content or migrate from description+images
    if (proj.content) {
      try {
        setBlocks(JSON.parse(proj.content))
      } catch (e) {
        setBlocks([])
      }
    } else {
      const migratedBlocks = []
      if (proj.description) migratedBlocks.push({ id: Math.random().toString(), type: 'text', content: proj.description })
      if (proj.images) {
        proj.images.forEach((img: any) => {
          migratedBlocks.push({
            id: Math.random().toString(),
            type: isImage(img.url) ? 'image' : 'document',
            url: img.url,
            caption: img.caption || ""
          })
        })
      }
      setBlocks(migratedBlocks)
    }
    setIsEditing(true)
  }

  const handleCreateNew = () => {
    setCurrent(null)
    setName("")
    setTheme("")
    setObjective("")
    setIsPublished(false)
    setBlocks([])
    setIsEditing(true)
  }

  // Blocks Handlers
  const addTextBlock = () => {
    setBlocks([...blocks, { id: Math.random().toString(), type: 'text', content: '' }])
  }

  const handleFileUploadForBlock = async (e: React.ChangeEvent<HTMLInputElement>, insertIndex: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      setShowSizeError(true)
      e.target.value = ""
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
      const type = isImage(res.url) ? 'image' : 'document'
      const newBlock = { id: Math.random().toString(), type, url: res.url, caption: "" }
      
      const newBlocks = [...blocks]
      if (insertIndex === -1) {
        newBlocks.push(newBlock)
      } else {
        newBlocks.splice(insertIndex, 0, newBlock)
      }
      setBlocks(newBlocks)
      toast.success(type === 'image' ? "Imagen subida" : "Documento subido")
    }
    
    e.target.value = ""
  }

  const updateBlock = (id: string, field: string, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return
    
    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp
    setBlocks(newBlocks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre es requerido")
      return
    }

    setIsLoading(true)
    
    // Extract first text block as fallback description
    const firstText = blocks.find(b => b.type === 'text')?.content || ""
    
    // Extract files as fallback images array
    const validImages = blocks
      .filter(b => (b.type === 'image' || b.type === 'document') && b.url?.trim() !== "")
      .map((b, index) => ({ url: b.url, caption: b.caption || "", order: index }))

    const dataToSubmit = {
      name,
      theme,
      description: firstText, // fallback for older displays
      content: JSON.stringify(blocks), // The new source of truth
      objective,
      isPublished,
      images: validImages // fallback gallery
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
              <textarea value={objective} onChange={e => setObjective(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none min-h-[80px]" placeholder="¿Qué se busca lograr con esto?" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenido Dinámico del Proyecto</label>
              
              <div className="space-y-4">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm group">
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded shadow-md p-1">
                      <button type="button" onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveBlock(idx, 'down')} disabled={idx === blocks.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-600 uppercase tracking-wider">
                        {block.type === 'text' && <><Type size={16} /> Bloque de Texto</>}
                        {block.type === 'image' && <><ImageIcon size={16} /> Imagen</>}
                        {block.type === 'document' && <><FileText size={16} /> Documento Adjunto</>}
                      </div>
                      <button type="button" onClick={() => removeBlock(block.id)} className="text-red-500 hover:bg-red-100 p-1.5 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {block.type === 'text' ? (
                      <textarea
                        value={block.content || ""}
                        onChange={e => updateBlock(block.id, 'content', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#31573c] focus:outline-none min-h-[100px]"
                        placeholder="Escribe el texto aquí..."
                      />
                    ) : (
                      <div className="flex gap-4 items-start bg-white p-3 border border-gray-200 rounded-lg">
                        <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {block.type === 'image' ? (
                            block.url ? <img src={block.url} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-400" />
                          ) : (
                            <FileText size={32} className="text-[#0B69CA]" />
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="text-sm text-gray-600 truncate border border-transparent p-2 bg-gray-50 rounded shadow-sm" title={block.url}>{block.url}</p>
                          <input 
                            type="text" 
                            value={block.caption || ""} 
                            onChange={e => updateBlock(block.id, 'caption', e.target.value)} 
                            placeholder={block.type === 'image' ? "Pie de foto (opcional)" : "Título del documento"} 
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none text-sm" 
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-2">
                      <input 
                        type="file" 
                        id={`file-upload-mid-${idx}`} 
                        className="hidden" 
                        accept="image/*,application/pdf,.doc,.docx"
                        onChange={(e) => handleFileUploadForBlock(e, idx + 1)}
                      />
                      <button type="button" onClick={() => { const b = [...blocks]; b.splice(idx + 1, 0, { id: Math.random().toString(), type: 'text', content: '' }); setBlocks(b) }} className="bg-white border border-gray-300 shadow-md text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-gray-50">
                        <Plus size={12} /> Texto
                      </button>
                      <button type="button" onClick={() => document.getElementById(`file-upload-mid-${idx}`)?.click()} className="bg-white border border-gray-300 shadow-md text-gray-700 text-xs px-2 py-1 rounded-full flex items-center gap-1 hover:bg-gray-50">
                        <Plus size={12} /> Archivo
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {blocks.length === 0 && (
                <div className="text-center py-10 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl">
                  <Sparkles size={32} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">Este proyecto está vacío.</p>
                  <p className="text-sm text-gray-500 mb-6">Comienza a construirlo agregando un bloque de contenido.</p>
                </div>
              )}

              <div className="mt-6 flex justify-center gap-4">
                <input 
                  type="file" 
                  id="file-upload-end" 
                  className="hidden" 
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={(e) => handleFileUploadForBlock(e, -1)}
                />
                <button type="button" onClick={addTextBlock} className="bg-white border-2 border-[#31573c] text-[#31573c] hover:bg-[#31573c] hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Type size={18} /> Agregar Párrafo
                </button>
                <button type="button" onClick={() => document.getElementById('file-upload-end')?.click()} className="bg-white border-2 border-[#0B69CA] text-[#0B69CA] hover:bg-[#0B69CA] hover:text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                  <Paperclip size={18} /> Agregar Archivo
                </button>
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <input 
                type="checkbox" 
                id="isPublished" 
                checked={isPublished} 
                onChange={e => setIsPublished(e.target.checked)}
                className="w-5 h-5 text-[#31573c] rounded focus:ring-[#31573c]"
              />
              <label htmlFor="isPublished" className="font-medium text-gray-800 cursor-pointer select-none flex-1">
                Publicar Proyecto
                <p className="text-sm text-gray-500 font-normal mt-0.5">Si está desmarcado, se guardará como borrador y no será visible al público.</p>
              </label>
            </div>
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
          <div key={proj.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col relative">
            <div className="absolute top-2 left-2 z-10">
              {proj.isPublished ? (
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded font-medium shadow-sm">Publicado</span>
              ) : (
                <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded font-medium shadow-sm">Borrador</span>
              )}
            </div>
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
              <div className="h-56 bg-gradient-to-br from-[#31573c] to-[#1f3a27] p-6 flex flex-col justify-end text-white relative">
                <h3 className="text-xl font-bold mb-1">{proj.name}</h3>
                <p className="text-sm text-gray-300">{proj.theme || "Sin temática"}</p>
              </div>
            )}
            <div className="p-4 flex-1 flex flex-col">
              <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{proj.description}</p>
              
              <div className="mt-auto pt-4 border-t flex justify-between items-center">
                <span className="text-xs text-gray-400">Creado {new Date(proj.createdAt).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewProject(proj)} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Vista Previa">
                    <Eye size={18} />
                  </button>
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

      {previewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-[#fdfdfd] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b bg-white shrink-0 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <span className="bg-[#31573c] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <Eye size={14} /> Vista Previa Pública
                </span>
                <span className="text-sm text-gray-500 hidden sm:inline-block">
                  Así es como se ve este proyecto en la página de Proyectos Especiales.
                </span>
              </div>
              <button onClick={() => setPreviewProject(null)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Reusing the public page design for the article block */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#fdfcf8]">
              <article className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e4decb]/50 max-w-4xl mx-auto">
                <div className="p-8 md:p-12">
                  {/* Etiqueta / Temática */}
                  {previewProject.theme && (
                    <div className="inline-block bg-[#e4decb]/30 text-[#31573c] px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-6">
                      {previewProject.theme}
                    </div>
                  )}

                  {/* Título Principal */}
                  <h2 className="text-3xl md:text-5xl font-bold text-[#31573c] mb-6 font-serif">
                    {previewProject.name}
                  </h2>

                  {/* Descripción */}
                  {previewProject.description && (
                    <div className="text-lg md:text-xl text-gray-700 leading-relaxed mb-10 max-w-3xl font-light">
                      {previewProject.description.split('\n').map((paragraph: string, idx: number) => (
                        <p key={idx} className="mb-4">{paragraph}</p>
                      ))}
                    </div>
                  )}

                  {/* Objetivo (Destacado) */}
                  {previewProject.objective && (
                    <div className="bg-[#f8f9f6] border-l-4 border-[#31573c] p-6 md:p-8 rounded-r-2xl mb-12 relative overflow-hidden">
                      <Target className="absolute -bottom-6 -right-6 text-[#e4decb] opacity-40 w-32 h-32" />
                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-[#31573c] mb-3 flex items-center gap-2">
                          <Target size={20} />
                          El Objetivo
                        </h3>
                        <p className="text-gray-700 italic leading-relaxed text-lg">
                          "{previewProject.objective}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Galería Fotográfica */}
                {previewProject.images && previewProject.images.length > 0 && (
                  <div className="px-8 md:px-12 pb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="text-[#c1743a]" size={24} />
                      <h3 className="text-2xl font-bold text-[#31573c] font-serif">Galería del Proyecto</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {previewProject.images.map((img: any, idx: number) => (
                        <div key={idx} className={`group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 ${
                          idx === 0 && previewProject.images.length % 2 !== 0 ? 'md:col-span-2 md:aspect-[21/9]' : 'aspect-[4/3]'
                        }`}>
                          <img 
                            src={img.url} 
                            alt={img.caption || `Imagen ${idx + 1}`} 
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          {/* Gradiente sutil inferior */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {/* Caption */}
                          {img.caption && (
                            <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <p className="text-white font-medium text-lg drop-shadow-md">{img.caption}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            </div>
            
          </div>
        </div>
      )}
      
      <FileErrorModal 
        isOpen={showSizeError} 
        onClose={() => setShowSizeError(false)} 
        maxSizeMB={5} 
      />
    </div>
  )
}
