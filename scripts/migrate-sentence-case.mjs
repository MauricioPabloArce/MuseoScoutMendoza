import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function toSentenceCase(text) {
  if (!text) return text
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

async function main() {
  console.log("🔄 Iniciando migración a Sentence Case...\n")

  // 1. Categorias
  const categories = await prisma.category.findMany()
  for (const cat of categories) {
    await prisma.category.update({
      where: { id: cat.id },
      data: { name: toSentenceCase(cat.name) || cat.name, description: toSentenceCase(cat.description) }
    })
  }
  console.log("✅ Categorias: " + categories.length)

  // 2. Secciones
  const sections = await prisma.fieldSection.findMany()
  for (const sec of sections) {
    await prisma.fieldSection.update({
      where: { id: sec.id },
      data: { name: toSentenceCase(sec.name) || sec.name, description: toSentenceCase(sec.description) }
    })
  }
  console.log("✅ Secciones: " + sections.length)

  // 3. Campos
  const fields = await prisma.fieldDefinition.findMany()
  for (const f of fields) {
    await prisma.fieldDefinition.update({ where: { id: f.id }, data: { name: toSentenceCase(f.name) || f.name } })
  }
  console.log("✅ Campos: " + fields.length)

  // 4. Valores de campos de piezas
  const fvs = await prisma.pieceFieldValue.findMany()
  let fvCount = 0
  for (const fv of fvs) {
    const nv = toSentenceCase(fv.value)
    if (nv && nv !== fv.value) { await prisma.pieceFieldValue.update({ where: { id: fv.id }, data: { value: nv } }); fvCount++ }
  }
  console.log("✅ Valores de piezas actualizados: " + fvCount + "/" + fvs.length)

  // 5. Muestras
  const exhibitions = await prisma.exhibition.findMany()
  for (const ex of exhibitions) {
    await prisma.exhibition.update({
      where: { id: ex.id },
      data: { name: toSentenceCase(ex.name) || ex.name, theme: toSentenceCase(ex.theme), location: toSentenceCase(ex.location) }
    })
  }
  console.log("✅ Muestras: " + exhibitions.length)

  // 6. Proyectos Especiales
  const projects = await prisma.specialProject.findMany({ include: { images: true } })
  for (const p of projects) {
    await prisma.specialProject.update({
      where: { id: p.id },
      data: { name: toSentenceCase(p.name) || p.name, theme: toSentenceCase(p.theme), description: toSentenceCase(p.description), objective: toSentenceCase(p.objective) }
    })
    for (const img of p.images) {
      if (img.caption) await prisma.specialProjectImage.update({ where: { id: img.id }, data: { caption: toSentenceCase(img.caption) } })
    }
  }
  console.log("✅ Proyectos: " + projects.length)

  console.log("\n🎉 Migracion completa!")
}

main().catch(console.error).finally(() => prisma.$disconnect())
