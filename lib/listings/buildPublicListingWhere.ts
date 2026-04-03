import type { Prisma } from '@prisma/client';
import { PROVINCES } from '../constants';

function parseNum(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function parseIntFilter(v: unknown): number | undefined {
  const n = parseNum(v);
  return n != null && n > 0 ? Math.floor(n) : undefined;
}

export type PublicListingFilterInput = Record<string, unknown>;

/**
 * Where clause for public-facing listings: ACTIVE/APPROVED and synced from MLS (`mlsId` set).
 * Broker-approved drafts stay internal until office files them on MLS and sync ingests the record.
 */
export function buildPublicListingWhere(
  filters: PublicListingFilterInput,
  extras?: { updatedAfter?: Date }
): Prisma.ListingWhereInput {
  const province = typeof filters.province === 'string' && filters.province.trim() ? filters.province : undefined;
  const city = typeof filters.city === 'string' ? filters.city.trim() : undefined;
  const minPrice = parseNum(filters.minPrice);
  const maxPrice = parseNum(filters.maxPrice);
  const bedrooms = parseIntFilter(filters.bedrooms);
  const bathrooms = parseIntFilter(filters.bathrooms);
  const propertyType =
    typeof filters.propertyType === 'string' && filters.propertyType.trim() ? filters.propertyType : undefined;

  const where: Prisma.ListingWhereInput = {
    status: { in: ['ACTIVE', 'APPROVED'] },
    mlsId: { not: null },
  };

  if (province && (PROVINCES as readonly string[]).includes(province)) {
    where.province = province as (typeof PROVINCES)[number];
  }
  if (city) where.location = { contains: city };
  if (minPrice != null && minPrice > 0) where.price = { ...((where.price as object) || {}), gte: minPrice };
  if (maxPrice != null && maxPrice > 0) where.price = { ...((where.price as object) || {}), lte: maxPrice };
  if (bedrooms != null && bedrooms > 0) where.bedroomsTotal = { gte: bedrooms };
  if (bathrooms != null && bathrooms > 0) where.bathroomsTotal = { gte: bathrooms };
  if (propertyType) where.propertyType = propertyType;

  if (extras?.updatedAfter) {
    where.updatedAt = { gt: extras.updatedAfter };
  }

  return where;
}
