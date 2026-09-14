import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function normalizeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

async function main() {
  console.log("Starting Donor migration...");

  // Get field definitions for the "Donante" section
  const donorFields = await prisma.fieldDefinition.findMany({
    where: { section: { name: { contains: 'donante' } } },
    include: { section: true }
  });
  
  if (donorFields.length === 0) {
    console.log("No donor fields found. Migration not needed or already done.");
    return;
  }
  
  const nameFieldIds = donorFields.filter(f => f.name.toLowerCase().includes('nombre') || f.name.toLowerCase().includes('apellido')).map(f => f.id);
  const emailFieldIds = donorFields.filter(f => f.name.toLowerCase().includes('mail') || f.name.toLowerCase().includes('correo')).map(f => f.id);
  const phoneFieldIds = donorFields.filter(f => f.name.toLowerCase().includes('movil') || f.name.toLowerCase().includes('móvil') || f.name.toLowerCase().includes('tel')).map(f => f.id);

  console.log("Name fields:", nameFieldIds);
  console.log("Email fields:", emailFieldIds);
  console.log("Phone fields:", phoneFieldIds);

  const pieces = await prisma.museumPiece.findMany({
    where: { donorId: null },
    include: { fieldValues: true }
  });

  console.log(`Found ${pieces.length} pieces to process.`);

  let migrated = 0;

  for (const piece of pieces) {
    let donorName = "";
    let donorEmail = "";
    let donorPhone = "";

    for (const fv of piece.fieldValues) {
      if (nameFieldIds.includes(fv.fieldId)) donorName = fv.value;
      if (emailFieldIds.includes(fv.fieldId)) donorEmail = fv.value;
      if (phoneFieldIds.includes(fv.fieldId)) donorPhone = fv.value;
    }

    if (!donorName || donorName.trim() === "") continue; // Skip if no name

    donorName = donorName.trim();
    const normalized = normalizeName(donorName);

    // Look for existing donor
    let donor = await prisma.donor.findFirst({
      where: { normalizedName: normalized }
    });

    if (!donor) {
      // Create donor
      donor = await prisma.donor.create({
        data: {
          displayName: donorName,
          normalizedName: normalized,
          email: donorEmail || null,
          phone: donorPhone || null,
          createdBy: "system",
          updatedBy: "system"
        }
      });
      console.log(`Created new donor: ${donorName}`);
    } else {
      // Maybe update email/phone if missing?
      if ((donorEmail && !donor.email) || (donorPhone && !donor.phone)) {
        await prisma.donor.update({
          where: { id: donor.id },
          data: {
            email: donor.email ? donor.email : (donorEmail || null),
            phone: donor.phone ? donor.phone : (donorPhone || null)
          }
        });
      }
    }

    // Associate piece with donor
    await prisma.museumPiece.update({
      where: { id: piece.id },
      data: { donorId: donor.id }
    });
    
    migrated++;
  }

  console.log(`Migration complete. Migrated ${migrated} pieces.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
