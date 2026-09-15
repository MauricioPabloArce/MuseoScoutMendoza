import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpieza de campos duplicados...");

  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { name: { contains: 'S.A.A.C' } },
        { name: { contains: 'SAAC' } },
        { prefix: { contains: 'SAAC' } }
      ]
    },
    include: {
      sections: true
    }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    process.exit(1);
  }

  const sectionIds = category.sections.map(s => s.sectionId);

  const keysToCheck = [
    'zona', 'distrito', 'direccion', 'fecha_fundacion', 'localidad', 'provincia', 'activo'
  ];

  let deletedCount = 0;

  for (const key of keysToCheck) {
    // Buscar todos los campos con este internalKey en las secciones de la categoría
    const fields = await prisma.fieldDefinition.findMany({
      where: {
        sectionId: { in: sectionIds },
        internalKey: key
      },
      orderBy: { createdAt: 'asc' } // El más antiguo primero
    });

    if (fields.length > 1) {
      console.log(`Encontrados ${fields.length} campos para '${key}'. Manteniendo el original y borrando duplicados...`);
      // Mantener el primero (el original) y borrar los demás
      const fieldsToDelete = fields.slice(1);
      
      for (const f of fieldsToDelete) {
        // Borrar valores asociados y luego el campo
        await prisma.pieceFieldValue.deleteMany({ where: { fieldId: f.id } });
        await prisma.fieldDefinition.delete({ where: { id: f.id } });
        deletedCount++;
        console.log(`  - Borrado campo duplicado ID: ${f.id} (creado en: ${f.createdAt})`);
      }
    }
  }

  console.log(`\n✅ Limpieza exitosa. Se eliminaron ${deletedCount} campos dinámicos duplicados (y sus valores erróneos).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
