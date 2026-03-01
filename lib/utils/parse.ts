/**
 * Parse a query param to number. Handles string or string[] (first element). Returns undefined if invalid.
 */
export function parseQueryNum(val: string | string[] | undefined): number | undefined {
  if (val == null || val === '') return undefined;
  const n = typeof val === 'string' ? parseFloat(val) : parseFloat(String(val[0]));
  return Number.isNaN(n) ? undefined : n;
}

/** Parse as integer (e.g. page, bedrooms). */
export function parseQueryInt(val: string | string[] | undefined): number | undefined {
  if (val == null || val === '') return undefined;
  const n = typeof val === 'string' ? parseInt(val, 10) : parseInt(String(val[0]), 10);
  return Number.isNaN(n) ? undefined : n;
}
