/**
 * Eco-Rating for Listings: Simple 1–10 score from property age, heating type,
 * insulation, renovations, roof age, appliances age. Precomputed in Prisma on
 * create/update; client-side recalc used for form previews. Indexed for sorting.
 */

export const HEATING_TYPES = [
  { value: '', label: 'Not specified' },
  { value: 'HEAT_PUMP', label: 'Heat pump' },
  { value: 'GEOTHERMAL', label: 'Geothermal' },
  { value: 'GAS', label: 'Natural gas' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'OIL', label: 'Oil' },
  { value: 'OTHER', label: 'Other' },
] as const;

export const INSULATION_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'AVERAGE', label: 'Average' },
  { value: 'POOR', label: 'Poor' },
] as const;

export type EcoRatingInputs = {
  yearBuilt?: number | null;
  heatingType?: string | null;
  insulationQuality?: string | null;
  hasRecentRenovations?: boolean | null;
  roofAgeYears?: number | null;
  appliancesAgeYears?: number | null;
};

const currentYear = () => new Date().getFullYear();

/**
 * Compute eco-rating score 1–10. Points: newer building, efficient heating,
 * good insulation, recent renovations, newer roof/appliances add; old age deducts.
 */
export function computeEcoRatingScore(inputs: EcoRatingInputs): number | null {
  let score = 5;
  const y = inputs.yearBuilt != null && inputs.yearBuilt > 0 ? inputs.yearBuilt : null;
  const age = y != null ? currentYear() - y : null;

  if (age != null) {
    if (age <= 5) score += 1.5;
    else if (age <= 15) score += 1;
    else if (age <= 30) score += 0.5;
    else if (age > 50) score -= 0.5;
  }

  switch (inputs.heatingType) {
    case 'HEAT_PUMP':
    case 'GEOTHERMAL':
      score += 1.5;
      break;
    case 'GAS':
      score += 1;
      break;
    case 'ELECTRIC':
      score += 0.5;
      break;
    default:
      break;
  }

  switch (inputs.insulationQuality) {
    case 'EXCELLENT':
      score += 1;
      break;
    case 'GOOD':
      score += 0.5;
      break;
    case 'POOR':
      score -= 0.5;
      break;
    default:
      break;
  }

  if (inputs.hasRecentRenovations === true) score += 0.5;

  const roof = inputs.roofAgeYears != null ? inputs.roofAgeYears : null;
  if (roof != null) {
    if (roof <= 5) score += 0.5;
    else if (roof > 15) score -= 0.25;
  }

  const app = inputs.appliancesAgeYears != null ? inputs.appliancesAgeYears : null;
  if (app != null) {
    if (app <= 5) score += 0.5;
    else if (app > 10) score -= 0.25;
  }

  const clamped = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  return clamped;
}

/** Display value for sorting/filtering; null when no score. */
export function getEcoRatingDisplay(score: number | null | undefined): string | null {
  if (score == null || Number.isNaN(score)) return null;
  return `${Math.min(10, Math.max(1, Math.round(score * 10) / 10))}/10`;
}

/** Render 1–10 as star count (e.g. 7.2 → 7 full; 7.6 → 7 full + half). */
export function ecoRatingStars(score: number | null | undefined): { full: number; half: boolean } {
  if (score == null || Number.isNaN(score)) return { full: 0, half: false };
  const s = Math.max(1, Math.min(10, score));
  const full = Math.floor(s);
  const half = full < 10 && s - full >= 0.5;
  return { full: Math.min(10, full), half };
}
