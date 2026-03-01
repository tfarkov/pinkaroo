import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Build a minimal NextApiRequest for API handler tests.
 */
export function createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
  return {
    method: 'GET',
    query: {},
    body: undefined,
    headers: {},
    ...overrides,
  } as NextApiRequest;
}

/**
 * Build a minimal NextApiResponse that captures status and JSON for assertions.
 */
export function createMockResponse(): NextApiResponse & { _status?: number; _json?: unknown } {
  const res: any = {
    _status: undefined,
    _json: undefined,
    status(code: number) {
      this._status = code;
      return this;
    },
    json(body: unknown) {
      this._json = body;
      if (this._status === undefined) this._status = 200;
      return this;
    },
    setHeader: jest.fn(),
    end: jest.fn(),
  };
  return res;
}

/**
 * Run an API handler and return the response status and body.
 */
export async function runHandler(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  req: NextApiRequest,
  res: ReturnType<typeof createMockResponse>
): Promise<{ status: number | undefined; body: unknown }> {
  await handler(req, res);
  return { status: res._status, body: res._json };
}
