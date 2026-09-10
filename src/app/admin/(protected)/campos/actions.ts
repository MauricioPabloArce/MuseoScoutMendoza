"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getFields() {
  return await prisma.fieldDefinition.findMany({
    include: {
      options: {
        orderBy: { order: 'asc' }
      },
      section: true
    },
    orderBy: { order: 'asc' }
  })
}

export async function getSections() {
  return await prisma.fieldSection.findMany({
    include: {
      fields: {
        include: {
          options: {
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      }
    },
    orderBy: { order: 'asc' }
  })
}

export async function createSection(data: { name: string; description?: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    const section = await prisma.fieldSection.create({
      data: {
        name: data.name,
        description: data.description
      }
    })
    revalidatePath("/admin/campos")
    return { success: true, section }
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Ya existe una sección con este nombre." }
    return { success: false, error: "Error al crear la sección." }
  }
}

export async function createField(data: {
  name: string
  internalKey: string
  type: string
  isGeneral?: boolean
  sectionId: string
  options?: { label: string, value: string }[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    const field = await prisma.fieldDefinition.create({
      data: {
        name: data.name,
        internalKey: data.internalKey,
        type: data.type,
        isGeneral: data.isGeneral ?? false,
        isPublic: true,
        sectionId: data.sectionId,
        options: data.options && data.options.length > 0 ? {
          create: data.options.map((opt, i) => ({
            label: opt.label,
            value: opt.value,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/campos")
    return { success: true, field }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "La clave interna ya está en uso." }
    }
    return { success: false, error: "Error al crear el campo dinámico." }
  }
}

export async function toggleFieldStatus(id: string, isActive: boolean) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  await prisma.fieldDefinition.update({
    where: { id },
    data: { isActive }
  })
  revalidatePath("/admin/campos")
}

export async function updateSection(id: string, data: { name: string; description?: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    const section = await prisma.fieldSection.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    })
    revalidatePath("/admin/campos")
    return { success: true, section }
  } catch (error: any) {
    if (error.code === 'P2002') return { success: false, error: "Ya existe una sección con este nombre." }
    return { success: false, error: "Error al actualizar la sección." }
  }
}

export async function deleteSection(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  await prisma.fieldSection.delete({ where: { id } })
  revalidatePath("/admin/campos")
  return { success: true }
}

export async function updateField(id: string, data: {
  name: string
  internalKey: string
  type: string
  isGeneral?: boolean
  sectionId: string
  options?: { label: string, value: string }[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    await prisma.fieldOption.deleteMany({ where: { fieldId: id } })

    const field = await prisma.fieldDefinition.update({
      where: { id },
      data: {
        name: data.name,
        internalKey: data.internalKey,
        type: data.type,
        isGeneral: data.isGeneral ?? false,
        sectionId: data.sectionId,
        options: data.options && data.options.length > 0 ? {
          create: data.options.map((opt, i) => ({
            label: opt.label,
            value: opt.value,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/campos")
    return { success: true, field }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "La clave interna ya está en uso." }
    }
    return { success: false, error: "Error al actualizar el campo dinámico." }
  }
}

export async function deleteField(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    // Check if field is used by any piece
    const piecesCount = await prisma.pieceFieldValue.count({ where: { fieldId: id } })
    if (piecesCount > 0) {
      return { success: false, error: `Este campo no puede ser eliminado porque está siendo utilizado en ${piecesCount} pieza(s).` }
    }

    await prisma.fieldDefinition.delete({ where: { id } })
    revalidatePath("/admin/campos")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "No se pudo eliminar el campo. Comprueba las dependencias." }
  }
}

export async function updateFieldOrder(sectionId: string, orderedFieldIds: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    await prisma.$transaction(
      orderedFieldIds.map((id, index) =>
        prisma.fieldDefinition.update({
          where: { id },
          data: { order: index },
        })
      )
    )
    revalidatePath("/admin/campos")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Error al actualizar el orden de los campos." }
  }
}
