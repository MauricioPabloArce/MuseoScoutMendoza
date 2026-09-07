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

export async function getCategories(): Promise<any[]> {
  const categories = await prisma.category.findMany({
    where: { isArchived: false },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { pieces: true }
      },
      fields: true
    }
  })
  
  return categories
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

export async function createCategory(data: { name: string; slug: string; prefix: string; description?: string; parentId?: string; fieldIds?: string[]; imageUrl?: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        prefix: data.prefix,
        description: data.description || null,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
        isPublished: false,
        fields: data.fieldIds && data.fieldIds.length > 0 ? {
          create: data.fieldIds.map((id, i) => ({
            fieldId: id,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/categorias")
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "El slug o prefijo ya existe" }
    }
    return { success: false, error: "Error al crear la categoría" }
  }
}

export async function updateCategory(id: string, data: { name: string; slug: string; prefix: string; description?: string; parentId?: string; fieldIds?: string[]; imageUrl?: string }) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  try {
    await prisma.categoryField.deleteMany({
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
        fields: data.fieldIds && data.fieldIds.length > 0 ? {
          create: data.fieldIds.map((fid, i) => ({
            fieldId: fid,
            order: i
          }))
        } : undefined
      }
    })
    revalidatePath("/admin/categorias")
    return { success: true }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { success: false, error: "El slug o prefijo ya existe" }
    }
    return { success: false, error: "Error al actualizar la categoría" }
  }
}

export async function togglePublishCategory(id: string, isPublished: boolean) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  await prisma.category.update({
    where: { id },
    data: { isPublished }
  })
  revalidatePath("/admin/categorias")
}

export async function archiveCategory(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

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
  return { success: true }
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

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
    return { success: true }
  } catch (error: any) {
    return { success: false, error: "Error al eliminar la categoría" }
  }
}
