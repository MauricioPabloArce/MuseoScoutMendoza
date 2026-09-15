import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando reseteo del contador de secuencias...");

  // Borrar todas las secuencias (los contadores de número de registro)
  const deleted = await prisma.registrySequence.deleteMany({});
  
  console.log(`✅ Contadores reseteados. Se eliminaron ${deleted.count} secuencias.`);
  console.log("La próxima pieza que crees empezará desde el número 1 nuevamente.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
