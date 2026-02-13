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
    await sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_TOKEN_ERROR, (error as Error).message);
    throw error;
  }
}

/** Build OData $filter for CREA DDF Property API (see CREA DDF documentation). */
export function buildMLSFilter(params: Record<string, string | number | undefined>): string {
  const clauses: string[] = [];
  const esc = (s: string) => `'${String(s).replace(/'/g, "''")}'`;

  if (params.standardStatus && params.standardStatus !== 'Any') {
    clauses.push(`StandardStatus eq ${esc(params.standardStatus as string)}`);
  } else if (params.standardStatus !== 'Any') {
    clauses.push(`StandardStatus eq 'Active'`);
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
    await sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_SEARCH_ERROR, (error as Error).message);
    throw error;
  }
}

export async function importListingFromMLS(mlsData: any, userId: string) {
  const existing = await prisma.listing.findFirst({ where: { mlsId: mlsData.ListingKey } });
  if (existing) return existing;
  return prisma.listing.create({
    data: {
      title: mlsData.StandardStatus + ' ' + mlsData.PropertyType,
      description: mlsData.PublicRemarks || '',
      price: parseFloat(mlsData.ListPrice) || 0,
      location: mlsData.City || '',
      province: mlsData.StateOrProvince as any || 'ONTARIO',
      postalCode: mlsData.PostalCode,
      sizeSqm: parseFloat(mlsData.LivingArea) || 0,
      bedroomsTotal: parseInt(mlsData.BedroomsTotal) || 0,
      bathroomsTotal: parseInt(mlsData.BathroomsTotalInteger) || 0,
      propertyType: mlsData.PropertyType,
      latitude: parseFloat(mlsData.Latitude) || DEFAULT_LOCATION.lat,
      longitude: parseFloat(mlsData.Longitude) || DEFAULT_LOCATION.lng,
      images: mlsData.Media?.map((m: any) => m.MediaURL) || [],
      mlsId: mlsData.ListingKey,
      status: 'PENDING',
      userId,
    },
  });
}

export async function syncMLS() {
  try {
    const filters = 'StandardStatus eq \'Active\' and LastUpdated gt now() - interval 1 day'; // Example for daily sync
    const results = await searchMLS(filters);
    const batchSize = 50;
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);
      await Promise.all(batch.map(async (mlsData) => {
        await prisma.listing.upsert({
          where: { mlsId: mlsData.ListingKey },
          update: {
            price: parseFloat(mlsData.ListPrice),
            // Update other fields as needed
          },
          create: {
            title: mlsData.StandardStatus + ' ' + mlsData.PropertyType,
            description: mlsData.PublicRemarks || '',
            price: parseFloat(mlsData.ListPrice) || 0,
            location: mlsData.City || '',
            province: ((mlsData.StateOrProvince as string) || DEFAULT_PROVINCE) as Province,
            postalCode: mlsData.PostalCode,
            sizeSqm: parseFloat(mlsData.LivingArea) || 0,
            bedroomsTotal: parseInt(mlsData.BedroomsTotal) || 0,
            bathroomsTotal: parseInt(mlsData.BathroomsTotalInteger) || 0,
            propertyType: mlsData.PropertyType,
            latitude: parseFloat(mlsData.Latitude) || DEFAULT_LOCATION.lat,
            longitude: parseFloat(mlsData.Longitude) || DEFAULT_LOCATION.lng,
            images: mlsData.Media?.map((m: any) => m.MediaURL) || [],
            mlsId: mlsData.ListingKey,
            status: 'ACTIVE',
            userId: DEFAULT_BROKER_ID,
          },
        });
      }));
    }
    console.log('MLS sync complete');
  } catch (error) {
    await sendEmail(ADMIN_EMAIL, EMAIL_SUBJECTS.MLS_SYNC_ERROR, (error as Error).message);
    throw error;
  }
}
