import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando rollback de la importación S.A.A.C...");

  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { name: { contains: 'S.A.A.C' } },
        { name: { contains: 'SAAC' } },
        { prefix: { contains: 'SAAC' } }
      ]
    },
    include: {
      sections: {
        include: { section: true }
      }
    }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    process.exit(1);
  }

  const sectionIds = category.sections.map(s => s.sectionId);

  // Encontrar los campos que usamos
  const keysToClean = [
    'zona', 'distrito', 'direccion', 'fecha_fundacion', 'localidad', 'provincia', 'activo'
  ];

  const fields = await prisma.fieldDefinition.findMany({
    where: {
      sectionId: { in: sectionIds },
      internalKey: { in: keysToClean }
    }
  });

  if (fields.length === 0) {
    console.log("No se encontraron campos para limpiar.");
    process.exit(0);
  }

  const fieldIds = fields.map(f => f.id);
  
  console.log(`Se encontraron ${fields.length} campos para limpiar. Buscando valores...`);

  // Buscar todas las piezas de la categoría S.A.A.C
  const pieces = await prisma.museumPiece.findMany({
    where: { categoryId: category.id },
    select: { id: true }
  });

  const pieceIds = pieces.map(p => p.id);

  if (pieceIds.length === 0) {
    console.log("No hay piezas en la categoría S.A.A.C.");
    process.exit(0);
  }

  // Eliminar los valores
  const deleted = await prisma.pieceFieldValue.deleteMany({
    where: {
      pieceId: { in: pieceIds },
      fieldId: { in: fieldIds }
    }
  });

  console.log(`✅ Rollback exitoso. Se eliminaron ${deleted.count} valores de los campos importados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
