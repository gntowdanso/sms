const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = 'test1234';
  const passwordHash = await bcrypt.hash(password, 10);

  // Find or create a role (e.g., Admin)
  let role = await prisma.role.findUnique({ where: { roleName: 'Admin' } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        roleName: 'Admin',
        description: 'Administrator',
      },
    });
  }

  // Create test user
  const user = await prisma.userAccount.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      passwordHash,
      roleId: role.id,
      isActive: true,
    },
  });

  console.log('Test user created:', user);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
