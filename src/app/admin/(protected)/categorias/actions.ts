"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

// Type for the flat category returned from DB
export type CategoryWithPieceCount = {
  id: string
  name: string
  slug: string
  prefix: string
  parentId: string | null
  isPublished: boolean
  isArchived: boolean
  _count: { pieces: number }
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (!member || (member.role !== 'ADMIN' && member.role !== 'SUPERADMIN')) {
    throw new Error("Solo administradores pueden realizar esta acción")
  }
  return session
}

export async function getCategories(): Promise<any[]> {
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    include: {
      _count: {
        select: { pieces: true }
      },
      sections: {
        include: { section: true }
      },
      leader: {
        include: {
          user: true
        }
      }
    },
    orderBy: [
      { order: 'asc' },
      { name: 'asc' }
    ]
  })
  
  return categories
}

export async function getCollaborators() {
  const session = await auth()
  if (!session?.user) return []
  
  const members = await prisma.museumMember.findMany({
    include: {
      user: true
    },
    orderBy: {
      user: { name: 'asc' }
    }
  })
  return members
}

export async function uploadCategoryImage(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const file = formData.get("file") as File
  if (!file) return { error: "No file" }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `cat-${Date.now()}.${ext}`
  
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const uploadDir = path.join(process.cwd(), `public/uploads/categories`)
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), buffer)

  return { url: `/uploads/categories/${filename}` }
}

export async function createCategory(data: { name: string; slug: string; prefix: string; description?: string; parentId?: string; sectionIds?: string[]; imageUrl?: string; leaderId?: string }) {
  await requireAdmin()

  try {
    // Ensure "Datos Pieza" section is always included
    let defaultSection = await prisma.fieldSection.findUnique({ where: { name: "Datos Pieza" } })
    if (!defaultSection) {
      defaultSection = await prisma.fieldSection.create({ data: { name: "Datos Pieza" } })
    }
    
    let finalSectionIds = data.sectionIds || []
    if (!finalSectionIds.includes(defaultSection.id)) {
      finalSectionIds = [defaultSection.id, ...finalSectionIds]
    }

    await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        prefix: data.prefix,
        description: data.description || null,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
        leaderId: data.leaderId || null,
        isPublished: false,
        sections: finalSectionIds.length > 0 ? {
          create: finalSectionIds.map((id, i) => ({
            sectionId: id,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/categorias")
    revalidatePath("/admin/piezas")
    revalidatePath("/admin/piezas/crear")
    revalidatePath("/catalogo")
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "El slug o prefijo ya existe" }
    }
    return { success: false, error: "Error al crear la categoría" }
  }
}

export async function updateCategory(id: string, data: { name: string; slug: string; prefix: string; description?: string; parentId?: string; sectionIds?: string[]; imageUrl?: string; leaderId?: string }) {
  await requireAdmin()

  try {
    // Ensure "Datos Pieza" section is always included
    let defaultSection = await prisma.fieldSection.findUnique({ where: { name: "Datos Pieza" } })
    if (!defaultSection) {
      defaultSection = await prisma.fieldSection.create({ data: { name: "Datos Pieza" } })
    }
    
    let finalSectionIds = data.sectionIds || []
    if (!finalSectionIds.includes(defaultSection.id)) {
      finalSectionIds = [defaultSection.id, ...finalSectionIds]
    }

    await prisma.categorySection.deleteMany({
      where: { categoryId: id }
    })

    await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        prefix: data.prefix,
        description: data.description || null,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
        leaderId: data.leaderId || null,
        sections: finalSectionIds.length > 0 ? {
          create: finalSectionIds.map((sid, i) => ({
            sectionId: sid,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/categorias")
    revalidatePath("/admin/piezas")
    revalidatePath("/admin/piezas/crear")
    revalidatePath("/catalogo")
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "El slug o prefijo ya existe" }
    }
    return { success: false, error: "Error al actualizar la categoría" }
  }
}

export async function togglePublishCategory(id: string, isPublished: boolean) {
  await requireAdmin()

  await prisma.category.update({
    where: { id },
    data: { isPublished }
  })
  revalidatePath("/admin/categorias")
  revalidatePath("/admin/piezas")
  revalidatePath("/admin/piezas/crear")
  revalidatePath("/catalogo")
}

export async function archiveCategory(id: string) {
  await requireAdmin()

  // Check if it has children
  const children = await prisma.category.count({ where: { parentId: id, isArchived: false } })
  if (children > 0) {
    return { success: false, error: "No se puede archivar una categoría con subcategorías activas" }
  }

  // Check if it has pieces
  const pieces = await prisma.museumPiece.count({ where: { categoryId: id } })
  if (pieces > 0) {
    return { success: false, error: "No se puede archivar una categoría que contiene piezas" }
  }

  await prisma.category.update({
    where: { id },
    data: { isArchived: true }
  })
  revalidatePath("/admin/categorias")
  revalidatePath("/admin/piezas")
  revalidatePath("/admin/piezas/crear")
  revalidatePath("/catalogo")
  return { success: true }
}

export async function deleteCategory(id: string) {
  await requireAdmin()

  // Check if it has children
  const children = await prisma.category.count({ where: { parentId: id } })
  if (children > 0) {
    return { success: false, error: "No se puede eliminar una categoría con subcategorías" }
  }

  // Check if it has pieces
  const pieces = await prisma.museumPiece.count({ where: { categoryId: id } })
  if (pieces > 0) {
    return { success: false, error: "No se puede eliminar una categoría que contiene piezas" }
  }

  try {
    await prisma.category.delete({
      where: { id }
    })
    revalidatePath("/admin/categorias")
    revalidatePath("/admin/piezas")
    revalidatePath("/admin/piezas/crear")
    revalidatePath("/catalogo")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Error al eliminar la categoría" }
  }
}
