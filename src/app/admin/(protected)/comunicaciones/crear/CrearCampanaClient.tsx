"use client"

import { useState } from "react"
import { Send, Image as ImageIcon, Type, Link as LinkIcon, AlignLeft, CheckCircle2, ChevronRight, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function CrearCampanaClient({ countSuscriptos }: { countSuscriptos: number }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // Step 1: Info
  const [internalName, setInternalName] = useState("")
  const [subject, setSubject] = useState("")
  const [preheader, setPreheader] = useState("")

  // Step 3: Editor
  const [blocks, setBlocks] = useState<any[]>([])

  const addBlock = (type: string) => {
    setBlocks([...blocks, { id: Math.random().toString(), type, content: "", url: "", link: "" }])
  }

  const updateBlock = (id: string, updates: any) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const handleSend = async () => {
    if (countSuscriptos === 0) {
      toast.error("No hay destinatarios suscriptos.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/comunicaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalName,
          subject,
          preheader,
          blocks
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Campaña enviada con éxito (procesando en background)")
        router.push('/admin/comunicaciones')
      } else {
        toast.error(data.error || "Error al enviar la campaña")
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado")
    }
    setLoading(false)
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#31573c] font-bold' : 'text-gray-400'}`}>
          <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">1</div>
          <span>Información</span>
        </div>
        <ChevronRight className="text-gray-300" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#31573c] font-bold' : 'text-gray-400'}`}>
          <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">2</div>
          <span>Destinatarios</span>
        </div>
        <ChevronRight className="text-gray-300" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#31573c] font-bold' : 'text-gray-400'}`}>
          <div className="w-8 h-8 rounded-full bg-current flex items-center justify-center text-white text-sm">3</div>
          <span>Editor Visual</span>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold mb-6">Información General</h2>
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre interno (solo para vos)</label>
              <input type="text" value={internalName} onChange={e => setInternalName(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Ej. Novedades Octubre 2026" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del correo</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Ej. Nuevas piezas en nuestro acervo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preheader (Texto oculto que acompaña al asunto)</label>
              <input type="text" value={preheader} onChange={e => setPreheader(e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#31573c] focus:outline-none" placeholder="Breve resumen del contenido" />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button disabled={!internalName || !subject} onClick={() => setStep(2)} className="bg-[#31573c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#23412c] disabled:opacity-50 transition-colors">Continuar</button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <h2 className="text-xl font-bold mb-2">Destinatarios de la Campaña</h2>
          <p className="text-gray-500 mb-8">Esta campaña se enviará a todos los usuarios que aceptaron recibir novedades.</p>
          
          <div className="inline-block p-8 bg-green-50 border border-green-100 rounded-2xl mb-8">
            <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-900">{countSuscriptos}</p>
            <p className="text-gray-600">suscriptores activos</p>
          </div>

          <div className="flex justify-between max-w-xl mx-auto">
            <button onClick={() => setStep(1)} className="text-gray-600 px-6 py-2 hover:bg-gray-100 rounded-lg transition-colors">Volver</button>
            <button onClick={() => setStep(3)} className="bg-[#31573c] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#23412c] transition-colors">Continuar al Editor</button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[600px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Diseño del Correo</h2>
              <button onClick={() => setPreviewMode(!previewMode)} className="text-sm border border-[#0B69CA] text-[#0B69CA] px-3 py-1 rounded hover:bg-[#0B69CA]/10 transition-colors">
                {previewMode ? "Modo Edición" : "Vista Previa"}
              </button>
            </div>

            {previewMode ? (
              <div className="bg-gray-100 p-8 rounded-xl flex justify-center">
                <div className="bg-white w-full max-w-[600px] shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 text-center border-b border-gray-100 bg-gray-50">
                    <img src="/logo.png" alt="Logo" className="h-16 mx-auto mb-2" />
                    <h3 className="font-serif font-bold text-gray-800 tracking-wider">MUSEO SCOUT MENDOZA</h3>
                  </div>
                  <div className="p-8 space-y-6">
                    {blocks.length === 0 && <p className="text-gray-400 text-center italic">El correo está vacío</p>}
                    {blocks.map(b => (
                      <div key={b.id}>
                        {b.type === 'title' && <h1 className="text-2xl font-bold text-gray-900">{b.content || "Título"}</h1>}
                        {b.type === 'text' && <p className="text-gray-700 whitespace-pre-line leading-relaxed">{b.content || "Párrafo de texto..."}</p>}
                        {b.type === 'image' && b.url && <img src={b.url} alt="Imagen" className="w-full rounded-lg" />}
                        {b.type === 'button' && (
                          <div className="text-center mt-6">
                            <a href={b.link} className="inline-block bg-[#0B69CA] text-white px-6 py-3 rounded-md font-bold uppercase tracking-wider text-sm">{b.content || "BOTÓN"}</a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="p-6 text-center border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                    <p>Recibís este correo porque aceptaste recibir novedades del Museo Scout Mendoza.</p>
                    <a href="#" className="text-[#0B69CA] underline mt-2 block">Dejar de recibir estas comunicaciones</a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((b, i) => (
                  <div key={b.id} className="p-4 border border-gray-200 rounded-lg relative group">
                    <button onClick={() => removeBlock(b.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-md">X</button>
                    
                    {b.type === 'title' && (
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Título</label>
                        <input type="text" value={b.content} onChange={e => updateBlock(b.id, { content: e.target.value })} className="w-full text-xl font-bold outline-none border-b border-dashed border-gray-300 focus:border-[#31573c] bg-transparent" placeholder="Escribe el título aquí" />
                      </div>
                    )}
                    {b.type === 'text' && (
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Párrafo de Texto</label>
                        <textarea value={b.content} onChange={e => updateBlock(b.id, { content: e.target.value })} className="w-full outline-none border border-gray-200 rounded p-2 focus:border-[#31573c] min-h-[100px]" placeholder="Escribe el texto de tu mensaje..."></textarea>
                      </div>
                    )}
                    {b.type === 'image' && (
                      <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Imagen (URL)</label>
                        <input type="url" value={b.url} onChange={e => updateBlock(b.id, { url: e.target.value })} className="w-full text-sm p-2 outline-none border border-gray-200 rounded focus:border-[#31573c]" placeholder="https://ejemplo.com/imagen.jpg" />
                      </div>
                    )}
                    {b.type === 'button' && (
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Texto del Botón</label>
                          <input type="text" value={b.content} onChange={e => updateBlock(b.id, { content: e.target.value })} className="w-full text-sm p-2 outline-none border border-gray-200 rounded focus:border-[#31573c]" placeholder="Ej. VER CATÁLOGO" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 font-medium mb-1 block">Enlace (URL)</label>
                          <input type="url" value={b.link} onChange={e => updateBlock(b.id, { link: e.target.value })} className="w-full text-sm p-2 outline-none border border-gray-200 rounded focus:border-[#31573c]" placeholder="https://..." />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 justify-center mt-6 p-4 border-2 border-dashed border-gray-200 rounded-xl">
                  <button onClick={() => addBlock('title')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"><Type size={14} /> Título</button>
                  <button onClick={() => addBlock('text')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"><AlignLeft size={14} /> Texto</button>
                  <button onClick={() => addBlock('image')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"><ImageIcon size={14} /> Imagen</button>
                  <button onClick={() => addBlock('button')} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors"><LinkIcon size={14} /> Botón</button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 space-y-6">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl">
              <div className="flex gap-2 text-yellow-800 font-bold mb-2">
                <AlertTriangle size={20} />
                Confirmación
              </div>
              <p className="text-sm text-yellow-800 mb-4">Revisá bien el contenido de tu correo. Esta acción enviará <strong>{countSuscriptos}</strong> correos electrónicos reales que no se pueden cancelar una vez iniciados.</p>
              
              <button disabled={loading || blocks.length === 0} onClick={handleSend} className="w-full flex items-center justify-center gap-2 bg-[#0B69CA] text-white py-3 rounded-lg font-bold hover:bg-[#0957A8] transition-colors shadow-sm disabled:opacity-50">
                <Send size={18} />
                {loading ? 'Enviando...' : 'Confirmar Envío'}
              </button>
              <button onClick={() => setStep(2)} className="w-full mt-2 text-sm text-gray-600 hover:underline">Volver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
