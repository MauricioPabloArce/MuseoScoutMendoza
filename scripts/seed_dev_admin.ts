import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const userId = 'dev-admin-id';
  let user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        name: 'Admin de Prueba',
        email: 'admin@local.test',
      }
    });
    console.log("Created user", user);
  } else {
    console.log("User exists", user);
  }

  let member = await prisma.museumMember.findUnique({ where: { userId } });
  
  if (!member) {
    member = await prisma.museumMember.create({
      data: {
        userId,
        role: 'SUPERADMIN',
      }
    });
    console.log("Created member", member);
  } else {
    console.log("Member exists", member);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
