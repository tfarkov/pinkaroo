import axios from 'axios';
import { attach as attachRetry } from 'retry-axios';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from './email';
import { ADMIN_EMAIL, DEFAULT_BROKER_ID, DEFAULT_LOCATION, DEFAULT_PROVINCE, EMAIL_SUBJECTS, type Province } from './constants';

const prisma = new PrismaClient();
attachRetry(axios);

export async function getAccessToken() {
  try {
    const response = await axios.post('https://auth.crea.ca/connect/token', new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.CREA_CLIENT_ID,
      client_secret: process.env.CREA_CLIENT_SECRET,
      scope: 'DdfApi',
    }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (response.status !== 200) throw new Error('Token fetch failed');
    return response.data.access_token;
  } catch (error) {
    console.error('Token error:', error);
    sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_TOKEN_ERROR, (error as Error).message).catch((e) => console.error('Email failed', e));
    throw error;
  }
}

/** Build OData $filter for CREA DDF Property API (see CREA DDF documentation). */
export function buildMLSFilter(params: Record<string, string | number | undefined>): string {
  const clauses: string[] = [];
  const esc = (s: string) => `'${String(s).replace(/'/g, "''")}'`;

  /* Only filter by status when explicitly set and not 'Any'; leave unfiltered when unsupplied */
  if (params.standardStatus && params.standardStatus !== 'Any') {
    clauses.push(`StandardStatus eq ${esc(params.standardStatus as string)}`);
  }
  if (params.province) clauses.push(`StateOrProvince eq ${esc(params.province as string)}`);
  if (params.city) clauses.push(`City eq ${esc((params.city as string).trim())}`);
  if (params.postalCode) {
    const pc = String(params.postalCode).trim().toUpperCase();
    if (pc.length >= 3) clauses.push(`startswith(PostalCode,${esc(pc.substring(0, 3))})`);
  }
  const minPrice = typeof params.minPrice === 'number' ? params.minPrice : parseInt(String(params.minPrice || ''), 10);
  if (!isNaN(minPrice) && minPrice > 0) clauses.push(`ListPrice ge ${minPrice}`);
  const maxPrice = typeof params.maxPrice === 'number' ? params.maxPrice : parseInt(String(params.maxPrice || ''), 10);
  if (!isNaN(maxPrice) && maxPrice > 0) clauses.push(`ListPrice le ${maxPrice}`);
  const minSize = typeof params.minSize === 'number' ? params.minSize : parseFloat(String(params.minSize || ''));
  if (!isNaN(minSize) && minSize > 0) clauses.push(`LivingArea ge ${minSize}`);
  const maxSize = typeof params.maxSize === 'number' ? params.maxSize : parseFloat(String(params.maxSize || ''));
  if (!isNaN(maxSize) && maxSize > 0) clauses.push(`LivingArea le ${maxSize}`);
  const bedrooms = typeof params.bedrooms === 'number' ? params.bedrooms : parseInt(String(params.bedrooms || ''), 10);
  if (!isNaN(bedrooms) && bedrooms > 0) clauses.push(`BedroomsTotal ge ${bedrooms}`);
  const bathrooms = typeof params.bathrooms === 'number' ? params.bathrooms : parseInt(String(params.bathrooms || ''), 10);
  if (!isNaN(bathrooms) && bathrooms > 0) clauses.push(`BathroomsTotalInteger ge ${bathrooms}`);
  if (params.propertyType) clauses.push(`PropertyType eq ${esc(params.propertyType as string)}`);

  return clauses.join(' and ');
}

export async function searchMLS(filter: string) {
  const token = await getAccessToken();
  try {
    const url = `https://ddfapi.crea.ca/v1/Property?$filter=${encodeURIComponent(filter)}&$top=50`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.value;
  } catch (error) {
    if (error.response?.status === 429) {
      // Rate limit handling
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simple wait, but exponential in retry
      throw error; // Retry will handle
    }
    console.error('Search error:', error);
    sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_SEARCH_ERROR, (error as Error).message).catch((e) => console.error('Email failed', e));
    throw error;
  }
}

