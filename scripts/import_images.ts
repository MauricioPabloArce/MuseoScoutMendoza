import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { copyFileSync, mkdirSync } from 'fs';

const prisma = new PrismaClient();

async function main() {
  const dirPath = process.argv[2] || path.join(process.cwd(), 'bulk_images');
  
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Carpeta de imágenes no encontrada en: ${dirPath}`);
    console.error('Uso: npx tsx scripts/import_images.ts [ruta_a_la_carpeta]');
    process.exit(1);
  }

  const files = fs.readdirSync(dirPath).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });

  console.log(`Buscando en la carpeta ${dirPath}... Encontrados ${files.length} archivos de imagen.`);

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

  // Buscar el campo N° Organismo
  const orgField = await prisma.fieldDefinition.findFirst({
    where: { sectionId: { in: sectionIds }, internalKey: 'norg' }
  });

  if (!orgField) {
    console.error("❌ No se encontró el campo 'norg' (N° Organismo) en S.A.A.C.");
    process.exit(1);
  }

  // Buscar campos de imágenes
  const imgField1 = await prisma.fieldDefinition.findFirst({
    where: { sectionId: { in: sectionIds }, internalKey: 'datpie_imagen' }
  });
  const imgField2 = await prisma.fieldDefinition.findFirst({
    where: { sectionId: { in: sectionIds }, internalKey: 'camgruscosa_versi_n_2' }
  });
  const imgField3 = await prisma.fieldDefinition.findFirst({
    where: { sectionId: { in: sectionIds }, internalKey: 'camgruscosa_versi_n_3' }
  });

  if (!imgField1) {
    console.warn("⚠️ No se encontró el campo 'datpie_imagen'. Asegúrate de que exista con ese internal key.");
  }

  // Agrupar archivos por número de organismo
  const groupedFiles: Record<string, string[]> = {};
  for (const file of files) {
    // Tomar los 4 primeros caracteres
    const first4 = file.substring(0, 4);
    // Parsear como entero para quitar ceros a la izquierda (0033 -> 33)
    const num = parseInt(first4, 10);
    
    if (isNaN(num)) {
      console.log(`⚠️ Ignorando archivo '${file}' (los 4 primeros caracteres '${first4}' no son un número)`);
      continue;
    }
    
    const orgNumStr = num.toString();
    if (!groupedFiles[orgNumStr]) {
      groupedFiles[orgNumStr] = [];
    }
    groupedFiles[orgNumStr].push(file);
  }

  let updated = 0;
  let notFound = 0;

  const safeCat = category.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const uploadDir = path.join(process.cwd(), `public/uploads/${safeCat}`);
  if (!fs.existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  for (const [orgNum, pieceFiles] of Object.entries(groupedFiles)) {
    // Buscar la pieza que tiene este norg
    const pv = await prisma.pieceFieldValue.findFirst({
      where: {
        fieldId: orgField.id,
        value: orgNum,
        piece: { categoryId: category.id }
      },
      include: { piece: true }
    });

    if (!pv) {
      console.log(`⚠️ No se encontró pieza para el Organismo N° ${orgNum}`);
      notFound++;
      continue;
    }

    const pieceId = pv.pieceId;
    
    // Ordenar archivos alfabéticamente para asegurar que V2 o V3 queden después
    pieceFiles.sort();

    for (let i = 0; i < pieceFiles.length; i++) {
      const file = pieceFiles[i];
      let targetFieldId = null;
      
      if (i === 0 && imgField1) targetFieldId = imgField1.id;
      else if (i === 1 && imgField2) targetFieldId = imgField2.id;
      else if (i === 2 && imgField3) targetFieldId = imgField3.id;
      
      if (!targetFieldId) {
        if (i >= 3) {
          console.log(`⚠️ Se omitió '${file}' para el org ${orgNum} (ya hay 3 imágenes)`);
        }
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      const safeTitle = `org_${orgNum}_v${i+1}`;
      const filename = `${safeTitle}-${Date.now()}${ext}`;
      
      const sourcePath = path.join(dirPath, file);
      const destPath = path.join(uploadDir, filename);

      try {
        copyFileSync(sourcePath, destPath);
        const url = `/uploads/${safeCat}/${filename}`;
        
        // Upsert el PieceFieldValue para esta imagen
        const existing = await prisma.pieceFieldValue.findUnique({
          where: { pieceId_fieldId: { pieceId, fieldId: targetFieldId } }
        });

        if (existing) {
          await prisma.pieceFieldValue.update({
            where: { id: existing.id },
            data: { value: url }
          });
        } else {
          await prisma.pieceFieldValue.create({
            data: { pieceId, fieldId: targetFieldId, value: url }
          });
        }
        
        console.log(`✅ Imagen ${i+1} vinculada a org N° ${orgNum} (${file})`);
      } catch (e: any) {
        console.error(`❌ Error al copiar ${file}:`, e.message);
      }
    }
    updated++;
  }

  console.log(`\n🎉 Vinculación de imágenes finalizada.`);
  console.log(`- Piezas con imágenes vinculadas con éxito: ${updated}`);
  console.log(`- Organismos no encontrados en la base: ${notFound}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
