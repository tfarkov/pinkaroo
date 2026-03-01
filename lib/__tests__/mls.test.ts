import { getAccessToken, searchMLS, importListingFromMLS, mlsDataToListingFields } from '../mls';
import axios from 'axios';

jest.mock('axios');
jest.mock('../email', () => ({ sendEmail: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@prisma/client', () => {
  const findFirst = jest.fn();
  const create = jest.fn();
  const upsert = jest.fn();
  return {
    PrismaClient: jest.fn(() => ({ listing: { findFirst, create, upsert } })),
  };
});

test('getAccessToken succeeds', async () => {
  (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { access_token: 'fake-token' } });
  const token = await getAccessToken();
  expect(token).toBe('fake-token');
});

test('getAccessToken handles error', async () => {
  (axios.post as jest.Mock).mockRejectedValue(new Error('Error'));
  await expect(getAccessToken()).rejects.toThrow('Error');
});

test('searchMLS returns data', async () => {
  (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { access_token: 'fake-token' } });
  (axios.get as jest.Mock).mockResolvedValue({ status: 200, data: { value: [{ ListingKey: '123' }] } });
  const results = await searchMLS('test');
  expect(results.length).toBe(1);
});

test('searchMLS handles rate limit', async () => {
  (axios.post as jest.Mock).mockResolvedValue({ status: 200, data: { access_token: 'fake-token' } });
  (axios.get as jest.Mock).mockRejectedValue(Object.assign(new Error('Rate limit'), { response: { status: 429 } }));
  await expect(searchMLS('test')).rejects.toThrow();
});

test('importListingFromMLS creates new', async () => {
  const { PrismaClient } = require('@prisma/client');
  const instance = (PrismaClient as jest.Mock).mock.results[0]?.value;
  const mockFindFirst = instance?.listing.findFirst as jest.Mock;
  const mockCreate = instance?.listing.create as jest.Mock;
  mockFindFirst.mockResolvedValue(null);
  mockCreate.mockResolvedValue({ id: 'new' });
  const result = await importListingFromMLS({ ListingKey: '123' } as any, 'user1');
  expect(result).toEqual({ id: 'new' });
});

test('importListingFromMLS throws when ListingKey is missing', async () => {
  await expect(importListingFromMLS({} as any, 'user1')).rejects.toThrow('Missing MLS ListingKey');
});
describe('mlsDataToListingFields', () => {
  const defaults = { userId: 'user-1', status: 'PENDING' as const };

  it('maps minimal MLS payload to listing fields', () => {
    const payload = {
      ListingKey: 'MLS-001',
      ListPrice: 500000,
      City: 'Barrie',
      StateOrProvince: 'ONTARIO',
      PropertyType: 'House',
      PublicRemarks: 'Nice home',
    };
    const out = mlsDataToListingFields(payload, defaults);
    expect(out.mlsId).toBe('MLS-001');
    expect(out.price).toBe(500000);
    expect(out.location).toBe('Barrie');
    expect(out.province).toBe('ONTARIO');
    expect(out.propertyType).toBe('House');
    expect(out.description).toBe('Nice home');
    expect(out.userId).toBe('user-1');
    expect(out.status).toBe('PENDING');
  });

  it('uses UnparsedAddress for streetAddress', () => {
    const out = mlsDataToListingFields(
      { ListingKey: 'x', UnparsedAddress: '123 Main St', City: 'Barrie', StateOrProvince: 'ONTARIO', ListPrice: 1 },
      defaults
    );
    expect(out.streetAddress).toBe('123 Main St');
  });

  it('maps YearBuilt, LandSize, HalfBathTotal, BuildingLevelTotal, LastUpdated', () => {
    const out = mlsDataToListingFields(
      {
        ListingKey: 'x',
        City: 'Barrie',
        StateOrProvince: 'ONTARIO',
        ListPrice: 1,
        YearBuilt: 1995,
        LandSize: 500,
        HalfBathTotal: 1,
        BuildingLevelTotal: 2,
        LastUpdated: '2024-01-15T12:00:00Z',
      },
      defaults
    );
    expect(out.yearBuilt).toBe(1995);
    expect(out.lotSizeSqm).toBe(500);
    expect(out.halfBathroomsTotal).toBe(1);
    expect(out.buildingLevelTotal).toBe(2);
    expect(out.mlsLastUpdated).toBeInstanceOf(Date);
  });

  it('converts LotSizeSqFt fallback values to square meters', () => {
    const out = mlsDataToListingFields(
      {
        ListingKey: 'x',
        City: 'Barrie',
        StateOrProvince: 'ONTARIO',
        ListPrice: 1,
        LotSizeSqFt: 5000,
      },
      defaults
    );
    expect(out.lotSizeSqm).toBeCloseTo(464.5152, 4);
  });

  it('does not apply create fallbacks when mapping update payloads', () => {
    const out = mlsDataToListingFields(
      { ListingKey: 'x' },
      defaults,
      { forUpdate: true }
    );
    expect(out.title).toBeUndefined();
    expect(out.description).toBeUndefined();
    expect(out.price).toBeUndefined();
    expect(out.latitude).toBeUndefined();
    expect(out.longitude).toBeUndefined();
    expect(out.images).toBeUndefined();
  });
  it('stores full mlsData in mlsData field', () => {
    const payload = { ListingKey: 'x', City: 'Barrie', StateOrProvince: 'ONTARIO', ListPrice: 1, custom: 'value' };
    const out = mlsDataToListingFields(payload, defaults);
    expect(out.mlsData).toEqual(payload);
  });
  it('does not inject fallback coordinates when MLS lat/lng are invalid', () => {
    const out = mlsDataToListingFields(
      { ListingKey: 'x', City: 'Barrie', StateOrProvince: 'ONTARIO', ListPrice: 1, Latitude: 'bad', Longitude: '' },
      defaults
    );
    expect(out.latitude).toBeUndefined();
    expect(out.longitude).toBeUndefined();
  });
});
