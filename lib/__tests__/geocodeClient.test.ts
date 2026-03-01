/**
 * Tests for client-side geocoding with localStorage cache.
 */
import { geocodeAddressClient } from '../geocodeClient';

const mockFetch = jest.fn();
let mockGetItem: jest.Mock;
let mockSetItem: jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem = jest.fn();
  mockSetItem = jest.fn();
  global.fetch = mockFetch;
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: (...args: unknown[]) => mockGetItem(...args),
      setItem: (...args: unknown[]) => mockSetItem(...args),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(),
    },
    writable: true,
  });
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key';
});

test('returns null for empty address', async () => {
  expect(await geocodeAddressClient('')).toBeNull();
  expect(await geocodeAddressClient('   ')).toBeNull();
  mockFetch.mockResolvedValue({ json: () => Promise.resolve({}) });
  expect(await geocodeAddressClient('')).toBeNull();
  expect(mockFetch).not.toHaveBeenCalled();
});

test('returns null when API key is missing', async () => {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  mockGetItem.mockReturnValue(null);
  const result = await geocodeAddressClient('123 Main St');
  expect(result).toBeNull();
  expect(mockFetch).not.toHaveBeenCalled();
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = key;
});

test('returns cached result when valid cache exists', async () => {
  mockGetItem.mockReturnValue(JSON.stringify({ lat: 44.39, lng: -79.69, ts: Date.now() - 1000 }));
  const result = await geocodeAddressClient('123 Main St');
  expect(result).toEqual({ lat: 44.39, lng: -79.69 });
  expect(mockFetch).not.toHaveBeenCalled();
});

test('returns null when cache is expired', async () => {
  const expiredTs = Date.now() - (25 * 60 * 60 * 1000);
  mockGetItem.mockReturnValue(JSON.stringify({ lat: 44.39, lng: -79.69, ts: expiredTs }));
  mockFetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        status: 'OK',
        results: [{ geometry: { location: { lat: 44.39, lng: -79.69 } }, formatted_address: '123 Main St' }],
      }),
  });
  const result = await geocodeAddressClient('123 Main St');
  expect(result).toEqual({ lat: 44.39, lng: -79.69, formattedAddress: '123 Main St' });
  expect(mockFetch).toHaveBeenCalled();
  expect(mockSetItem).toHaveBeenCalled();
});

test('calls API and caches on cache miss', async () => {
  mockGetItem.mockReturnValue(null);
  mockFetch.mockResolvedValue({
    json: () =>
      Promise.resolve({
        status: 'OK',
        results: [{ geometry: { location: { lat: 44.3894, lng: -79.6903 } }, formatted_address: 'Barrie, ON' }],
      }),
  });
  const result = await geocodeAddressClient('Barrie, ON');
  expect(result).toEqual({ lat: 44.3894, lng: -79.6903, formattedAddress: 'Barrie, ON' });
  expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('address=Barrie'));
  expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('region=ca'));
  expect(mockSetItem).toHaveBeenCalledWith(
    expect.stringContaining('pinkaroo_geocode_'),
    expect.stringContaining('"lat":44.3894')
  );
});

test('returns null when API status is not OK', async () => {
  mockGetItem.mockReturnValue(null);
  mockFetch.mockResolvedValue({ json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] }) });
  const result = await geocodeAddressClient('Nowhere');
  expect(result).toBeNull();
  expect(mockSetItem).not.toHaveBeenCalled();
});

test('returns null when API throws', async () => {
  mockGetItem.mockReturnValue(null);
  mockFetch.mockRejectedValue(new Error('Network error'));
  const result = await geocodeAddressClient('123 Main St');
  expect(result).toBeNull();
});
