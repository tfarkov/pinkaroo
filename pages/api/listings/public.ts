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
  const bedrooms = parseInt(req.query.bedrooms as string, 10);
  const bathrooms = parseInt(req.query.bathrooms as string, 10);
  const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined;
  const city = typeof req.query.city === 'string' ? req.query.city.trim() : undefined;

  const where: Record<string, unknown> = {
    status: { in: ['ACTIVE', 'APPROVED'] },
  };
  if (province) where.province = province;
  if (city) where.location = { contains: city };
  if (!isNaN(minPrice) && minPrice > 0) where.price = { ...((where.price as object) || {}), gte: minPrice };
  if (!isNaN(maxPrice) && maxPrice > 0) where.price = { ...((where.price as object) || {}), lte: maxPrice };
  if (!isNaN(bedrooms) && bedrooms > 0) where.bedroomsTotal = { gte: bedrooms };
  if (!isNaN(bathrooms) && bathrooms > 0) where.bathroomsTotal = { gte: bathrooms };
  if (propertyType) where.propertyType = propertyType;

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
