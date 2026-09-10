const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  let section = await prisma.fieldSection.findUnique({ where: { name: "Datos Pieza" } })
  if (!section) {
    section = await prisma.fieldSection.create({ data: { name: "Datos Pieza" } })
  }

  const titulo = await prisma.fieldDefinition.findUnique({ where: { internalKey: "titulo" } })
  if (!titulo) {
    await prisma.fieldDefinition.create({
      data: {
        name: "Título",
        internalKey: "titulo",
        type: "TEXT",
        isRequired: true,
        sectionId: section.id
      }
    })
    console.log("Campo titulo creado")
  }

  const imagen = await prisma.fieldDefinition.findUnique({ where: { internalKey: "imagen_principal" } })
  if (!imagen) {
    await prisma.fieldDefinition.create({
      data: {
        name: "Imagen Principal",
        internalKey: "imagen_principal",
        type: "IMAGE",
        sectionId: section.id
      }
    })
    console.log("Campo imagen_principal creado")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
