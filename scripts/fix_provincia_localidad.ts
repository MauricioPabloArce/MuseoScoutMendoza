import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando carga de Provincia y Localidad faltantes...");

  const wb = xlsx.readFile('Datos/importate.xlsx');
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data: any[] = xlsx.utils.sheet_to_json(sheet);

  const category = await prisma.category.findUnique({
    where: { slug: 's-a-a-c' }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    process.exit(1);
  }

  // Encontrar el field identificador y los campos provincia/localidad
  const fields = await prisma.fieldDefinition.findMany({
    where: { categoryId: category.id }
  });

  const orgField = fields.find(f => f.name === 'Número de Organismo' || f.name === 'N° Organismo');
  const provinciaField = fields.find(f => f.name.toLowerCase() === 'provincia');
  const localidadField = fields.find(f => f.name.toLowerCase() === 'localidad');

  if (!orgField || !provinciaField || !localidadField) {
    console.error("❌ Faltan campos en la base de datos.");
    process.exit(1);
  }

  let updatedCount = 0;

  for (const row of data) {
    const numOrg = row['N']?.toString().trim();
    if (!numOrg) continue;

    const pieceValue = await prisma.pieceFieldValue.findFirst({
      where: {
        fieldId: orgField.id,
        value: numOrg
      }
    });

    if (pieceValue) {
      const pieceId = pieceValue.pieceId;
      const provVal = (row['Provincia'] ?? row['PROVINCIA'])?.toString();
      const locVal = (row['Localidad'] ?? row['LOCALIDAD'])?.toString();

      if (provVal) {
        // Upsert
        const existingProv = await prisma.pieceFieldValue.findFirst({
          where: { pieceId, fieldId: provinciaField.id }
        });
        if (existingProv) {
          await prisma.pieceFieldValue.update({
            where: { id: existingProv.id },
            data: { value: provVal }
          });
        } else {
          await prisma.pieceFieldValue.create({
            data: { pieceId, fieldId: provinciaField.id, value: provVal }
          });
        }
      }

      if (locVal) {
        // Upsert
        const existingLoc = await prisma.pieceFieldValue.findFirst({
          where: { pieceId, fieldId: localidadField.id }
        });
        if (existingLoc) {
          await prisma.pieceFieldValue.update({
            where: { id: existingLoc.id },
            data: { value: locVal }
          });
        } else {
          await prisma.pieceFieldValue.create({
            data: { pieceId, fieldId: localidadField.id, value: locVal }
          });
        }
      }
      
      if (provVal || locVal) updatedCount++;
    }
  }

  console.log(`\n✅ Proceso terminado. Piezas actualizadas con datos geográficos: ${updatedCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
