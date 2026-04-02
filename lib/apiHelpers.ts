import type { NextApiRequest, NextApiResponse } from 'next';

const METHOD_NOT_ALLOWED = 'Method not allowed';
const SERVER_ERROR = 'An error occurred';
const UNAUTHORIZED = 'Unauthorized';
const FORBIDDEN = 'Forbidden';
const TOO_MANY_REQUESTS = 'Too many requests';

/**
 * Send a JSON error response and return the same status for convenience.
 */
export function sendError(
  res: NextApiResponse,
  status: number,
  message: string = SERVER_ERROR
): number {
  res.status(status).json({ error: message });
  return status;
}

/**
 * Require one of the given HTTP methods. If req.method is not in the list,
 * sends 405 and returns false; otherwise returns true.
 */
export function requireMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  methods: string[]
): boolean {
  if (req.method && methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  sendError(res, 405, METHOD_NOT_ALLOWED);
  return false;
}

/**
 * Validate that req.query.id is a non-empty string. If not, sends 400 and returns null; otherwise returns the id.
 */
export function requireIdParam(req: NextApiRequest, res: NextApiResponse): string | null {
  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id) {
    sendError(res, 400, 'id is required');
    return null;
  }
  return id;
}

export function requireAuth(
  res: NextApiResponse,
  session: { user?: { id?: string; role?: string } } | null | undefined
): session is { user: { id: string; role?: string } } {
  if (!session?.user?.id) {
    sendError(res, 401, UNAUTHORIZED);
    return false;
  }
  return true;
}

export function requireRole(
  res: NextApiResponse,
  role: string | undefined,
  allowedRoles: string[]
): boolean {
  if (!role || !allowedRoles.includes(role)) {
    sendError(res, 403, FORBIDDEN);
    return false;
  }
  return true;
}

export function isSystemAdminRole(role: string | undefined): boolean {
  return role === 'SYSTEM_ADMIN';
}

export function isOfficeAdminRole(role: string | undefined): boolean {
  return role === 'OFFICE_ADMIN';
}

export function canManageBrokersAndRealtors(role: string | undefined): boolean {
  return isSystemAdminRole(role) || isOfficeAdminRole(role);
}

export function canManageSystemSettings(role: string | undefined): boolean {
  return isSystemAdminRole(role);
}

export function parseString(
  value: unknown,
  options: { trim?: boolean; minLength?: number; maxLength?: number; allowEmpty?: boolean } = {}
): string | null {
  if (typeof value !== 'string') return null;
  const trim = options.trim !== false;
  const parsed = trim ? value.trim() : value;
  const minLength = options.minLength ?? (options.allowEmpty ? 0 : 1);
  const maxLength = options.maxLength ?? 10_000;
  if (parsed.length < minLength || parsed.length > maxLength) return null;
  return parsed;
}

export function parseFiniteNumber(
  value: unknown,
  options: { min?: number; max?: number } = {}
): number | null {
  if (value === '' || value == null) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (options.min != null && num < options.min) return null;
  if (options.max != null && num > options.max) return null;
  return num;
}

export function parseFiniteInt(
  value: unknown,
  options: { min?: number; max?: number } = {}
): number | null {
  const num = parseFiniteNumber(value, options);
  if (num == null) return null;
  if (!Number.isInteger(num)) return null;
  return num;
}

export function parseBoolean(value: unknown): boolean | null {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value.trim());
}

type RateLimitBucket = { count: number; resetAt: number };
const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();

export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress ?? 'unknown';
}

export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  key: string,
  options: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const bucketKey = `${key}:${getClientIp(req)}`;
  const existing = RATE_LIMIT_BUCKETS.get(bucketKey);
  if (!existing || now >= existing.resetAt) {
    RATE_LIMIT_BUCKETS.set(bucketKey, { count: 1, resetAt: now + options.windowMs });
    return true;
  }
  if (existing.count >= options.max) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfterSec));
    sendError(res, 429, TOO_MANY_REQUESTS);
    return false;
  }
  existing.count += 1;
  RATE_LIMIT_BUCKETS.set(bucketKey, existing);
  return true;
}

/**
 * Wrap an async API handler with try/catch. On thrown errors, logs and sends 500.
 * Use like: export default withApiHandler(async (req, res) => { ... }).
 */
export function withApiHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  logLabel: string = 'api'
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(`[${logLabel}]`, err);
      if (!res.headersSent) sendError(res, 500, SERVER_ERROR);
    }
  };
}

/**
 * Safe user fields that must never include secrets (e.g. password).
 * Use in Prisma `select` for API responses.
 */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  role: true,
  name: true,
  bio: true,
  phone: true,
  availableHours: true,
  image: true,
  ratings: true,
  listingsCount: true,
  avgSalePrice: true,
  clientConversionRate: true,
  approvalRate: true,
  brokerId: true,
  teamId: true,
  isTeamLead: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const SAFE_TEAM_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  availableHours: true,
  image: true,
  bio: true,
  brokerId: true,
  teamId: true,
  isTeamLead: true,
} as const;
