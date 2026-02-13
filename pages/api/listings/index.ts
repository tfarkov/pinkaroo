import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();
const upload = multer({ dest: '/tmp' });
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 0;
    const filters = req.query;
    const where: Record<string, unknown> = {};
    if (filters.province && typeof filters.province === 'string') where.province = filters.province;
    const minPrice = parseFloat(filters.minPrice as string);
    const maxPrice = parseFloat(filters.maxPrice as string);
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      where.price = { ...(!isNaN(minPrice) && { gte: minPrice }), ...(!isNaN(maxPrice) && { lte: maxPrice }) };
    }
    const listings = await prisma.listing.findMany({
      skip: page * 20,
      take: 20,
      where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
      select: { id: true, title: true, price: true, sizeSqm: true },
    });
    res.json({ listings, nextPage: listings.length === 20 ? page + 1 : null });
  } else if (req.method === 'POST') {
    await new Promise<void>((resolve, reject) => upload.array('images')(req as any, res as any, (err) => {
      if (err) reject(err);
      else resolve();
    }));
    const files = (req as { files?: Express.Multer.File[] }).files ?? [];
    const images = await Promise.all(files.map(async file => {
      const result = await cloudinary.uploader.upload(file.path, { transformation: [{ width: 800, quality: 80, format: 'auto' }], secure: true });
      return result.secure_url;
    }));
    const data = req.body;
    data.images = images;
    data.userId = session.user.id;
    data.status = session.user.role === 'REALTOR' ? 'PENDING' : 'ACTIVE';
    const listing = await prisma.listing.create({ data });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (session.user.role === 'REALTOR' && io) {
      const brokerId = (session.user as { brokerId?: string }).brokerId;
      if (brokerId) io.to(brokerId).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_LISTING_PENDING, id: listing.id });
    }
    res.json(listing);
  } else if (req.method === 'PUT') {
    const { id, ...updateData } = req.body;
    const updated = await prisma.listing.update({ where: { id }, data: updateData });
    res.json(updated);
  } else if (req.method === 'DELETE') {
    const { id } = req.body;
    await prisma.listing.delete({ where: { id } });
    res.status(204).end();
  }
}
