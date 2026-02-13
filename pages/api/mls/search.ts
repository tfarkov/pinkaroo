import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { searchMLS, importListingFromMLS } from '../../../lib/mls';
import { API_MESSAGES } from '../../../lib/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const filter = Object.entries(req.query).map(([k, v]) => `${k} eq '${v}'`).join(' and ');
    const results = await searchMLS(filter);
    res.json(results);
  } else if (req.method === 'POST') {
    const imported = await importListingFromMLS(req.body.mlsData, session.user.id);
    res.json(imported);
  }
}
