"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { writeFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
import fs from "fs"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const bio = formData.get("bio") as string
  const teamPosition = formData.get("teamPosition") as string

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone,
      address,
      bio,
    }
  })

  // Update teamPosition if the user is a museum member
  const member = await prisma.museumMember.findUnique({
    where: { userId: session.user.id }
  })
  if (member && teamPosition !== undefined) {
    await prisma.museumMember.update({
      where: { id: member.id },
      data: { teamPosition }
    })
    revalidatePath("/sobre-el-museo/equipo")
  }

  revalidatePath("/admin/perfil")
}

export async function uploadProfilePicture(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("No autorizado")

  const file = formData.get("file") as File
  if (!file) throw new Error("No se recibió ningún archivo")

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = join(process.cwd(), "public", "uploads", "profiles")
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const ext = file.name.split('.').pop()
  const fileName = `${session.user.id}-${randomUUID()}.${ext}`
  const filePath = join(uploadDir, fileName)

  await writeFile(filePath, buffer)
  const fileUrl = `/uploads/profiles/${fileName}`

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: fileUrl }
  })

  revalidatePath("/admin/perfil")
}
