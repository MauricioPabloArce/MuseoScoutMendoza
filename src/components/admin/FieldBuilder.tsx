"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Settings, Globe, Lock, Save, X } from "lucide-react"
import type { FieldDefinition } from "@prisma/client"
import { createField, updateField } from "@/app/admin/(protected)/campos/actions"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function FieldBuilder({ sections, initialData }: { sections: { id: string, name: string }[], initialData?: any }) {
  const [name, setName] = useState("")
  const [internalKey, setInternalKey] = useState("")
  const [type, setType] = useState("TEXT")
  const [isGeneral, setIsGeneral] = useState(true)
  const [sectionId, setSectionId] = useState<string>("")
  const [options, setOptions] = useState<{ label: string, value: string }[]>([])
  const router = useRouter()
  
  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setInternalKey(initialData.internalKey)
      setType(initialData.type)
      setIsGeneral(initialData.isGeneral)
      setSectionId(initialData.sectionId || "")
      setOptions(initialData.options ? initialData.options.map((o: any) => ({ label: o.label, value: o.value })) : [])
    } else {
      setName("")
      setInternalKey("")
      setType("TEXT")
      setIsGeneral(true)
      setSectionId("")
      setOptions([])
    }
  }, [initialData])

  const generateKey = (val: string) => {
    setName(val)
    if(!initialData && !internalKey) {
      setInternalKey(val.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    }
  }

  const addOption = () => setOptions([...options, { label: "", value: "" }])
  const updateOption = (index: number, field: 'label'|'value', val: string) => {
    const newOpts = [...options]
    newOpts[index][field] = val
    if (field === 'label' && !newOpts[index].value) {
      newOpts[index].value = val.toLowerCase().replace(/[^a-z0-9]/g, '_')
    }
    setOptions(newOpts)
  }
  const removeOption = (index: number) => setOptions(options.filter((_, i) => i !== index))

  const handleSave = async () => {
    if(!name || !internalKey) return toast.error("Nombre y clave interna son requeridos")
    if(!sectionId) return toast.error("Debes asignar una sección visual al campo")
    
    const res = initialData 
      ? await updateField(initialData.id, {
          name, internalKey, type, isGeneral, sectionId, options: ['SELECT', 'MULTISELECT'].includes(type) ? options : []
        })
      : await createField({
          name, internalKey, type, isGeneral, sectionId, options: ['SELECT', 'MULTISELECT'].includes(type) ? options : []
        })

    if(res.success) {
      toast.success(initialData ? "Campo actualizado con éxito" : "Campo creado con éxito")
      if (initialData) {
        router.push("/admin/campos")
      } else {
        setName("")
        setInternalKey("")
        setOptions([])
        setSectionId("")
      }
    } else {
      toast.error(res.error || "Error al guardar campo")
    }
  }

  const handleCancel = () => {
    router.push("/admin/campos")
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-[#374151] flex items-center gap-2">
        <Settings size={20} /> {initialData ? "Editar Campo" : "Crear Nuevo Campo"}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del campo (Etiqueta)</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2 focus:ring-[#374151] focus:border-[#374151]"
            placeholder="Ej: Material"
            value={name}
            onChange={e => generateKey(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Clave interna (Identificador único)</label>
          <input 
            type="text" 
            className="w-full border border-gray-300 rounded p-2 focus:ring-[#374151] focus:border-[#374151]"
            placeholder="ej_material"
            value={internalKey}
            onChange={e => setInternalKey(e.target.value)}
            disabled={!!initialData}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Dato</label>
          <select 
            className="w-full border border-gray-300 rounded p-2"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="TEXT">Texto corto</option>
            <option value="TEXTAREA">Texto largo (Descripción)</option>
            <option value="NUMBER">Número</option>
            <option value="DATE">Fecha</option>
            <option value="BOOLEAN">Verdadero / Falso</option>
            <option value="SELECT">Lista desplegable (Select)</option>
            <option value="MULTISELECT">Selección múltiple</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a Sección Visual *</label>
          <select 
            required
            className="w-full border border-gray-300 rounded p-2 focus:ring-[#374151] focus:border-[#374151]"
            value={sectionId}
            onChange={e => setSectionId(e.target.value)}
          >
            <option value="">-- Seleccionar Sección --</option>
            {sections.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Es obligatorio agrupar el campo en una sección.</p>
        </div>
      </div>

      {['SELECT', 'MULTISELECT'].includes(type) && (
        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Opciones de la lista</label>
          <div className="space-y-2 mb-3">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" placeholder="Etiqueta visual" className="flex-1 p-2 border rounded" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)}/>
                <input type="text" placeholder="Valor interno" className="flex-1 p-2 border rounded" value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)}/>
                <button onClick={() => removeOption(i)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
              </div>
            ))}
          </div>
          <button onClick={addOption} className="text-sm flex items-center gap-1 text-[#374151] font-medium hover:underline">
            <Plus size={16} /> Añadir opción
          </button>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-200 gap-2">
        {initialData && (
          <button type="button" onClick={handleCancel} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded flex items-center gap-2 font-medium">
            <X size={16} /> Cancelar
          </button>
        )}
        <button onClick={handleSave} className="bg-[#374151] hover:bg-[#4b5563] text-white px-6 py-2 rounded flex items-center gap-2 font-medium">
          <Save size={18} /> {initialData ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </div>
  )
}
