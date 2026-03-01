import { getMarkerPosition } from '../HomeMap';

describe('getMarkerPosition', () => {
  it('returns null for missing or invalid coords', () => {
    expect(getMarkerPosition({ id: '1', latitude: null, longitude: null })).toBeNull();
    expect(getMarkerPosition({ id: '1', latitude: 44, longitude: undefined })).toBeNull();
    expect(getMarkerPosition({ id: '1', latitude: 0, longitude: 0 })).toBeNull();
  });

  it('returns coords when already valid', () => {
    expect(getMarkerPosition({ id: '1', latitude: 44.3894, longitude: -79.6903 })).toEqual({
      lat: 44.3894,
      lng: -79.6903,
    });
  });

  it('swaps reversed latitude/longitude when clearly reversed', () => {
    expect(getMarkerPosition({ id: '1', latitude: -79.6903, longitude: 44.3894 })).toEqual({
      lat: 44.3894,
      lng: -79.6903,
    });
  });
});
