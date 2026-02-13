import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, DEFAULT_NEARBY_RADIUS_KM, KM_PER_DEGREE_APPROX } from '../../../lib/constants';

const prisma = new PrismaClient();

const kmToDeg = (km: number) => km / KM_PER_DEGREE_APPROX;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || DEFAULT_NEARBY_RADIUS_KM;
  if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: API_MESSAGES.LAT_LNG_REQUIRED });

  const delta = kmToDeg(radius);
  const listings = await prisma.listing.findMany({
    where: {
      latitude: { gte: lat - delta, lte: lat + delta },
      longitude: { gte: lng - delta, lte: lng + delta },
    },
  });
  res.json(listings);
}
