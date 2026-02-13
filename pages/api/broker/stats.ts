import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session || session.user.role !== 'BROKER') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  const teamMembers = await prisma.user.findMany({ where: { brokerId: session.user.id } });
  const teamCount = teamMembers.length;
  const listings = await prisma.listing.count({ where: { userId: { in: teamMembers.map(m => m.id) } } });
  const pending = await prisma.listing.count({ where: { userId: { in: teamMembers.map(m => m.id) }, status: 'PENDING' } });
  const approved = await prisma.listing.count({ where: { userId: { in: teamMembers.map(m => m.id) }, status: 'APPROVED' } });
  const rejected = await prisma.listing.count({ where: { userId: { in: teamMembers.map(m => m.id) }, status: 'REJECTED' } });
  // Revenue example (assume from sold listings)
  const revenue = [100000, 200000 /* monthly data */];
  const months = ['Jan', 'Feb'];
  res.json({ teamCount, listings, pending, approved, rejected, realtors: teamMembers, revenue, months });
}
