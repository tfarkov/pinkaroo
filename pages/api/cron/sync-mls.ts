import { NextApiRequest, NextApiResponse } from 'next';
import { syncMLS } from '../../../lib/mls';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

/** MLS sync cron: run on schedule (e.g. daily). Secured by CRON_SECRET; Vercel sends GET with Bearer token. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    sendError(res, 503, 'CRON_SECRET is not configured');
    return;
  }
  const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization.trim() : '';
  const expected = `Bearer ${cronSecret}`;
  if (authHeader !== expected) {
    sendError(res, 401, 'Unauthorized');
    return;
  }
  try {
    await syncMLS();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[api/cron/sync-mls]', err);
    if (!res.headersSent) sendError(res, 500, 'MLS sync failed');
  }
}
