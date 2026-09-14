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

  const files = fs.readdirSync(dirPath);
  console.log(`Buscando en la carpeta ${dirPath}... Encontrados ${files.length} archivos.`);

  let updated = 0;
  let notFound = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      continue;
    }

    // El nombre del archivo (sin extensión) es el código de registro
    const registryCode = path.basename(file, ext).trim();
    
    // Buscar la pieza
    const piece = await prisma.museumPiece.findUnique({
      where: { registryCode },
      include: { category: true }
    });

    if (!piece) {
      console.log(`⚠️ Pieza no encontrada para el código: ${registryCode}`);
      notFound++;
      continue;
    }

    // Carpeta de destino
    const safeCat = piece.category.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const safeTitle = registryCode.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    const filename = `${safeTitle}-${Date.now()}${ext}`;
    
    const uploadDir = path.join(process.cwd(), `public/uploads/${safeCat}`);
    if (!fs.existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const sourcePath = path.join(dirPath, file);
    const destPath = path.join(uploadDir, filename);

    // Copiar el archivo
    try {
      copyFileSync(sourcePath, destPath);
      
      // Crear el registro de PieceMedia
      const url = `/uploads/${safeCat}/${filename}`;
      await prisma.pieceMedia.create({
        data: {
          pieceId: piece.id,
          url,
          type: 'IMAGE',
          order: 0
        }
      });
      
      console.log(`✅ Imagen agregada a la pieza ${registryCode}`);
      updated++;
    } catch (e: any) {
      console.error(`❌ Error al procesar imagen para ${registryCode}:`, e.message);
    }
  }

  console.log(`\n🎉 Importación de imágenes finalizada.`);
  console.log(`- Imágenes procesadas y subidas con éxito: ${updated}`);
  console.log(`- Piezas no encontradas (Código de registro no existe): ${notFound}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
