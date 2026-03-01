import { renderHook, waitFor } from '@testing-library/react';
import { useGeolocation } from '../hooks/useGeolocation';

test('returns default location on error', async () => {
  (global as any).navigator = {
    geolocation: {
      getCurrentPosition: jest.fn((success: (p: any) => void, error: (e: any) => void) => {
        setTimeout(() => error(new Error('Denied')), 0);
      }),
    },
  };
  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => {
    expect(result.current).toEqual({ lat: 44.3894, lng: -79.6903 });
  });
});
