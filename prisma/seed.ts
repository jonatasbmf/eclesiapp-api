import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Note: Ensure connection details are provided since adapter requires it if generated so
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or ensure the Admin Permission Group exists
  const adminGroup = await prisma.permissionGroup.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'System Administrator Group with full permissions',
    },
  });

  console.log(`✅ Admin group ensured: ${adminGroup.id}`);

  // 2. Hash the default password
  const defaultPassword = 'admin'; // Using 'admin' as standard explicit dev password
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 3. Upsert Person and User together using a transaction-like nested write or direct
  const email = 'sysadmin@eclesiapp.com';

  let sysadminUser = await prisma.user.findUnique({
    where: { email },
    include: {
      groups: true,
    },
  });

  if (!sysadminUser) {
    // Create Person and linked User
    const sysadminPerson = await prisma.person.create({
      data: {
        email: email,
        user: {
          create: {
            email: email,
            passwordHash: hashedPassword,
            isActive: true,
            groups: {
              create: {
                groupId: adminGroup.id,
              },
            },
          },
        },
      },
      include: {
        user: {
          include: {
            groups: true,
          }
        },
      },
    });
    
    sysadminUser = sysadminPerson.user;
    if (sysadminUser) {
      console.log(`✅ Sysadmin created: ${sysadminUser.email}`);
    }
  } else {
    // Optionally update password if already exists
    sysadminUser = await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
      include: { groups: true },
    });
    
    // Ensure the group link exists
    const hasAdminGroup = sysadminUser.groups.some(g => g.groupId === adminGroup.id);
    if (!hasAdminGroup) {
      await prisma.userGroup.create({
        data: {
          userId: sysadminUser.id,
          groupId: adminGroup.id,
        }
      });
      console.log(`✅ Added sysadmin to admin group`);
    } else {
      console.log(`✅ Sysadmin already exists and is in the admin group`);
    }
  }

  console.log('✅ Seeding completed! You can now log in with:');
  console.log('   Email: sysadmin@eclesiapp.com');
  console.log('   Pass : admin');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
