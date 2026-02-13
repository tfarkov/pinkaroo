import { renderHook } from '@testing-library/react-hooks';
import { useGeolocation } from '../hooks/useGeolocation';

test('returns default location on error', () => {
  global.navigator.geolocation = { getCurrentPosition: jest.fn((success, error) => error('Error')) };
  const { result } = renderHook(() => useGeolocation());
  expect(result.current).toEqual({ lat: 44.3894, lng: -79.6903 });
});
