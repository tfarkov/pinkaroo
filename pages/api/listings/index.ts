import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient, type Province, type ListingStatus } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';
import { geocodeAddress } from '../../../lib/geocode';
import { computeEcoRatingScore } from '../../../lib/ecoRating';
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
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const num = (v: unknown) => (v === '' || v == null ? undefined : Number(v));
  const bool = (v: unknown): boolean | undefined => {
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    return undefined;
  };
  try {
  if (req.method === 'GET') {
    const page = parseInt(req.query.page as string) || 0;
    const filters = req.query;
    const where: Record<string, unknown> = {};
    const mine = filters.mine === '1' || filters.mine === 'true';
    if (mine) where.userId = session.user.id;
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
    const PAGE_SIZE = 10;
    const listings = await prisma.listing.findMany({
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
    });
    res.json({ listings, nextPage: listings.length === PAGE_SIZE ? page + 1 : null });
    return;
  }
  if (req.method === 'POST') {
    const role = session.user.role;
    if (role !== 'REALTOR' && role !== 'BROKER' && role !== 'ADMIN') {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    await new Promise<void>((resolve, reject) => upload.array('images')(req as any, res as any, (err) => {
      if (err) reject(err);
      else resolve();
    }));
    const files = (req as { files?: Express.Multer.File[] }).files ?? [];
    const rawBody = (req as { body?: Record<string, unknown> }).body ?? {};
    const images = await Promise.all((files as Express.Multer.File[]).map(async file => {
      const result = await cloudinary.uploader.upload(file.path, { transformation: [{ width: 800, quality: 80, format: 'auto' }], secure: true });
      return result.secure_url;
    }));
    const province = ((rawBody.province as string) ?? 'ONTARIO') as Province;
    const status = (role === 'REALTOR' ? 'PENDING' : 'ACTIVE') as ListingStatus;
    let latitude = num(rawBody.latitude) ?? null;
    let longitude = num(rawBody.longitude) ?? null;
    const locationStr = String(rawBody.location ?? '').trim();
    if ((latitude == null || longitude == null) && locationStr) {
      const geocoded = await geocodeAddress(locationStr);
      if (geocoded) {
        latitude = geocoded.lat;
        longitude = geocoded.lng;
      }
    }
    const data = {
      title: String(rawBody.title ?? ''),
      description: String(rawBody.description ?? ''),
      price: num(rawBody.price) ?? 0,
      location: String(rawBody.location ?? ''),
      province,
      postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
      sizeSqm: num(rawBody.sizeSqm),
      bedroomsTotal: num(rawBody.bedroomsTotal) ?? null,
      bathroomsTotal: num(rawBody.bathroomsTotal) ?? null,
      propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
      latitude,
      longitude,
      images: images.length ? images : (rawBody.images as string[] | undefined) ?? [],
      userId: session.user.id,
      status,
      streetAddress: rawBody.streetAddress != null ? String(rawBody.streetAddress).trim() || null : undefined,
      yearBuilt: num(rawBody.yearBuilt) ?? undefined,
      lotSizeSqm: num(rawBody.lotSizeSqm) ?? undefined,
      heatingType: rawBody.heatingType != null && String(rawBody.heatingType).trim() ? String(rawBody.heatingType).trim() : null,
      insulationQuality: rawBody.insulationQuality != null && String(rawBody.insulationQuality).trim() ? String(rawBody.insulationQuality).trim() : null,
      hasRecentRenovations: bool(rawBody.hasRecentRenovations),
      roofAgeYears: num(rawBody.roofAgeYears) ?? null,
      appliancesAgeYears: num(rawBody.appliancesAgeYears) ?? null,
    };
    const ecoScore = computeEcoRatingScore({
      yearBuilt: data.yearBuilt ?? undefined,
      heatingType: data.heatingType ?? undefined,
      insulationQuality: data.insulationQuality ?? undefined,
      hasRecentRenovations: data.hasRecentRenovations ?? undefined,
      roofAgeYears: data.roofAgeYears ?? undefined,
      appliancesAgeYears: data.appliancesAgeYears ?? undefined,
    });
    (data as Record<string, unknown>).ecoRatingScore = ecoScore ?? null;
    const listing = await prisma.listing.create({ data });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (role === 'REALTOR' && io) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { brokerId: true } });
      if (user?.brokerId) io.to(user.brokerId).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_LISTING_PENDING, id: listing.id });
    }
    res.json(listing);
    return;
  }
  if (req.method === 'PUT') {
    const { id, ...updateData } = (req.body ?? {}) as Record<string, unknown> & { id?: string };
    if (!id || typeof id !== 'string') {
      sendError(res, 400, 'id is required');
      return;
    }
    const locationStr = typeof updateData.location === 'string' ? updateData.location.trim() : '';
    const hasLat = updateData.latitude != null && !Number.isNaN(Number(updateData.latitude));
    const hasLng = updateData.longitude != null && !Number.isNaN(Number(updateData.longitude));
    if (locationStr && (!hasLat || !hasLng)) {
      const geocoded = await geocodeAddress(locationStr);
      if (geocoded) {
        updateData.latitude = geocoded.lat;
        updateData.longitude = geocoded.lng;
      }
    }
    const ecoKeys = ['yearBuilt', 'heatingType', 'insulationQuality', 'hasRecentRenovations', 'roofAgeYears', 'appliancesAgeYears'];
    const hasEcoChange = ecoKeys.some((k) => updateData[k] !== undefined);
    if (hasEcoChange) {
      const existing = await prisma.listing.findUnique({ where: { id }, select: { yearBuilt: true, heatingType: true, insulationQuality: true, hasRecentRenovations: true, roofAgeYears: true, appliancesAgeYears: true } });
      const y = updateData.yearBuilt !== undefined ? num(updateData.yearBuilt) : existing?.yearBuilt ?? undefined;
      const ht = updateData.heatingType !== undefined ? (updateData.heatingType != null && String(updateData.heatingType).trim() ? String(updateData.heatingType).trim() : null) : existing?.heatingType ?? undefined;
      const iq = updateData.insulationQuality !== undefined ? (updateData.insulationQuality != null && String(updateData.insulationQuality).trim() ? String(updateData.insulationQuality).trim() : null) : existing?.insulationQuality ?? undefined;
      const ren = updateData.hasRecentRenovations !== undefined ? bool(updateData.hasRecentRenovations) : existing?.hasRecentRenovations ?? undefined;
      const roof = updateData.roofAgeYears !== undefined ? num(updateData.roofAgeYears) : existing?.roofAgeYears ?? undefined;
      const app = updateData.appliancesAgeYears !== undefined ? num(updateData.appliancesAgeYears) : existing?.appliancesAgeYears ?? undefined;
      const ecoScore = computeEcoRatingScore({ yearBuilt: y ?? null, heatingType: ht ?? null, insulationQuality: iq ?? null, hasRecentRenovations: ren ?? null, roofAgeYears: roof ?? null, appliancesAgeYears: app ?? null });
      updateData.ecoRatingScore = ecoScore ?? null;
    }
    const updated = await prisma.listing.update({ where: { id }, data: updateData });
    res.json(updated);
    return;
  }
  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id || typeof id !== 'string') {
      sendError(res, 400, 'id is required');
      return;
    }
    await prisma.listing.delete({ where: { id } });
    res.status(204).end();
  }
  } catch (err) {
    console.error('[api/listings]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
