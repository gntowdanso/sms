const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const adminRole = await prisma.role.upsert({
      where: { roleName: 'ADMIN' },
      update: {},
      create: { roleName: 'ADMIN', description: 'Administrator' },
    });

    const password = 'changeme';
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.userAccount.upsert({
      where: { username: 'rekoll' },
      update: { passwordHash, roleId: adminRole.id, isActive: true },
      create: { username: 'rekoll', passwordHash, roleId: adminRole.id, isActive: true },
    });

    console.log('Seeded user:', { id: user.id, username: user.username, roleId: user.roleId });
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
