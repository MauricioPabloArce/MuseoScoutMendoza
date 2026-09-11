"use server"

import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export type DashboardFilters = {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  status?: string;
}

export async function getDashboardData(filters: DashboardFilters = {}) {
  const session = await auth()
  if (!session?.user) throw new Error("No autorizado")

  const member = await prisma.museumMember.findUnique({
    where: { userId: session.user.id },
    include: { permissions: true }
  })
  
  let isAdmin = false
  let authCategories: string[] = []

  if (member) {
    isAdmin = member.role === "ADMIN" || member.role === "SUPERADMIN"
    authCategories = member.permissions.map(p => p.categoryId)
  } else if (session.user.email === 'admin@local.test') {
    isAdmin = true // Fallback para desarrollo local
  } else {
    return getEmptyDashboard()
  }

  // Si no es admin y no tiene permisos de categoría, no ve nada
  if (!isAdmin && authCategories.length === 0) {
    return getEmptyDashboard()
  }

  // --- 2. Construir la consulta Base de Piezas (Where) ---
  const whereClause: any = {}

  // Filtro de Permisos
  if (!isAdmin) {
    whereClause.categoryId = { in: authCategories }
  }

  // Filtro de Categoría (desde la UI)
  if (filters.categoryId) {
    const cats = await prisma.category.findMany({ where: { OR: [{ id: filters.categoryId }, { parentId: filters.categoryId }] } })
    const catIds = cats.map(c => c.id)
    whereClause.categoryId = isAdmin ? { in: catIds } : { in: catIds.filter(id => authCategories.includes(id)) }
  }

  // Filtro de Estado
  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'PUBLISHED') whereClause.status = 'PUBLISHED'
    if (filters.status === 'DRAFT') whereClause.status = 'DRAFT'
    if (filters.status === 'ARCHIVED') whereClause.status = 'ARCHIVED'
  }

  // Filtro de Fechas
  if (filters.dateFrom || filters.dateTo) {
    whereClause.registeredAt = {}
    if (filters.dateFrom) whereClause.registeredAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) whereClause.registeredAt.lte = new Date(filters.dateTo)
  }

  // Búsqueda (search)
  if (filters.search) {
    whereClause.registryCode = { contains: filters.search }
  }

  // Obtenemos todas las piezas filtradas
  const pieces = await prisma.museumPiece.findMany({
    where: whereClause,
    include: {
      category: {
        include: { parent: true }
      },
      media: true,
      fieldValues: {
        include: { field: true }
      }
    }
  })

  // === 3. Procesamiento y KPIs ===
  
  const totalPieces = pieces.length
  let published = 0
  let draft = 0
  let archived = 0
  let withImage = 0

  const categoryCount: Record<string, number> = {}
  const statusCount = { PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 }
  const timeSeries: Record<string, number> = {} // YYYY-MM
  const geographicCount: Record<string, number> = {}

  pieces.forEach(p => {
    // KPI Estado
    if (p.status === 'PUBLISHED') { published++; statusCount.PUBLISHED++ }
    if (p.status === 'DRAFT') { draft++; statusCount.DRAFT++ }
    if (p.status === 'ARCHIVED') { archived++; statusCount.ARCHIVED++ }

    // KPI Imagen
    if (p.media.some(m => m.type === 'IMAGE')) withImage++

    // Categorías
    const catName = p.category.name
    categoryCount[catName] = (categoryCount[catName] || 0) + 1

    // Temporal
    const dateStr = p.registeredAt.toISOString().substring(0, 7) // YYYY-MM
    timeSeries[dateStr] = (timeSeries[dateStr] || 0) + 1

    // Geográfico
    const geoField = p.fieldValues.find(fv => 
      fv.field.name.toLowerCase().includes('provincia') || 
      fv.field.name.toLowerCase().includes('origen') ||
      fv.field.name.toLowerCase().includes('procedencia')
    )
    if (geoField && geoField.value) {
      const val = geoField.value.trim()
      if (val) {
        geographicCount[val] = (geographicCount[val] || 0) + 1
      }
    }
  })

  // Format arrays for Recharts
  const evolutionData = Object.entries(timeSeries)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
    
  let acc = 0;
  evolutionData.forEach(item => {
    acc += item.count;
    (item as any).accumulated = acc;
  })

  const categoryData = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  const geoData = Object.entries(geographicCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  // Insights
  const insights = []
  if (totalPieces > 0) {
    insights.push({ type: 'info', text: `El ${Math.round((published/totalPieces)*100)}% de las piezas registradas se encuentran publicadas.` })
    
    const withoutImage = totalPieces - withImage
    if (withoutImage > 0) {
      insights.push({ type: 'warning', text: `${withoutImage} piezas todavía no poseen imagen principal.` })
    }

    if (categoryData.length > 0) {
      const topCat = categoryData[0]
      const percentage = Math.round((topCat.count / totalPieces) * 100)
      insights.push({ type: 'info', text: `La categoría '${topCat.name}' representa el ${percentage}% del acervo.` })
    }
  }

  const totalCategories = await prisma.category.count()
  const allCategories = await prisma.category.findMany({ select: { id: true, name: true, parentId: true } })

  return {
    kpis: {
      total: totalPieces,
      published,
      draft,
      archived,
      withImage,
      withoutImage: totalPieces - withImage,
      totalCategories
    },
    evolutionData,
    categoryData,
    statusCount,
    geoData,
    insights,
    allCategories,
    recentPieces: pieces.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime()).slice(0, 10).map(p => ({
      id: p.id,
      code: p.registryCode,
      category: p.category.name,
      status: p.status,
      date: p.registeredAt.toISOString()
    }))
  }
}

function getEmptyDashboard() {
  return {
    kpis: { total: 0, published: 0, draft: 0, archived: 0, withImage: 0, withoutImage: 0, totalCategories: 0 },
    evolutionData: [],
    categoryData: [],
    statusCount: { PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 },
    geoData: [],
    insights: [],
    allCategories: [],
    recentPieces: []
  }
}
