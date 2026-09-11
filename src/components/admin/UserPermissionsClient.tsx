"use client"

import { useState } from "react"
import { Users, Shield, Tag, X, Trash2, AlertTriangle, ChevronRight, Settings, UserCheck, UserCog, Eye } from "lucide-react"
import { updateUserRole, assignCategoryPermission, removeCategoryPermission, deleteUser, updateTeamMemberProfile } from "@/app/admin/(protected)/usuarios/actions"
import toast from "react-hot-toast"

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN:       { label: "Administrador", color: "bg-purple-100 text-purple-700" },
  COLLABORATOR:{ label: "Colaborador",   color: "bg-blue-100 text-blue-700" },
  VIEWER:      { label: "Visitante",     color: "bg-gray-100 text-gray-500" },
}

export default function UserPermissionsClient({ users, categories }: { users: any[], categories: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [newCatId, setNewCatId] = useState("")
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null)
  const [isTeamMember, setIsTeamMember] = useState(false)
  const [teamPosition, setTeamPosition] = useState("")

  // Flatten categories for dropdown
  const flattenCategories = (cats: any[], parentId: string | null = null, depth = 0): any[] => {
    let result: any[] = []
    const children = cats.filter(c => c.parentId === parentId)
    for (const child of children) {
      result.push({ id: child.id, name: `${'— '.repeat(depth)}${child.name}` })
      result = result.concat(flattenCategories(cats, child.id, depth + 1))
    }
    return result
  }
  const structuredCategories = flattenCategories(categories)

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    if (user) {
      setIsTeamMember(user.member?.isTeamMember || false)
      setTeamPosition(user.member?.teamPosition || "")
    }
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
    if (res.success) window.location.reload()
  }

  const roleInfo = (role?: string) => ROLE_LABELS[role || 'VIEWER'] || ROLE_LABELS.VIEWER

  return (
    <div className="relative">
      {/* ===== TABLA PRINCIPAL ===== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header de la tabla */}
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
          </span>
          {selectedUser && (
            <button
              onClick={() => setSelectedUser(null)}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X size={14} /> Cerrar panel
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100">
              <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Rol del Sistema</th>
                <th className="px-5 py-3 text-center">Equipo</th>
                <th className="px-5 py-3 text-center">Ramas</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => {
                const ri = roleInfo(user.member?.role)
                const isSelected = selectedUser?.id === user.id
                return (
                  <tr
                    key={user.id}
                    className={`transition-colors ${isSelected ? 'bg-[#f0f7f2] border-l-4 border-l-[#1d4328]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
                  >
                    {/* Avatar + Nombre */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e4decb] flex items-center justify-center text-[#1d4328] font-bold text-sm flex-shrink-0">
                          {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 whitespace-nowrap">{user.name || 'Sin nombre'}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3 text-gray-500 text-xs">{user.email}</td>

                    {/* Rol — selector */}
                    <td className="px-5 py-3">
                      <select
                        className={`border-0 rounded-full text-xs px-2.5 py-1 font-medium cursor-pointer focus:ring-2 focus:ring-[#1d4328]/20 ${ri.color}`}
                        value={user.member?.role || 'VIEWER'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      >
                        <option value="VIEWER">Visitante</option>
                        <option value="COLLABORATOR">Colaborador</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </td>

                    {/* Equipo */}
                    <td className="px-5 py-3 text-center">
                      {user.member?.isTeamMember ? (
                        <span title={user.member?.teamPosition || ''} className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <UserCheck size={11} />
                          {user.member?.teamPosition || 'Sí'}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Permisos */}
                    <td className="px-5 py-3 text-center">
                      {user.member?.role === 'ADMIN' ? (
                        <span className="text-xs text-green-600 font-medium">Total</span>
                      ) : (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          (user.member?.permissions?.length || 0) > 0
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {user.member?.permissions?.length || 0} rama{(user.member?.permissions?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleSelectUser(user)}
                          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            isSelected
                              ? 'bg-[#1d4328] text-white'
                              : 'bg-gray-100 hover:bg-[#e4decb] text-gray-600 hover:text-[#1d4328]'
                          }`}
                        >
                          <Settings size={12} />
                          {isSelected ? 'Editando' : 'Configurar'}
                        </button>
                        <button
                          onClick={() => { setUserToDelete({ id: user.id, name: user.name || 'Sin nombre' }); setDeleteModalOpen(true) }}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== SLIDE-OVER PANEL ===== */}
      {selectedUser && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-[#1d4328]/20 overflow-hidden">
          {/* Header del panel */}
          <div className="bg-gradient-to-r from-[#1d4328] to-[#255633] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                {(selectedUser.name?.[0] || '?').toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight">{selectedUser.name}</h3>
                {selectedUser.member?.teamPosition ? (
                  <p className="text-green-200 text-xs uppercase tracking-wider">{selectedUser.member.teamPosition}</p>
                ) : (
                  <p className="text-white/50 text-xs italic">Sin cargo de equipo</p>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="text-white/60 hover:text-white p-1 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* ---- Columna izquierda: Perfil del equipo ---- */}
            <div className="p-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <UserCog size={15} className="text-[#1d4328]" />
                Perfil Público del Museo
              </h4>

              <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${isTeamMember ? 'bg-[#1d4328]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isTeamMember ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <input type="checkbox" className="sr-only" checked={isTeamMember} onChange={e => setIsTeamMember(e.target.checked)} />
                <span className="text-sm text-gray-700 font-medium">Aparece en la página del equipo</span>
              </label>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Cargo Público
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4328]/30 focus:border-[#1d4328]"
                  placeholder="Ej: Director, Curador, Colaborador..."
                  value={teamPosition}
                  onChange={e => setTeamPosition(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Independiente del rol del sistema
                </p>
              </div>

              <button
                onClick={handleSaveTeamProfile}
                className="w-full bg-[#1d4328] hover:bg-[#255633] text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Guardar Perfil
              </button>
            </div>

            {/* ---- Columna derecha: Acceso a ramas ---- */}
            <div className="p-6">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Shield size={15} className="text-[#1d4328]" />
                Acceso Permitido
              </h4>

              {selectedUser.member?.role === 'ADMIN' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Shield size={24} className="text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-semibold">Acceso total al acervo</p>
                  <p className="text-xs text-green-600 mt-1">Los administradores pueden gestionar todas las categorías y piezas.</p>
                </div>
              ) : selectedUser.member?.role === 'COLLABORATOR' ? (
                <div className="space-y-3">
                  {/* Ramas asignadas */}
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedUser.member?.permissions?.length > 0 ? (
                      selectedUser.member.permissions.map((perm: any) => (
                        <div key={perm.id} className="flex justify-between items-center text-sm bg-[#f0f7f2] px-3 py-2 rounded-lg border border-[#1d4328]/10">
                          <span className="flex items-center gap-2 text-[#1d4328] font-medium">
                            <Tag size={13} className="text-[#1d4328]/60" />
                            {perm.category.name}
                          </span>
                          <button onClick={() => handleRemovePermission(perm.id)} className="text-red-400 hover:text-red-600 ml-2">
                            <X size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-700 font-medium">Sin ramas asignadas</p>
                        <p className="text-xs text-amber-600 mt-0.5">No podrá editar ninguna pieza.</p>
                      </div>
                    )}
                  </div>

                  {/* Asignar nueva rama */}
                  <div className="pt-3 border-t border-gray-100">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Asignar nueva rama
                    </label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 border border-gray-200 rounded-lg text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1d4328]/30 focus:border-[#1d4328]"
                        value={newCatId}
                        onChange={e => setNewCatId(e.target.value)}
                      >
                        <option value="">Seleccionar categoría...</option>
                        {structuredCategories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssignCategory}
                        disabled={!newCatId}
                        className="bg-[#1d4328] hover:bg-[#255633] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <Eye size={22} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Rol de solo lectura</p>
                  <p className="text-xs text-gray-400 mt-1">No puede crear ni editar piezas del acervo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL ELIMINAR ===== */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-red-50">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
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
