"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, PackageSearch, Plus, Edit, Trash2, AlertTriangle, ShieldX } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { archivePiece, deletePiece } from "@/app/admin/(protected)/piezas/actions"

interface Category {
  id: string
  name: string
  parentId: string | null
  prefix: string
  [key: string]: any
}

interface Piece {
  id: string
  registryCode: string
  categoryId: string
  status: string
  [key: string]: any
}

interface TreeNode extends Category {
  children: TreeNode[]
}

function buildTree(categories: Category[]): TreeNode[] {
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

export default function PieceExplorer({ categories, pieces, userRole = 'VIEWER' }: { categories: Category[], pieces: Piece[], userRole?: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [pieceToDelete, setPieceToDelete] = useState<{id: string, title: string} | null>(null)
  
  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [pieceToArchive, setPieceToArchive] = useState<{id: string, title: string} | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)
  const [noPermissionModal, setNoPermissionModal] = useState(false)
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  
  const tree = buildTree(categories)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpanded(newExpanded)
  }

  const handleArchiveConfirm = async () => {
    if (!pieceToArchive) return
    setIsDeleting(true)
    const res = await archivePiece(pieceToArchive.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success("Pieza archivada")
      setArchiveModalOpen(false)
      setPieceToArchive(null)
    } else {
      toast.error(res.error || "Error")
    }
  }

  const getPieceTitle = (piece: Piece) => {
    return piece.fieldValues?.find((fv: any) => fv.field?.internalKey === 'titulo')?.value || "Sin Título"
  }

  const handleDeleteConfirm = async () => {
    if (!pieceToDelete) return
    setIsDeleting(true)
    try {
      const res = await deletePiece(pieceToDelete.id)
      if (res.success) {
        toast.success("Pieza eliminada correctamente")
        setDeleteModalOpen(false)
        setPieceToDelete(null)
      } else {
        toast.error(res.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error inesperado al eliminar la pieza")
    } finally {
      setIsDeleting(false)
    }
  }

  const visiblePieces = selectedCategoryId 
    ? pieces.filter(p => p.categoryId === selectedCategoryId)
    : pieces

  const renderNode = (node: TreeNode, level = 0) => {
    const isExpanded = expanded.has(node.id)
    const hasChildren = node.children.length > 0
    const isSelected = selectedCategoryId === node.id

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center py-2 px-2 hover:bg-gray-100 rounded cursor-pointer ${isSelected ? 'bg-green-50 text-[#1d4328] font-medium' : 'text-gray-700'}`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => setSelectedCategoryId(node.id)}
        >
          <div 
            className="w-5 h-5 flex items-center justify-center text-gray-500 mr-1"
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(node.id)
            }}
          >
            {hasChildren ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
          </div>
          
          <div className="mr-2">
            {isExpanded && hasChildren ? <FolderOpen size={16} className="text-amber-500" /> : <Folder size={16} className="text-amber-500" />}
          </div>
          
          <span className="truncate">{node.name}</span>
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
    <div className="flex flex-col md:flex-row gap-6 h-[70vh]">
      {/* Left Panel: Category Tree */}
      <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 font-semibold text-gray-700">
          Carpetas del Acervo
        </div>
        <div className="p-2 overflow-y-auto flex-1">
          <div 
            className={`flex items-center py-2 px-2 hover:bg-gray-100 rounded cursor-pointer ${selectedCategoryId === null ? 'bg-green-50 text-[#1d4328] font-medium' : 'text-gray-700'}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            <PackageSearch size={18} className="mr-3 text-gray-500" />
            Ver Todo
          </div>
          <div className="my-2 border-t border-gray-100"></div>
          {tree.map(node => renderNode(node, 0))}
        </div>
      </div>

      {/* Right Panel: Pieces */}
      <div className="w-full md:w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">
            {selectedCategoryId 
              ? `Piezas en "${categories.find(c => c.id === selectedCategoryId)?.name}"`
              : "Todas las Piezas"}
          </h3>
          {isAdmin ? (
            <Link 
              href={`/admin/piezas/crear${selectedCategoryId ? `?categoryId=${selectedCategoryId}` : ''}`}
              className="text-sm bg-[#1d4328] hover:bg-[#255633] text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> Registrar Pieza
            </Link>
          ) : (
            <button
              onClick={() => setNoPermissionModal(true)}
              className="text-sm bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> Registrar Pieza
            </button>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1 p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Título</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visiblePieces.filter(p => p.status !== 'ARCHIVED').map(piece => {
                const title = getPieceTitle(piece)
                return (
                <tr key={piece.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-[#1d4328] font-medium">{piece.registryCode}</td>
                  <td className="px-4 py-3 text-gray-800">{title}</td>
                  <td className="px-4 py-3">
                    {piece.status === 'PUBLISHED' && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Publicado</span>}
                    {piece.status === 'DRAFT' && <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs">Borrador</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link 
                        href={`/admin/piezas/${piece.id}/editar`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 bg-white border border-gray-200 rounded shadow-sm"
                        title="Editar Pieza"
                      >
                        <Edit size={16} />
                      </Link>
                      <button 
                        onClick={() => {
                          setPieceToDelete({ id: piece.id, title })
                          setDeleteModalOpen(true)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded shadow-sm"
                        title="Eliminar Pieza"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
              
              {visiblePieces.filter(p => p.status !== 'ARCHIVED').length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    No hay piezas registradas en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    {/* Delete Modal */}
    {deleteModalOpen && pieceToDelete && (
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
                ¿Estás seguro que deseas eliminar la pieza <strong>"{pieceToDelete.title}"</strong>?
              </p>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Esta acción no se puede deshacer. Se borrarán todos los valores y archivos asociados a la pieza.
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
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalOpen && pieceToArchive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Confirmar Archivar
              </h3>
              <button onClick={() => setArchiveModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro que deseas archivar la pieza <strong>"{pieceToArchive.title}"</strong>?
              </p>
              <p className="text-sm text-amber-600 mt-2 font-medium">
                Las piezas archivadas dejan de ser visibles públicamente y se mueven al archivo inactivo.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setArchiveModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleArchiveConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Archivando..." : "Archivar"}
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
                No tenés permisos para registrar o editar piezas en el acervo.
              </p>
              <p className="text-sm text-gray-500">
                Para poder hacerlo, un <strong>administrador</strong> debe asignarte acceso a una o más ramas del árbol de categorías desde <strong>Usuarios y Accesos</strong>.
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
    </>
  )
}
