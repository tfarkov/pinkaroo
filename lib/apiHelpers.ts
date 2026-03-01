import type { NextApiRequest, NextApiResponse } from 'next';

const METHOD_NOT_ALLOWED = 'Method not allowed';
const BAD_REQUEST = 'Bad request';
const SERVER_ERROR = 'An error occurred';

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
