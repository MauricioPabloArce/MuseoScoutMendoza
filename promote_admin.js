// promote_admin.js
// Ejecutar esto en el VPS Contabo con: node promote_admin.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'mauriciopablo@gmail.com'; // Cambia esto si tu email es otro
  
  console.log(`Buscando usuario: ${email}...`);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`❌ Usuario ${email} no encontrado en la base de datos.`);
    console.log(`Asegúrate de haber iniciado sesión al menos una vez con Google.`);
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ID ${user.id}`);

  // Verificar si ya es miembro del museo
  let member = await prisma.museumMember.findUnique({ where: { userId: user.id } });

  if (!member) {
    console.log(`Creando registro de miembro para el usuario...`);
    member = await prisma.museumMember.create({
      data: {
        userId: user.id,
        role: 'ADMIN'
      }
    });
    console.log(`✅ ¡Éxito! El usuario ha sido registrado y ahora es Super Administrador (ADMIN).`);
  } else {
    if (member.role === 'ADMIN') {
      console.log(`ℹ️ El usuario ya es Administrador.`);
    } else {
      console.log(`Actualizando rol a ADMIN...`);
      await prisma.museumMember.update({
        where: { id: member.id },
        data: { role: 'ADMIN' }
      });
      console.log(`✅ ¡Éxito! El rol del usuario se actualizó a Super Administrador (ADMIN).`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
