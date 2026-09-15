import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

function normalizeString(str: string) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function getOrCreateField(sectionId: string, name: string, internalKey: string, type = 'TEXT') {
  let field = await prisma.fieldDefinition.findFirst({
    where: { sectionId, internalKey }
  });

  if (!field) {
    // try finding by name just in case
    field = await prisma.fieldDefinition.findFirst({
      where: { sectionId, name: { contains: name } }
    });
  }

  if (!field) {
    console.log(`Creando campo dinámico: ${name} (${internalKey})...`);
    field = await prisma.fieldDefinition.create({
      data: {
        name,
        internalKey,
        type,
        sectionId,
        isPublic: true,
        isSearchable: true,
      }
    });
  }
  return field;
}

async function main() {
  const filePath = process.argv[2] || path.join(process.cwd(), 'Datos', 'importate.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Archivo no encontrado en: ${filePath}`);
    console.error('Uso: npx tsx scripts/import_saac_excel.ts [ruta_al_archivo]');
    process.exit(1);
  }

  console.log(`Leendo archivo Excel: ${filePath}`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json<any>(worksheet);

  console.log(`Se encontraron ${data.length} filas en el Excel.`);

  // 1. Encontrar la Categoría S.A.A.C.
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
    console.error("❌ No se encontró la categoría S.A.A.C. en la base de datos.");
    process.exit(1);
  }

  console.log(`✅ Categoría encontrada: ${category.name} (${category.id})`);

  if (category.sections.length === 0) {
    console.error("❌ La categoría no tiene secciones configuradas para campos dinámicos.");
    process.exit(1);
  }

  const sectionIds = category.sections.map(s => s.sectionId);
  const mainSectionId = sectionIds[0];

  // 2. Preparar/Asegurar los campos dinámicos necesarios
  console.log("Asegurando campos dinámicos...");
  const fieldZona = await getOrCreateField(mainSectionId, 'Zona', 'zona');
  const fieldDistrito = await getOrCreateField(mainSectionId, 'Distrito', 'distrito');
  const fieldDireccion = await getOrCreateField(mainSectionId, 'Dirección', 'direccion');
  const fieldFundacion = await getOrCreateField(mainSectionId, 'Fecha de fundación', 'fecha_fundacion');
  const fieldLocalidad = await getOrCreateField(mainSectionId, 'Localidad', 'localidad');
  const fieldProvincia = await getOrCreateField(mainSectionId, 'Provincia', 'provincia');
  const fieldActivo = await getOrCreateField(mainSectionId, 'Activo', 'activo', 'TEXT');

  // Buscar el campo que actúa como "Número de Organismo"
  const orgField = await prisma.fieldDefinition.findFirst({
    where: {
      sectionId: { in: sectionIds },
      OR: [
        { internalKey: 'norg' },
        { internalKey: { contains: 'organismo' } },
        { name: { contains: 'rganismo' } },
        { internalKey: 'n' }
      ]
    }
  });

  if (!orgField) {
    console.error("❌ No se encontró ningún campo dinámico para 'Número de Organismo'.");
    process.exit(1);
  }
  console.log(`✅ Campo identificador de Organismo encontrado: ${orgField.name} (${orgField.internalKey})`);

  // 3. Procesar las filas
  let updated = 0;
  let notFound = 0;

  for (const row of data) {
    const numOrg = row['N']?.toString().trim();
    if (!numOrg) continue;

    // Buscar pieza que tenga el número de organismo correspondiente
    const pieceValues = await prisma.pieceFieldValue.findMany({
      where: {
        fieldId: orgField.id,
        value: numOrg
      },
      include: { piece: true }
    });

    const pieceValue = pieceValues.find(pv => pv.piece.categoryId === category.id);

    if (!pieceValue) {
      console.log(`⚠️ Pieza no encontrada para Número de Organismo: ${numOrg}`);
      notFound++;
      continue;
    }

    const pieceId = pieceValue.pieceId;

    const upsertField = async (fieldId: string, value: string | undefined | null) => {
      if (value === undefined || value === null || value === '') return;
      
      const valStr = value.toString().trim();
      
      // Buscar si ya existe el valor
      const existing = await prisma.pieceFieldValue.findUnique({
        where: { pieceId_fieldId: { pieceId, fieldId } }
      });

      if (existing) {
        await prisma.pieceFieldValue.update({
          where: { id: existing.id },
          data: { value: valStr }
        });
      } else {
        await prisma.pieceFieldValue.create({
          data: {
            pieceId,
            fieldId,
            value: valStr
          }
        });
      }
    };

    const zona = row['Z']?.toString();
    const distrito = row['D']?.toString();
    const domicilio = row['Domicilio']?.toString();
    const cp = row['CP']?.toString();
    let direccion = domicilio || '';
    if (domicilio && cp) {
      direccion += ` CP: ${cp}`;
    }
    const fundacion = row['A fundacion']?.toString();
    const localidad = row['LOCALIDAD']?.toString();
    const provincia = row['PROVINCIA']?.toString();
    
    // Condicion: Si dice baja es NO si no dice nada es ALTA
    let activo = "ALTA";
    const condicionStr = row['Condicion']?.toString().toLowerCase().trim();
    if (condicionStr === 'baja') {
      activo = "NO";
    } else if (condicionStr) {
      activo = row['Condicion'].toString();
    }

    await upsertField(fieldZona.id, zona);
    await upsertField(fieldDistrito.id, distrito);
    await upsertField(fieldDireccion.id, direccion);
    await upsertField(fieldFundacion.id, fundacion);
    await upsertField(fieldLocalidad.id, localidad);
    await upsertField(fieldProvincia.id, provincia);
    await upsertField(fieldActivo.id, activo);

    updated++;
    if (updated % 10 === 0) {
      console.log(`Procesadas ${updated} piezas...`);
    }
  }

  console.log(`\n🎉 Importación finalizada.`);
  console.log(`- Piezas actualizadas: ${updated}`);
  console.log(`- Piezas no encontradas (Número no coincide): ${notFound}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
