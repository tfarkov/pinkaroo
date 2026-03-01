/**
 * Tests for eco-rating: computeEcoRatingScore, getEcoRatingDisplay, ecoRatingStars.
 */
import {
  computeEcoRatingScore,
  getEcoRatingDisplay,
  ecoRatingStars,
  HEATING_TYPES,
  INSULATION_OPTIONS,
} from '../ecoRating';

describe('computeEcoRatingScore', () => {
  it('returns base score when no inputs', () => {
    expect(computeEcoRatingScore({})).toBe(5);
  });

  it('adds points for heat pump and geothermal', () => {
    expect(computeEcoRatingScore({ heatingType: 'HEAT_PUMP' })).toBe(6.5);
    expect(computeEcoRatingScore({ heatingType: 'GEOTHERMAL' })).toBe(6.5);
  });

  it('adds points for excellent insulation', () => {
    expect(computeEcoRatingScore({ insulationQuality: 'EXCELLENT' })).toBe(6);
  });

  it('adds for recent renovations', () => {
    expect(computeEcoRatingScore({ hasRecentRenovations: true })).toBe(5.5);
  });

  it('clamps result between 1 and 10', () => {
    const y = new Date().getFullYear() - 100;
    const low = computeEcoRatingScore({
      yearBuilt: y,
      insulationQuality: 'POOR',
      roofAgeYears: 25,
      appliancesAgeYears: 20,
    });
    expect(low).toBeGreaterThanOrEqual(1);
    expect(low).toBeLessThanOrEqual(10);
  });
});

describe('getEcoRatingDisplay', () => {
  it('returns null for null or undefined', () => {
    expect(getEcoRatingDisplay(null)).toBeNull();
    expect(getEcoRatingDisplay(undefined)).toBeNull();
  });

  it('returns X/10 for valid score', () => {
    expect(getEcoRatingDisplay(7)).toBe('7/10');
  });
});

describe('ecoRatingStars', () => {
  it('returns 0 full for null', () => {
    expect(ecoRatingStars(null)).toEqual({ full: 0, half: false });
  });

  it('returns full and half when appropriate', () => {
    expect(ecoRatingStars(7)).toEqual({ full: 7, half: false });
    expect(ecoRatingStars(7.6)).toEqual({ full: 7, half: true });
  });
});

describe('option arrays', () => {
  it('HEATING_TYPES includes HEAT_PUMP and GAS', () => {
    expect(HEATING_TYPES.some((o) => o.value === 'HEAT_PUMP')).toBe(true);
    expect(HEATING_TYPES.some((o) => o.value === 'GAS')).toBe(true);
  });

  it('INSULATION_OPTIONS includes EXCELLENT and POOR', () => {
    expect(INSULATION_OPTIONS.some((o) => o.value === 'EXCELLENT')).toBe(true);
    expect(INSULATION_OPTIONS.some((o) => o.value === 'POOR')).toBe(true);
  });
});
