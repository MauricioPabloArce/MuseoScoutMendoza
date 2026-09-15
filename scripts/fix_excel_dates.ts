import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando corrección de fechas de fundación...");

  const fields = await prisma.fieldDefinition.findMany({
    where: { internalKey: 'fecha_fundacion' }
  });

  if (fields.length === 0) {
    console.error("❌ No se encontró el campo 'fecha_fundacion'.");
    process.exit(1);
  }

  const fieldIds = fields.map(f => f.id);

  const values = await prisma.pieceFieldValue.findMany({
    where: { fieldId: { in: fieldIds } }
  });

  let updated = 0;

  for (const pv of values) {
    if (!pv.value) continue;
    
    // Si el valor es solo números, probablemente sea un serial de Excel
    if (/^\d+$/.test(pv.value.trim())) {
      const serial = parseInt(pv.value.trim(), 10);
      
      // Asumimos que los seriales válidos son > 1000 (año 1902 en adelante)
      if (serial > 1000) {
        const epoch = new Date(1899, 11, 30);
        const date = new Date(epoch.getTime() + serial * 86400000);
        
        const formattedDate = date.toLocaleDateString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });

        await prisma.pieceFieldValue.update({
          where: { id: pv.id },
          data: { value: formattedDate }
        });
        
        updated++;
        console.log(`Corregida fecha: ${pv.value} -> ${formattedDate}`);
      }
    }
  }

  console.log(`\n✅ Fechas corregidas exitosamente: ${updated}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
