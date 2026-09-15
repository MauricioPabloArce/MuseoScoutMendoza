import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpieza FORZADA de campos creados hoy...");

  const category = await prisma.category.findFirst({
    where: { 
      OR: [
        { name: { contains: 'S.A.A.C' } },
        { name: { contains: 'SAAC' } }
      ]
    },
    include: { sections: true }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    process.exit(1);
  }

  const sectionIds = category.sections.map(s => s.sectionId);

  // Buscar campos creados en las últimas 24 horas (desde que corrimos el script)
  const today = new Date();
  today.setHours(today.getHours() - 12); // Hace 12 horas

  const keysWeUsed = [
    'zona', 'distrito', 'direccion', 'fecha_fundacion', 'localidad', 'provincia', 'activo'
  ];

  const fieldsCreatedToday = await prisma.fieldDefinition.findMany({
    where: {
      sectionId: { in: sectionIds },
      internalKey: { in: keysWeUsed },
      createdAt: { gte: today }
    }
  });

  if (fieldsCreatedToday.length === 0) {
    console.log("No se encontraron campos dinámicos recientes para eliminar.");
  } else {
    console.log(`Se encontraron ${fieldsCreatedToday.length} campos creados recientemente. Eliminándolos...`);
    for (const f of fieldsCreatedToday) {
      // Eliminar valores primero por las dudas
      await prisma.pieceFieldValue.deleteMany({ where: { fieldId: f.id } });
      // Eliminar el campo
      await prisma.fieldDefinition.delete({ where: { id: f.id } });
      console.log(`  - Borrado campo: ${f.name} (Key: ${f.internalKey})`);
    }
  }

  console.log("\n✅ Limpieza forzada exitosa.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
