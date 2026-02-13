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
  const session = await getSession(req, res);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 0;
    const filters = req.query;
    const where: Record<string, unknown> = {};
    if (filters.province && typeof filters.province === 'string') where.province = filters.province;
    const city = typeof filters.city === 'string' ? filters.city.trim() : undefined;
    if (city) where.location = { contains: city };
    const minPrice = parseFloat(filters.minPrice as string);
    const maxPrice = parseFloat(filters.maxPrice as string);
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      where.price = { ...(!isNaN(minPrice) && { gte: minPrice }), ...(!isNaN(maxPrice) && { lte: maxPrice }) };
    }
    const bedrooms = parseInt(filters.bedrooms as string, 10);
    const bathrooms = parseInt(filters.bathrooms as string, 10);
    if (!isNaN(bedrooms) && bedrooms > 0) where.bedroomsTotal = { gte: bedrooms };
    if (!isNaN(bathrooms) && bathrooms > 0) where.bathroomsTotal = { gte: bathrooms };
    if (filters.propertyType && typeof filters.propertyType === 'string') where.propertyType = filters.propertyType;
    const listings = await prisma.listing.findMany({
      skip: page * 20,
      take: 20,
      where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
    });
    res.json({ listings, nextPage: listings.length === 20 ? page + 1 : null });
  } else if (req.method === 'POST') {
    const role = session.user.role;
    if (role !== 'REALTOR' && role !== 'BROKER' && role !== 'ADMIN') {
      return res.status(403).json({ error: API_MESSAGES.FORBIDDEN });
    }
    await new Promise<void>((resolve, reject) => upload.array('images')(req as any, res as any, (err) => {
      if (err) reject(err);
      else resolve();
    }));
    const files = (req as { files?: Express.Multer.File[] }).files ?? [];
    const rawBody = (req as { body?: Record<string, unknown> }).body ?? {};
    const num = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
    const images = await Promise.all((files as Express.Multer.File[]).map(async file => {
      const result = await cloudinary.uploader.upload(file.path, { transformation: [{ width: 800, quality: 80, format: 'auto' }], secure: true });
      return result.secure_url;
    }));
    const data = {
      title: String(rawBody.title ?? ''),
      description: String(rawBody.description ?? ''),
      price: num(rawBody.price) ?? 0,
      location: String(rawBody.location ?? ''),
      province: (rawBody.province as string) ?? 'ONTARIO',
      postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
      sizeSqm: num(rawBody.sizeSqm),
      bedroomsTotal: num(rawBody.bedroomsTotal) ?? null,
      bathroomsTotal: num(rawBody.bathroomsTotal) ?? null,
      propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
      latitude: num(rawBody.latitude) ?? null,
      longitude: num(rawBody.longitude) ?? null,
      images: images.length ? images : (rawBody.images as string[] | undefined) ?? [],
      userId: session.user.id,
      status: role === 'REALTOR' ? 'PENDING' : 'ACTIVE',
    };
    const listing = await prisma.listing.create({ data });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (role === 'REALTOR' && io) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { brokerId: true } });
      if (user?.brokerId) io.to(user.brokerId).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_LISTING_PENDING, id: listing.id });
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