/** Parse MLS LastUpdated (ISO string or similar) to Date or null. */
function parseMLSDate(v: unknown): Date | null {
  if (v == null) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Map CREA DDF Property payload to Listing create/update data (shared by import and sync). */
export function mlsDataToListingFields(mlsData: any, defaults: { userId: string; status: 'PENDING' | 'ACTIVE' }) {
  const streetAddress =
    mlsData.UnparsedAddress?.trim() ||
    [mlsData.StreetNumber, mlsData.StreetDirPrefix, mlsData.StreetName, mlsData.StreetDirSuffix, mlsData.StreetSuffix]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    mlsData.StreetAddress?.trim() ||
    null;
  const lotSizeSource =
    mlsData.LandSize != null
      ? 'LandSize'
      : mlsData.LotSize != null
        ? 'LotSize'
        : mlsData.LotSizeSqFt != null
          ? 'LotSizeSqFt'
          : null;
  const lotRaw = parseFloat(lotSizeSource ? mlsData[lotSizeSource] : '');
  // CREA may send lot in sqft; if value is large assume sqft and convert to sqm
  const lotSizeSqm = Number.isFinite(lotRaw)
    ? lotSizeSource === 'LotSizeSqFt' || lotRaw > 10000
      ? lotRaw * 0.09290304
      : lotRaw
    : null;
  return {
    title: (mlsData.StandardStatus && mlsData.PropertyType ? mlsData.StandardStatus + ' ' + mlsData.PropertyType : mlsData.Title) || 'Listing',
    description: mlsData.PublicRemarks || mlsData.Remarks || '',
    price: parseFloat(mlsData.ListPrice) || 0,
    location: mlsData.City || mlsData.UnparsedAddress?.split(',')[0]?.trim() || '',
    province: (mlsData.StateOrProvince || DEFAULT_PROVINCE) as Province,
    postalCode: mlsData.PostalCode ?? null,
    sizeSqm: parseFloat(mlsData.LivingArea) || null,
    bedroomsTotal: parseInt(mlsData.BedroomsTotal, 10) || null,
    bathroomsTotal: parseInt(mlsData.BathroomsTotalInteger, 10) || null,
    propertyType: mlsData.PropertyType ?? null,
    latitude: parseFloat(mlsData.Latitude) || DEFAULT_LOCATION.lat,
    longitude: parseFloat(mlsData.Longitude) || DEFAULT_LOCATION.lng,
    images: Array.isArray(mlsData.Media) ? mlsData.Media.map((m: any) => m.MediaURL || m.Url).filter(Boolean) : [],
    mlsId: mlsData.ListingKey ?? null,
    status: defaults.status,
    userId: defaults.userId,
    streetAddress: streetAddress || undefined,
    unitNumber: mlsData.UnitNumber?.trim() || undefined,
    yearBuilt: parseInt(mlsData.YearBuilt, 10) || undefined,
    lotSizeSqm: lotSizeSqm ?? undefined,
    standardStatus: mlsData.StandardStatus?.trim() || undefined,
    halfBathroomsTotal: parseInt(mlsData.HalfBathTotal ?? mlsData.BathroomsHalfTotal, 10) || undefined,
    buildingLevelTotal: parseInt(mlsData.BuildingLevelTotal ?? mlsData.StoriesTotal, 10) || undefined,
    mlsLastUpdated: parseMLSDate(mlsData.LastUpdated ?? mlsData.ModificationTimestamp) ?? undefined,
    mlsData: mlsData ?? undefined,
  };
}

export async function importListingFromMLS(mlsData: any, userId: string) {
  const existing = await prisma.listing.findFirst({ where: { mlsId: mlsData.ListingKey } });
  if (existing) return existing;
  const data = mlsDataToListingFields(mlsData, { userId, status: 'PENDING' });
  return prisma.listing.create({ data });
}

export async function syncMLS() {
  try {
    const filters = 'StandardStatus eq \'Active\' and LastUpdated gt now() - interval 1 day'; // Example for daily sync
    const results = await searchMLS(filters);
    const batchSize = 50;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (mlsData) => {
        const fields = mlsDataToListingFields(mlsData, { userId: DEFAULT_BROKER_ID, status: 'ACTIVE' });
        await prisma.listing.upsert({
          where: { mlsId: mlsData.ListingKey },
          update: { price: fields.price },
          create: { ...fields, mlsId: mlsData.ListingKey },
        });
      }));
    }
    console.log('MLS sync complete');
  } catch (error) {
    sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_SYNC_ERROR, (error as Error).message).catch((e) => console.error('Email failed', e));
    throw error;
  }
}
