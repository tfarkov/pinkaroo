/**
 * Seed script: creates test users, mock listings (for before MLS sync), and sample data.
 * Run: npx prisma db seed  (or: npm run db:seed)
 *
 * ┌─────────────────────────┬────────────┬───────────────┬─────────────────────────────────────┐
 * │ Email                   │ Password   │ Name          │ Role                                 │
 * ├─────────────────────────┼────────────┼───────────────┼─────────────────────────────────────┤
 * │ admin@example.com       │ password   │ Morgan Blake  │ System Admin                         │
 * │ officeadmin@example.com │ password   │ Avery Cole    │ Office Admin                         │
 * │ broker@example.com      │ password   │ Jordan Lee    │ Broker                               │
 * │ broker2@example.com     │ password   │ Riley Scott   │ Broker                               │
 * │ realtor@example.com     │ password   │ Sam Chen      │ Realtor (team lead, under Jordan)    │
 * │ realtor2@example.com    │ password   │ Alex Rivera   │ Realtor (under Jordan)               │
 * │ realtor3@example.com    │ password   │ Morgan Taylor │ Realtor (under Riley)                │
 * │ realtor4@example.com    │ password   │ Casey Wong    │ Realtor (under Jordan)               │
 * │ user@example.com        │ password   │ Jamie Smith   │ Consumer (USER)                      │
 * └─────────────────────────┴────────────┴───────────────┴─────────────────────────────────────┘
 * Sign in at /signin with any row above.
 *
 * Mock listings (100 Ontario properties) are upserted so they load from DB until MLS sync is active.
 * Also seeds: draft listings (realtor edit flow), broker-approved listings without mlsId (office “awaiting MLS”),
 * sample supportingDocuments on mock-1 and on one draft, saved searches (favorites/alerts), APPROVAL/INTERACTION notifications.
 * Draft detail URLs (e.g. seed-listing-draft-2 = realtor2@example.com) are not public: sign in as that realtor, broker@example.com, or an admin.
 */
