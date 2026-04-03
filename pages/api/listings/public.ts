import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { parseQueryNum, parseQueryInt } from '../../../lib/utils/parse';
import { requireMethod, sendError } from '../../../lib/apiHelpers';
import { buildPublicListingWhere } from '../../../lib/listings/buildPublicListingWhere';

const prisma = new PrismaClient();
const PAGE_SIZE = 10;

/**
 * GET /api/listings/public
 * Public paginated listings (no auth). ACTIVE/APPROVED with MLS id (synced inventory only).
 * Query: page, province, city, minPrice, maxPrice, bedrooms, bathrooms, propertyType.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  try {
    const page = Math.max(0, parseQueryInt(req.query.page) ?? 0);
    const province = typeof req.query.province === 'string' ? req.query.province : undefined;
    const minPrice = parseQueryNum(req.query.minPrice);
    const maxPrice = parseQueryNum(req.query.maxPrice);
    const bedrooms = parseQueryInt(req.query.bedrooms);
    const bathrooms = parseQueryInt(req.query.bathrooms);
    const propertyType = typeof req.query.propertyType === 'string' ? req.query.propertyType : undefined;
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : undefined;

    const where = buildPublicListingWhere({
      province,
      city,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      propertyType,
    });

    const rows = await prisma.listing.findMany({
      where,
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { updatedAt: 'desc' },
    });

    // Build plain JSON-safe objects; ensure ecoRatingScore is always a number or null for client
    const listings = rows.map((l) => {
      const eco = l.ecoRatingScore != null ? Number(l.ecoRatingScore) : null;
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        price: Number(l.price),
        location: l.location,
        province: l.province,
        postalCode: l.postalCode,
        sizeSqm: l.sizeSqm != null ? Number(l.sizeSqm) : null,
        bedroomsTotal: l.bedroomsTotal,
        bathroomsTotal: l.bathroomsTotal,
        propertyType: l.propertyType,
        latitude: l.latitude != null ? Number(l.latitude) : null,
        longitude: l.longitude != null ? Number(l.longitude) : null,
        images: l.images,
        status: l.status,
        userId: l.userId,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        streetAddress: l.streetAddress ?? null,
        unitNumber: l.unitNumber ?? null,
        yearBuilt: l.yearBuilt ?? null,
        lotSizeSqm: l.lotSizeSqm != null ? Number(l.lotSizeSqm) : null,
        standardStatus: l.standardStatus ?? null,
        halfBathroomsTotal: l.halfBathroomsTotal ?? null,
        buildingLevelTotal: l.buildingLevelTotal ?? null,
        mlsId: l.mlsId ?? null,
        ecoRatingScore: eco,
        heatingType: l.heatingType ?? null,
        insulationQuality: l.insulationQuality ?? null,
        hasRecentRenovations: l.hasRecentRenovations ?? null,
        roofAgeYears: l.roofAgeYears ?? null,
        appliancesAgeYears: l.appliancesAgeYears ?? null,
      };
    });

    res.json({
      listings,
      nextPage: listings.length === PAGE_SIZE ? page + 1 : null,
    });
  } catch (err) {
    console.error('[api/listings/public]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
