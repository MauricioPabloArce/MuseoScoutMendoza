import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando corrección de Zona y Distrito...");

  const fields = await prisma.fieldDefinition.findMany({
    where: { 
      OR: [
        { name: { contains: 'Zona' } },
        { name: { contains: 'Distrito' } },
        { internalKey: 'zona' },
        { internalKey: 'distrito' }
      ]
    }
  });

  if (fields.length === 0) {
    console.error("❌ No se encontraron campos de Zona o Distrito.");
    process.exit(1);
  }

  const fieldIds = fields.map(f => f.id);

  const values = await prisma.pieceFieldValue.findMany({
    where: { fieldId: { in: fieldIds } }
  });

  let updated = 0;

  for (const pv of values) {
    if (!pv.value) continue;
    
    const valStr = pv.value.trim();
    
    // Si el valor es un número de 1 solo dígito, lo rellenamos
    if (/^\d{1}$/.test(valStr)) {
      const padded = valStr.padStart(2, '0');

      await prisma.pieceFieldValue.update({
        where: { id: pv.id },
        data: { value: padded }
      });
      
      updated++;
      console.log(`Corregido: ${valStr} -> ${padded}`);
    }
  }

  console.log(`\n✅ Valores de Zona y Distrito corregidos exitosamente: ${updated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
