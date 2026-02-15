/**
 * Seed script: creates test users and sample data.
 * Run: npx prisma db seed  (or: npm run db:seed)
 *
 * ┌─────────────────────────┬────────────┬───────────────┬─────────────────────────────────────┐
 * │ Email                   │ Password   │ Name          │ Role                                 │
 * ├─────────────────────────┼────────────┼───────────────┼─────────────────────────────────────┤
 * │ admin@example.com       │ password   │ Morgan Blake  │ Admin                                │
 * │ broker@example.com      │ password   │ Jordan Lee    │ Broker                               │
 * │ broker2@example.com     │ password   │ Riley Scott   │ Broker                               │
 * │ realtor@example.com     │ password   │ Sam Chen      │ Realtor (team lead, under Jordan)    │
 * │ realtor2@example.com    │ password   │ Alex Rivera   │ Realtor (under Jordan)               │
 * │ realtor3@example.com    │ password   │ Morgan Taylor │ Realtor (under Riley)                │
 * │ realtor4@example.com    │ password   │ Casey Wong    │ Realtor (under Jordan)               │
 * │ user@example.com        │ password   │ Jamie Smith   │ Consumer (USER)                      │
 * └─────────────────────────┴────────────┴───────────────┴─────────────────────────────────────┘
 * Sign in at /signin with any row above.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ADMIN_EMAIL, UI } from '../lib/constants';

const prisma = new PrismaClient();
const TEST_PASSWORD = 'password';

async function main() {
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Morgan Blake',
      bio: 'Admin bio',
      ratings: 4.5,
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Morgan Blake',
      bio: 'Admin bio',
      ratings: 4.5,
    },
  });
  const broker = await prisma.user.upsert({
    where: { email: 'broker@example.com' },
    update: {
      password: hashedPassword,
      role: 'BROKER',
      name: 'Jordan Lee',
      bio: 'Broker bio',
      ratings: 4.8,
    },
    create: {
      email: 'broker@example.com',
      password: hashedPassword,
      role: 'BROKER',
      name: 'Jordan Lee',
      bio: 'Broker bio',
      ratings: 4.8,
    },
  });
  const broker2 = await prisma.user.upsert({
    where: { email: 'broker2@example.com' },
    update: {
      password: hashedPassword,
      role: 'BROKER',
      name: 'Riley Scott',
      bio: 'Second brokerage',
      ratings: 4.6,
    },
    create: {
      email: 'broker2@example.com',
      password: hashedPassword,
      role: 'BROKER',
      name: 'Riley Scott',
      bio: 'Second brokerage',
      ratings: 4.6,
    },
  });
  const realtor = await prisma.user.upsert({
    where: { email: 'realtor@example.com' },
    update: {
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Sam Chen',
      bio: 'Residential specialist. 10+ years helping families find the right home.',
      ratings: 4.2,
      brokerId: broker.id,
      isTeamLead: true,
    },
    create: {
      email: 'realtor@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Sam Chen',
      bio: 'Residential specialist. 10+ years helping families find the right home.',
      ratings: 4.2,
      brokerId: broker.id,
      isTeamLead: true,
    },
  });
  const realtor2 = await prisma.user.upsert({
    where: { email: 'realtor2@example.com' },
    update: {
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Alex Rivera',
      bio: 'First-time buyers and condos. Bilingual (EN/ES).',
      ratings: 4.0,
      brokerId: broker.id,
    },
    create: {
      email: 'realtor2@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Alex Rivera',
      bio: 'First-time buyers and condos. Bilingual (EN/ES).',
      ratings: 4.0,
      brokerId: broker.id,
    },
  });
  const realtor3 = await prisma.user.upsert({
    where: { email: 'realtor3@example.com' },
    update: {
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Morgan Taylor',
      bio: 'Lakeshore and waterfront. Top producer 2023.',
      ratings: 4.3,
      brokerId: broker2.id,
    },
    create: {
      email: 'realtor3@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Morgan Taylor',
      bio: 'Lakeshore and waterfront. Top producer 2023.',
      ratings: 4.3,
      brokerId: broker2.id,
    },
  });
  const realtor4 = await prisma.user.upsert({
    where: { email: 'realtor4@example.com' },
    update: {
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Casey Wong',
      bio: 'New builds and investment properties. Your local expert.',
      ratings: 4.1,
      brokerId: broker.id,
    },
    create: {
      email: 'realtor4@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Casey Wong',
      bio: 'New builds and investment properties. Your local expert.',
      ratings: 4.1,
      brokerId: broker.id,
    },
  });
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: hashedPassword,
      role: 'USER',
      name: 'Jamie Smith',
      bio: 'Regular user for testing',
    },
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
      name: 'Jamie Smith',
      bio: 'Regular user for testing',
    },
  });
  // Emulate user for local testing (no DB required to sign in; seed creates record so APIs work)
  const emulateRole = (process.env.EMULATE_SESSION_ROLE ?? 'REALTOR').toUpperCase();
  await prisma.user.upsert({
    where: { id: 'emulate-local' },
    update: { role: emulateRole },
    create: {
      id: 'emulate-local',
      email: process.env.EMULATE_SESSION_EMAIL ?? 'emulate@local',
      password: await bcrypt.hash(process.env.EMULATE_SESSION_PASSWORD ?? 'emulate', 10),
      role: emulateRole,
      name: 'Emulate (local)',
      bio: 'Local testing user',
      ratings: 0,
    },
  });
  // Sample listing
  const listing = await prisma.listing.create({
    data: {
      title: 'Sample Property',
      description: 'A beautiful home in Barrie',
      price: 500000,
      location: 'Barrie, ON',
      province: 'ONTARIO',
      postalCode: 'L4M 1A1',
      sizeSqm: 200,
      bedroomsTotal: 3,
      bathroomsTotal: 2,
      propertyType: 'House',
      latitude: 44.3894,
      longitude: -79.6903,
      images: [],
      status: 'PENDING',
      userId: realtor.id,
    },
  });
  // Sample client
  await prisma.client.create({
    data: {
      name: 'Sample Client',
      email: 'client@example.com',
      phone: '123-456-7890',
      notes: 'Interested in houses',
      status: 'LEAD',
      userId: realtor.id,
    },
  });
  // Sample notification
  await prisma.notification.create({
    data: {
      message: UI.WELCOME_NOTIFICATION,
      type: 'SYSTEM',
      userId: admin.id,
    },
  });
  // Sample favorite
  await prisma.favorite.create({
    data: {
      listingId: listing.id,
      userId: admin.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
