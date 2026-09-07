"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, Edit, Eye, EyeOff, Archive, Save, Trash2, AlertTriangle } from "lucide-react"
import type { CategoryWithPieceCount } from "@/app/admin/(protected)/categorias/actions"
import { uploadCategoryImage, togglePublishCategory, archiveCategory, deleteCategory, createCategory, updateCategory } from "@/app/admin/(protected)/categorias/actions"
import toast from "react-hot-toast"

interface TreeNode {
  id: string
  name: string
  prefix: string
  parentId: string | null
  isPublished: boolean
  isArchived: boolean
  description?: string | null
  _count: { pieces: number }
  fields?: any[]
  children: TreeNode[]
  [key: string]: any
}

function buildTree(categories: any[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }))

  categories.forEach(cat => {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(map.get(cat.id)!)
    } else {
      roots.push(map.get(cat.id)!)
    }
  })

  return roots
}

export default function CategoryTree({ data, availableFields = [] }: { data: any[], availableFields?: any[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null)
  
  const [targetParentId, setTargetParentId] = useState<string | undefined>(undefined)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
  const [catName, setCatName] = useState("")
  const [catPrefix, setCatPrefix] = useState("")
  const [catDescription, setCatDescription] = useState("")
  const [catImageUrl, setCatImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  
  const tree = buildTree(data)

  const openModal = (parentId?: string, editNode?: any) => {
    if (editNode) {
      setEditCategoryId(editNode.id)
      setCatName(editNode.name)
      setCatPrefix(editNode.prefix)
      setCatDescription(editNode.description || "")
      setCatImageUrl(editNode.imageUrl || null)
      setFile(null)
      setTargetParentId(editNode.parentId || undefined)
      setSelectedFields(editNode.fields?.map((f: any) => f.fieldId) || [])
    } else {
      setEditCategoryId(null)
      setTargetParentId(parentId)
      setCatName("")
      const parentPrefix = parentId ? tree.flatMap(n => [n, ...n.children]).find(n => n.id === parentId)?.prefix || "" : ""
      setCatPrefix(parentPrefix)
      setCatDescription("")
      setCatImageUrl(null)
      setFile(null)
      setSelectedFields([])
    }
    setModalOpen(true)
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catName) return
    setIsSaving(true)
    const parentPrefix = (targetParentId && !editCategoryId) ? (tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix || '') : ''
    const generatedPrefix = catName.substring(0, 2).toUpperCase()
    const prefix = catPrefix || (parentPrefix + generatedPrefix)
    const slug = catName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    
    let finalImageUrl = catImageUrl
    if (file) {
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await uploadCategoryImage(formData)
      if (uploadRes.url) {
        finalImageUrl = uploadRes.url
      }
    }

    let res
    if (editCategoryId) {
      res = await updateCategory(editCategoryId, { name: catName, slug, prefix, description: catDescription, parentId: targetParentId, fieldIds: selectedFields, imageUrl: finalImageUrl || undefined })
    } else {
      res = await createCategory({ name: catName, slug, prefix, description: catDescription, parentId: targetParentId, fieldIds: selectedFields, imageUrl: finalImageUrl || undefined })
    }
    
    setIsSaving(false)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(editCategoryId ? "Categoría actualizada con éxito" : "Categoría creada con éxito")
      setModalOpen(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    const res = await deleteCategory(categoryToDelete.id)
    if (res.success) {
      toast.success("Categoría eliminada")
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
    } else {
      toast.error(res.error || "Error al eliminar")
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpanded(newExpanded)
  }

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expanded.has(node.id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.id} className="select-none">
        <div 
          className="flex items-center justify-between py-2 px-2 hover:bg-gray-100 rounded group border-b border-gray-50 last:border-0"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleExpand(node.id)}>
            <div className="w-5 h-5 flex items-center justify-center text-gray-500">
              {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
            </div>
            
            <div className="text-gray-500">
              {isExpanded && hasChildren ? <FolderOpen size={18} className="text-amber-500" /> : <Folder size={18} className="text-amber-500" />}
            </div>
            
            <span className={`font-medium ${!node.isPublished ? 'text-gray-400' : 'text-gray-700'}`}>
              {node.name}
            </span>
            
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-2">
              {node.prefix}
            </span>

            {node._count.pieces > 0 && (
              <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full ml-auto">
                {node._count.pieces} piezas
              </span>
            )}
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button 
              className="p-1.5 text-gray-400 hover:text-green-600 rounded" 
              title="Agregar Subcategoría"
              onClick={() => openModal(node.id)}
            >
              <Plus size={16} />
            </button>
            <button 
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded" 
              title="Editar"
              onClick={() => openModal(undefined, node)}
            >
              <Edit size={16} />
            </button>
            <button 
              className={`p-1.5 rounded ${node.isPublished ? 'text-gray-400 hover:text-amber-600' : 'text-amber-500 hover:text-amber-600'}`} 
              title={node.isPublished ? "Ocultar" : "Publicar"}
              onClick={() => togglePublishCategory(node.id, !node.isPublished)}
            >
              {node.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button 
              className="p-1.5 text-gray-400 hover:text-red-600 rounded" 
              title="Eliminar"
              onClick={() => {
                setCategoryToDelete({ id: node.id, name: node.name })
                setDeleteModalOpen(true)
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Estructura del Acervo</h3>
          <button 
            onClick={() => openModal(undefined)}
            className="text-sm bg-[#374151] hover:bg-[#4b5563] text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Categoría Raíz
          </button>
        </div>
        <div className="p-2 min-h-[400px]">
          {tree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay categorías creadas. Comienza creando una categoría raíz.
            </div>
          ) : (
            tree.map(node => renderNode(node, 0))
          )}
        </div>
      </div>

      {/* Modal Custom de Tailwind */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editCategoryId ? "Editar Categoría" : "Nueva Categoría"}
            </h3>
            <form onSubmit={handleCreateCategory}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    className="w-full border border-gray-300 rounded p-2"
                    value={catName}
                    onChange={e => {
                      setCatName(e.target.value)
                      if (!catPrefix) setCatPrefix(e.target.value.substring(0, 2).toUpperCase())
                    }}
                    placeholder="Ej: Insignias"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prefijo Registral</label>
                  <div className="flex">
                    {targetParentId && !editCategoryId && (
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                        {tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix}
                      </span>
                    )}
                    <input 
                      type="text" 
                      className={`w-full border border-gray-300 p-2 uppercase ${targetParentId && !editCategoryId ? 'rounded-r-md border-l-0 focus:ring-0 focus:border-gray-300' : 'rounded'}`}
                      value={catPrefix.replace(new RegExp(`^${tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix || ''}`), '')}
                      onChange={e => {
                        const parentPrefix = (targetParentId && !editCategoryId) ? (tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix || '') : ''
                        setCatPrefix(parentPrefix + e.target.value.toUpperCase())
                      }}
                      placeholder="Ej: IN"
                      maxLength={4}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Prefijo final: <strong className="text-gray-700">{catPrefix}</strong></p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Categoría (Opcional)</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded p-2 min-h-[120px]"
                    value={catDescription}
                    onChange={e => setCatDescription(e.target.value)}
                    placeholder="Breve descripción que se mostrará en el catálogo al público..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Portada (Opcional)</label>
                  <div className="flex flex-col gap-3 border-2 border-dashed border-gray-300 p-3 rounded-lg bg-gray-50 items-center justify-center min-h-[120px]">
                    {(file || catImageUrl) ? (
                      <div className="relative w-full h-full flex flex-col items-center">
                        <img 
                          src={file ? URL.createObjectURL(file) : (catImageUrl as string)} 
                          alt="Preview" 
                          className="h-24 w-auto object-contain rounded border border-gray-200 bg-white"
                        />
                        <button 
                          type="button" 
                          onClick={() => { setFile(null); setCatImageUrl(null) }} 
                          className="text-red-500 hover:text-red-700 text-xs font-medium mt-2"
                        >
                          Quitar imagen
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => setFile(e.target.files?.[0] || null)}
                          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 w-full"
                        />
                        <p className="text-xs text-gray-400 text-center mt-1">Recomendado: Formato apaisado, máx 2MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {availableFields.length > 0 && (
                <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Secciones de Ficha Museológica</label>
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {Array.from(new Map(availableFields.filter(f => f.section).map(f => [f.section.id, f.section])).values()).map((section: any) => {
                      // Comprobar si todos los campos de esta sección están seleccionados
                      const sectionFieldIds = availableFields.filter(f => f.section?.id === section.id).map(f => f.id)
                      const isSelected = sectionFieldIds.length > 0 && sectionFieldIds.every(id => selectedFields.includes(id))
                      
                      return (
                        <label key={section.id} className="flex items-center gap-2 text-sm bg-white p-2 border rounded cursor-pointer hover:border-gray-400">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Add all fields from this section
                                const newFields = [...selectedFields]
                                sectionFieldIds.forEach(id => {
                                  if (!newFields.includes(id)) newFields.push(id)
                                })
                                setSelectedFields(newFields)
                              } else {
                                // Remove all fields from this section
                                setSelectedFields(selectedFields.filter(id => !sectionFieldIds.includes(id)))
                              }
                            }}
                          />
                          <span>
                            {section.name}
                            <span className="block text-xs text-gray-400">{sectionFieldIds.length} campos configurados</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isSaving}
                  type="submit" 
                  className="px-6 py-2 bg-[#374151] text-white hover:bg-[#4b5563] rounded font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} /> {isSaving ? "Guardando..." : (editCategoryId ? "Actualizar Categoría" : "Crear Categoría")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} />
                Confirmar Eliminación
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro que deseas eliminar la categoría <strong>"{categoryToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta acción no se puede deshacer. (Recuerda que no se podrá eliminar si tiene piezas asignadas o subcategorías).
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
