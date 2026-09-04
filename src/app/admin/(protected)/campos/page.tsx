import { getFields, getSections, deleteSection, deleteField } from "./actions"
import FieldBuilder from "@/components/admin/FieldBuilder"
import SectionBuilder from "@/components/admin/SectionBuilder"
import { FileEdit, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react"
import Link from "next/link"

export default async function CamposPage({ searchParams }: { searchParams: Promise<{ editSection?: string, editField?: string }> }) {
  const fields = await getFields()
  const sections = await getSections()
  const resolvedParams = await searchParams

  const editingSection = sections.find(s => s.id === resolvedParams.editSection)
  const editingField = fields.find(f => f.id === resolvedParams.editField)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-[#e5e7eb] p-2 rounded-lg">
          <FileEdit className="text-[#374151]" size={24} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Campos y Secciones</h1>
      </div>
      <p className="text-gray-600 mb-8 ml-14">
        Diseña las Secciones y los Campos Dinámicos que conforman la Ficha Museológica. Las secciones te permiten organizar los campos visualmente.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 items-start">
        <div className="space-y-8">
          <SectionBuilder initialData={editingSection} />
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
              <h3 className="font-semibold text-gray-700">Secciones Creadas</h3>
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-200">
                {sections.map(section => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{section.name}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/campos?editSection=${section.id}`} className="inline-block p-1 text-gray-400 hover:text-blue-600 mr-2">
                        <Edit size={16} />
                      </Link>
                      <form action={async () => { "use server"; await deleteSection(section.id) }} className="inline-block">
                        <button type="submit" className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {sections.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500">No hay secciones</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <FieldBuilder sections={sections} initialData={editingField} />
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-800">Campos Configurados</h3>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Key</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Sección</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Tipo</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Ámbito</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {fields.map(field => (
              <tr key={field.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{field.name}</td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{field.internalKey}</td>
                <td className="px-6 py-4 text-gray-700">{field.section ? field.section.name : <span className="text-gray-400 italic">Ninguna</span>}</td>
                <td className="px-6 py-4">{field.type}</td>
                <td className="px-6 py-4">
                  {field.isGeneral ? (
                    <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-full text-xs">General</span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs">Específico</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <Link href={`/admin/campos?editField=${field.id}`} className="inline-block p-1 text-gray-400 hover:text-blue-600 mr-2">
                    <Edit size={16} />
                  </Link>
                  <form action={async () => { "use server"; await deleteField(field.id) }} className="inline-block">
                    <button type="submit" className="p-1 text-gray-400 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {fields.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay campos configurados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
