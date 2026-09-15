import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Iniciando correcciones automáticas...");

  const category = await prisma.category.findFirst({
    where: { name: { contains: 'S.A.A.C' } }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    return;
  }

  // 1. Convertir Provincia a TEXT
  const provinciaField = await prisma.fieldDefinition.findFirst({
    where: { name: { contains: 'Provincia' }, type: 'SELECT' }
  });

  if (provinciaField) {
    await prisma.fieldDefinition.update({
      where: { id: provinciaField.id },
      data: { type: 'TEXT' }
    });
    console.log("✅ Campo Provincia cambiado a tipo TEXT.");
  }

  // 2. Formatear fechas a YYYY-MM-DD
  const dateFields = await prisma.fieldDefinition.findMany({
    where: { type: 'DATE' }
  });

  let updatedDates = 0;

  for (const field of dateFields) {
    const values = await prisma.pieceFieldValue.findMany({
      where: { fieldId: field.id }
    });

    for (const pv of values) {
      if (!pv.value) continue;
      
      const val = pv.value.trim();
      
      // Si está en formato DD/MM/YYYY o D/M/YYYY
      if (val.includes('/')) {
        const parts = val.split('/');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          
          if (year.length === 4) {
            const newDate = `${year}-${month}-${day}`;
            await prisma.pieceFieldValue.update({
              where: { id: pv.id },
              data: { value: newDate }
            });
            updatedDates++;
          }
        }
      }
    }
  }

  console.log(`✅ Fechas corregidas al formato YYYY-MM-DD: ${updatedDates}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
