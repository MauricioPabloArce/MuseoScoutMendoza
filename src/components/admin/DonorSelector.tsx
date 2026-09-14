"use client"

import { useState, useEffect, useRef } from "react"
import { searchDonors, checkPossibleDuplicates, createDonor } from "@/app/admin/(protected)/donantes/actions"
import { Search, Plus, User, X, Mail, Phone, AlertTriangle } from "lucide-react"

export default function DonorSelector({ 
  value, 
  onChange, 
  initialDonor 
}: { 
  value?: string | null
  onChange: (val: string | null) => void
  initialDonor?: any 
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState<any>(initialDonor || null)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState({ displayName: "", email: "", phone: "", notes: "" })
  const [duplicates, setDuplicates] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await searchDonors(query)
        setResults(data)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (donor: any) => {
    setSelectedDonor(donor)
    onChange(donor.id)
    setIsOpen(false)
    setQuery("")
  }

  const handleClear = () => {
    setSelectedDonor(null)
    onChange(null)
  }

  const handleCreateDonor = async (force = false) => {
    if (!modalData.displayName.trim()) return alert("El nombre es obligatorio")
    
    setCreating(true)
    if (!force) {
      const possibleDups = await checkPossibleDuplicates(modalData.email, modalData.phone, modalData.displayName)
      if (possibleDups.length > 0) {
        setDuplicates(possibleDups)
        setCreating(false)
        return
      }
    }
    
    try {
      const newDonor = await createDonor(modalData)
      setSelectedDonor(newDonor)
      onChange(newDonor.id)
      setShowModal(false)
      setModalData({ displayName: "", email: "", phone: "", notes: "" })
      setDuplicates([])
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setCreating(false)
    }
  }

  if (selectedDonor) {
    return (
      <div className="w-full border border-gray-300 rounded p-3 flex items-center justify-between bg-gray-50">
        <div>
          <div className="font-semibold text-gray-800 flex items-center gap-2">
            <User size={16} /> {selectedDonor.displayName}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
            {selectedDonor.email && <span className="flex items-center gap-1"><Mail size={12}/> {selectedDonor.email}</span>}
            {selectedDonor.phone && <span className="flex items-center gap-1"><Phone size={12}/> {selectedDonor.phone}</span>}
          </div>
        </div>
        <button 
          type="button" 
          onClick={handleClear}
          className="text-gray-400 hover:text-red-500 p-1"
        >
          <X size={18} />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full border border-gray-300 rounded py-2 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-green-700"
          placeholder="Buscar donante por nombre, email o teléfono..."
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onClick={() => setIsOpen(true)}
        />
      </div>

      {isOpen && (query.trim().length > 0 || results.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500 text-center">Buscando...</div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {results.map((donor) => (
                <li 
                  key={donor.id} 
                  className="p-3 hover:bg-green-50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(donor)}
                >
                  <div className="font-medium text-gray-800">{donor.displayName}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                    {donor.email && <span className="flex items-center gap-1"><Mail size={12}/> {donor.email}</span>}
                    {donor.phone && <span className="flex items-center gap-1"><Phone size={12}/> {donor.phone}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">No se encontraron resultados.</div>
          )}
          
          <div className="p-2 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setModalData(prev => ({ ...prev, displayName: query }))
                setShowModal(true)
              }}
              className="w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-green-700 hover:bg-green-100 rounded transition-colors"
            >
              <Plus size={16} /> Nuevo donante
            </button>
          </div>
        </div>
      )}

      {/* Modal Nuevo Donante */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User size={18} /> Crear Nuevo Donante
              </h3>
              <button type="button" onClick={() => {
                setShowModal(false)
                setDuplicates([])
              }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {duplicates.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                    <div>
                      <h4 className="font-semibold text-amber-800">Posibles donantes existentes</h4>
                      <p className="text-sm text-amber-700 mt-1">
                        Hemos encontrado registros similares. ¿Es alguno de estos?
                      </p>
                    </div>
                  </div>
                  
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                    {duplicates.map(donor => (
                      <li key={donor.id} className="p-3 hover:bg-gray-50 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-800">{donor.displayName}</div>
                          <div className="text-xs text-gray-500 flex gap-3 mt-1">
                            {donor.email && <span>{donor.email}</span>}
                            {donor.phone && <span>{donor.phone}</span>}
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            handleSelect(donor)
                            setShowModal(false)
                            setDuplicates([])
                          }}
                          className="text-xs font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded hover:bg-green-100"
                        >
                          Usar este
                        </button>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setDuplicates([])}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Volver
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleCreateDonor(true)}
                      disabled={creating}
                      className="px-4 py-2 text-sm text-white bg-green-700 hover:bg-green-800 rounded disabled:opacity-50"
                    >
                      {creating ? 'Creando...' : 'Crear de todas formas'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido y Nombre *</label>
                    <input 
                      type="text" 
                      required
                      value={modalData.displayName}
                      onChange={e => setModalData(prev => ({...prev, displayName: e.target.value}))}
                      className="w-full border border-gray-300 rounded p-2"
                      placeholder="Ej. Pérez Pablo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      value={modalData.email}
                      onChange={e => setModalData(prev => ({...prev, email: e.target.value}))}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Móvil</label>
                    <input 
                      type="text" 
                      value={modalData.phone}
                      onChange={e => setModalData(prev => ({...prev, phone: e.target.value}))}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea 
                      value={modalData.notes}
                      onChange={e => setModalData(prev => ({...prev, notes: e.target.value}))}
                      className="w-full border border-gray-300 rounded p-2"
                      rows={3}
                    />
                  </div>
                  
                  <div className="pt-4 flex justify-end gap-3 border-t">
                    <button 
                      type="button" 
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded border border-gray-300"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleCreateDonor(false)}
                      disabled={creating || !modalData.displayName.trim()}
                      className="px-4 py-2 text-sm text-white bg-[#1d4328] hover:bg-[#15341c] rounded disabled:opacity-50"
                    >
                      {creating ? 'Guardando...' : 'Guardar donante'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
