import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ANONYMOUS_FAVORITES_KEY, API, MAX_FAVORITES } from '../constants';
import { useFavorites } from '../hooks/useFavorites';

const mockUseAuth = jest.fn();

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useFavorites', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('adds and removes anonymous favorites using localStorage', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });

    act(() => {
      result.current.toggleFavorite('listing-1', {
        id: 'listing-1',
        title: 'Sample',
        price: 450000,
        images: ['https://example.com/a.jpg'],
      });
    });
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.isFavorited('listing-1')).toBe(true);

    const persisted = JSON.parse(localStorage.getItem(ANONYMOUS_FAVORITES_KEY) || '[]');
    expect(persisted).toHaveLength(1);
    expect(persisted[0]?.listing?.id).toBe('listing-1');

    act(() => {
      result.current.toggleFavorite('listing-1');
    });
    expect(result.current.favorites).toHaveLength(0);
    expect(result.current.isFavorited('listing-1')).toBe(false);
  });

  it('caps anonymous favorites at MAX_FAVORITES', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });

    act(() => {
      for (let i = 0; i < MAX_FAVORITES + 5; i += 1) {
        result.current.toggleFavorite(`listing-${i}`, { id: `listing-${i}` });
      }
    });

    expect(result.current.favorites).toHaveLength(MAX_FAVORITES);
    const persisted = JSON.parse(localStorage.getItem(ANONYMOUS_FAVORITES_KEY) || '[]');
    expect(persisted).toHaveLength(MAX_FAVORITES);
  });

  it('uses API mutations for authenticated favorites toggle', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const fetchMock = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 'fav-1', listing: { id: 'listing-1' } }],
      })
      .mockResolvedValueOnce({ ok: true });
    (global as { fetch?: unknown }).fetch = fetchMock as unknown;

    const { result } = renderHook(() => useFavorites(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.favorites.length).toBe(1);
    });

    act(() => {
      result.current.toggleFavorite('listing-2', { id: 'listing-2' });
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        API.FAVORITES,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ listingId: 'listing-2' }),
        })
      );
    });
  });
});
