/** Filter/search params as key-value; used for listings, nearby, MLS. */
export type FilterParams = Record<string, string | number | undefined>;

/**
 * Build a query string from filters and extra params. Skips undefined/null/empty.
 * @example buildQueryParams({ province: 'ONTARIO' }, { lat: '44', lng: '-79' }) => '?province=ONTARIO&lat=44&lng=-79'
 */
export function buildQueryParams(
  filters: FilterParams,
  extra: Record<string, string> = {}
): string {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...extra }).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const q = params.toString();
  return q ? `?${q}` : '';
}
