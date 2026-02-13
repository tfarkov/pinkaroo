import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PAGE_SIZE = 20;

/** Public paginated listings (no auth). Only ACTIVE/APPROVED for homepage browse. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const page = Math.max(0, parseInt(req.query.page as string) || 0);
  const province = typeof req.query.province === 'string' ? req.query.province : undefined;
  const minPrice = parseFloat(req.query.minPrice as string);
  const maxPrice = parseFloat(req.query.maxPrice as string);

  const where: Record<string, unknown> = {
    status: { in: ['ACTIVE', 'APPROVED'] },
  };
  if (province) where.province = province;
  if (!isNaN(minPrice) && minPrice > 0) where.price = { ...((where.price as object) || {}), gte: minPrice };
  if (!isNaN(maxPrice) && maxPrice > 0) where.price = { ...((where.price as object) || {}), lte: maxPrice };

  const listings = await prisma.listing.findMany({
    where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
    skip: page * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    listings,
    nextPage: listings.length === PAGE_SIZE ? page + 1 : null,
  });
}
