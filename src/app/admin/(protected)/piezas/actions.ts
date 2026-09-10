"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

export async function getPieces() {
  return await prisma.museumPiece.findMany({
    include: {
      category: true,
      fieldValues: {
        include: { field: true }
      },
      media: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getFieldsForCategory(categoryId: string) {
  const categorySections = await prisma.categorySection.findMany({
    where: { categoryId },
    select: { sectionId: true, order: true },
    orderBy: { order: 'asc' }
  })
  const sectionIds = categorySections.map(cs => cs.sectionId)

  const fields = await prisma.fieldDefinition.findMany({
    where: {
      sectionId: { in: sectionIds },
      isActive: true
    },
    include: { options: { orderBy: { order: 'asc' } }, section: true }
  })

  // Ordenar primero por el orden elegido en CategorySection, luego por el orden del Field
  const sortedFields = fields.sort((a, b) => {
    const aOrder = categorySections.find(cs => cs.sectionId === a.sectionId)?.order ?? 999
    const bOrder = categorySections.find(cs => cs.sectionId === b.sectionId)?.order ?? 999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.order - b.order
  })

  return sortedFields
}

// Atomic generation of the registry code
async function generateRegistryCode(categoryId: string): Promise<string> {
  const initialCategory = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!initialCategory) throw new Error("Categoría no encontrada")
  
  let currentCategory = initialCategory;
  
  // Encontrar la categoría raíz (General)
  while (currentCategory.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: currentCategory.parentId } })
    if (parent) currentCategory = parent
    else break
  }

  const settings = await prisma.museumSettings.findFirst() || {
    registrySeparator: '-',
    registrySequenceLen: 6,
    registryUse4DigitYr: true
  }

  const prefix = currentCategory.prefix || "XX"
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

async function checkUserPermission(userId: string, categoryId: string, action: 'create' | 'edit' | 'archive'): Promise<boolean> {
  const member = await prisma.museumMember.findUnique({
    where: { userId },
    include: { permissions: true }
  })
  if (!member) return false
  if (member.role === 'ADMIN' || member.role === 'SUPERADMIN') return true
  if (member.role === 'VIEWER') return false

  // For COLLABORATOR: Check if user has explicit permission on this category or any ancestor.
  // Note: includeDescendants is true by default for all assignments.
  const allCategories = await prisma.category.findMany({ select: { id: true, parentId: true } })
  
  let currentCatId: string | null = categoryId
  while (currentCatId) {
    const perm = member.permissions.find(p => p.categoryId === currentCatId)
    if (perm) {
      if (action === 'create' && perm.canCreate) return true
      if (action === 'edit' && perm.canEdit) return true
      if (action === 'archive' && perm.canArchive) return true
    }
    const cat = allCategories.find(c => c.id === currentCatId)
    currentCatId = cat?.parentId || null
  }
  return false
}

export async function createPiece(data: {
  categoryId: string
  status: string
  fields: Record<string, string>
  mediaUrls?: string[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const hasPerm = await checkUserPermission(session.user.id, data.categoryId, 'create')
  if (!hasPerm) return { success: false, error: "No tienes permisos para crear piezas en esta rama del acervo." }

  try {
    const registryCode = await generateRegistryCode(data.categoryId)

    const piece = await prisma.museumPiece.create({
      data: {
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
  categoryId: string
  status: string
  fields: Record<string, string>
  mediaUrls?: string[]
}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const hasPerm = await checkUserPermission(session.user.id, data.categoryId, 'edit')
  if (!hasPerm) return { success: false, error: "No tienes permisos para editar piezas en esta rama del acervo." }

  try {
    // Delete existing field values and replace them
    await prisma.pieceFieldValue.deleteMany({
      where: { pieceId: id }
    })

    const piece = await prisma.museumPiece.update({
      where: { id },
      data: {
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
    const piece = await prisma.museumPiece.findUnique({ where: { id } })
    if (!piece) return { success: false, error: "Pieza no encontrada" }

    const hasPerm = await checkUserPermission(session.user.id, piece.categoryId, 'archive')
    if (!hasPerm) return { success: false, error: "No tienes permisos para archivar esta pieza." }

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

    const hasPerm = await checkUserPermission(session.user.id, piece.categoryId, 'archive')
    if (!hasPerm) return { success: false, error: "No tienes permisos para eliminar piezas en esta rama." }

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
