// 3. Validar Archivo de Importación
export async function validateImportFile(formData: FormData) {
  const member = await checkAdminOrCollab()
  
  const file = formData.get("file") as File
  const categoryId = formData.get("categoryId") as string

  if (!file || !categoryId) throw new Error("Faltan datos para la validación")

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { children: true }
  })
  
  if (!category) throw new Error("Categoría no encontrada")
  if (category.children.length > 0) throw new Error("Solo se puede importar en categorías hoja")

  // Leer archivo
  const buffer = Buffer.from(await file.arrayBuffer())
  const wb = xlsx.read(buffer, { type: 'buffer' })

  // Validar hoja de instrucciones
  const wsInst = wb.Sheets["Instrucciones"]
  if (!wsInst) throw new Error("El archivo no tiene la hoja de 'Instrucciones'. Utilice la plantilla generada por el sistema.")
  
  const instData = xlsx.utils.sheet_to_json<string[]>(wsInst, { header: 1 })
  const catRow = instData.find(row => row[0] === "Categoría ID")
  if (!catRow || catRow[1] !== category.id) {
    throw new Error(`El archivo pertenece a otra categoría o fue alterado (ID esperado: ${category.id}).`)
  }

  // Leer piezas
  const wsPieces = wb.Sheets["Piezas"]
  if (!wsPieces) throw new Error("Falta la hoja de 'Piezas'.")
  
  const rows = xlsx.utils.sheet_to_json<any>(wsPieces, { defval: "" })
  if (rows.length === 0) throw new Error("El archivo está vacío.")

  // Cargar definición de campos
  const categorySections = await prisma.categorySection.findMany({
    where: { categoryId },
    select: { sectionId: true }
  })
  
  const fields = await prisma.fieldDefinition.findMany({
    where: { sectionId: { in: categorySections.map(c => c.sectionId) }, isActive: true },
    include: { options: true }
  })

  let validCount = 0
  let errorCount = 0

  const validationResults = rows.map((row, index) => {
    const errors: string[] = []
    const cleanRow: any = {}
    
    // Código de registro
    const code = row["Código de registro"]?.toString().trim() || ""
    cleanRow["Código de registro"] = code

    // Estado
    const status = row["Estado"]?.toString().trim().toUpperCase() || "DRAFT"
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      errors.push(`Estado '${status}' no es válido (use DRAFT, PUBLISHED o ARCHIVED).`)
    }
    cleanRow["Estado"] = status

    // Campos dinámicos
    fields.forEach(f => {
      const val = row[f.name]?.toString().trim() || ""
      cleanRow[f.name] = val
      cleanRow[`_fieldId_${f.name}`] = f.id

      if (f.isRequired && !val) {
        errors.push(`Campo obligatorio faltante: ${f.name}`)
      }

      if (val) {
        if (f.type === 'NUMBER') {
          if (isNaN(Number(val))) errors.push(`Campo ${f.name} debe ser numérico.`)
        } else if (f.type === 'BOOLEAN') {
          if (val.toLowerCase() !== 'sí' && val.toLowerCase() !== 'no') {
            errors.push(`Campo ${f.name} debe ser 'Sí' o 'No'.`)
          }
        } else if (f.options.length > 0) {
          // SELECT, RADIO, MULTISELECT
          const validLabels = f.options.map(o => o.label.toLowerCase())
          if (f.type === 'MULTISELECT') {
            const vals = val.split('|').map((v: string) => v.trim())
            vals.forEach((v: string) => {
              if (!validLabels.includes(v.toLowerCase())) errors.push(`Opción '${v}' no permitida en ${f.name}.`)
            })
          } else {
            if (!validLabels.includes(val.toLowerCase())) errors.push(`Opción '${val}' no permitida en ${f.name}.`)
          }
        }
      }
    })

    if (errors.length > 0) errorCount++
    else validCount++

    return {
      index: index + 2, // +2 por el encabezado y ser 1-based index visualmente
      originalRow: cleanRow,
      isValid: errors.length === 0,
      errors
    }
  })

  // Revisar duplicados en el mismo archivo
  const codesInFile = validationResults.map(r => r.originalRow["Código de registro"]).filter(c => c !== "")
  const duplicateCodesInFile = codesInFile.filter((item, index) => codesInFile.indexOf(item) !== index)
  if (duplicateCodesInFile.length > 0) {
    validationResults.forEach(r => {
      const code = r.originalRow["Código de registro"]
      if (code && duplicateCodesInFile.includes(code)) {
        r.errors.push(`Código duplicado dentro del archivo: ${code}`)
        if (r.isValid) { r.isValid = false; errorCount++; validCount--; }
      }
    })
  }

  // Revisar duplicados en la base de datos (solo códigos informados)
  const uniqueCodes = [...new Set(codesInFile)]
  if (uniqueCodes.length > 0) {
    const existingPieces = await prisma.museumPiece.findMany({
      where: { registryCode: { in: uniqueCodes } },
      select: { registryCode: true }
    })
    const existingCodes = existingPieces.map(p => p.registryCode)
    
    validationResults.forEach(r => {
      const code = r.originalRow["Código de registro"]
      if (code && existingCodes.includes(code)) {
        // En una importación histórica esto podría ser advertencia o error según el caso
        // Como convención, si existe ya es error, al menos que estemos "Actualizando" (no implementado en esta versión simple)
        if (member.role !== 'ADMIN' && member.role !== 'SUPERADMIN') {
           r.errors.push(`El código ${code} ya existe en el sistema.`)
           if (r.isValid) { r.isValid = false; errorCount++; validCount--; }
        } else {
           // Admin puede importar histórico, pero si ya existe en BD es colisión
           r.errors.push(`CUIDADO: El código ${code} ya existe en el sistema. Esta fila fallará al importar.`)
           if (r.isValid) { r.isValid = false; errorCount++; validCount--; }
        }
      }
    })
  }

  // Generar reporte de errores si hay errores
  let errorReportBase64 = null
  if (errorCount > 0) {
    const errorWb = xlsx.utils.book_new()
    const errorRows = validationResults.map(r => {
      return {
        Fila: r.index,
        ...r.originalRow,
        Resultado: r.isValid ? "OK" : "ERROR",
        Errores: r.errors.join(" | ")
      }
    })
    const errorWs = xlsx.utils.json_to_sheet(errorRows)
    xlsx.utils.book_append_sheet(errorWb, errorWs, "Errores")
    const errorBuf = xlsx.write(errorWb, { type: 'buffer', bookType: 'xlsx' })
    errorReportBase64 = errorBuf.toString('base64')
  }

  return {
    success: true,
    totalRows: rows.length,
    validCount,
    errorCount,
    preview: validationResults.slice(0, 10), // Mandar solo las primeras 10 para no saturar
    errorReportBase64,
    cacheKey: Date.now().toString() // Un token simple para representar que fue validado (en una app real se guardaría en BD/Redis)
  }
}
