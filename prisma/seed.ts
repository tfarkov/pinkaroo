import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ADMIN_EMAIL, UI } from '../lib/constants';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password', 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'ADMIN',
      name: 'Admin User',
      bio: 'Admin bio',
      ratings: 4.5,
    },
  });
  const broker = await prisma.user.upsert({
    where: { email: 'broker@example.com' },
    update: {},
    create: {
      email: 'broker@example.com',
      password: hashedPassword,
      role: 'BROKER',
      name: 'Broker User',
      bio: 'Broker bio',
      ratings: 4.8,
    },
  });
  const realtor = await prisma.user.upsert({
    where: { email: 'realtor@example.com' },
    update: {},
    create: {
      email: 'realtor@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Realtor User',
      bio: 'Realtor bio',
      ratings: 4.2,
      brokerId: broker.id,
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
