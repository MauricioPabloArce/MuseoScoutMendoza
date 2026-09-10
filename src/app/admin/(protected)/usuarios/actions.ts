"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getUsersWithPermissions() {
  return await prisma.user.findMany({
    include: {
      member: {
        include: {
          permissions: {
            include: {
              category: { select: { id: true, name: true } }
            }
          }
        }
      }
    }
  })
}

export async function updateUserRole(userId: string, role: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  
  // Verify acting user is SUPERADMIN or ADMIN
  const actingUser = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (actingUser?.role !== 'ADMIN' && actingUser?.role !== 'SUPERADMIN') {
      // In dev mode, we might not have the member record setup for the dummy user yet. 
      // For this demo/hito we will bypass strict role check if actingUser doesn't exist (e.g. dev login).
      if (session.user.id !== 'dev-admin-id') throw new Error("Solo administradores pueden cambiar roles")
  }

  // Create member profile if it doesn't exist
  await prisma.museumMember.upsert({
    where: { userId },
    update: { role },
    create: { userId, role }
  })
  
  revalidatePath("/admin/usuarios")
  return { success: true }
}

export async function updateTeamMemberProfile(userId: string, isTeamMember: boolean, teamPosition: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const actingUser = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (actingUser?.role !== 'ADMIN' && actingUser?.role !== 'SUPERADMIN') {
      if (session.user.id !== 'dev-admin-id') throw new Error("Solo administradores pueden cambiar roles")
  }

  await prisma.museumMember.upsert({
    where: { userId },
    update: { isTeamMember, teamPosition: teamPosition || null },
    create: { userId, isTeamMember, teamPosition: teamPosition || null }
  })
  
  revalidatePath("/admin/usuarios")
  return { success: true }
}

export async function assignCategoryPermission(userId: string, categoryId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const member = await prisma.museumMember.findUnique({ where: { userId } })
  if (!member) throw new Error("El usuario no tiene un perfil de miembro asignado")

  try {
    await prisma.categoryPermission.create({
      data: {
        memberId: member.id,
        categoryId: categoryId
      }
    })
    revalidatePath("/admin/usuarios")
    return { success: true }
  } catch (error) {
    return { success: false, error: "El permiso ya existe o ocurrió un error." }
  }
}

export async function removeCategoryPermission(permissionId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  await prisma.categoryPermission.delete({
    where: { id: permissionId }
  })
  revalidatePath("/admin/usuarios")
  return { success: true }
}

export async function createDummyUser() {
  const num = Math.floor(Math.random() * 1000)
  await prisma.user.create({
    data: {
      name: `Colaborador Prueba ${num}`,
      email: `colab${num}@museo.scout`,
    }
  })
  revalidatePath("/admin/usuarios")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const actingUser = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (actingUser?.role !== 'ADMIN' && session.user.id !== 'dev-admin-id') {
      throw new Error("Solo administradores pueden eliminar usuarios")
  }

  // Prevenir que el admin se borre a si mismo
  if (session.user.id === userId) {
    throw new Error("No puedes eliminar tu propia cuenta")
  }

  await prisma.user.delete({
    where: { id: userId }
  })
  revalidatePath("/admin/usuarios")
  return { success: true }
}
