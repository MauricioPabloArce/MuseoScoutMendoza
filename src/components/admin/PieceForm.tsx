"use client"

import { useState, useEffect } from "react"
import { updatePiece, getFieldsForCategory, createPiece, uploadImage } from "@/app/admin/(protected)/piezas/actions"
import { Save, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react"
import toast from "react-hot-toast"
import FileErrorModal from "./FileErrorModal"

type FieldDef = {
  id: string
  name: string
  type: string
  isGeneral?: boolean
  options: { label: string, value: string }[]
}

type FormCategory = {
  id: string
  name: string
  prefix: string
  hasChildren?: boolean
  [key: string]: any
}

export default function PieceForm({ 
  categories, 
  initialCategoryId,
  initialData 
}: { 
  categories: FormCategory[],
  initialCategoryId?: string,
  initialData?: any
}) {
  const isEditing = !!initialData
  
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || initialCategoryId || "")
  const [status, setStatus] = useState(initialData?.status || "DRAFT")
  
  const [fields, setFields] = useState<FieldDef[]>([])
  
  // Initialize field values from initialData if editing
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    if (initialData?.fieldValues) {
      const vals: Record<string, string> = {}
      initialData.fieldValues.forEach((fv: any) => {
        vals[fv.fieldId] = fv.value
      })
      return vals
    }
    return {}
  })

  const [loadingFields, setLoadingFields] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // To hold files to upload for IMAGE type fields
  const [fileUploads, setFileUploads] = useState<Record<string, File>>({})
  const [showSizeError, setShowSizeError] = useState(false)

  useEffect(() => {
    if (!categoryId) {
      setFields([])
      return
    }

    setLoadingFields(true)
    getFieldsForCategory(categoryId).then(res => {
      setFields(res as FieldDef[])
      setLoadingFields(false)
      
      // If category changes during edit, we might want to wipe old field values that don't belong,
      // but to keep it simple, we just let them exist in state. They won't be saved if they aren't in the form.
    })
  }, [categoryId])

  const handleFieldChange = (id: string, val: string) => {
    setFieldValues(prev => ({ ...prev, [id]: val }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId) return toast.error("La categoría es obligatoria")
    
    setSaving(true)
    
    // Upload files
    const catName = categories.find(c => c.id === categoryId)?.name || "General"
    const finalFieldValues = { ...fieldValues }
    
    for (const [fieldId, fileObj] of Object.entries(fileUploads)) {
      if (fileObj) {
        const formData = new FormData()
        formData.append("file", fileObj)
        // Usamos el ID del campo temporalmente como título para el nombre de archivo
        formData.append("title", "field_" + fieldId)
        formData.append("category", catName)
        
        const uploadRes = await uploadImage(formData)
        if (uploadRes.url) {
          finalFieldValues[fieldId] = uploadRes.url
        }
      }
    }

    let res
    if (isEditing) {
      res = await updatePiece(initialData.id, {
        categoryId,
        status,
        fields: finalFieldValues
      })
    } else {
      res = await createPiece({
        categoryId,
        status,
        fields: finalFieldValues
      })
    }
    setSaving(false)

    if (res.success) {
      toast.success(isEditing ? "Pieza actualizada con éxito" : `Pieza creada con éxito. Código: ${res.piece?.registryCode}`)
      setTimeout(() => {
        window.location.href = "/admin/piezas"
      }, 1500)
    } else {
      toast.error(res.error || "Ocurrió un error")
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información de Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Taxonómica *</label>
            <select 
              required
              className="w-full border border-gray-300 rounded p-2"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Selecciona una categoría...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id} disabled={c.hasChildren}>
                  {c.name} ({c.prefix}) {c.hasChildren ? '(No permite piezas)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Publicación</label>
            <select 
              className="w-full border border-gray-300 rounded p-2"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="DRAFT">Borrador (Interno)</option>
              <option value="PUBLISHED">Publicado (Visible)</option>
              <option value="ARCHIVED">Archivado (Oculto)</option>
            </select>
          </div>
        </div>
      </div>

      {categoryId && (
        <div className="space-y-6">
          {loadingFields ? (
            <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-[#1d4328] mb-4" size={32} />
              <p className="text-gray-500">Cargando campos de la ficha museológica...</p>
            </div>
          ) : fields.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Ficha Museológica</h3>
              <p className="text-gray-500 italic">No hay campos configurados para esta categoría.</p>
            </div>
          ) : (
            Object.entries(
              fields.reduce((acc, field: any) => {
                const section = field.section?.name || (field.isGeneral ? "Datos Generales" : "Datos Específicos")
                
                if (!acc[section]) acc[section] = []
                acc[section].push(field)
                return acc
              }, {} as Record<string, any[]>)
            ).map(([sectionName, sectionFields]) => (
              <div key={sectionName} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#1d4328] rounded-full"></div>
                  {sectionName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sectionFields.map(field => (
                    <div key={field.id} className={field.type === 'TEXTAREA' ? "col-span-2" : ""}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}</label>
                      
                      {field.type === 'TEXTAREA' ? (
                        <textarea 
                          className="w-full border border-gray-300 rounded p-2 min-h-[100px]"
                          value={fieldValues[field.id] || ""}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                        />
                      ) : field.type === 'SELECT' ? (
                        <select 
                          className="w-full border border-gray-300 rounded p-2"
                          value={fieldValues[field.id] || ""}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                        >
                          <option value="">Seleccionar...</option>
                          {field.options.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.type === 'IMAGE' ? (
                        <div className="flex flex-col gap-2">
                          {fieldValues[field.id] && !fileUploads[field.id] && (
                            <img src={fieldValues[field.id]} className="h-24 w-auto object-cover border border-gray-200 rounded" />
                          )}
                          {fileUploads[field.id] && (
                            <div className="text-xs text-green-700 font-medium bg-green-50 p-2 rounded">
                              Archivo nuevo seleccionado: {fileUploads[field.id].name}
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  setShowSizeError(true)
                                  e.target.value = ""
                                  return
                                }
                                setFileUploads(prev => ({ ...prev, [field.id]: file }))
                              }
                            }}
                            className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700"
                          />
                        </div>
                      ) : field.type === 'BOOLEAN' ? (
                        <div className="flex items-center gap-3 h-10">
                          <button
                            type="button"
                            onClick={() => handleFieldChange(field.id, fieldValues[field.id] === 'true' ? 'false' : 'true')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              fieldValues[field.id] === 'true' ? 'bg-[#31573c]' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                fieldValues[field.id] === 'true' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-sm font-medium text-gray-700">
                            {fieldValues[field.id] === 'true' ? 'Sí' : 'No'}
                          </span>
                        </div>
                      ) : (
                        <input 
                          type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                          className="w-full border border-gray-300 rounded p-2"
                          value={fieldValues[field.id] || ""}
                          onChange={e => handleFieldChange(field.id, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className="flex justify-between items-center pt-4">
        <a href="/admin/piezas" className="text-gray-600 hover:text-gray-800 flex items-center gap-1 font-medium">
          <ArrowLeft size={16} /> Volver al listado
        </a>
        <button 
          disabled={saving || !categoryId}
          type="submit" 
          className="bg-[#1d4328] hover:bg-[#255633] disabled:opacity-50 text-white px-8 py-3 rounded flex items-center gap-2 font-medium shadow-sm transition-colors"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {isEditing ? "Actualizar Pieza" : "Registrar Pieza"}
        </button>
      </div>

      <FileErrorModal 
        isOpen={showSizeError} 
        onClose={() => setShowSizeError(false)} 
        maxSizeMB={5} 
      />
    </form>
  )
}
