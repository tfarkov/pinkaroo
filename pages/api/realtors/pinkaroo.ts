import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getMockPinkarooTeam } from '../../../lib/mockData';
import { requireMethod } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/** Public: returns brokers and realtors belonging to Pinkaroo Real Estate (random order). */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  try {
    const broker = await prisma.user.findFirst({
      where: { role: 'BROKER', name: { contains: 'Pinkaroo' } },
    });
    if (!broker) {
      const team = getMockPinkarooTeam();
      return res.json(team);
    }

    const realtors = await prisma.user.findMany({
      where: { brokerId: broker.id, role: 'REALTOR' },
      include: { broker: { select: { id: true, name: true } } },
    });

    const team = [
      { ...broker, broker: null },
      ...realtors,
    ];
    const shuffled = [...team].sort(() => Math.random() - 0.5);
    return res.json(shuffled);
  } catch (err) {
    console.error('[api/realtors/pinkaroo]', err);
    if (!res.headersSent) res.json(getMockPinkarooTeam());
  }
}
