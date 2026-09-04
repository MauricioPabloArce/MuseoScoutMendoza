"use client"

import { useState, useEffect } from "react"
import { updatePiece, getFieldsForCategory, createPiece, uploadImage } from "@/app/admin/(protected)/piezas/actions"
import { Save, Loader2, ArrowLeft, Image as ImageIcon } from "lucide-react"
import toast from "react-hot-toast"

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
  
  const [title, setTitle] = useState(initialData?.title || "")
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
  const [file, setFile] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    initialData?.media?.[0]?.url || null
  )

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
    if (!title || !categoryId) return toast.error("Título y categoría son obligatorios")
    
    setSaving(true)
    let mediaUrls: string[] = []
    
    if (file) {
      const catName = categories.find(c => c.id === categoryId)?.name || "General"
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("category", catName)
      
      const uploadRes = await uploadImage(formData)
      if (uploadRes.url) {
        mediaUrls.push(uploadRes.url)
      }
    }

    let res
    if (isEditing) {
      res = await updatePiece(initialData.id, {
        title,
        categoryId,
        status,
        fields: fieldValues,
        mediaUrls
      })
    } else {
      res = await createPiece({
        title,
        categoryId,
        status,
        fields: fieldValues,
        mediaUrls
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
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Información Principal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Pieza *</label>
            <input 
              required
              type="text" 
              className="w-full border border-gray-300 rounded p-2 focus:ring-[#1d4328] focus:border-[#1d4328]"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          
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
          
          <div className="col-span-2 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de la Pieza (Máximo 1 imagen)</label>
            <div className="flex flex-col gap-4 border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
              
              {/* Show existing image if editing and no new file selected */}
              {existingImageUrl && !file && (
                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200">
                  <img 
                    src={existingImageUrl} 
                    alt="Imagen actual" 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Imagen actual de la pieza</p>
                    <p className="text-xs text-gray-500">Selecciona un nuevo archivo para reemplazarla</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-gray-400">
                  <ImageIcon size={24} />
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    const selected = e.target.files?.[0] || null
                    setFile(selected)
                  }}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
              </div>
              {file && (
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFile(null)} 
                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                  >
                    Quitar
                  </button>
                </div>
              )}
            </div>
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
    </form>
  )
}
