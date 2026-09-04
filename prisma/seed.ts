import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // 1. Configuración del Museo
  await prisma.museumSettings.create({
    data: {
      name: 'Museo Scout Mendoza',
      description: 'Preservando la historia del escultismo y guidismo en Mendoza',
      registrySeparator: '-',
      registrySequenceLen: 6,
      registryUse4DigitYr: true,
      registryResetYearly: false,
    },
  })

  // 2. Categorías recursivas
  const catInsignias = await prisma.category.create({
    data: {
      name: 'Insignias',
      slug: 'insignias',
      prefix: 'IN',
      isPublished: true,
    },
  })

  const catInsigniasArg = await prisma.category.create({
    data: {
      name: 'Argentina',
      slug: 'insignias-argentina',
      prefix: 'IA', // prefijo único
      parentId: catInsignias.id,
      isPublished: true,
    },
  })

  const catInsigniasArgEventos = await prisma.category.create({
    data: {
      name: 'Eventos Nacionales',
      slug: 'insignias-argentina-eventos',
      prefix: 'EN',
      parentId: catInsigniasArg.id,
      isPublished: true,
    },
  })

  const catDocumentos = await prisma.category.create({
    data: {
      name: 'Documentos',
      slug: 'documentos',
      prefix: 'DO',
      isPublished: true,
    },
  })

  const catLibros = await prisma.category.create({
    data: {
      name: 'Libros',
      slug: 'documentos-libros',
      prefix: 'LI',
      parentId: catDocumentos.id,
      isPublished: true,
    },
  })

  // 3. Campos generales
  const fEstado = await prisma.fieldDefinition.create({
    data: {
      name: 'Estado de Conservación',
      internalKey: 'estado_conservacion',
      type: 'SELECT',
      isGeneral: true,
      isPublic: true,
      options: {
        create: [
          { label: 'Excelente', value: 'excelente', order: 1 },
          { label: 'Bueno', value: 'bueno', order: 2 },
          { label: 'Regular', value: 'regular', order: 3 },
          { label: 'Malo', value: 'malo', order: 4 },
        ],
      },
    },
  })

  const fProcedencia = await prisma.fieldDefinition.create({
    data: {
      name: 'Procedencia',
      internalKey: 'procedencia',
      type: 'TEXT',
      isGeneral: true,
      isPublic: true,
    },
  })

  // 4. Campos específicos por categoría
  const fMaterial = await prisma.fieldDefinition.create({
    data: {
      name: 'Material',
      internalKey: 'material',
      type: 'TEXT',
      isGeneral: false,
      isPublic: true,
      categoryFields: {
        create: {
          categoryId: catInsigniasArgEventos.id,
        },
      },
    },
  })

  const fAno = await prisma.fieldDefinition.create({
    data: {
      name: 'Año',
      internalKey: 'ano',
      type: 'NUMBER',
      isGeneral: false,
      isPublic: true,
      categoryFields: {
        create: [
          { categoryId: catInsigniasArgEventos.id },
          { categoryId: catLibros.id }
        ]
      },
    },
  })

  // 5. Piezas demostrativas
  await prisma.museumPiece.create({
    data: {
      registryCode: 'IN-2026-000001',
      title: 'Insignia Campamento Nacional 1965',
      categoryId: catInsigniasArgEventos.id,
      status: 'PUBLISHED',
      fieldValues: {
        create: [
          { fieldId: fEstado.id, value: 'bueno' },
          { fieldId: fProcedencia.id, value: 'Donación anónima' },
          { fieldId: fMaterial.id, value: 'Tela bordada' },
          { fieldId: fAno.id, value: '1965' },
        ],
      },
    },
  })

  await prisma.museumPiece.create({
    data: {
      registryCode: 'DO-2026-000002',
      title: 'Manual del Lobato (1era Edición)',
      categoryId: catLibros.id,
      status: 'PUBLISHED',
      fieldValues: {
        create: [
          { fieldId: fEstado.id, value: 'regular' },
          { fieldId: fAno.id, value: '1916' },
        ],
      },
    },
  })

  console.log('Seed completado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
