"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getPieces() {
  return await prisma.museumPiece.findMany({
    include: {
      category: true,
      fieldValues: true,
      media: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getFieldsForCategory(categoryId: string) {
  // Fields that are general OR specific to this category
  const generalFields = await prisma.fieldDefinition.findMany({
    where: { isGeneral: true, isActive: true },
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { order: 'asc' } }, section: true }
  })

  const specificFields = await prisma.fieldDefinition.findMany({
    where: {
      isGeneral: false,
      isActive: true,
      categoryFields: { some: { categoryId } }
    },
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { order: 'asc' } }, section: true }
  })

  return [...generalFields, ...specificFields].sort((a, b) => a.order - b.order)
}

// Atomic generation of the registry code
async function generateRegistryCode(categoryId: string): Promise<string> {
  let category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category) throw new Error("Categoría no encontrada")
  
  // Encontrar la categoría raíz (General)
  while (category.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: category.parentId } })
    if (parent) category = parent
    else break
  }

  const settings = await prisma.museumSettings.findFirst() || {
    registrySeparator: '-',
    registrySequenceLen: 6,
    registryUse4DigitYr: true
  }

  const prefix = category.prefix || "XX"
  const currentYear = new Date().getFullYear()
  const yearStr = settings.registryUse4DigitYr ? currentYear.toString() : currentYear.toString().slice(-2)

  // Atomic increment
  const seq = await prisma.registrySequence.upsert({
    where: { year: currentYear },
    update: { lastValue: { increment: 1 } },
    create: { year: currentYear, lastValue: 1 }
  })

  const seqStr = seq.lastValue.toString().padStart(settings.registrySequenceLen, '0')
  return `${prefix}${settings.registrySeparator}${yearStr}${settings.registrySeparator}${seqStr}`
}

export async function uploadImage(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const file = formData.get("file") as File
  if (!file) return { error: "No file" }

  const title = formData.get("title") as string || "Sin_Titulo"
  const category = formData.get("category") as string || "General"

  const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
  const safeCat = category.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${safeTitle}-${Date.now()}.${ext}`
  
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const uploadDir = path.join(process.cwd(), `public/uploads/${safeCat}`)
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), buffer)

  return { url: `/uploads/${safeCat}/${filename}` }
}

export async function createPiece(data: {
  title: string
  categoryId: string
  status: string
  fields: Record<string, string>
  mediaUrls?: string[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    const registryCode = await generateRegistryCode(data.categoryId)

    const piece = await prisma.museumPiece.create({
      data: {
        title: data.title,
        categoryId: data.categoryId,
        registryCode,
        status: data.status,
        createdBy: session.user.id,
        fieldValues: {
          create: Object.entries(data.fields).map(([fieldId, value]) => ({
            fieldId,
            value
          }))
        },
        media: data.mediaUrls && data.mediaUrls.length > 0 ? {
          create: data.mediaUrls.map(url => ({
            url,
            type: "IMAGE"
          }))
        } : undefined
      }
    })

    revalidatePath("/admin/piezas")
    revalidatePath("/catalogo")
    return { success: true, piece }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Error al crear la pieza" }
  }
}

export async function getPiece(id: string) {
  return await prisma.museumPiece.findUnique({
    where: { id },
    include: {
      category: true,
      fieldValues: true,
      media: true
    }
  })
}

export async function updatePiece(id: string, data: {
  title: string
  categoryId: string
  status: string
  fields: Record<string, string>
  mediaUrls?: string[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    // Delete existing field values and replace them
    await prisma.pieceFieldValue.deleteMany({
      where: { pieceId: id }
    })

    const piece = await prisma.museumPiece.update({
      where: { id },
      data: {
        title: data.title,
        categoryId: data.categoryId,
        status: data.status,
        updatedBy: session.user.id,
        fieldValues: {
          create: Object.entries(data.fields).map(([fieldId, value]) => ({
            fieldId,
            value
          }))
        },
        // For media, we append for now. A full sync requires more logic
        media: data.mediaUrls && data.mediaUrls.length > 0 ? {
          create: data.mediaUrls.map(url => ({
            url,
            type: "IMAGE"
          }))
        } : undefined
      }
    })

    revalidatePath("/admin/piezas")
    revalidatePath("/catalogo")
    return { success: true, piece }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: "Error al actualizar la pieza" }
  }
}

export async function archivePiece(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    await prisma.museumPiece.update({
      where: { id },
      data: { status: "ARCHIVED" }
    })
    revalidatePath("/admin/piezas")
    revalidatePath("/catalogo")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Error al archivar la pieza" }
  }
}

export async function deletePiece(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    // Verificar que la pieza existe
    const piece = await prisma.museumPiece.findUnique({ where: { id } })
    if (!piece) return { success: false, error: "Pieza no encontrada" }

    // Verificar permisos del usuario
    const member = await prisma.museumMember.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!member) return { success: false, error: "No tienes permisos para esta acción" }
    
    // Solo ADMIN puede eliminar, o usuario con permiso canArchive en la categoría
    if (member.role !== 'ADMIN') {
      const permission = await prisma.categoryPermission.findUnique({
        where: { memberId_categoryId: { memberId: member.id, categoryId: piece.categoryId } }
      })
      if (!permission?.canArchive) {
        return { success: false, error: "No tienes permisos para eliminar piezas en esta categoría" }
      }
    }

    // Eliminar relaciones explícitamente para evitar problemas de FK
    await prisma.pieceFieldValue.deleteMany({ where: { pieceId: id } })
    await prisma.pieceMedia.deleteMany({ where: { pieceId: id } })
    
    // Eliminar la pieza
    await prisma.museumPiece.delete({ where: { id } })
    
    revalidatePath("/admin/piezas")
    revalidatePath("/catalogo")
    return { success: true }
  } catch (error: any) {
    console.error("Error al eliminar pieza:", error)
    return { success: false, error: "Error al eliminar la pieza: " + (error.message || "Error desconocido") }
  }
}
