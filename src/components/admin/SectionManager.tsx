"use client"

import { useState } from "react"
import { Layers, Plus, Edit, Trash2, ChevronDown, ChevronRight, Settings } from "lucide-react"
import SectionBuilder from "./SectionBuilder"
import FieldBuilder from "./FieldBuilder"
import { deleteSection, deleteField } from "@/app/admin/(protected)/campos/actions"
import toast from "react-hot-toast"

export default function SectionManager({ sections }: { sections: any[] }) {
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null)
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [editingField, setEditingField] = useState<any | null>(null)
  const [isCreatingSection, setIsCreatingSection] = useState(false)
  const [isCreatingFieldForSectionId, setIsCreatingFieldForSectionId] = useState<string | null>(null)
  
  // Custom Delete Modals State
  const [sectionToDelete, setSectionToDelete] = useState<{id: string, name: string} | null>(null)
  const [fieldToDelete, setFieldToDelete] = useState<{id: string, name: string} | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggleSection = (id: string) => {
    if (expandedSectionId === id) setExpandedSectionId(null)
    else setExpandedSectionId(id)
  }

  const handleDeleteSectionConfirm = async () => {
    if (!sectionToDelete) return
    setIsDeleting(true)
    const res = await deleteSection(sectionToDelete.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success("Sección eliminada")
      if (expandedSectionId === sectionToDelete.id) setExpandedSectionId(null)
      setSectionToDelete(null)
    } else {
      toast.error((res as any).error || "Error al eliminar")
    }
  }

  const handleDeleteFieldConfirm = async () => {
    if (!fieldToDelete) return
    setIsDeleting(true)
    const res = await deleteField(fieldToDelete.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success("Campo eliminado")
      setFieldToDelete(null)
    } else {
      toast.error((res as any).error || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Layers size={20} className="text-[#374151]" />
            Secciones de Información
          </h2>
          <p className="text-sm text-gray-500">Administra las secciones y los campos que contienen.</p>
        </div>
        <button 
          onClick={() => {
            setIsCreatingSection(true)
            setEditingSection(null)
            setIsCreatingFieldForSectionId(null)
            setEditingField(null)
          }}
          className="bg-[#374151] hover:bg-[#4b5563] text-white px-4 py-2 rounded flex items-center gap-2 font-medium transition-colors"
        >
          <Plus size={18} /> Nueva Sección
        </button>
      </div>

      {(isCreatingSection || editingSection) && (
        <div className="border border-[#374151]/20 shadow-md rounded-lg p-1 bg-white">
          <SectionBuilder initialData={editingSection} onCancel={() => {
            setIsCreatingSection(false)
            setEditingSection(null)
          }} />
        </div>
      )}

      <div className="space-y-4">
        {sections.map(section => {
          const isExpanded = expandedSectionId === section.id
          
          return (
            <div key={section.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
              <div 
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${isExpanded ? 'bg-[#f8f9fa] border-b border-gray-200' : 'hover:bg-gray-50'}`}
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      {section.name}
                      {section.name.toLowerCase().includes('datos pieza') && (
                         <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase">Por defecto</span>
                      )}
                    </h3>
                    {section.description && <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>}
                  </div>
                </div>
                
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mr-4">
                    {section.fields?.length || 0} campos
                  </span>
                  
                  <button 
                    onClick={() => {
                      setEditingSection(section)
                      setIsCreatingSection(false)
                      setIsCreatingFieldForSectionId(null)
                      setEditingField(null)
                      // scroll to top logic if needed
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Editar Sección"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setSectionToDelete({ id: section.id, name: section.name })
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                    title="Eliminar Sección"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">Campos en esta sección:</h4>
                    <button 
                      onClick={() => {
                        setIsCreatingFieldForSectionId(section.id)
                        setEditingField(null)
                        setIsCreatingSection(false)
                        setEditingSection(null)
                      }}
                      className="text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <Plus size={16} /> Añadir Campo
                    </button>
                  </div>

                  {(isCreatingFieldForSectionId === section.id || (editingField && editingField.sectionId === section.id)) && (
                    <div className="mb-6 border border-blue-200 shadow-md rounded-lg overflow-hidden bg-white">
                      <div className="bg-blue-50 border-b border-blue-100 p-3 flex justify-between items-center">
                        <h5 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                          <Settings size={16} />
                          {editingField ? "Editar Campo" : `Nuevo Campo en "${section.name}"`}
                        </h5>
                      </div>
                      <FieldBuilder 
                        sections={sections} // Still needed for the internal select, though we could fix it to the current section
                        initialData={editingField ? { ...editingField, sectionId: section.id } : { sectionId: section.id }} 
                        onCancel={() => {
                          setIsCreatingFieldForSectionId(null)
                          setEditingField(null)
                        }}
                      />
                    </div>
                  )}

                  {section.fields && section.fields.length > 0 ? (
                    <table className="w-full text-left text-sm border-t border-l border-r border-gray-200 rounded-lg overflow-hidden bg-white">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-gray-600">Nombre</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Key</th>
                          <th className="px-4 py-2 font-semibold text-gray-600">Tipo</th>
                          <th className="px-4 py-2 font-semibold text-gray-600 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {section.fields.map((field: any) => (
                          <tr key={field.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{field.name}</td>
                            <td className="px-4 py-3 text-gray-500 font-mono text-xs">{field.internalKey}</td>
                            <td className="px-4 py-3">{field.type}</td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button 
                                onClick={() => {
                                  setEditingField(field)
                                  setIsCreatingFieldForSectionId(null)
                                  setIsCreatingSection(false)
                                  setEditingSection(null)
                                }}
                                className="inline-block p-1 text-gray-400 hover:text-blue-600 mr-2 transition-colors"
                              >
                                <Edit size={16} />
                              </button>
                              <button 
                                onClick={() => setFieldToDelete({ id: field.id, name: field.name })}
                                className="inline-block p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 rounded-lg border-dashed">
                      No hay campos en esta sección. Añade un campo nuevo.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {sections.length === 0 && (
          <div className="text-center py-12 text-gray-500 border border-gray-200 border-dashed rounded-lg bg-gray-50">
            No hay secciones creadas aún.
          </div>
        )}
      </div>

      {/* Modal Eliminar Sección */}
      {sectionToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-red-500" size={18} />
                Confirmar Eliminación
              </h3>
              <button onClick={() => setSectionToDelete(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro que deseas eliminar la sección <strong>"{sectionToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta acción no se puede deshacer. Se perderá la configuración visual de la sección.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleDeleteSectionConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Campo */}
      {fieldToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Settings className="text-red-500" size={18} />
                Confirmar Eliminación
              </h3>
              <button onClick={() => setFieldToDelete(null)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro que deseas eliminar el campo <strong>"{fieldToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta acción eliminará la configuración del campo. Los valores almacenados en las piezas podrían perder visibilidad.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setFieldToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleDeleteFieldConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
