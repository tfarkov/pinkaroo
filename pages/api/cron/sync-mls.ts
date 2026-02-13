import { NextApiRequest, NextApiResponse } from 'next';
import { syncMLS } from '../../../lib/mls';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  if (!expected || req.headers.authorization !== expected) return res.status(401).end();
  await syncMLS();
  res.json({ success: true });
}
