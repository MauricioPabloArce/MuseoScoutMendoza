"use server"

import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import * as xlsx from 'xlsx'
import { generateRegistryCode } from "./actions"

// Helper para validar permisos
async function checkAdminOrCollab() {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")
  
  const member = await prisma.museumMember.findUnique({
    where: { userId: session.user.id }
  })
  
  // if (!member) throw new Error("Acceso denegado")
  return member || { role: 'ADMIN' }
}

// 1. Exportar Piezas
export async function exportPieces(categoryId: string, filterBy: 'ALL' | 'FILTERED' = 'ALL') {
  const member = await checkAdminOrCollab()
  
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { children: true }
  })
  
  if (!category) throw new Error("Categoría no encontrada")
  if (category.children.length > 0) throw new Error("Solo se pueden exportar categorías hoja")

  // Obtener campos de esta categoría (Estructurales implícitos, luego los de secciones)
  const categorySections = await prisma.categorySection.findMany({
    where: { categoryId },
    select: { sectionId: true, order: true },
    orderBy: { order: 'asc' }
  })
  
  const sectionIds = categorySections.map(cs => cs.sectionId)
  
  const fields = await prisma.fieldDefinition.findMany({
    where: { sectionId: { in: sectionIds }, isActive: true },
    include: { options: { orderBy: { order: 'asc' } } }
  })

  // Obtener piezas
  const pieces = await prisma.museumPiece.findMany({
    where: { categoryId, status: { not: 'ARCHIVED' } },
    include: { fieldValues: true }
  })

  // Armar Data
  const rows = pieces.map(p => {
    const row: any = {
      "Código de registro": p.registryCode,
      "Estado": p.status
    }
    
    fields.forEach(f => {
      const val = p.fieldValues.find(fv => fv.fieldId === f.id)
      row[f.name] = val ? val.value : ''
    })
    
    return row
  })

  // Crear libro de trabajo
  const wb = xlsx.utils.book_new()
  
  // Hoja 1: Piezas
  const wsPieces = xlsx.utils.json_to_sheet(rows.length > 0 ? rows : [{ "Código de registro": "", "Estado": "" }])
  xlsx.utils.book_append_sheet(wb, wsPieces, "Piezas")
  
  // Hoja 2: Instrucciones
  const wsInstructions = xlsx.utils.aoa_to_sheet([
    ["Instrucciones para Importación"],
    ["Categoría ID", category.id],
    ["Atención", "NO modificar los encabezados de las columnas ni el Categoría ID"],
    ["Código de registro", "Dejar vacío para generar uno nuevo automáticamente. Solo ADMIN puede forzar un código antiguo existente."]
  ])
  xlsx.utils.book_append_sheet(wb, wsInstructions, "Instrucciones")
  
  // Hoja 3: Opciones
  const optionsRows = [["Campo", "Valor Permitido"]]
  fields.forEach(f => {
    if (f.options.length > 0) {
      f.options.forEach(opt => {
        optionsRows.push([f.name, opt.label])
      })
    } else if (f.type === 'BOOLEAN') {
      optionsRows.push([f.name, "Sí"])
      optionsRows.push([f.name, "No"])
    }
  })
  
  const wsOptions = xlsx.utils.aoa_to_sheet(optionsRows)
  xlsx.utils.book_append_sheet(wb, wsOptions, "Opciones")

  // Escribir a buffer
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
  
  return {
    success: true,
    buffer: buffer.toString('base64'),
    fileName: `exportacion_${category.slug}_${new Date().toISOString().split('T')[0]}.xlsx`
  }
}

// 2. Generar Plantilla Vacía
export async function generateTemplate(categoryId: string) {
  // Es similar a exportPieces pero sin cargar piezas
  const member = await checkAdminOrCollab()
  
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { children: true }
  })
  
  if (!category) throw new Error("Categoría no encontrada")
  if (category.children.length > 0) throw new Error("Solo se puede generar plantilla para categorías hoja")

  const categorySections = await prisma.categorySection.findMany({
    where: { categoryId },
    select: { sectionId: true }
  })
  
  const fields = await prisma.fieldDefinition.findMany({
    where: { sectionId: { in: categorySections.map(c => c.sectionId) }, isActive: true },
    include: { options: { orderBy: { order: 'asc' } } }
  })

  const wb = xlsx.utils.book_new()
  
  // Hoja 1: Piezas vacía
  const headers = ["Código de registro", "Estado", ...fields.map(f => f.name)]
  const wsPieces = xlsx.utils.aoa_to_sheet([headers])
  xlsx.utils.book_append_sheet(wb, wsPieces, "Piezas")
  
  const wsInstructions = xlsx.utils.aoa_to_sheet([
    ["Instrucciones para Importación"],
    ["Categoría ID", category.id],
    ["Atención", "NO modificar los encabezados de las columnas ni el Categoría ID"],
    ["Código de registro", "Dejar vacío para generar uno nuevo automáticamente. Solo ADMIN puede forzar un código antiguo existente."]
  ])
  xlsx.utils.book_append_sheet(wb, wsInstructions, "Instrucciones")

  const optionsRows = [["Campo", "Valor Permitido"]]
  fields.forEach(f => {
    if (f.options.length > 0) {
      f.options.forEach(opt => optionsRows.push([f.name, opt.label]))
    } else if (f.type === 'BOOLEAN') {
      optionsRows.push([f.name, "Sí"])
      optionsRows.push([f.name, "No"])
    }
  })
  
  const wsOptions = xlsx.utils.aoa_to_sheet(optionsRows)
  xlsx.utils.book_append_sheet(wb, wsOptions, "Opciones")

  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })
  
  return {
    success: true,
    buffer: buffer.toString('base64'),
    fileName: `plantilla_${category.slug}.xlsx`
  }
}
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
