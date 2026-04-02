import {
  applyRateLimit,
  isSafeId,
  parseBoolean,
  parseFiniteInt,
  parseFiniteNumber,
  parseString,
  requireAuth,
  requireIdParam,
  requireMethod,
  requireRole,
  sendError,
} from '../apiHelpers';

function createMockRes() {
  const res: any = {
    statusCode: 200,
    _status: undefined,
    _json: undefined,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(body: unknown) {
      this._json = body;
      return this;
    },
    setHeader: jest.fn(),
  };
  return res;
}

describe('sendError', () => {
  it('sets status and sends JSON with error message', () => {
    const res = createMockRes();
    sendError(res, 400, 'Bad request');
    expect(res._status).toBe(400);
    expect(res._json).toEqual({ error: 'Bad request' });
  });

  it('returns the status code', () => {
    const res = createMockRes();
    expect(sendError(res, 404, 'Not found')).toBe(404);
  });
});

describe('requireMethod', () => {
  it('returns true when method is allowed', () => {
    const res = createMockRes();
    expect(requireMethod({ method: 'GET' } as any, res, ['GET', 'POST'])).toBe(true);
    expect(res._status).toBeUndefined();
  });

  it('sends 405 and returns false when method not allowed', () => {
    const res = createMockRes();
    expect(requireMethod({ method: 'PUT' } as any, res, ['GET', 'POST'])).toBe(false);
    expect(res.setHeader).toHaveBeenCalledWith('Allow', 'GET, POST');
    expect(res._status).toBe(405);
    expect(res._json?.error).toBe('Method not allowed');
  });

  it('allows method when list contains it', () => {
    const res = createMockRes();
    expect(requireMethod({ method: 'DELETE' } as any, res, ['GET', 'DELETE'])).toBe(true);
  });
});

describe('requireIdParam', () => {
  it('returns id when query.id is non-empty string', () => {
    const res = createMockRes();
    expect(requireIdParam({ query: { id: 'abc-123' } } as any, res)).toBe('abc-123');
    expect(requireIdParam({ query: { id: '  trimmed  ' } } as any, res)).toBe('trimmed');
  });

  it('sends 400 and returns null when id missing', () => {
    const res = createMockRes();
    expect(requireIdParam({ query: {} } as any, res)).toBe(null);
    expect(res._status).toBe(400);
    expect(res._json?.error).toBe('id is required');
  });

  it('sends 400 when id is empty string', () => {
    const res = createMockRes();
    expect(requireIdParam({ query: { id: '   ' } } as any, res)).toBe(null);
    expect(res._status).toBe(400);
  });
});

describe('requireAuth / requireRole', () => {
  it('requireAuth returns false and sends 401 when session missing', () => {
    const res = createMockRes();
    expect(requireAuth(res, null)).toBe(false);
    expect(res._status).toBe(401);
  });

  it('requireAuth returns true when session has user id', () => {
    const res = createMockRes();
    expect(requireAuth(res, { user: { id: 'u1', role: 'USER' } })).toBe(true);
  });

  it('requireRole returns false when role not allowed', () => {
    const res = createMockRes();
    expect(requireRole(res, 'USER', ['ADMIN'])).toBe(false);
    expect(res._status).toBe(403);
  });
});

describe('parsers and id validation', () => {
  it('parseString enforces min/max and trim', () => {
    expect(parseString('  hello  ')).toBe('hello');
    expect(parseString('')).toBeNull();
    expect(parseString('a'.repeat(5), { maxLength: 4 })).toBeNull();
  });

  it('parseFiniteNumber and parseFiniteInt enforce numeric bounds', () => {
    expect(parseFiniteNumber('12.5', { min: 0, max: 20 })).toBe(12.5);
    expect(parseFiniteNumber('abc')).toBeNull();
    expect(parseFiniteInt('5', { min: 1, max: 10 })).toBe(5);
    expect(parseFiniteInt('5.2')).toBeNull();
  });

  it('parseBoolean handles boolean strings', () => {
    expect(parseBoolean(true)).toBe(true);
    expect(parseBoolean('false')).toBe(false);
    expect(parseBoolean('nope')).toBeNull();
  });

  it('isSafeId validates identifier format', () => {
    expect(isSafeId('abc_123-XYZ')).toBe(true);
    expect(isSafeId('../bad')).toBe(false);
    expect(isSafeId('')).toBe(false);
  });
});

describe('applyRateLimit', () => {
  it('allows requests below limit and blocks after threshold', () => {
    const req = { headers: { 'x-forwarded-for': '1.2.3.4' }, socket: { remoteAddress: '1.2.3.4' } } as any;
    const res = createMockRes();
    expect(applyRateLimit(req, res, 'unit-test', { max: 2, windowMs: 60000 })).toBe(true);
    expect(applyRateLimit(req, res, 'unit-test', { max: 2, windowMs: 60000 })).toBe(true);
    expect(applyRateLimit(req, res, 'unit-test', { max: 2, windowMs: 60000 })).toBe(false);
    expect(res._status).toBe(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String));
  });
});
