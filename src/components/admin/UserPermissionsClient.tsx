"use client"

import { useState } from "react"
import { Users, Shield, Tag, X, Trash2, AlertTriangle } from "lucide-react"
import { updateUserRole, assignCategoryPermission, removeCategoryPermission, deleteUser, updateTeamMemberProfile } from "@/app/admin/(protected)/usuarios/actions"
import toast from "react-hot-toast"

export default function UserPermissionsClient({ users, categories }: { users: any[], categories: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [newCatId, setNewCatId] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null)
  
  // Team Member State
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [teamPosition, setTeamPosition] = useState("")

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setIsTeamMember(user.member?.isTeamMember || false)
    setTeamPosition(user.member?.teamPosition || "")
  }

  const handleSaveTeamProfile = async () => {
    if (!selectedUser) return
    const res = await updateTeamMemberProfile(selectedUser.id, isTeamMember, teamPosition)
    if (res.success) {
      toast.success("Perfil de equipo actualizado")
      setTimeout(() => window.location.reload(), 1000)
    } else {
      toast.error("Error actualizando perfil")
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await updateUserRole(userId, role)
    if (res.success) {
      toast.success("Rol actualizado")
      setTimeout(() => window.location.reload(), 1000)
    } else {
      toast.error("Error actualizando rol")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    
    try {
      const res = await deleteUser(userToDelete.id)
      if (res.success) {
        toast.success("Usuario eliminado correctamente")
        if (selectedUser?.id === userToDelete.id) setSelectedUser(null)
        setDeleteModalOpen(false)
        setUserToDelete(null)
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario")
    }
  }

  const handleAssignCategory = async () => {
    if (!selectedUser || !newCatId) return
    const res = await assignCategoryPermission(selectedUser.id, newCatId)
    if (res.success) {
      setNewCatId("")
      window.location.reload()
    } else {
      toast.error(res.error || "Error")
    }
  }

  const handleRemovePermission = async (permId: string) => {
    const res = await removeCategoryPermission(permId)
    if (res.success) {
      window.location.reload()
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600">Nombre</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Email</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Rol</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-center">Equipo Museo</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-center">Permisos Esp.</th>
              <th className="px-6 py-3 font-semibold text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className={`hover:bg-gray-50 ${selectedUser?.id === user.id ? 'bg-green-50' : ''}`}>
                <td className="px-6 py-4 font-medium">{user.name || 'Sin nombre'}</td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <select 
                    className="border border-gray-300 rounded text-xs p-1"
                    value={user.member?.role || 'VIEWER'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="VIEWER">Visitante</option>
                    <option value="COLLABORATOR">Colaborador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-center">
                  {user.member?.isTeamMember ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      Sí
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">No</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {user.member?.permissions?.length || 0} ramas
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleSelectUser(user)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Configurar
                    </button>
                    <button 
                      onClick={() => {
                        setUserToDelete({ id: user.id, name: user.name || 'Sin nombre' })
                        setDeleteModalOpen(true)
                      }}
                      className="text-red-500 hover:text-red-700 font-medium"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        {selectedUser ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{selectedUser.name}</h3>
                <p className="text-sm text-gray-500">{selectedUser.member?.role}</p>
              </div>
              <button onClick={() => handleSelectUser(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Perfil Público del Museo</h4>
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-[#1d4328] focus:ring-[#1d4328]"
                  checked={isTeamMember}
                  onChange={(e) => setIsTeamMember(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-800">Es miembro del equipo del museo</span>
              </label>
              
              {isTeamMember && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cargo Público (Ej: Director, Curador)</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded p-2 text-sm"
                    placeholder="Escriba el cargo..."
                    value={teamPosition}
                    onChange={(e) => setTeamPosition(e.target.value)}
                  />
                </div>
              )}
              
              <button 
                onClick={handleSaveTeamProfile}
                className="w-full bg-[#374151] hover:bg-[#4b5563] text-white py-1.5 rounded text-sm transition-colors"
              >
                Guardar Perfil
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                <Shield size={16} className="text-[#1d4328]" /> Acceso Permitido
              </h4>
              {selectedUser.member?.role === 'ADMIN' ? (
                <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                  Tiene acceso total a todo el árbol de categorías.
                </p>
              ) : selectedUser.member?.role === 'COLLABORATOR' ? (
                <div className="space-y-2">
                  {selectedUser.member?.permissions?.map((perm: any) => (
                    <div key={perm.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded border border-gray-100">
                      <span className="flex items-center gap-2"><Tag size={14} className="text-amber-600" /> {perm.category.name}</span>
                      <button onClick={() => handleRemovePermission(perm.id)} className="text-red-500 hover:text-red-700"><X size={14}/></button>
                    </div>
                  ))}
                  {(!selectedUser.member?.permissions || selectedUser.member.permissions.length === 0) && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      No tiene ramas asignadas. No podrá editar ninguna pieza.
                    </p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Asignar nueva rama:</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 border border-gray-300 rounded text-sm p-1.5"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value)}
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAssignCategory}
                        disabled={!newCatId}
                        className="bg-[#1d4328] hover:bg-[#255633] text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                  Rol de solo lectura. No puede gestionar piezas.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-8 text-center text-gray-500 h-full flex flex-col items-center justify-center">
            <Users size={32} className="mb-2 opacity-50" />
            <p>Selecciona un usuario de la lista para configurar sus permisos por categoría.</p>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} />
                Confirmar Eliminación
              </h3>
              <button onClick={() => setDeleteModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                ¿Estás seguro que deseas eliminar al usuario <strong>"{userToDelete.name}"</strong>?
              </p>
              <p className="text-sm text-red-600 font-medium">
                Esta acción es irreversible y eliminará todos sus permisos asociados.
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
    </div>
  )
}
