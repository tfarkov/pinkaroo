import { getAccessToken, searchMLS, syncMLS, importListingFromMLS } from '../mls';
import axios from 'axios';
jest.mock('axios');
jest.mock('./prisma'); // mock prisma and email
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
  (axios.get as jest.Mock).mockResolvedValue({ status: 200, data: { value: [{ ListingKey: '123' }] } });
  const results = await searchMLS('test');
  expect(results.length).toBe(1);
});
test('searchMLS handles rate limit', async () => {
  (axios.get as jest.Mock).mockRejectedValue({ response: { status: 429 } });
  await expect(searchMLS('test')).rejects.toThrow();
});
test('importListingFromMLS creates new', async () => {
  prisma.listing.findUnique.mockResolvedValue(null);
  prisma.listing.create.mockResolvedValue({ id: 'new' });
  const result = await importListingFromMLS({ ListingKey: '123' }, 'user1');
  expect(result).toEqual({ id: 'new' });
});
test('syncMLS handles batch', async () => {
  (axios.get as jest.Mock).mockResolvedValue({ data: { value: Array(60).fill({ ListingKey: 'test' }) } });
  await syncMLS();
  expect(prisma.listing.upsert).toHaveBeenCalledTimes(60);
});
