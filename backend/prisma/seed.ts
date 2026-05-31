import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed users for local development / testing.
 *
 * Passwords are hashed with bcryptjs (12 rounds) to match AuthService, so these
 * accounts log in through the normal /api/auth/login flow.
 *
 * Re-running is safe: each user is upserted by email.
 *
 *   npm run prisma:seed
 */
const SEED_USERS: Array<{
  email: string;
  username: string;
  name: string;
  password: string;
  role: UserRole;
  college?: string;
  year?: number;
}> = [
  {
    email: 'admin@test.com',
    username: 'admin',
    name: 'Super Admin',
    password: 'Admin123!',
    role: UserRole.SUPER_ADMIN,
  },

  {
    email: 'participant@test.com',
    username: 'participant',
    name: 'Pat Participant',
    password: 'Participant123!',
    role: UserRole.PARTICIPANT,
    college: 'MIT',
    year: 3,
  },
  {
    email: 'participant2@test.com',
    username: 'participant2',
    name: 'Sam Student',
    password: 'Participant123!',
    role: UserRole.PARTICIPANT,
    college: 'Stanford',
    year: 2,
  },
];

async function main() {
  console.log('Seeding users...');

  for (const u of SEED_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, 12);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        username: u.username,
        name: u.name,
        password: hashedPassword,
        role: u.role,
        college: u.college,
        year: u.year,
        isEmailVerified: true,
      },
      create: {
        email: u.email,
        username: u.username,
        name: u.name,
        password: hashedPassword,
        role: u.role,
        college: u.college,
        year: u.year,
        isEmailVerified: true,
      },
    });

    console.log(`  ✓ ${user.role.padEnd(12)} ${user.email}  (password: ${u.password})`);
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
