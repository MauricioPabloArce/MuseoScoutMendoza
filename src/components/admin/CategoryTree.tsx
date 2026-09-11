"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, ChevronUp, Folder, FolderOpen, MoreVertical, Plus, Edit, Eye, EyeOff, Archive, Save, Trash2, AlertTriangle, ShieldX } from "lucide-react"
import type { CategoryWithPieceCount } from "@/app/admin/(protected)/categorias/actions"
import { createCategory, updateCategory, deleteCategory, uploadCategoryImage, togglePublishCategory, archiveCategory } from "@/app/admin/(protected)/categorias/actions"
import FileErrorModal from "./FileErrorModal"
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

export default function CategoryTree({ data, availableSections = [], members = [], userRole = 'VIEWER' }: { data: any[], availableSections?: any[], members?: any[], userRole?: string }) {
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
  const [showSizeError, setShowSizeError] = useState(false)
  const [catLeaderId, setCatLeaderId] = useState<string>("")
  const [file, setFile] = useState<File | null>(null)
  const [selectedSections, setSelectedSections] = useState<string[]>([])
  const [categoryHasChildren, setCategoryHasChildren] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [noPermissionModal, setNoPermissionModal] = useState(false)
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  
  const tree = buildTree(data)

  const openModal = (parentId?: string, editNode?: any) => {
    if (editNode) {
      setEditCategoryId(editNode.id)
      setCatName(editNode.name)
      setCatPrefix(editNode.prefix)
      setCatDescription(editNode.description || "")
      setCatImageUrl(editNode.imageUrl || null)
      setCatLeaderId(editNode.leaderId || "")
      setFile(null)
      setFile(null)
      setTargetParentId(editNode.parentId || undefined)
      // Ordenar por el campo order para respetar el orden guardado
      const sortedSections = [...(editNode.sections || [])].sort((a: any, b: any) => a.order - b.order)
      setSelectedSections(sortedSections.map((s: any) => s.sectionId))
      setCategoryHasChildren(editNode.children?.length > 0)
    } else {
      setEditCategoryId(null)
      setTargetParentId(parentId)
      setCatName("")
      const parentPrefix = parentId ? tree.flatMap(n => [n, ...n.children]).find(n => n.id === parentId)?.prefix || "" : ""
      setCatPrefix(parentPrefix)
      setCatDescription("")
      setCatImageUrl(null)
      setCatLeaderId("")
      setFile(null)
      
      // Default to "Datos pieza" section if it exists
      const datosPiezaId = availableSections.find(s => s.name?.toLowerCase().trim() === 'datos pieza')?.id
      if (editNode) {
        let sections = editNode.sections?.map((s: any) => s.sectionId) || []
        if (datosPiezaId && !sections.includes(datosPiezaId)) {
          sections.unshift(datosPiezaId)
        } else if (datosPiezaId && sections.indexOf(datosPiezaId) > 0) {
          sections = [datosPiezaId, ...sections.filter((id: string) => id !== datosPiezaId)]
        }
        setSelectedSections(sections)
      } else {
        setSelectedSections(datosPiezaId ? [datosPiezaId] : [])
      }
      setCategoryHasChildren(false)
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
    
    try {
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
        res = await updateCategory(editCategoryId, { name: catName, slug, prefix, description: catDescription, parentId: targetParentId, sectionIds: selectedSections, imageUrl: finalImageUrl || undefined, leaderId: catLeaderId || undefined })
      } else {
        res = await createCategory({ name: catName, slug, prefix, description: catDescription, parentId: targetParentId, sectionIds: selectedSections, imageUrl: finalImageUrl || undefined, leaderId: catLeaderId || undefined })
      }
      
      setIsSaving(false)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(editCategoryId ? "Categoría actualizada con éxito" : "Categoría creada con éxito")
        setModalOpen(false)
      }
    } catch (error: any) {
      setIsSaving(false)
      toast.error(error.message || "La imagen es muy pesada o hubo un error de conexión")
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

          {isAdmin && (
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
          )}
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
          {isAdmin ? (
          <button 
            onClick={() => openModal(undefined)}
            className="text-sm bg-[#374151] hover:bg-[#4b5563] text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Categoría Raíz
          </button>
          ) : (
          <button 
            onClick={() => setNoPermissionModal(true)}
            className="text-sm bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus size={16} /> Categoría Raíz
          </button>
          )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
            <div className="bg-gradient-to-r from-[#1f2937] to-[#374151] px-6 py-5 flex justify-between items-center text-white shrink-0">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {editCategoryId ? <Edit size={22} className="text-amber-400" /> : <Plus size={22} className="text-green-400" />}
                {editCategoryId ? "Editar Proyecto / Categoría" : "Nuevo Proyecto / Categoría"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full">×</button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              {/* Sección Principal */}
              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <FolderOpen size={16} className="text-[#31573c]" /> 
                  Identificación Principal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la Categoría <span className="text-red-500">*</span></label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#31573c]/30 focus:border-[#31573c] transition-all bg-white"
                    value={catName}
                    onChange={e => {
                      setCatName(e.target.value)
                      if (!catPrefix) setCatPrefix(e.target.value.substring(0, 2).toUpperCase())
                    }}
                    placeholder="Ej: Insignias"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prefijo Registral <span className="text-red-500">*</span></label>
                  <div className="flex shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-[#31573c]/30 focus-within:border-[#31573c]">
                    {targetParentId && !editCategoryId && (
                      <span className="inline-flex items-center px-3 bg-gray-100 text-gray-600 font-mono text-sm border-r border-gray-300">
                        {tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix}
                      </span>
                    )}
                    <input 
                      type="text" 
                      className="w-full p-2.5 uppercase font-mono text-gray-800 bg-white focus:outline-none"
                      value={catPrefix.replace(new RegExp(`^${tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix || ''}`), '')}
                      onChange={e => {
                        const parentPrefix = (targetParentId && !editCategoryId) ? (tree.flatMap(n => [n, ...n.children]).find(n => n.id === targetParentId)?.prefix || '') : ''
                        setCatPrefix(parentPrefix + e.target.value.toUpperCase())
                      }}
                      placeholder="Ej: IN"
                      maxLength={4}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500"/>
                    Prefijo final de inventario: <strong className="text-gray-900 font-mono bg-gray-200 px-1 rounded">{catPrefix}</strong>
                  </p>
                </div>
              </div>
              </div>

              {/* Lider y Descripción */}
              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                  <Eye size={16} className="text-blue-500" /> 
                  Presentación Pública
                </h4>
                
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Líder del Proyecto (Opcional)</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-800 bg-white focus:ring-2 focus:ring-[#31573c]/30 focus:border-[#31573c] transition-all"
                    value={catLeaderId}
                    onChange={e => setCatLeaderId(e.target.value)}
                  >
                    <option value="">-- Sin asignar --</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.user?.name || member.user?.email} ({member.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">Aparecerá como responsable del proyecto en el catálogo público.</p>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción de la Categoría (Opcional)</label>
                  <textarea 
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[140px] focus:ring-2 focus:ring-[#31573c]/30 focus:border-[#31573c] transition-all bg-white"
                    value={catDescription}
                    onChange={e => setCatDescription(e.target.value)}
                    placeholder="Breve descripción que se mostrará en el catálogo al público..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Imagen de Portada (Opcional)</label>
                  <div className="flex flex-col gap-3 border-2 border-dashed border-gray-300 p-4 rounded-xl bg-gray-50 items-center justify-center min-h-[140px] hover:bg-gray-100 transition-colors">
                    {(file || catImageUrl) ? (
                      <div className="relative w-full h-full flex flex-col items-center group">
                        <img 
                          src={file ? URL.createObjectURL(file) : (catImageUrl as string)} 
                          alt="Preview" 
                          className="h-28 w-auto object-contain rounded-lg shadow-sm border border-gray-200 bg-white"
                        />
                        <button 
                          type="button" 
                          onClick={() => { setFile(null); setCatImageUrl(null) }} 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          title="Quitar imagen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) {
                              if (f.size > 5 * 1024 * 1024) {
                                setShowSizeError(true)
                                e.target.value = ""
                                return
                              }
                              setFile(f)
                            }
                          }}
                          className="text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 w-full cursor-pointer"
                        />
                        <p className="text-xs text-gray-400 text-center mt-2">Recomendado: Formato apaisado, máx 5MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              </div>

              {/* Secciones y Campos */}
              {availableSections.length > 0 && (
                <div className={`p-5 rounded-xl border ${categoryHasChildren ? 'bg-amber-50 border-amber-200' : 'bg-green-50/50 border-green-100'}`}>
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <Folder size={16} className={categoryHasChildren ? "text-amber-600" : "text-[#31573c]"} /> 
                      {categoryHasChildren ? "Categoría Contenedora" : "Secciones de Ficha Museológica"}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {categoryHasChildren 
                        ? "Esta categoría contiene subcategorías, por lo tanto funciona exclusivamente como carpeta. No puede alojar piezas directamente ni tener secciones configuradas."
                        : "Elige qué secciones de información deseas activar para las piezas registradas en este proyecto."}
                    </p>
                  </div>
                  
                  {!categoryHasChildren && (
                    <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const datosPiezaId = availableSections.find(s => s.name?.toLowerCase().trim() === 'datos pieza')?.id;
                      const sorted = [...availableSections].sort((a, b) => {
                        if (a.id === datosPiezaId) return -1;
                        if (b.id === datosPiezaId) return 1;
                        const aIdx = selectedSections.indexOf(a.id);
                        const bIdx = selectedSections.indexOf(b.id);
                        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                        if (aIdx !== -1) return -1;
                        if (bIdx !== -1) return 1;
                        return a.name.localeCompare(b.name);
                      });

                      return sorted.map((section: any) => {
                        const isSelected = selectedSections.includes(section.id);
                        const isDatosPieza = section.id === datosPiezaId;
                        const selectedIdx = selectedSections.indexOf(section.id);
                        
                        return (
                          <label 
                            key={section.id} 
                            className={`flex items-center gap-3 text-sm p-3.5 border rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-[#31573c] bg-white shadow-sm ring-1 ring-[#31573c]' 
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                disabled={isDatosPieza}
                                className={`rounded h-4.5 w-4.5 ${isDatosPieza ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-[#31573c] border-gray-300 focus:ring-[#31573c]'}`}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSections([...selectedSections, section.id])
                                  } else {
                                    setSelectedSections(selectedSections.filter(id => id !== section.id))
                                  }
                                }}
                              />
                              <div>
                                <span className="font-bold block text-gray-900 flex items-center gap-2">
                                  {section.name}
                                  {isDatosPieza && <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Fijo / 1º</span>}
                                  {isSelected && !isDatosPieza && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded ml-1">{selectedIdx + 1}º</span>}
                                </span>
                                <span className="block text-xs text-gray-500 mt-1">{section.fields?.length || 0} campos configurados</span>
                              </div>
                            </div>

                            {isSelected && !isDatosPieza && (
                              <div className="flex flex-col gap-1 items-center justify-center border-l border-gray-200 pl-3 ml-2">
                                <button
                                  type="button"
                                  disabled={selectedIdx <= 1}
                                  onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    if (selectedIdx <= 1) return;
                                    const newArr = [...selectedSections];
                                    [newArr[selectedIdx - 1], newArr[selectedIdx]] = [newArr[selectedIdx], newArr[selectedIdx - 1]];
                                    setSelectedSections(newArr);
                                  }}
                                  className="text-gray-400 hover:text-[#31573c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronUp size={20} />
                                </button>
                                <button
                                  type="button"
                                  disabled={selectedIdx === selectedSections.length - 1}
                                  onClick={(e) => {
                                    e.preventDefault(); e.stopPropagation();
                                    if (selectedIdx === selectedSections.length - 1) return;
                                    const newArr = [...selectedSections];
                                    [newArr[selectedIdx + 1], newArr[selectedIdx]] = [newArr[selectedIdx], newArr[selectedIdx + 1]];
                                    setSelectedSections(newArr);
                                  }}
                                  className="text-gray-400 hover:text-[#31573c] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronDown size={20} />
                                </button>
                              </div>
                            )}
                          </label>
                        )
                      });
                    })()}
                  </div>
                  )}
                </div>
              )}
            </form>
            
            {/* Footer Buttons */}
            <div className="bg-gray-100/80 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateCategory}
                disabled={isSaving}
                type="button" 
                className="px-6 py-2.5 bg-[#1f2937] hover:bg-[#374151] text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Save size={18} /> {isSaving ? "Guardando..." : (editCategoryId ? "Guardar Cambios" : "Crear Proyecto")}
              </button>
            </div>
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

      {/* No Permission Modal */}
      {noPermissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <ShieldX className="text-red-500" size={18} />
                Sin permisos de acceso
              </h3>
              <button onClick={() => setNoPermissionModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-3">
                No tenés permisos para crear o modificar categorías del acervo.
              </p>
              <p className="text-sm text-gray-500">
                La gestión de categorías está reservada para <strong>administradores</strong>. Si necesitás acceso, contactá al responsable del sistema.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setNoPermissionModal(false)}
                className="px-4 py-2 bg-[#1d4328] text-white rounded hover:bg-[#255633] text-sm font-medium"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <FileErrorModal 
        isOpen={showSizeError} 
        onClose={() => setShowSizeError(false)} 
        maxSizeMB={5} 
      />
    </>
  )
}
