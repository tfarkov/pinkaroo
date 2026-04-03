import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, DEFAULT_NEARBY_RADIUS_KM, KM_PER_DEGREE_APPROX } from '../../../lib/constants';
import { parseQueryNum } from '../../../lib/utils/parse';
import { requireMethod, sendError } from '../../../lib/apiHelpers';
import { distanceKm } from '../../../lib/utils/geo';

const prisma = new PrismaClient();

/** 1 degree latitude ≈ 111 km everywhere. Longitude degree length depends on latitude. */
function boundingBoxDeltas(
  lat: number,
  radiusKm: number
): { deltaLat: number; deltaLng: number } {
  const deltaLat = radiusKm / KM_PER_DEGREE_APPROX;
  const latRad = (lat * Math.PI) / 180;
  const kmPerDegLng = KM_PER_DEGREE_APPROX * Math.max(0.01, Math.cos(latRad));
  const deltaLng = radiusKm / kmPerDegLng;
  return { deltaLat, deltaLng };
}

/**
 * GET /api/listings/nearby
 * Returns listings within radius (km) of lat/lng. No auth. Only ACTIVE/APPROVED with MLS id (published inventory).
 * Haversine filter with indexed lat/lng (Prisma); default radius 50km. Client should
 * pass user location or fallback (e.g. Barrie, ON) when geolocation is unavailable.
 * Query: lat, lng, radius (optional), plus filter params (province, minPrice, etc.).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const lat = parseQueryNum(req.query.lat);
  const lng = parseQueryNum(req.query.lng);
  const radius = parseQueryNum(req.query.radius) ?? DEFAULT_NEARBY_RADIUS_KM;
  if (lat == null || lng == null) {
    sendError(res, 400, API_MESSAGES.LAT_LNG_REQUIRED);
    return;
  }

  const { deltaLat, deltaLng } = boundingBoxDeltas(lat, radius);
  const q = req.query;

  const where: Record<string, unknown> = {
    status: { in: ['ACTIVE', 'APPROVED'] },
    mlsId: { not: null },
    latitude: { gte: lat - deltaLat, lte: lat + deltaLat },
    longitude: { gte: lng - deltaLng, lte: lng + deltaLng },
  };

  const province = typeof q.province === 'string' && q.province.trim() ? q.province.trim() : undefined;
  if (province) where.province = province;

  const minPrice = parseQueryNum(q.minPrice);
  const maxPrice = parseQueryNum(q.maxPrice);
  if (minPrice != null && minPrice > 0) where.price = { ...((where.price as object) || {}), gte: minPrice };
  if (maxPrice != null && maxPrice > 0) where.price = { ...((where.price as object) || {}), lte: maxPrice };

  const bedrooms = parseQueryNum(q.bedrooms);
  const bathrooms = parseQueryNum(q.bathrooms);
  if (bedrooms != null && bedrooms > 0) where.bedroomsTotal = { gte: bedrooms };
  if (bathrooms != null && bathrooms > 0) where.bathroomsTotal = { gte: bathrooms };

  const propertyType = typeof q.propertyType === 'string' && q.propertyType.trim() ? q.propertyType.trim() : undefined;
  if (propertyType) where.propertyType = propertyType;

  try {
    const center = { lat, lng };
    const listings = await prisma.listing.findMany({
      where: where as Parameters<typeof prisma.listing.findMany>[0]['where'],
    });
    // Filter to listings actually within radius (bounding box includes corners outside circle)
    const withinRadius = listings.filter((l) => {
      if (l.latitude == null || l.longitude == null) return false;
      return distanceKm(center, { lat: Number(l.latitude), lng: Number(l.longitude) }) <= radius;
    });
    // Build plain serializable objects (ensure numbers for lat/lng)
    const payload = withinRadius.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      price: l.price,
      location: l.location,
      province: l.province,
      postalCode: l.postalCode,
      sizeSqm: l.sizeSqm,
      bedroomsTotal: l.bedroomsTotal,
      bathroomsTotal: l.bathroomsTotal,
      propertyType: l.propertyType,
      latitude: l.latitude != null ? Number(l.latitude) : null,
      longitude: l.longitude != null ? Number(l.longitude) : null,
      images: l.images,
      mlsId: l.mlsId,
      status: l.status,
      userId: l.userId,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
      streetAddress: l.streetAddress ?? null,
      unitNumber: l.unitNumber ?? null,
      yearBuilt: l.yearBuilt ?? null,
      lotSizeSqm: l.lotSizeSqm ?? null,
      standardStatus: l.standardStatus ?? null,
      halfBathroomsTotal: l.halfBathroomsTotal ?? null,
      buildingLevelTotal: l.buildingLevelTotal ?? null,
      mlsLastUpdated: l.mlsLastUpdated ?? null,
      mlsData: l.mlsData ?? null,
      ecoRatingScore: l.ecoRatingScore ?? null,
      heatingType: l.heatingType ?? null,
      insulationQuality: l.insulationQuality ?? null,
      hasRecentRenovations: l.hasRecentRenovations ?? null,
      roofAgeYears: l.roofAgeYears ?? null,
      appliancesAgeYears: l.appliancesAgeYears ?? null,
    }));
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[api/listings/nearby]', err);
    if (!res.headersSent) sendError(res, 500, 'Failed to fetch nearby listings');
  }
}
