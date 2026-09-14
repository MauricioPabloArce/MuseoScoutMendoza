"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, PackageSearch, Plus, Edit2, Edit, Trash2, Archive, Search, Eye, AlertTriangle, ShieldX, ChevronLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { archivePiece, deletePiece, bulkUpdatePieceStatus, getPiecesPaginated } from "@/app/admin/(protected)/piezas/actions"
import ExportModal from "./ExportModal"
import ImportModal from "./ImportModal"
import { useDebounce } from "use-debounce"

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

export default function PieceExplorer({ categories, pieces: initialPieces, userRole = 'VIEWER' }: { categories: Category[], pieces: Piece[], userRole?: string }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [pieceToDelete, setPieceToDelete] = useState<{id: string, title: string} | null>(null)
  
  const [archiveModalOpen, setArchiveModalOpen] = useState(false)
  const [pieceToArchive, setPieceToArchive] = useState<{id: string, title: string} | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)
  const [noPermissionModal, setNoPermissionModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isBulking, setIsBulking] = useState(false)
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN'
  const isCollab = userRole === 'COLLABORATOR'

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500)
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [visiblePieces, setVisiblePieces] = useState<Piece[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const tree = buildTree(categories)

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) newExpanded.delete(id)
    else newExpanded.add(id)
    setExpanded(newExpanded)
  }

  const fetchPieces = async () => {
    setIsLoading(true)
    try {
      const res = await getPiecesPaginated(page, 20, selectedCategoryId, statusFilter, debouncedSearchQuery)
      setVisiblePieces(res.pieces)
      setTotalPages(res.pages)
      setTotalItems(res.total)
    } catch (e) {
      console.error(e)
      toast.error("Error al cargar las piezas")
    } finally {
      setIsLoading(false)
    }
  }

  // Reload pieces when dependencies change
  useEffect(() => {
    fetchPieces()
  }, [page, selectedCategoryId, statusFilter, debouncedSearchQuery])

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedCategoryId, statusFilter, debouncedSearchQuery])

  const handleArchiveConfirm = async () => {
    if (!pieceToArchive) return
    setIsDeleting(true)
    const res = await archivePiece(pieceToArchive.id)
    setIsDeleting(false)
    if (res.success) {
      toast.success("Pieza archivada")
      setArchiveModalOpen(false)
      setPieceToArchive(null)
      fetchPieces()
    } else {
      toast.error(res.error || "Error")
    }
  }

  const getPieceTitle = (piece: Piece) => {
    let fv = piece.fieldValues?.find((fv: any) => {
      const key = fv.field?.internalKey?.toLowerCase() || '';
      const name = fv.field?.name?.toLowerCase() || '';
      return ['nombre', 'nombre_pieza', 'titulo', 'título'].includes(key) ||
             ['nombre', 'nombre de la pieza', 'titulo', 'título'].includes(name);
    });

    if (!fv) {
      fv = piece.fieldValues?.find((fv: any) => {
        const name = fv.field?.name?.toLowerCase() || '';
        return name.includes('nombre') || name.includes('titulo') || name.includes('título');
      });
    }

    if (!fv) {
      fv = piece.fieldValues?.find((fv: any) =>
        fv.value && fv.value.trim() !== '' && isNaN(Number(fv.value.trim()))
      );
    }

    const rawTitle = fv?.value || piece.registryCode || "Sin nombre"
    return rawTitle.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
  }

  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkStatusToApply, setBulkStatusToApply] = useState<string>('')

  const handleBulkActionClick = (status: string) => {
    setBulkStatusToApply(status)
    setBulkModalOpen(true)
  }

  const handleBulkActionConfirm = async () => {
    if (!selectedCategoryId || !bulkStatusToApply) return
    
    setIsBulking(true)
    try {
      const res = await bulkUpdatePieceStatus(selectedCategoryId, bulkStatusToApply)
      if (res.success) {
        toast.success(`Se han ${status === 'PUBLISHED' ? 'publicado' : 'despublicado'} ${res.count} piezas`)
        fetchPieces()
      } else {
        toast.error(res.error || "Error en la acción masiva")
      }
    } catch {
      toast.error("Error inesperado en la acción masiva")
    } finally {
      setIsBulking(false)
    }
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
        fetchPieces()
      } else {
        toast.error(res.error || "Error al eliminar")
      }
    } catch {
      toast.error("Error inesperado al eliminar la pieza")
    } finally {
      setIsDeleting(false)
    }
  }

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
            <span className="text-sm font-normal text-gray-500 ml-2">({totalItems})</span>
          </h3>
          {true ? (
            <div className="flex gap-2">
              {selectedCategoryId && (
                <>
                  <button 
                    onClick={() => handleBulkActionClick('PUBLISHED')}
                    disabled={isBulking}
                    className="text-sm bg-white hover:bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Publicar Todas
                  </button>
                  <button 
                    onClick={() => handleBulkActionClick('DRAFT')}
                    disabled={isBulking}
                    className="text-sm bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm disabled:opacity-50"
                  >
                    Despublicar Todas
                  </button>
                </>
              )}
              <button 
                onClick={() => setImportModalOpen(true)}
                className="text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm"
              >
                Importar
              </button>
              <button 
                onClick={() => setExportModalOpen(true)}
                className="text-sm bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm"
              >
                Exportar
              </button>
              <Link 
                href={`/admin/piezas/crear${selectedCategoryId ? `?categoryId=${selectedCategoryId}` : ''}`}
                className="text-sm bg-[#1d4328] hover:bg-[#255633] text-white border border-[#1d4328] px-3 py-1.5 rounded flex items-center gap-1 transition-colors shadow-sm"
              >
                <Plus size={16} /> Registrar Pieza
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setNoPermissionModal(true)}
              className="text-sm bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
            >
              <Plus size={16} /> Registrar Pieza
            </button>
          )}
        </div>
        
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar pieza por código o nombre..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#1d4328] focus:border-[#1d4328]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48 border border-gray-300 rounded text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1d4328] focus:border-[#1d4328]"
          >
            <option value="ALL">Todos los estados</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="DRAFT">Borrador</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </div>

        <div className="overflow-y-auto flex-1 p-0 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#31573c] rounded-full animate-spin"></div>
            </div>
          )}
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Código</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Nombre</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visiblePieces.map(piece => {
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
                        href={`/catalogo/${piece.registryCode}`}
                        target="_blank"
                        className="p-1.5 text-gray-400 hover:text-green-600 bg-white border border-gray-200 rounded shadow-sm"
                        title="Ver en el catálogo"
                      >
                        <Eye size={16} />
                      </Link>
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
              
              {!isLoading && visiblePieces.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                    No hay piezas registradas en esta vista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 border border-gray-300 rounded bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
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

      {/* Bulk Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-blue-500" size={18} />
                Confirmar Acción
              </h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700">
                ¿Estás seguro que deseas <strong>{bulkStatusToApply === 'PUBLISHED' ? 'publicar' : 'despublicar'}</strong> todas las piezas de esta categoría?
              </p>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setBulkModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => {
                  setBulkModalOpen(false)
                  handleBulkActionConfirm()
                }}
                disabled={isBulking}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulking ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
        categories={categories} 
      />
      
      <ImportModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        categories={categories} 
      />
    </>
  )
}