import { PrismaClient, type Role, type Province, type ListingStatus, type AssignmentStatus, type ClientStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { assertMockDataIntegrity, MOCK_LISTINGS } from '../lib/mockData';

const prisma = new PrismaClient();
const TEST_PASSWORD = 'password';
const ADMIN_EMAIL = 'admin@example.com';
const OFFICE_ADMIN_EMAIL = 'officeadmin@example.com';
const WELCOME_NOTIFICATION = 'Welcome to Pinkaroo';

const IDS = {
  admin: 'seed-admin',
  officeAdmin: 'seed-office-admin',
  broker1: 'seed-broker-1',
  broker2: 'seed-broker-2',
  realtor1: 'seed-realtor-1',
  realtor2: 'seed-realtor-2',
  realtor3: 'seed-realtor-3',
  realtor4: 'seed-realtor-4',
  realtor5: 'seed-realtor-5',
  consumer: 'seed-user-1',
  emulate: 'emulate-local',
  team1: 'seed-team-1',
  team2: 'seed-team-2',
  team3: 'seed-team-3',
} as const;

async function main() {
  assertMockDataIntegrity();
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      role: 'SYSTEM_ADMIN',
      name: 'Morgan Blake',
      bio: 'Admin bio',
      ratings: 4.5,
    },
    create: {
      id: IDS.admin,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'SYSTEM_ADMIN',
      name: 'Morgan Blake',
      bio: 'Admin bio',
      ratings: 4.5,
    },
  });
  const officeAdmin = await prisma.user.upsert({
    where: { email: OFFICE_ADMIN_EMAIL },
    update: {
      password: hashedPassword,
      role: 'OFFICE_ADMIN',
      name: 'Avery Cole',
      bio: 'Office admin for brokerage operations.',
      ratings: 4.3,
    },
    create: {
      id: IDS.officeAdmin,
      email: OFFICE_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'OFFICE_ADMIN',
      name: 'Avery Cole',
      bio: 'Office admin for brokerage operations.',
      ratings: 4.3,
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
      id: IDS.broker1,
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
      id: IDS.broker2,
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
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 9am-6pm',
      listingsCount: 11,
      avgSalePrice: 585000,
      clientConversionRate: 42.5,
      approvalRate: 88.2,
    },
    create: {
      id: IDS.realtor1,
      email: 'realtor@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Sam Chen',
      bio: 'Residential specialist. 10+ years helping families find the right home.',
      ratings: 4.2,
      brokerId: broker.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 9am-6pm',
      listingsCount: 11,
      avgSalePrice: 585000,
      clientConversionRate: 42.5,
      approvalRate: 88.2,
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
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 8am-7pm',
      listingsCount: 9,
      avgSalePrice: 520000,
      clientConversionRate: 39.8,
      approvalRate: 84.4,
    },
    create: {
      id: IDS.realtor2,
      email: 'realtor2@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Alex Rivera',
      bio: 'First-time buyers and condos. Bilingual (EN/ES).',
      ratings: 4.0,
      brokerId: broker.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 8am-7pm',
      listingsCount: 9,
      avgSalePrice: 520000,
      clientConversionRate: 39.8,
      approvalRate: 84.4,
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
      teamId: null,
      isTeamLead: false,
      availableHours: 'Tue-Sat 9am-5pm',
      listingsCount: 7,
      avgSalePrice: 615000,
      clientConversionRate: 36.2,
      approvalRate: 81.3,
    },
    create: {
      id: IDS.realtor3,
      email: 'realtor3@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Morgan Taylor',
      bio: 'Lakeshore and waterfront. Top producer 2023.',
      ratings: 4.3,
      brokerId: broker2.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Tue-Sat 9am-5pm',
      listingsCount: 7,
      avgSalePrice: 615000,
      clientConversionRate: 36.2,
      approvalRate: 81.3,
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
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 10am-6pm',
      listingsCount: 6,
      avgSalePrice: 548000,
      clientConversionRate: 34.1,
      approvalRate: 79.7,
    },
    create: {
      id: IDS.realtor4,
      email: 'realtor4@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Casey Wong',
      bio: 'New builds and investment properties. Your local expert.',
      ratings: 4.1,
      brokerId: broker.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Fri 10am-6pm',
      listingsCount: 6,
      avgSalePrice: 548000,
      clientConversionRate: 34.1,
      approvalRate: 79.7,
    },
  });
  const realtor5 = await prisma.user.upsert({
    where: { email: 'realtor5@example.com' },
    update: {
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Jamie Patel',
      bio: 'Data-driven buyer journeys and long-cycle follow-up specialist.',
      ratings: 4.0,
      brokerId: broker2.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Thu 9am-5pm',
      listingsCount: 4,
      avgSalePrice: 505000,
      clientConversionRate: 31.7,
      approvalRate: 76.9,
    },
    create: {
      id: IDS.realtor5,
      email: 'realtor5@example.com',
      password: hashedPassword,
      role: 'REALTOR',
      name: 'Jamie Patel',
      bio: 'Data-driven buyer journeys and long-cycle follow-up specialist.',
      ratings: 4.0,
      brokerId: broker2.id,
      teamId: null,
      isTeamLead: false,
      availableHours: 'Mon-Thu 9am-5pm',
      listingsCount: 4,
      avgSalePrice: 505000,
      clientConversionRate: 31.7,
      approvalRate: 76.9,
    },
  });
  const consumer = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {
      password: hashedPassword,
      role: 'USER',
      name: 'Jamie Smith',
      bio: 'Regular user for testing',
      phone: '(705) 555-0199',
    },
    create: {
      id: IDS.consumer,
      email: 'user@example.com',
      password: hashedPassword,
      role: 'USER',
      name: 'Jamie Smith',
      bio: 'Regular user for testing',
      phone: '(705) 555-0199',
    },
  });
  // Emulate user for local testing (no DB required to sign in; seed creates record so APIs work)
  const emulateRole = (process.env.EMULATE_SESSION_ROLE ?? 'REALTOR').toUpperCase() as Role;
  await prisma.user.upsert({
    where: { id: IDS.emulate },
    update: {
      role: emulateRole,
      password: await bcrypt.hash(process.env.EMULATE_SESSION_PASSWORD ?? 'emulate', 10),
    },
    create: {
      id: IDS.emulate,
      email: process.env.EMULATE_SESSION_EMAIL ?? 'emulate@local',
      password: await bcrypt.hash(process.env.EMULATE_SESSION_PASSWORD ?? 'emulate', 10),
      role: emulateRole,
      name: 'Emulate (local)',
      bio: 'Local testing user',
      ratings: 0,
    },
  });

  await prisma.team.upsert({
    where: { id: IDS.team1 },
    update: {
      name: 'Barrie Sales',
      brokerId: broker.id,
      targetListings: 24,
      targetRevenue: 3200000,
      targetInteractions: 90,
    },
    create: {
      id: IDS.team1,
      name: 'Barrie Sales',
      brokerId: broker.id,
      targetListings: 24,
      targetRevenue: 3200000,
      targetInteractions: 90,
    },
  });
  await prisma.team.upsert({
    where: { id: IDS.team2 },
    update: {
      name: 'Innisfil Partners',
      brokerId: broker.id,
      targetListings: 16,
      targetRevenue: 2100000,
      targetInteractions: 60,
    },
    create: {
      id: IDS.team2,
      name: 'Innisfil Partners',
      brokerId: broker.id,
      targetListings: 16,
      targetRevenue: 2100000,
      targetInteractions: 60,
    },
  });
  await prisma.team.upsert({
    where: { id: IDS.team3 },
    update: {
      name: 'Orillia Growth',
      brokerId: broker2.id,
      targetListings: 14,
      targetRevenue: 1800000,
      targetInteractions: 55,
    },
    create: {
      id: IDS.team3,
      name: 'Orillia Growth',
      brokerId: broker2.id,
      targetListings: 14,
      targetRevenue: 1800000,
      targetInteractions: 55,
    },
  });

  await prisma.user.update({ where: { id: realtor.id }, data: { teamId: IDS.team1, isTeamLead: true } });
  await prisma.user.update({ where: { id: realtor2.id }, data: { teamId: IDS.team1, isTeamLead: false } });
  await prisma.user.update({ where: { id: realtor3.id }, data: { teamId: IDS.team3, isTeamLead: true } });
  await prisma.user.update({ where: { id: realtor4.id }, data: { teamId: IDS.team2, isTeamLead: false } });
  await prisma.user.update({ where: { id: realtor5.id }, data: { teamId: null, isTeamLead: false } });

  // Mock listings: upsert by id so re-seed is safe. Include all MLS attributes from mock data.
  for (const l of MOCK_LISTINGS) {
    const realtorOwners = [realtor.id, realtor2.id, realtor3.id, realtor4.id, realtor5.id];
    const ownerId = realtorOwners[(Number(l.id.replace('mock-', '')) || 1) % realtorOwners.length];
    const index = Number(l.id.replace('mock-', '')) || 1;
    const seededStatus: ListingStatus =
      index % 11 === 0 ? 'REJECTED' : index % 5 === 0 ? 'PENDING' : index % 3 === 0 ? 'APPROVED' : 'ACTIVE';
    const approvedBy = seededStatus === 'APPROVED' ? broker.id : null;
    const approvedAt = seededStatus === 'APPROVED' ? new Date(Date.now() - index * 3600000) : null;
    const rejectionReason = seededStatus === 'REJECTED' ? 'Incomplete disclosure package' : null;
    await prisma.listing.upsert({
      where: { id: l.id },
      create: {
        id: l.id,
        title: l.title,
        description: l.description,
        price: l.price,
        location: l.location,
        province: (l.province as Province) ?? 'ONTARIO',
        postalCode: l.postalCode ?? null,
        sizeSqm: l.sizeSqm ?? null,
        bedroomsTotal: l.bedroomsTotal ?? null,
        bathroomsTotal: l.bathroomsTotal ?? null,
        propertyType: l.propertyType ?? null,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
        images: (l.images ?? []) as object,
        status: seededStatus,
        mlsId: l.mlsId ?? null,
        userId: ownerId,
        approvedBy,
        approvedAt,
        rejectionReason,
        streetAddress: l.streetAddress ?? null,
        unitNumber: l.unitNumber ?? null,
        yearBuilt: l.yearBuilt ?? null,
        lotSizeSqm: l.lotSizeSqm ?? null,
        standardStatus: l.standardStatus ?? null,
        halfBathroomsTotal: l.halfBathroomsTotal ?? null,
        buildingLevelTotal: l.buildingLevelTotal ?? null,
        mlsLastUpdated: l.mlsLastUpdated ? new Date(l.mlsLastUpdated) : null,
        mlsData: (l.mlsData ?? null) as object | null,
        ecoRatingScore: l.ecoRatingScore ?? null,
        heatingType: l.heatingType ?? null,
        insulationQuality: l.insulationQuality ?? null,
        hasRecentRenovations: l.hasRecentRenovations ?? null,
        roofAgeYears: l.roofAgeYears ?? null,
        appliancesAgeYears: l.appliancesAgeYears ?? null,
      },
      update: {
        title: l.title,
        description: l.description,
        price: l.price,
        location: l.location,
        province: (l.province as Province) ?? 'ONTARIO',
        postalCode: l.postalCode ?? null,
        sizeSqm: l.sizeSqm ?? null,
        bedroomsTotal: l.bedroomsTotal ?? null,
        bathroomsTotal: l.bathroomsTotal ?? null,
        propertyType: l.propertyType ?? null,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
        images: (l.images ?? []) as object,
        status: seededStatus,
        mlsId: l.mlsId ?? null,
        userId: ownerId,
        approvedBy,
        approvedAt,
        rejectionReason,
        streetAddress: l.streetAddress ?? null,
        unitNumber: l.unitNumber ?? null,
        yearBuilt: l.yearBuilt ?? null,
        lotSizeSqm: l.lotSizeSqm ?? null,
        standardStatus: l.standardStatus ?? null,
        halfBathroomsTotal: l.halfBathroomsTotal ?? null,
        buildingLevelTotal: l.buildingLevelTotal ?? null,
        mlsLastUpdated: l.mlsLastUpdated ? new Date(l.mlsLastUpdated) : null,
        mlsData: (l.mlsData ?? null) as object | null,
        ecoRatingScore: l.ecoRatingScore ?? null,
        heatingType: l.heatingType ?? null,
        insulationQuality: l.insulationQuality ?? null,
        hasRecentRenovations: l.hasRecentRenovations ?? null,
        roofAgeYears: l.roofAgeYears ?? null,
        appliancesAgeYears: l.appliancesAgeYears ?? null,
      },
    });
  }
  console.log(`Seeded ${MOCK_LISTINGS.length} curated mock listings with validated images and coordinates.`);

  const sampleSupportingDocs = [
    {
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'sample-disclosure.pdf',
      mimeType: 'application/pdf',
    },
  ];

  function listingFromTemplate(
    l: (typeof MOCK_LISTINGS)[number],
    id: string,
    extras: {
      status: ListingStatus;
      userId: string;
      mlsId: string | null;
      approvedBy: string | null;
      approvedAt: Date | null;
      rejectionReason?: string | null;
      supportingDocuments?: object | null;
      title?: string;
      description?: string;
    }
  ) {
    return {
      id,
      title: extras.title ?? l.title,
      description: extras.description ?? l.description,
      price: l.price,
      location: l.location,
      province: (l.province as Province) ?? 'ONTARIO',
      postalCode: l.postalCode ?? null,
      sizeSqm: l.sizeSqm ?? null,
      bedroomsTotal: l.bedroomsTotal ?? null,
      bathroomsTotal: l.bathroomsTotal ?? null,
      propertyType: l.propertyType ?? null,
      latitude: l.latitude ?? null,
      longitude: l.longitude ?? null,
      images: (l.images ?? []) as object,
      status: extras.status,
      mlsId: extras.mlsId,
      userId: extras.userId,
      approvedBy: extras.approvedBy,
      approvedAt: extras.approvedAt,
      rejectionReason: extras.rejectionReason ?? null,
      streetAddress: l.streetAddress ?? null,
      unitNumber: l.unitNumber ?? null,
      yearBuilt: l.yearBuilt ?? null,
      lotSizeSqm: l.lotSizeSqm ?? null,
      standardStatus: l.standardStatus ?? null,
      halfBathroomsTotal: l.halfBathroomsTotal ?? null,
      buildingLevelTotal: l.buildingLevelTotal ?? null,
      mlsLastUpdated: l.mlsLastUpdated ? new Date(l.mlsLastUpdated) : null,
      mlsData: (l.mlsData ?? null) as object | null,
      ecoRatingScore: l.ecoRatingScore ?? null,
      heatingType: l.heatingType ?? null,
      insulationQuality: l.insulationQuality ?? null,
      hasRecentRenovations: l.hasRecentRenovations ?? null,
      roofAgeYears: l.roofAgeYears ?? null,
      appliancesAgeYears: l.appliancesAgeYears ?? null,
      supportingDocuments: extras.supportingDocuments ?? null,
    };
  }

  const tDraft = MOCK_LISTINGS[12];
  const tAwait = MOCK_LISTINGS[18];
  const extraListingSeeds: Array<ReturnType<typeof listingFromTemplate>> = [
    listingFromTemplate(tDraft, 'seed-listing-draft-1', {
      status: 'DRAFT',
      userId: realtor.id,
      mlsId: null,
      approvedBy: null,
      approvedAt: null,
      title: 'Draft: semi-detached (Barrie) — finishing copy',
      description: 'Work in progress. Photos uploaded; disclosure PDF attached for broker review.',
      supportingDocuments: sampleSupportingDocs as object,
    }),
    listingFromTemplate(MOCK_LISTINGS[13], 'seed-listing-draft-2', {
      status: 'DRAFT',
      userId: realtor2.id,
      mlsId: null,
      approvedBy: null,
      approvedAt: null,
      title: 'Draft: downtown condo listing',
      description: 'Draft saved from new listing flow — no documents yet.',
    }),
    listingFromTemplate(tAwait, 'seed-listing-awaiting-mls-1', {
      status: 'APPROVED',
      userId: realtor3.id,
      mlsId: null,
      approvedBy: broker2.id,
      approvedAt: new Date(Date.now() - 2 * 86400000),
      title: `${tAwait.title} (broker-approved, MLS pending)`,
    }),
    listingFromTemplate(MOCK_LISTINGS[19], 'seed-listing-awaiting-mls-2', {
      status: 'APPROVED',
      userId: realtor4.id,
      mlsId: null,
      approvedBy: broker.id,
      approvedAt: new Date(Date.now() - 5 * 86400000),
      title: `${MOCK_LISTINGS[19].title} (awaiting MLS filing)`,
    }),
  ];
  for (const row of extraListingSeeds) {
    await prisma.listing.upsert({
      where: { id: row.id },
      create: row,
      update: row,
    });
  }

  await prisma.listing.update({
    where: { id: 'mock-1' },
    data: { supportingDocuments: sampleSupportingDocs as object },
  });

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const savedSearchSeeds = [
    {
      id: 'seed-saved-search-1',
      userId: consumer.id,
      name: 'Barrie — 3BR under $850k',
      filters: { province: 'ONTARIO', city: 'Barrie', minPrice: 350000, maxPrice: 850000, bedrooms: 3 },
      notifyNewMatch: true,
      lastSeenAt: weekAgo,
      lastNotifiedAt: null as Date | null,
    },
    {
      id: 'seed-saved-search-2',
      userId: admin.id,
      name: 'Ontario detached — eco focus',
      filters: { province: 'ONTARIO', propertyType: 'Detached', minPrice: 400000 },
      notifyNewMatch: false,
      lastSeenAt: new Date(),
      lastNotifiedAt: null as Date | null,
    },
    {
      id: 'seed-saved-search-3',
      userId: realtor.id,
      name: 'Innisfil waterfront watch',
      filters: { province: 'ONTARIO', city: 'Innisfil', minPrice: 500000 },
      notifyNewMatch: true,
      lastSeenAt: weekAgo,
      lastNotifiedAt: weekAgo,
    },
  ];
  for (const s of savedSearchSeeds) {
    await prisma.savedSearch.upsert({
      where: { id: s.id },
      update: {
        userId: s.userId,
        name: s.name,
        filters: s.filters as object,
        notifyNewMatch: s.notifyNewMatch,
        lastSeenAt: s.lastSeenAt,
        lastNotifiedAt: s.lastNotifiedAt,
      },
      create: {
        id: s.id,
        userId: s.userId,
        name: s.name,
        filters: s.filters as object,
        notifyNewMatch: s.notifyNewMatch,
        lastSeenAt: s.lastSeenAt,
        lastNotifiedAt: s.lastNotifiedAt,
      },
    });
  }

  const seedClients: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    notes: string;
    status: ClientStatus;
    userId: string;
    brokerId: string;
    teamId: string | null;
  }> = [
    { id: 'seed-client-1', name: 'Olivia Carter', email: 'olivia.carter@example.com', phone: '555-0100', notes: 'Interested in waterfront options', status: 'LEAD', userId: realtor.id, brokerId: broker.id, teamId: IDS.team1 },
    { id: 'seed-client-2', name: 'Ethan Brooks', email: 'ethan.brooks@example.com', phone: '555-0101', notes: 'Pre-approved, wants 4BR detached', status: 'QUALIFIED', userId: realtor2.id, brokerId: broker.id, teamId: IDS.team1 },
    { id: 'seed-client-3', name: 'Mia Thompson', email: 'mia.thompson@example.com', phone: '555-0102', notes: 'Reviewing offer terms', status: 'NEGOTIATION', userId: realtor4.id, brokerId: broker.id, teamId: IDS.team2 },
    { id: 'seed-client-4', name: 'Lucas Green', email: 'lucas.green@example.com', phone: '555-0103', notes: 'Condo buyer, downtown focus', status: 'PROPOSAL', userId: realtor3.id, brokerId: broker2.id, teamId: IDS.team3 },
    { id: 'seed-client-5', name: 'Charlotte Nguyen', email: 'charlotte.nguyen@example.com', phone: '555-0104', notes: 'Recently closed purchase', status: 'CLOSED', userId: realtor.id, brokerId: broker.id, teamId: IDS.team1 },
    { id: 'seed-client-6', name: 'Noah Singh', email: 'noah.singh@example.com', phone: '555-0105', notes: 'Needs follow-up, no response for 2 weeks', status: 'LEAD', userId: realtor5.id, brokerId: broker2.id, teamId: null },
  ];
  for (const client of seedClients) {
    await prisma.client.upsert({
      where: { id: client.id },
      update: client,
      create: client,
    });
  }

  const seedInteractions = [
    { id: 'seed-int-1', type: 'Call', details: 'Initial discovery call', daysAgo: 20, clientId: 'seed-client-1', userId: realtor.id },
    { id: 'seed-int-2', type: 'Email', details: 'Sent listing package', daysAgo: 14, clientId: 'seed-client-1', userId: realtor.id },
    { id: 'seed-int-3', type: 'Meeting', details: 'Mortgage pre-approval review', daysAgo: 7, clientId: 'seed-client-2', userId: realtor2.id },
    { id: 'seed-int-4', type: 'Showing', details: 'Showed 2 detached homes', daysAgo: 6, clientId: 'seed-client-2', userId: realtor2.id },
    { id: 'seed-int-5', type: 'Document', details: 'Offer paperwork prepared', daysAgo: 5, clientId: 'seed-client-3', userId: realtor4.id },
    { id: 'seed-int-6', type: 'Call', details: 'Counter-offer discussion', daysAgo: 4, clientId: 'seed-client-3', userId: realtor4.id },
    { id: 'seed-int-7', type: 'Email', details: 'Sent proposal details', daysAgo: 10, clientId: 'seed-client-4', userId: realtor3.id },
    { id: 'seed-int-8', type: 'Meeting', details: 'Final walk-through', daysAgo: 2, clientId: 'seed-client-5', userId: realtor.id },
  ];
  for (const interaction of seedInteractions) {
    await prisma.interaction.upsert({
      where: { id: interaction.id },
      update: {
        type: interaction.type,
        details: interaction.details,
        date: new Date(Date.now() - interaction.daysAgo * 86400000),
        clientId: interaction.clientId,
        userId: interaction.userId,
      },
      create: {
        id: interaction.id,
        type: interaction.type,
        details: interaction.details,
        date: new Date(Date.now() - interaction.daysAgo * 86400000),
        clientId: interaction.clientId,
        userId: interaction.userId,
      },
    });
  }

  await prisma.notification.upsert({
    where: { id: 'seed-notif-1' },
    update: { message: WELCOME_NOTIFICATION, type: 'SYSTEM', userId: admin.id, read: false },
    create: { id: 'seed-notif-1', message: WELCOME_NOTIFICATION, type: 'SYSTEM', userId: admin.id, read: false },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-2' },
    update: {
      message: '[Broadcast] Weekly pipeline review due Friday 2pm',
      type: 'SYSTEM',
      userId: realtor.id,
      fromUserId: broker.id,
      read: false,
    },
    create: {
      id: 'seed-notif-2',
      message: '[Broadcast] Weekly pipeline review due Friday 2pm',
      type: 'SYSTEM',
      userId: realtor.id,
      fromUserId: broker.id,
      read: false,
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-3' },
    update: {
      message: 'Hi, I have a client interested in the 3BR listing. Can we schedule a viewing?',
      type: 'MESSAGE',
      userId: broker.id,
      fromUserId: realtor2.id,
      read: false,
      flagged: false,
    },
    create: {
      id: 'seed-notif-3',
      message: 'Hi, I have a client interested in the 3BR listing. Can we schedule a viewing?',
      type: 'MESSAGE',
      userId: broker.id,
      fromUserId: realtor2.id,
      read: false,
      flagged: false,
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-4' },
    update: {
      message: 'Listing approved: seed-listing-awaiting-mls-1 is ready for MLS filing.',
      type: 'APPROVAL',
      userId: realtor3.id,
      fromUserId: broker2.id,
      read: false,
    },
    create: {
      id: 'seed-notif-4',
      message: 'Listing approved: seed-listing-awaiting-mls-1 is ready for MLS filing.',
      type: 'APPROVAL',
      userId: realtor3.id,
      fromUserId: broker2.id,
      read: false,
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-5' },
    update: {
      message: 'New interaction logged on client Olivia Carter (Call).',
      type: 'INTERACTION',
      userId: broker.id,
      read: true,
    },
    create: {
      id: 'seed-notif-5',
      message: 'New interaction logged on client Olivia Carter (Call).',
      type: 'INTERACTION',
      userId: broker.id,
      read: true,
    },
  });
  await prisma.notification.upsert({
    where: { id: 'seed-notif-6' },
    update: {
      message: 'Your saved search "Barrie — 3BR under $850k" has new matches (seed data).',
      type: 'SYSTEM',
      userId: consumer.id,
      read: false,
    },
    create: {
      id: 'seed-notif-6',
      message: 'Your saved search "Barrie — 3BR under $850k" has new matches (seed data).',
      type: 'SYSTEM',
      userId: consumer.id,
      read: false,
    },
  });

  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: admin.id, listingId: 'mock-1' } },
    update: {},
    create: { userId: admin.id, listingId: 'mock-1' },
  });
  await prisma.favorite.upsert({
    where: { userId_listingId: { userId: consumer.id, listingId: 'mock-2' } },
    update: {},
    create: { userId: consumer.id, listingId: 'mock-2' },
  });

  const workloadSeed: Array<{
    id: string;
    title: string;
    details: string;
    priority: number;
    status: AssignmentStatus;
    dueInDays: number;
    brokerId: string;
    realtorId: string;
    assignedById: string;
    clientId: string | null;
    listingId: string | null;
  }> = [
    { id: 'seed-assign-1', title: 'Follow up with Olivia', details: 'Confirm weekend showing availability', priority: 4, status: 'OPEN', dueInDays: 2, brokerId: broker.id, realtorId: realtor.id, assignedById: broker.id, clientId: 'seed-client-1', listingId: 'mock-2' },
    { id: 'seed-assign-2', title: 'Prepare offer package', details: 'Review clauses with buyer', priority: 5, status: 'IN_PROGRESS', dueInDays: 1, brokerId: broker.id, realtorId: realtor4.id, assignedById: broker.id, clientId: 'seed-client-3', listingId: 'mock-7' },
    { id: 'seed-assign-3', title: 'Revive stale lead', details: 'Call and send shortlist', priority: 3, status: 'BLOCKED', dueInDays: 3, brokerId: broker2.id, realtorId: realtor5.id, assignedById: broker2.id, clientId: 'seed-client-6', listingId: null },
    { id: 'seed-assign-4', title: 'Schedule closing prep', details: 'Coordinate legal and inspection docs', priority: 2, status: 'DONE', dueInDays: -1, brokerId: broker.id, realtorId: realtor2.id, assignedById: broker.id, clientId: 'seed-client-2', listingId: 'mock-14' },
  ];
  for (const assignment of workloadSeed) {
    await prisma.workloadAssignment.upsert({
      where: { id: assignment.id },
      update: {
        title: assignment.title,
        details: assignment.details,
        priority: assignment.priority,
        status: assignment.status,
        dueAt: new Date(Date.now() + assignment.dueInDays * 86400000),
        brokerId: assignment.brokerId,
        realtorId: assignment.realtorId,
        assignedById: assignment.assignedById,
        clientId: assignment.clientId,
        listingId: assignment.listingId,
      },
      create: {
        id: assignment.id,
        title: assignment.title,
        details: assignment.details,
        priority: assignment.priority,
        status: assignment.status,
        dueAt: new Date(Date.now() + assignment.dueInDays * 86400000),
        brokerId: assignment.brokerId,
        realtorId: assignment.realtorId,
        assignedById: assignment.assignedById,
        clientId: assignment.clientId,
        listingId: assignment.listingId,
      },
    });
  }

  await prisma.commsTemplate.upsert({
    where: { id: 'seed-template-1' },
    update: { brokerId: broker.id, name: 'Weekly KPI Review', body: 'Please update your weekly KPI notes before Friday 2pm.' },
    create: { id: 'seed-template-1', brokerId: broker.id, name: 'Weekly KPI Review', body: 'Please update your weekly KPI notes before Friday 2pm.' },
  });
  await prisma.commsTemplate.upsert({
    where: { id: 'seed-template-2' },
    update: { brokerId: broker.id, name: 'Approval Queue Reminder', body: 'Pending approval queue is high. Prioritize status updates today.' },
    create: { id: 'seed-template-2', brokerId: broker.id, name: 'Approval Queue Reminder', body: 'Pending approval queue is high. Prioritize status updates today.' },
  });
  await prisma.brokerBroadcast.upsert({
    where: { id: 'seed-broadcast-1' },
    update: {
      brokerId: broker.id,
      teamId: IDS.team1,
      templateId: 'seed-template-1',
      sentById: broker.id,
      subject: 'Friday KPI checkpoint',
      message: 'Please publish your weekly KPI snapshot by 2pm Friday.',
    },
    create: {
      id: 'seed-broadcast-1',
      brokerId: broker.id,
      teamId: IDS.team1,
      templateId: 'seed-template-1',
      sentById: broker.id,
      subject: 'Friday KPI checkpoint',
      message: 'Please publish your weekly KPI snapshot by 2pm Friday.',
    },
  });
  await prisma.brokerBroadcast.upsert({
    where: { id: 'seed-broadcast-2' },
    update: {
      brokerId: broker.id,
      teamId: null,
      templateId: null,
      sentById: broker.id,
      subject: 'Open house weekend push',
      message: 'All teams: prioritize follow-up with leads from Saturday open houses.',
    },
    create: {
      id: 'seed-broadcast-2',
      brokerId: broker.id,
      teamId: null,
      templateId: null,
      sentById: broker.id,
      subject: 'Open house weekend push',
      message: 'All teams: prioritize follow-up with leads from Saturday open houses.',
    },
  });

  await prisma.config.upsert({
    where: { key: 'app_name' },
    update: { value: 'Pinkaroo' },
    create: { key: 'app_name', value: 'Pinkaroo' },
  });
  await prisma.config.upsert({
    where: { key: 'feature_broker_workload' },
    update: { value: 'true' },
    create: { key: 'feature_broker_workload', value: 'true' },
  });
  await prisma.config.upsert({
    where: { key: 'notifications_rate_limit_per_min' },
    update: { value: '25' },
    create: { key: 'notifications_rate_limit_per_min', value: '25' },
  });
  await prisma.config.upsert({
    where: { key: 'role_permissions' },
    update: {
      value: JSON.stringify({
        SYSTEM_ADMIN: ['*'],
        OFFICE_ADMIN: ['manage:brokers', 'manage:realtors', 'view:operational_dashboards'],
        BROKER: ['manage:teams', 'manage:assignments', 'approve:listings'],
        REALTOR: ['manage:own_clients', 'manage:own_listings'],
        USER: ['browse:listings'],
      }),
    },
    create: {
      key: 'role_permissions',
      value: JSON.stringify({
        SYSTEM_ADMIN: ['*'],
        OFFICE_ADMIN: ['manage:brokers', 'manage:realtors', 'view:operational_dashboards'],
        BROKER: ['manage:teams', 'manage:assignments', 'approve:listings'],
        REALTOR: ['manage:own_clients', 'manage:own_listings'],
        USER: ['browse:listings'],
      }),
    },
  });

  const auditSeed = [
    { id: 'seed-audit-1', actorId: admin.id, brokerId: null, action: 'SYSTEM_SETTING_UPDATED', entityType: 'Config', entityId: 'app_name', details: { key: 'app_name', value: 'Pinkaroo' } },
    { id: 'seed-audit-2', actorId: officeAdmin.id, brokerId: broker.id, action: 'BROKER_ASSIGNMENT_UPDATED', entityType: 'User', entityId: realtor.id, details: { realtorId: realtor.id, brokerId: broker.id } },
    { id: 'seed-audit-3', actorId: broker.id, brokerId: broker.id, action: 'ASSIGNMENT_REBALANCED', entityType: 'WorkloadAssignment', entityId: 'seed-assign-1', details: { reason: 'load balancing' } },
    { id: 'seed-audit-4', actorId: broker.id, brokerId: broker.id, action: 'BROADCAST_SENT', entityType: 'BrokerBroadcast', entityId: 'seed-broadcast-1', details: { teamId: IDS.team1 } },
  ];
  for (const audit of auditSeed) {
    await prisma.auditLog.upsert({
      where: { id: audit.id },
      update: {
        actorId: audit.actorId,
        brokerId: audit.brokerId,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId,
        details: audit.details as object,
      },
      create: {
        id: audit.id,
        actorId: audit.actorId,
        brokerId: audit.brokerId,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId,
        details: audit.details as object,
      },
    });
  }

  await prisma.client.deleteMany({ where: { email: 'client@example.com' } });

  console.log(
    'Seeded live-like dataset (draft + awaiting-MLS listings, saved searches, supporting docs on mock-1, APPROVAL/INTERACTION notifications, teams, clients, workload, comms, config, audit).'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
