import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient, type Province, type ListingStatus } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';
import {
  applyRateLimit,
  isSafeId,
  parseBoolean,
  parseFiniteInt,
  parseFiniteNumber,
  parseString,
  requireAuth,
  requireMethod,
  requireRole,
  sendError,
} from '../../../lib/apiHelpers';
import { geocodeAddress } from '../../../lib/geocode';
import { computeEcoRatingScore } from '../../../lib/ecoRating';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import os from 'os';
import { unlink } from 'fs/promises';

const prisma = new PrismaClient();
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});
const LISTING_MUTABLE_FIELDS = new Set([
  'title',
  'description',
  'price',
  'location',
  'province',
  'postalCode',
  'sizeSqm',
  'bedroomsTotal',
  'bathroomsTotal',
  'propertyType',
  'latitude',
  'longitude',
  'images',
  'streetAddress',
  'unitNumber',
  'yearBuilt',
  'lotSizeSqm',
  'heatingType',
  'insulationQuality',
  'hasRecentRenovations',
  'roofAgeYears',
  'appliancesAgeYears',
]);
const LISTING_PRIVILEGED_MUTABLE_FIELDS = new Set(['status', 'rejectionReason']);
const LISTING_PROTECTED_FIELDS = new Set(['id', 'userId', 'approvedBy', 'approvedAt', 'createdAt', 'updatedAt']);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  const session = await getSession(req, res);
  if (!requireAuth(res, session)) return;
  try {
  if (req.method === 'GET') {
    const page = parseFiniteInt(req.query.page, { min: 0 }) ?? 0;
    const filters = req.query;
    const where: Record<string, unknown> = {};
    const mine = filters.mine === '1' || filters.mine === 'true';
    if (mine) where.userId = session.user.id;
    if (filters.province && typeof filters.province === 'string') where.province = filters.province;
    const city = parseString(filters.city, { maxLength: 80, allowEmpty: true }) ?? undefined;
    if (city) where.location = { contains: city };
    const minPrice = parseFiniteNumber(filters.minPrice, { min: 0 });
    const maxPrice = parseFiniteNumber(filters.maxPrice, { min: 0 });
    if (minPrice != null || maxPrice != null) {
      where.price = { ...(minPrice != null && { gte: minPrice }), ...(maxPrice != null && { lte: maxPrice }) };
    }
    const bedrooms = parseFiniteInt(filters.bedrooms, { min: 1, max: 20 });
    const bathrooms = parseFiniteInt(filters.bathrooms, { min: 1, max: 20 });
    if (bedrooms != null) where.bedroomsTotal = { gte: bedrooms };
    if (bathrooms != null) where.bathroomsTotal = { gte: bathrooms };
    if (filters.propertyType && typeof filters.propertyType === 'string') where.propertyType = filters.propertyType;
    if (mine && filters.status && typeof filters.status === 'string' && filters.status.trim()) {
      where.status = filters.status.trim();
    }
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
    if (!requireRole(res, role, ['REALTOR', 'BROKER', 'OFFICE_ADMIN', 'SYSTEM_ADMIN'])) return;
    if (!applyRateLimit(req, res, 'listings-create', { max: 20, windowMs: 60_000 })) return;
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      sendError(res, 503, 'Image upload service unavailable');
      return;
    }
    await new Promise<void>((resolve, reject) => upload.array('images')(req as any, res as any, (err) => {
      if (err) reject(err);
      else resolve();
    }));
    const files = (req as { files?: Express.Multer.File[] }).files ?? [];
    const rawBody = (req as { body?: Record<string, unknown> }).body ?? {};
    const uploadedImages: string[] = [];
    try {
      for (const file of files as Express.Multer.File[]) {
        const result = await cloudinary.uploader.upload(file.path, {
          transformation: [{ width: 800, quality: 80, format: 'auto' }],
          secure: true,
        });
        uploadedImages.push(result.secure_url);
      }
    } finally {
      await Promise.all((files as Express.Multer.File[]).map(async (file) => {
        try {
          await unlink(file.path);
        } catch {
          // best-effort temp cleanup
        }
      }));
    }

    const draftIdRaw = rawBody.draftId != null ? String(rawBody.draftId).trim() : '';
    const submitForApproval = parseBoolean(rawBody.submitForApproval) === true;
    const isNewDraft = parseBoolean(rawBody.isDraft) === true;

    const mergeDraftImages = (existingImages: unknown): string[] => {
      const prev = Array.isArray(existingImages)
        ? (existingImages as unknown[]).filter((u): u is string => typeof u === 'string')
        : [];
      if (uploadedImages.length > 0) return [...prev, ...uploadedImages];
      return prev;
    };

    if (draftIdRaw && isSafeId(draftIdRaw)) {
      const existingDraft = await prisma.listing.findFirst({
        where: { id: draftIdRaw, userId: session.user.id, status: 'DRAFT' },
      });
      if (!existingDraft) {
        sendError(res, 404, 'Draft not found');
        return;
      }
      const province = ((rawBody.province as string) ?? 'ONTARIO') as Province;
      const images = mergeDraftImages(existingDraft.images);

      if (submitForApproval) {
        const title = parseString(rawBody.title, { maxLength: 160 });
        const description = parseString(rawBody.description, { maxLength: 5000 });
        const location = parseString(rawBody.location, { maxLength: 180 });
        const price = parseFiniteNumber(rawBody.price, { min: 0, max: 100_000_000 });
        if (!title || !description || !location || price == null || price < 1) {
          sendError(res, 422, 'Invalid listing payload');
          return;
        }
        let latitude = parseFiniteNumber(rawBody.latitude, { min: -90, max: 90 });
        let longitude = parseFiniteNumber(rawBody.longitude, { min: -180, max: 180 });
        if ((latitude == null || longitude == null) && location) {
          const geocoded = await geocodeAddress(location);
          if (geocoded) {
            latitude = geocoded.lat;
            longitude = geocoded.lng;
          }
        }
        const nextStatus = (role === 'REALTOR' ? 'PENDING' : 'ACTIVE') as ListingStatus;
        const submitData = {
          title,
          description,
          price,
          location,
          province,
          postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
          sizeSqm: parseFiniteNumber(rawBody.sizeSqm, { min: 0 }),
          bedroomsTotal: parseFiniteInt(rawBody.bedroomsTotal, { min: 0, max: 20 }) ?? null,
          bathroomsTotal: parseFiniteInt(rawBody.bathroomsTotal, { min: 0, max: 20 }) ?? null,
          propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
          latitude,
          longitude,
          images,
          status: nextStatus,
          streetAddress: rawBody.streetAddress != null ? String(rawBody.streetAddress).trim() || null : undefined,
          yearBuilt: parseFiniteInt(rawBody.yearBuilt, { min: 1800, max: 2100 }) ?? undefined,
          lotSizeSqm: parseFiniteNumber(rawBody.lotSizeSqm, { min: 0 }) ?? undefined,
          heatingType: rawBody.heatingType != null && String(rawBody.heatingType).trim() ? String(rawBody.heatingType).trim() : null,
          insulationQuality: rawBody.insulationQuality != null && String(rawBody.insulationQuality).trim() ? String(rawBody.insulationQuality).trim() : null,
          hasRecentRenovations: parseBoolean(rawBody.hasRecentRenovations) ?? undefined,
          roofAgeYears: parseFiniteInt(rawBody.roofAgeYears, { min: 0, max: 200 }) ?? null,
          appliancesAgeYears: parseFiniteInt(rawBody.appliancesAgeYears, { min: 0, max: 100 }) ?? null,
        };
        const ecoSubmit = computeEcoRatingScore({
          yearBuilt: submitData.yearBuilt ?? undefined,
          heatingType: submitData.heatingType ?? undefined,
          insulationQuality: submitData.insulationQuality ?? undefined,
          hasRecentRenovations: submitData.hasRecentRenovations ?? undefined,
          roofAgeYears: submitData.roofAgeYears ?? undefined,
          appliancesAgeYears: submitData.appliancesAgeYears ?? undefined,
        });
        const listing = await prisma.listing.update({
          where: { id: draftIdRaw },
          data: { ...submitData, ecoRatingScore: ecoSubmit ?? null },
        });
        const ioSubmit = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
        if (role === 'REALTOR' && nextStatus === 'PENDING' && ioSubmit) {
          const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { brokerId: true } });
          if (user?.brokerId) ioSubmit.to(user.brokerId).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_LISTING_PENDING, id: listing.id });
        }
        res.json(listing);
        return;
      }

      const t = parseString(rawBody.title, { maxLength: 160, allowEmpty: true });
      const title = t && t.length > 0 ? t : '(Draft)';
      const d = parseString(rawBody.description, { maxLength: 5000, allowEmpty: true });
      const description = d && d.length > 0 ? d : 'Add a description before publishing.';
      const l = parseString(rawBody.location, { maxLength: 180, allowEmpty: true });
      const location = l && l.length > 0 ? l : 'TBD';
      const price = parseFiniteNumber(rawBody.price, { min: 0, max: 100_000_000 }) ?? 0;
      let latitude = parseFiniteNumber(rawBody.latitude, { min: -90, max: 90 });
      let longitude = parseFiniteNumber(rawBody.longitude, { min: -180, max: 180 });
      if ((latitude == null || longitude == null) && location && location !== 'TBD') {
        const geocoded = await geocodeAddress(location);
        if (geocoded) {
          latitude = geocoded.lat;
          longitude = geocoded.lng;
        }
      }
      const draftSaveData = {
        title,
        description,
        price,
        location,
        province,
        postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
        sizeSqm: parseFiniteNumber(rawBody.sizeSqm, { min: 0 }),
        bedroomsTotal: parseFiniteInt(rawBody.bedroomsTotal, { min: 0, max: 20 }) ?? null,
        bathroomsTotal: parseFiniteInt(rawBody.bathroomsTotal, { min: 0, max: 20 }) ?? null,
        propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
        latitude,
        longitude,
        images,
        status: 'DRAFT' as ListingStatus,
        streetAddress: rawBody.streetAddress != null ? String(rawBody.streetAddress).trim() || null : undefined,
        yearBuilt: parseFiniteInt(rawBody.yearBuilt, { min: 1800, max: 2100 }) ?? undefined,
        lotSizeSqm: parseFiniteNumber(rawBody.lotSizeSqm, { min: 0 }) ?? undefined,
        heatingType: rawBody.heatingType != null && String(rawBody.heatingType).trim() ? String(rawBody.heatingType).trim() : null,
        insulationQuality: rawBody.insulationQuality != null && String(rawBody.insulationQuality).trim() ? String(rawBody.insulationQuality).trim() : null,
        hasRecentRenovations: parseBoolean(rawBody.hasRecentRenovations) ?? undefined,
        roofAgeYears: parseFiniteInt(rawBody.roofAgeYears, { min: 0, max: 200 }) ?? null,
        appliancesAgeYears: parseFiniteInt(rawBody.appliancesAgeYears, { min: 0, max: 100 }) ?? null,
      };
      const ecoDraft = computeEcoRatingScore({
        yearBuilt: draftSaveData.yearBuilt ?? undefined,
        heatingType: draftSaveData.heatingType ?? undefined,
        insulationQuality: draftSaveData.insulationQuality ?? undefined,
        hasRecentRenovations: draftSaveData.hasRecentRenovations ?? undefined,
        roofAgeYears: draftSaveData.roofAgeYears ?? undefined,
        appliancesAgeYears: draftSaveData.appliancesAgeYears ?? undefined,
      });
      const updatedDraft = await prisma.listing.update({
        where: { id: draftIdRaw },
        data: { ...draftSaveData, ecoRatingScore: ecoDraft ?? null },
      });
      res.json(updatedDraft);
      return;
    }

    if (isNewDraft) {
      const t = parseString(rawBody.title, { maxLength: 160, allowEmpty: true });
      const title = t && t.length > 0 ? t : '(Draft)';
      const d = parseString(rawBody.description, { maxLength: 5000, allowEmpty: true });
      const description = d && d.length > 0 ? d : 'Add a description before publishing.';
      const l = parseString(rawBody.location, { maxLength: 180, allowEmpty: true });
      const location = l && l.length > 0 ? l : 'TBD';
      const price = parseFiniteNumber(rawBody.price, { min: 0, max: 100_000_000 }) ?? 0;
      const province = ((rawBody.province as string) ?? 'ONTARIO') as Province;
      let latitude = parseFiniteNumber(rawBody.latitude, { min: -90, max: 90 });
      let longitude = parseFiniteNumber(rawBody.longitude, { min: -180, max: 180 });
      if ((latitude == null || longitude == null) && location && location !== 'TBD') {
        const geocoded = await geocodeAddress(location);
        if (geocoded) {
          latitude = geocoded.lat;
          longitude = geocoded.lng;
        }
      }
      const draftImages = uploadedImages.length
        ? uploadedImages
        : Array.isArray(rawBody.images)
          ? rawBody.images.filter((v): v is string => typeof v === 'string')
          : [];
      const newDraftData = {
        title,
        description,
        price,
        location,
        province,
        postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
        sizeSqm: parseFiniteNumber(rawBody.sizeSqm, { min: 0 }),
        bedroomsTotal: parseFiniteInt(rawBody.bedroomsTotal, { min: 0, max: 20 }) ?? null,
        bathroomsTotal: parseFiniteInt(rawBody.bathroomsTotal, { min: 0, max: 20 }) ?? null,
        propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
        latitude,
        longitude,
        images: draftImages,
        userId: session.user.id,
        status: 'DRAFT' as ListingStatus,
        streetAddress: rawBody.streetAddress != null ? String(rawBody.streetAddress).trim() || null : undefined,
        yearBuilt: parseFiniteInt(rawBody.yearBuilt, { min: 1800, max: 2100 }) ?? undefined,
        lotSizeSqm: parseFiniteNumber(rawBody.lotSizeSqm, { min: 0 }) ?? undefined,
        heatingType: rawBody.heatingType != null && String(rawBody.heatingType).trim() ? String(rawBody.heatingType).trim() : null,
        insulationQuality: rawBody.insulationQuality != null && String(rawBody.insulationQuality).trim() ? String(rawBody.insulationQuality).trim() : null,
        hasRecentRenovations: parseBoolean(rawBody.hasRecentRenovations) ?? undefined,
        roofAgeYears: parseFiniteInt(rawBody.roofAgeYears, { min: 0, max: 200 }) ?? null,
        appliancesAgeYears: parseFiniteInt(rawBody.appliancesAgeYears, { min: 0, max: 100 }) ?? null,
      };
      const ecoNew = computeEcoRatingScore({
        yearBuilt: newDraftData.yearBuilt ?? undefined,
        heatingType: newDraftData.heatingType ?? undefined,
        insulationQuality: newDraftData.insulationQuality ?? undefined,
        hasRecentRenovations: newDraftData.hasRecentRenovations ?? undefined,
        roofAgeYears: newDraftData.roofAgeYears ?? undefined,
        appliancesAgeYears: newDraftData.appliancesAgeYears ?? undefined,
      });
      const draftListing = await prisma.listing.create({
        data: { ...newDraftData, ecoRatingScore: ecoNew ?? null },
      });
      res.json(draftListing);
      return;
    }

    const title = parseString(rawBody.title, { maxLength: 160 });
    const description = parseString(rawBody.description, { maxLength: 5000 });
    const location = parseString(rawBody.location, { maxLength: 180 });
    const price = parseFiniteNumber(rawBody.price, { min: 0, max: 100_000_000 });
    if (!title || !description || !location || price == null) {
      sendError(res, 422, 'Invalid listing payload');
      return;
    }
    const province = ((rawBody.province as string) ?? 'ONTARIO') as Province;
    const status = (role === 'REALTOR' ? 'PENDING' : 'ACTIVE') as ListingStatus;
    let latitude = parseFiniteNumber(rawBody.latitude, { min: -90, max: 90 });
    let longitude = parseFiniteNumber(rawBody.longitude, { min: -180, max: 180 });
    const locationStr = location;
    if ((latitude == null || longitude == null) && locationStr) {
      const geocoded = await geocodeAddress(locationStr);
      if (geocoded) {
        latitude = geocoded.lat;
        longitude = geocoded.lng;
      }
    }
    const data = {
      title,
      description,
      price,
      location,
      province,
      postalCode: rawBody.postalCode != null ? String(rawBody.postalCode) : null,
      sizeSqm: parseFiniteNumber(rawBody.sizeSqm, { min: 0 }),
      bedroomsTotal: parseFiniteInt(rawBody.bedroomsTotal, { min: 0, max: 20 }) ?? null,
      bathroomsTotal: parseFiniteInt(rawBody.bathroomsTotal, { min: 0, max: 20 }) ?? null,
      propertyType: rawBody.propertyType != null ? String(rawBody.propertyType) : null,
      latitude,
      longitude,
      images: uploadedImages.length ? uploadedImages : (Array.isArray(rawBody.images) ? rawBody.images.filter((v): v is string => typeof v === 'string') : []),
      userId: session.user.id,
      status,
      streetAddress: rawBody.streetAddress != null ? String(rawBody.streetAddress).trim() || null : undefined,
      yearBuilt: parseFiniteInt(rawBody.yearBuilt, { min: 1800, max: 2100 }) ?? undefined,
      lotSizeSqm: parseFiniteNumber(rawBody.lotSizeSqm, { min: 0 }) ?? undefined,
      heatingType: rawBody.heatingType != null && String(rawBody.heatingType).trim() ? String(rawBody.heatingType).trim() : null,
      insulationQuality: rawBody.insulationQuality != null && String(rawBody.insulationQuality).trim() ? String(rawBody.insulationQuality).trim() : null,
      hasRecentRenovations: parseBoolean(rawBody.hasRecentRenovations) ?? undefined,
      roofAgeYears: parseFiniteInt(rawBody.roofAgeYears, { min: 0, max: 200 }) ?? null,
      appliancesAgeYears: parseFiniteInt(rawBody.appliancesAgeYears, { min: 0, max: 100 }) ?? null,
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
    if (!applyRateLimit(req, res, 'listings-update', { max: 40, windowMs: 60_000 })) return;
    const { id, ...updateData } = (req.body ?? {}) as Record<string, unknown> & { id?: string };
    if (!isSafeId(id)) {
      sendError(res, 400, 'id is required');
      return;
    }
    const existingListing = await prisma.listing.findUnique({ where: { id }, select: { userId: true } });
    if (!existingListing) {
      sendError(res, 404, 'Listing not found');
      return;
    }
    const userRole = session.user.role;
    const canManageAnyListing = userRole === 'SYSTEM_ADMIN' || userRole === 'OFFICE_ADMIN' || userRole === 'BROKER';
    if (!canManageAnyListing && existingListing.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    const allowedFields = new Set([
      ...LISTING_MUTABLE_FIELDS,
      ...(canManageAnyListing ? [...LISTING_PRIVILEGED_MUTABLE_FIELDS] : []),
    ]);
    const keys = Object.keys(updateData);
    if (keys.length === 0) {
      sendError(res, 400, 'No fields provided');
      return;
    }
    for (const key of keys) {
      if (LISTING_PROTECTED_FIELDS.has(key)) {
        sendError(res, 403, `Field '${key}' cannot be updated`);
        return;
      }
      if (!allowedFields.has(key)) {
        sendError(res, 422, `Field '${key}' is not allowed`);
        return;
      }
    }
    const sanitized: Record<string, unknown> = {};
    if (updateData.title !== undefined) {
      const parsed = parseString(updateData.title, { maxLength: 160 });
      if (!parsed) {
        sendError(res, 422, 'Invalid title');
        return;
      }
      sanitized.title = parsed;
    }
    if (updateData.description !== undefined) {
      const parsed = parseString(updateData.description, { maxLength: 5000 });
      if (!parsed) {
        sendError(res, 422, 'Invalid description');
        return;
      }
      sanitized.description = parsed;
    }
    if (updateData.price !== undefined) {
      const parsed = parseFiniteNumber(updateData.price, { min: 0, max: 100_000_000 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid price');
        return;
      }
      sanitized.price = parsed;
    }
    if (updateData.location !== undefined) {
      const parsed = parseString(updateData.location, { maxLength: 180 });
      if (!parsed) {
        sendError(res, 422, 'Invalid location');
        return;
      }
      sanitized.location = parsed;
    }
    if (updateData.province !== undefined) {
      const parsed = parseString(updateData.province, { maxLength: 64 });
      if (!parsed) {
        sendError(res, 422, 'Invalid province');
        return;
      }
      sanitized.province = parsed;
    }
    if (updateData.postalCode !== undefined) {
      sanitized.postalCode = updateData.postalCode == null ? null : String(updateData.postalCode).trim() || null;
    }
    if (updateData.sizeSqm !== undefined) {
      const parsed = parseFiniteNumber(updateData.sizeSqm, { min: 0 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid sizeSqm');
        return;
      }
      sanitized.sizeSqm = parsed;
    }
    if (updateData.bedroomsTotal !== undefined) {
      const parsed = parseFiniteInt(updateData.bedroomsTotal, { min: 0, max: 20 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid bedroomsTotal');
        return;
      }
      sanitized.bedroomsTotal = parsed;
    }
    if (updateData.bathroomsTotal !== undefined) {
      const parsed = parseFiniteInt(updateData.bathroomsTotal, { min: 0, max: 20 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid bathroomsTotal');
        return;
      }
      sanitized.bathroomsTotal = parsed;
    }
    if (updateData.propertyType !== undefined) {
      sanitized.propertyType = updateData.propertyType == null ? null : String(updateData.propertyType).trim() || null;
    }
    if (updateData.latitude !== undefined) {
      const parsed = parseFiniteNumber(updateData.latitude, { min: -90, max: 90 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid latitude');
        return;
      }
      sanitized.latitude = parsed;
    }
    if (updateData.longitude !== undefined) {
      const parsed = parseFiniteNumber(updateData.longitude, { min: -180, max: 180 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid longitude');
        return;
      }
      sanitized.longitude = parsed;
    }
    if (updateData.images !== undefined) {
      if (!Array.isArray(updateData.images) || updateData.images.some((value) => typeof value !== 'string' || !value.trim())) {
        sendError(res, 422, 'Invalid images');
        return;
      }
      sanitized.images = updateData.images;
    }
    if (updateData.streetAddress !== undefined) {
      sanitized.streetAddress = updateData.streetAddress == null ? null : String(updateData.streetAddress).trim() || null;
    }
    if (updateData.unitNumber !== undefined) {
      sanitized.unitNumber = updateData.unitNumber == null ? null : String(updateData.unitNumber).trim() || null;
    }
    if (updateData.yearBuilt !== undefined) {
      const parsed = parseFiniteInt(updateData.yearBuilt, { min: 1800, max: 2100 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid yearBuilt');
        return;
      }
      sanitized.yearBuilt = parsed;
    }
    if (updateData.lotSizeSqm !== undefined) {
      const parsed = parseFiniteNumber(updateData.lotSizeSqm, { min: 0 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid lotSizeSqm');
        return;
      }
      sanitized.lotSizeSqm = parsed;
    }
    if (updateData.heatingType !== undefined) {
      sanitized.heatingType = updateData.heatingType == null ? null : String(updateData.heatingType).trim() || null;
    }
    if (updateData.insulationQuality !== undefined) {
      sanitized.insulationQuality = updateData.insulationQuality == null ? null : String(updateData.insulationQuality).trim() || null;
    }
    if (updateData.hasRecentRenovations !== undefined) {
      const parsed = parseBoolean(updateData.hasRecentRenovations);
      if (parsed == null) {
        sendError(res, 422, 'Invalid hasRecentRenovations');
        return;
      }
      sanitized.hasRecentRenovations = parsed;
    }
    if (updateData.roofAgeYears !== undefined) {
      const parsed = parseFiniteInt(updateData.roofAgeYears, { min: 0, max: 200 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid roofAgeYears');
        return;
      }
      sanitized.roofAgeYears = parsed;
    }
    if (updateData.appliancesAgeYears !== undefined) {
      const parsed = parseFiniteInt(updateData.appliancesAgeYears, { min: 0, max: 100 });
      if (parsed == null) {
        sendError(res, 422, 'Invalid appliancesAgeYears');
        return;
      }
      sanitized.appliancesAgeYears = parsed;
    }
    if (updateData.status !== undefined) {
      if (!canManageAnyListing) {
        sendError(res, 403, 'status can only be updated by broker or admin');
        return;
      }
      const parsed = parseString(updateData.status, { maxLength: 32 });
      if (!parsed || !['DRAFT', 'ACTIVE', 'PENDING', 'APPROVED', 'REJECTED'].includes(parsed)) {
        sendError(res, 422, 'Invalid status');
        return;
      }
      sanitized.status = parsed;
    }
    if (updateData.rejectionReason !== undefined) {
      if (!canManageAnyListing) {
        sendError(res, 403, 'rejectionReason can only be updated by broker or admin');
        return;
      }
      sanitized.rejectionReason = updateData.rejectionReason == null ? null : parseString(updateData.rejectionReason, { maxLength: 2000, allowEmpty: true });
    }
    const locationStr = typeof sanitized.location === 'string' ? sanitized.location.trim() : '';
    const hasLat = sanitized.latitude != null && !Number.isNaN(Number(sanitized.latitude));
    const hasLng = sanitized.longitude != null && !Number.isNaN(Number(sanitized.longitude));
    if (locationStr && (!hasLat || !hasLng)) {
      const geocoded = await geocodeAddress(locationStr);
      if (geocoded) {
        sanitized.latitude = geocoded.lat;
        sanitized.longitude = geocoded.lng;
      }
    }
    const ecoKeys = ['yearBuilt', 'heatingType', 'insulationQuality', 'hasRecentRenovations', 'roofAgeYears', 'appliancesAgeYears'];
    const hasEcoChange = ecoKeys.some((k) => sanitized[k] !== undefined);
    if (hasEcoChange) {
      const existing = await prisma.listing.findUnique({ where: { id }, select: { yearBuilt: true, heatingType: true, insulationQuality: true, hasRecentRenovations: true, roofAgeYears: true, appliancesAgeYears: true } });
      const y = sanitized.yearBuilt !== undefined ? (sanitized.yearBuilt as number) : existing?.yearBuilt ?? undefined;
      const ht = sanitized.heatingType !== undefined ? (sanitized.heatingType as string | null) : existing?.heatingType ?? undefined;
      const iq = sanitized.insulationQuality !== undefined ? (sanitized.insulationQuality as string | null) : existing?.insulationQuality ?? undefined;
      const ren = sanitized.hasRecentRenovations !== undefined ? (sanitized.hasRecentRenovations as boolean | null) : existing?.hasRecentRenovations ?? undefined;
      const roof = sanitized.roofAgeYears !== undefined ? (sanitized.roofAgeYears as number | null) : existing?.roofAgeYears ?? undefined;
      const app = sanitized.appliancesAgeYears !== undefined ? (sanitized.appliancesAgeYears as number | null) : existing?.appliancesAgeYears ?? undefined;
      const ecoScore = computeEcoRatingScore({ yearBuilt: y ?? null, heatingType: ht ?? null, insulationQuality: iq ?? null, hasRecentRenovations: ren ?? null, roofAgeYears: roof ?? null, appliancesAgeYears: app ?? null });
      sanitized.ecoRatingScore = ecoScore ?? null;
    }
    const updated = await prisma.listing.update({ where: { id }, data: sanitized });
    res.json(updated);
    return;
  }
  if (req.method === 'DELETE') {
    if (!applyRateLimit(req, res, 'listings-delete', { max: 30, windowMs: 60_000 })) return;
    const { id } = req.body ?? {};
    if (!isSafeId(id)) {
      sendError(res, 400, 'id is required');
      return;
    }
    const existingListing = await prisma.listing.findUnique({ where: { id }, select: { userId: true } });
    if (!existingListing) {
      sendError(res, 404, 'Listing not found');
      return;
    }
    const userRole = session.user.role;
    const canManageAnyListing = userRole === 'SYSTEM_ADMIN' || userRole === 'OFFICE_ADMIN' || userRole === 'BROKER';
    if (!canManageAnyListing && existingListing.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
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
