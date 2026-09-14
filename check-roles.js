const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const members = await prisma.museumMember.findMany();
  console.log(members);
}

main().finally(() => prisma.$disconnect());
