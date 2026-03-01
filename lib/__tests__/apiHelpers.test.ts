import { sendError, requireMethod, requireIdParam } from '../apiHelpers';

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
