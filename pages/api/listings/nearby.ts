import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, DEFAULT_NEARBY_RADIUS_KM, KM_PER_DEGREE_APPROX } from '../../../lib/constants';

const prisma = new PrismaClient();

const kmToDeg = (km: number) => km / KM_PER_DEGREE_APPROX;

function parseNum(val: string | string[] | undefined): number | undefined {
  if (val == null || val === '') return undefined;
  const n = typeof val === 'string' ? parseFloat(val) : parseFloat(String(val[0]));
  return isNaN(n) ? undefined : n;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || DEFAULT_NEARBY_RADIUS_KM;
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: API_MESSAGES.LAT_LNG_REQUIRED });

  const delta = kmToDeg(radius);
  const q = req.query;

  const where: Record<string, unknown> = {
    latitude: { gte: lat - delta, lte: lat + delta },
    longitude: { gte: lng - delta, lte: lng + delta },
  };

  const province = typeof q.province === 'string' && q.province.trim() ? q.province.trim() : undefined;
  if (province) where.province = province;

  const minPrice = parseNum(q.minPrice as string);
  const maxPrice = parseNum(q.maxPrice as string);
  if (minPrice != null && minPrice > 0) where.price = { ...((where.price as object) || {}), gte: minPrice };
  if (maxPrice != null && maxPrice > 0) where.price = { ...((where.price as object) || {}), lte: maxPrice };

  const bedrooms = parseNum(q.bedrooms as string);
  const bathrooms = parseNum(q.bathrooms as string);
  if (bedrooms != null && bedrooms > 0) where.bedroomsTotal = { gte: bedrooms };
  if (bathrooms != null && bathrooms > 0) where.bathroomsTotal = { gte: bathrooms };

  const propertyType = typeof q.propertyType === 'string' && q.propertyType.trim() ? q.propertyType.trim() : undefined;
  if (propertyType) where.propertyType = propertyType;

  const listings = await prisma.listing.findMany({
    where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
  });
  res.json(listings);
}
