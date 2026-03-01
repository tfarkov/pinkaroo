import type { ListingBasic } from './types';

export const LISTING_SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'eco-desc', label: 'Eco rating: high to low' },
  { value: 'beds-desc', label: 'Beds: most first' },
  { value: 'baths-desc', label: 'Baths: most first' },
  { value: 'size-desc', label: 'Size: largest first' },
] as const;

export type ListingSortValue = (typeof LISTING_SORT_OPTIONS)[number]['value'];

/** Sort a list of listings by the given sort key (mutates a copy). */
export function sortListings<T extends ListingBasic>(
  listings: T[],
  sortKey: ListingSortValue
): T[] {
  const arr = [...listings];
  if (sortKey === 'default') return arr;
  switch (sortKey) {
    case 'price-asc':
      return arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    case 'price-desc':
      return arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    case 'eco-desc':
      return arr.sort((a, b) => (b.ecoRatingScore ?? -1) - (a.ecoRatingScore ?? -1));
    case 'beds-desc':
      return arr.sort((a, b) => (b.bedroomsTotal ?? 0) - (a.bedroomsTotal ?? 0));
    case 'baths-desc':
      return arr.sort((a, b) => (b.bathroomsTotal ?? 0) - (a.bathroomsTotal ?? 0));
    case 'size-desc':
      return arr.sort((a, b) => (b.sizeSqm ?? 0) - (a.sizeSqm ?? 0));
    default:
      return arr;
  }
}
