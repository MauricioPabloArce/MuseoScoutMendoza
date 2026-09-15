import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Cambiando el campo Provincia a tipo TEXT para que sea editable...");

  const category = await prisma.category.findFirst({
    where: { name: { contains: 'S.A.A.C' } }
  });

  if (!category) {
    console.error("❌ No se encontró la categoría S.A.A.C.");
    return;
  }

  const provinciaField = await prisma.fieldDefinition.findFirst({
    where: { categoryId: category.id, name: { contains: 'Provincia' } }
  });

  if (provinciaField) {
    await prisma.fieldDefinition.update({
      where: { id: provinciaField.id },
      data: { type: 'TEXT' }
    });
    console.log("✅ Campo Provincia cambiado a tipo TEXT exitosamente.");
  } else {
    console.log("❌ No se encontró el campo Provincia.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
