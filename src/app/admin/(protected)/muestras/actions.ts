"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { toSentenceCase } from "@/lib/utils"

async function requireCollaborator() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (!member) throw new Error("No autorizado")
  return { session, member }
}

export async function uploadExhibitionImage(formData: FormData) {
  const { session } = await requireCollaborator()

  const file = formData.get("file") as File
  if (!file) return { error: "No se encontró el archivo" }
  
  if (file.size > 5 * 1024 * 1024) {
    return { error: "El archivo excede el tamaño máximo de 5MB" }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `exhibition-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`
  
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const uploadDir = path.join(process.cwd(), `public/uploads/muestras`)
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), buffer)

  return { url: `/uploads/muestras/${filename}` }
}

export async function getExhibitions() {
  return await prisma.exhibition.findMany({
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getExhibition(id: string) {
  return await prisma.exhibition.findUnique({
    where: { id },
    include: { images: true }
  })
}

export async function createExhibition(data: {
  name: string;
  theme?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  images: { url: string; order: number }[];
}) {
  const { member } = await requireCollaborator()

  try {
    await prisma.exhibition.create({
      data: {
        name: toSentenceCase(data.name) || data.name,
        theme: toSentenceCase(data.theme) || null,
        location: toSentenceCase(data.location) || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        createdBy: member.id,
        images: {
          create: data.images.map(img => ({
            url: img.url,
            order: img.order
          }))
        }
      }
    })
    revalidatePath("/admin/muestras")
    revalidatePath("/muestras")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al crear la muestra" }
  }
}

export async function updateExhibition(id: string, data: {
  name: string;
  theme?: string;
  location?: string;
  startDate?: Date;
  endDate?: Date;
  images: { id?: string; url: string; order: number }[];
}) {
  await requireCollaborator()

  try {
    // Delete existing images that are not in the new list, or just clear and recreate
    // For simplicity, we clear and recreate all images
    await prisma.exhibitionImage.deleteMany({
      where: { exhibitionId: id }
    })

    await prisma.exhibition.update({
      where: { id },
      data: {
        name: toSentenceCase(data.name) || data.name,
        theme: toSentenceCase(data.theme) || null,
        location: toSentenceCase(data.location) || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        images: {
          create: data.images.map(img => ({
            url: img.url,
            order: img.order
          }))
        }
      }
    })
    revalidatePath("/admin/muestras")
    revalidatePath("/muestras")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al actualizar la muestra" }
  }
}

export async function deleteExhibition(id: string) {
  await requireCollaborator()

  try {
    await prisma.exhibition.delete({
      where: { id }
    })
    revalidatePath("/admin/muestras")
    revalidatePath("/muestras")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar la muestra" }
  }
}
