import { NextApiRequest, NextApiResponse } from 'next';
import { syncMLS } from '../../../lib/mls';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

/** MLS sync cron: run on schedule (e.g. daily). Secured by CRON_SECRET; Vercel sends GET with Bearer token. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET'])) return;
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  if (!expected || req.headers.authorization !== expected) {
    res.status(401).end();
    return;
  }
  try {
    await syncMLS();
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[api/cron/sync-mls]', err);
    if (!res.headersSent) res.status(500).json({ success: false, error: (err as Error).message });
  }
}
