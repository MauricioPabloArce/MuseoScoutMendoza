import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando borrado TOTAL de piezas de S.A.A.C...");

  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { name: { contains: 'S.A.A.C' } },
        { name: { contains: 'SAAC' } }
      ]
    }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    process.exit(1);
  }

  // Buscar todas las piezas
  const pieces = await prisma.museumPiece.findMany({
    where: { categoryId: category.id },
    select: { id: true }
  });

  const pieceIds = pieces.map(p => p.id);

  if (pieceIds.length === 0) {
    console.log("No hay piezas para borrar en la categoría S.A.A.C.");
    process.exit(0);
  }

  console.log(`Se encontrarón ${pieceIds.length} piezas. Procediendo a borrarlas...`);

  // Eliminar los valores y medios asociados primero
  const deletedValues = await prisma.pieceFieldValue.deleteMany({
    where: { pieceId: { in: pieceIds } }
  });
  console.log(`- Valores dinámicos borrados: ${deletedValues.count}`);

  const deletedMedia = await prisma.pieceMedia.deleteMany({
    where: { pieceId: { in: pieceIds } }
  });
  console.log(`- Archivos/imágenes desvinculadas: ${deletedMedia.count}`);

  // Borrar las piezas
  const deletedPieces = await prisma.museumPiece.deleteMany({
    where: { id: { in: pieceIds } }
  });

  console.log(`\n✅ Borrado total exitoso. Se eliminaron definitivamente ${deletedPieces.count} piezas de S.A.A.C.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
