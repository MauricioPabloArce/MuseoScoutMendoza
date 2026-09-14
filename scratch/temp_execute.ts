// 4. Ejecutar Importación
export async function executeImport(formData: FormData) {
  const member = await checkAdminOrCollab()
  
  const file = formData.get("file") as File
  const categoryId = formData.get("categoryId") as string

  if (!file || !categoryId) throw new Error("Faltan datos para la importación")

  // Leer archivo
  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = xlsx.read(buffer, { type: 'buffer' })
  const wsPieces = wb.Sheets["Piezas"]
  const rows = xlsx.utils.sheet_to_json<any>(wsPieces, { defval: "" })

  const categorySections = await prisma.categorySection.findMany({
    where: { categoryId },
    select: { sectionId: true }
  })
  
  const fields = await prisma.fieldDefinition.findMany({
    where: { sectionId: { in: categorySections.map(c => c.sectionId) }, isActive: true }
  })

  let successCount = 0

  // Realizamos la importación en una transacción secuencial o Promise.all (por seguridad con códigos, secuencial)
  for (const row of rows) {
    try {
      let code = row["Código de registro"]?.toString().trim() || ""
      const status = row["Estado"]?.toString().trim().toUpperCase() || "DRAFT"

      // Generar código si no existe
      if (!code) {
        const generated = await generateRegistryCode(categoryId)
        if (generated) code = generated
      }

      // Crear pieza
      await prisma.museumPiece.create({
        data: {
          registryCode: code,
          categoryId: categoryId,
          status: status as any, // DRAFT, PUBLISHED, ARCHIVED
          fieldValues: {
            create: fields.map(f => ({
              fieldId: f.id,
              value: row[f.name]?.toString().trim() || ""
            }))
          }
        }
      })
      successCount++
    } catch (err) {
      console.error("Error importando fila", err)
      // En un import masivo real podríamos acumular errores de inserción, pero como ya validamos, 
      // esto solo debería fallar por concurrencia o problemas de base de datos graves.
    }
  }

  // Guardar historial
  await prisma.importHistory.create({
    data: {
      userId: member.userId,
      categoryId: categoryId,
      fileName: file.name,
      recordsCount: successCount
    }
  })

  return { success: true, imported: successCount }
}
