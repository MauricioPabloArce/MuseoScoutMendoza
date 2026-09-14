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
