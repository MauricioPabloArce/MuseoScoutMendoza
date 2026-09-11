"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { toSentenceCase } from "@/lib/utils"

// Secciones protegidas: solo administradores pueden modificarlas
const PROTECTED_SECTIONS = ['datos pieza', 'donante']

async function getCallerInfo() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")
  const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  return { userId: session.user.id, member }
}

function isAdmin(member: any) {
  return member?.role === 'ADMIN' || member?.role === 'SUPERADMIN'
}

/** Verifica si el usuario puede editar una sección dada */
async function canEditSection(sectionId: string): Promise<{ allowed: boolean; reason?: string }> {
  const { userId, member } = await getCallerInfo()
  if (isAdmin(member)) return { allowed: true }

  const section = await prisma.fieldSection.findUnique({ where: { id: sectionId } })
  if (!section) return { allowed: false, reason: "Sección no encontrada" }

  // Secciones del sistema (sin creador o nombre protegido) → solo admins
  if (!section.createdBy || PROTECTED_SECTIONS.includes(section.name.toLowerCase().trim())) {
    return { allowed: false, reason: `La sección "${section.name}" solo puede ser modificada por administradores.` }
  }

  // Sección creada por otro colaborador
  if (section.createdBy !== userId) {
    return { allowed: false, reason: `La sección "${section.name}" solo puede ser modificada por quien la creó o por un administrador.` }
  }

  return { allowed: true }
}

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
  const { userId, member } = await getCallerInfo()
  // Cualquier colaborador o admin puede crear secciones, excepto con nombre protegido
  if (PROTECTED_SECTIONS.includes(data.name.toLowerCase().trim()) && !isAdmin(member)) {
    return { success: false, error: `El nombre "${data.name}" está reservado para administradores.` }
  }

  try {
    const section = await prisma.fieldSection.create({
      data: {
        name: data.name,
        description: data.description,
        createdBy: userId  // guardar el creador
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
  const check = await canEditSection(data.sectionId)
  if (!check.allowed) return { success: false, error: check.reason }

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
  // Find the field's section first
  const field = await prisma.fieldDefinition.findUnique({ where: { id }, select: { sectionId: true } })
  if (field?.sectionId) {
    const check = await canEditSection(field.sectionId)
    if (!check.allowed) throw new Error(check.reason)
  }

  await prisma.fieldDefinition.update({
    where: { id },
    data: { isActive }
  })
  revalidatePath("/admin/campos")
}

export async function updateSection(id: string, data: { name: string; description?: string }) {
  const check = await canEditSection(id)
  if (!check.allowed) return { success: false, error: check.reason }

  const { member } = await getCallerInfo()
  if (PROTECTED_SECTIONS.includes(data.name.toLowerCase().trim()) && !isAdmin(member)) {
    return { success: false, error: `El nombre "${data.name}" está reservado para administradores.` }
  }

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
  const check = await canEditSection(id)
  if (!check.allowed) return { success: false, error: check.reason }

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
  const check = await canEditSection(data.sectionId)
  if (!check.allowed) return { success: false, error: check.reason }

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
  // Find the field's section first
  const field = await prisma.fieldDefinition.findUnique({ where: { id }, select: { sectionId: true } })
  if (field?.sectionId) {
    const check = await canEditSection(field.sectionId)
    if (!check.allowed) return { success: false, error: check.reason }
  }

  try {
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
  const check = await canEditSection(sectionId)
  if (!check.allowed) return { success: false, error: check.reason }

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
