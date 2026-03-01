import { distanceKm, radiusKmFromZoom } from '../../utils/geo';
import { DEFAULT_NEARBY_RADIUS_KM } from '../../constants';

describe('distanceKm', () => {
  it('returns 0 for same point', () => {
    const p = { lat: 44.3894, lng: -79.6903 };
    expect(distanceKm(p, p)).toBe(0);
  });

  it('returns positive distance for different points', () => {
    const barrie = { lat: 44.3894, lng: -79.6903 };
    const orillia = { lat: 44.608, lng: -79.419 };
    const d = distanceKm(barrie, orillia);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(100);
  });

  it('is symmetric', () => {
    const a = { lat: 44.3894, lng: -79.6903 };
    const b = { lat: 44.75, lng: -79.886 };
    expect(distanceKm(a, b)).toBe(distanceKm(b, a));
  });

  it('approximates known distance (Barrie to Toronto ~90 km)', () => {
    const barrie = { lat: 44.3894, lng: -79.6903 };
    const toronto = { lat: 43.6532, lng: -79.3832 };
    const d = distanceKm(barrie, toronto);
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(110);
  });
});

describe('radiusKmFromZoom', () => {
  it('clamps to min 2 km', () => {
    expect(radiusKmFromZoom(25)).toBe(2);
  });

  it('clamps to max 500 km', () => {
    expect(radiusKmFromZoom(0)).toBe(500);
  });

  it('returns larger radius for smaller zoom (zoomed out)', () => {
    const r10 = radiusKmFromZoom(10);
    const r12 = radiusKmFromZoom(12);
    expect(r10).toBeGreaterThan(r12);
  });

  it('uses DEFAULT_NEARBY_RADIUS_KM at zoom 10', () => {
    expect(radiusKmFromZoom(10)).toBe(DEFAULT_NEARBY_RADIUS_KM);
  });
});
