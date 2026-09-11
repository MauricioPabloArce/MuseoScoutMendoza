"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

async function requireCollaborator() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  const member = await prisma.museumMember.findUnique({ where: { userId: session.user.id } })
  if (!member) throw new Error("No autorizado")
  return { session, member }
}

async function requireCreatorOrAdmin(projectId: string) {
  const { session, member } = await requireCollaborator()
  
  if (member.role === 'ADMIN' || member.role === 'SUPERADMIN') {
    return { session, member }
  }
  
  const project = await prisma.specialProject.findUnique({ where: { id: projectId } })
  if (!project) throw new Error("Proyecto no encontrado")
  
  if (project.createdBy !== member.id) {
    throw new Error("Solo el creador o un administrador puede modificar este proyecto")
  }
  
  return { session, member, project }
}

export async function uploadProjectImage(formData: FormData) {
  const { session } = await requireCollaborator()

  const file = formData.get("file") as File
  if (!file) return { error: "No se encontró el archivo" }
  
  if (file.size > 5 * 1024 * 1024) {
    return { error: "El archivo excede el tamaño máximo de 5MB" }
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `proyecto-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`
  
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const uploadDir = path.join(process.cwd(), `public/uploads/proyectos`)
  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(path.join(uploadDir, filename), buffer)

  return { url: `/uploads/proyectos/${filename}` }
}

export async function getSpecialProjects() {
  return await prisma.specialProject.findMany({
    include: { images: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getSpecialProject(id: string) {
  return await prisma.specialProject.findUnique({
    where: { id },
    include: { images: true }
  })
}

export async function createSpecialProject(data: {
  name: string;
  theme?: string;
  description?: string;
  objective?: string;
  isPublished?: boolean;
  images: { url: string; caption?: string; order: number }[];
}) {
  const { member } = await requireCollaborator()

  try {
    await prisma.specialProject.create({
      data: {
        name: data.name,
        theme: data.theme || null,
        description: data.description || null,
        objective: data.objective || null,
        isPublished: data.isPublished || false,
        createdBy: member.id,
        images: {
          create: data.images.map(img => ({
            url: img.url,
            caption: img.caption || null,
            order: img.order
          }))
        }
      }
    })
    revalidatePath("/admin/proyectos-especiales")
    revalidatePath("/proyectos-especiales")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al crear el proyecto especial" }
  }
}

export async function updateSpecialProject(id: string, data: {
  name: string;
  theme?: string;
  description?: string;
  objective?: string;
  isPublished?: boolean;
  images: { id?: string; url: string; caption?: string; order: number }[];
}) {
  await requireCreatorOrAdmin(id)

  try {
    await prisma.specialProjectImage.deleteMany({
      where: { projectId: id }
    })

    await prisma.specialProject.update({
      where: { id },
      data: {
        name: data.name,
        theme: data.theme || null,
        description: data.description || null,
        objective: data.objective || null,
        isPublished: data.isPublished,
        images: {
          create: data.images.map(img => ({
            url: img.url,
            caption: img.caption || null,
            order: img.order
          }))
        }
      }
    })
    revalidatePath("/admin/proyectos-especiales")
    revalidatePath("/proyectos-especiales")
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Error al actualizar el proyecto" }
  }
}

export async function deleteSpecialProject(id: string) {
  await requireCreatorOrAdmin(id)

  try {
    await prisma.specialProject.delete({
      where: { id }
    })
    revalidatePath("/admin/proyectos-especiales")
    revalidatePath("/proyectos-especiales")
    return { success: true }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Error al eliminar el proyecto" }
  }
}
