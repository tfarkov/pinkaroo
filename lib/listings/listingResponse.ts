import type { Listing } from '@prisma/client';

/** JSON shape returned by GET /api/listings/[id] (and similar). */
export function listingToPublicJson(listing: Listing) {
  const eco = listing.ecoRatingScore != null ? Number(listing.ecoRatingScore) : null;
  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: Number(listing.price),
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
    lotSizeSqm: listing.lotSizeSqm != null ? Number(listing.lotSizeSqm) : null,
    standardStatus: listing.standardStatus ?? null,
    halfBathroomsTotal: listing.halfBathroomsTotal ?? null,
    buildingLevelTotal: listing.buildingLevelTotal ?? null,
    mlsLastUpdated: listing.mlsLastUpdated ?? null,
    mlsData: listing.mlsData ?? null,
    ecoRatingScore: eco,
    heatingType: listing.heatingType ?? null,
    insulationQuality: listing.insulationQuality ?? null,
    hasRecentRenovations: listing.hasRecentRenovations ?? null,
    roofAgeYears: listing.roofAgeYears ?? null,
    appliancesAgeYears: listing.appliancesAgeYears ?? null,
  };
}
