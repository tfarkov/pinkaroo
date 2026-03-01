import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * GET /api/listings/[id]
 * Public single listing by id (no auth). Only ACTIVE/APPROVED listings are returned.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const id = typeof req.query.id === 'string' ? req.query.id.trim() : undefined;
  if (!id) {
    sendError(res, 400, 'Listing id is required');
    return;
  }
  /** "new" is a reserved path for the add-listing page, not a listing id. */
  if (id === 'new') {
    sendError(res, 400, 'Invalid listing id');
    return;
  }
  try {
    const listing = await prisma.listing.findFirst({
      where: {
        id,
        status: { in: ['ACTIVE', 'APPROVED'] },
      },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      province: listing.province,
      postalCode: listing.postalCode,
      sizeSqm: listing.sizeSqm,
      bedroomsTotal: listing.bedroomsTotal,
      bathroomsTotal: listing.bathroomsTotal,
      propertyType: listing.propertyType,
      latitude: listing.latitude != null ? Number(listing.latitude) : null,
      longitude: listing.longitude != null ? Number(listing.longitude) : null,
      images: listing.images,
      mlsId: listing.mlsId,
      status: listing.status,
      userId: listing.userId,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      streetAddress: listing.streetAddress ?? null,
      unitNumber: listing.unitNumber ?? null,
      yearBuilt: listing.yearBuilt ?? null,
      lotSizeSqm: listing.lotSizeSqm ?? null,
      standardStatus: listing.standardStatus ?? null,
      halfBathroomsTotal: listing.halfBathroomsTotal ?? null,
      buildingLevelTotal: listing.buildingLevelTotal ?? null,
      mlsLastUpdated: listing.mlsLastUpdated ?? null,
      mlsData: listing.mlsData ?? null,
      ecoRatingScore: listing.ecoRatingScore ?? null,
      heatingType: listing.heatingType ?? null,
      insulationQuality: listing.insulationQuality ?? null,
      hasRecentRenovations: listing.hasRecentRenovations ?? null,
      roofAgeYears: listing.roofAgeYears ?? null,
      appliancesAgeYears: listing.appliancesAgeYears ?? null,
    });
  } catch (err) {
    console.error('[api/listings/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
