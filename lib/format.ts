import { SQFT_CONVERSION_FACTOR } from './constants';

const priceFormatter = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

/** Format price in CAD (e.g. $450,000) */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** Format area: m² or sq ft based on isMetric */
export function formatArea(sizeSqm: number | null | undefined, isMetric: boolean): string {
  if (sizeSqm == null) return '—';
  return isMetric ? `${sizeSqm} m²` : `${(sizeSqm * SQFT_CONVERSION_FACTOR).toFixed(0)} sq ft`;
}
