import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const favorites = await prisma.favorite.findMany({ where: { userId: session.user.id }, include: { listing: true } });
    res.json(favorites);
  } else if (req.method === 'POST') {
    const { listingId } = req.body;
    const existing = await prisma.favorite.findUnique({ where: { userId_listingId: { userId: session.user.id, listingId } } });
    if (existing) return res.status(400).json({ error: API_MESSAGES.ALREADY_FAVORITED });
    const favorite = await prisma.favorite.create({ data: { userId: session.user.id, listingId } });
    res.json(favorite);
  } else if (req.method === 'DELETE') {
    const { listingId } = req.body;
    await prisma.favorite.delete({ where: { userId_listingId: { userId: session.user.id, listingId } } });
    res.status(204).end();
  }
}
