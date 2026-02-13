import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { searchMLS, importListingFromMLS, buildMLSFilter } from '../../../lib/mls';
import { API_MESSAGES } from '../../../lib/constants';

function parseNum(val: string | string[] | undefined): number | undefined {
  if (val == null) return undefined;
  const n = typeof val === 'string' ? parseFloat(val) : parseFloat(String(val[0]));
  return isNaN(n) ? undefined : n;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'GET') {
    const q = req.query as Record<string, string | string[] | undefined>;
    const params: Record<string, string | number | undefined> = {
      standardStatus: (q.standardStatus as string) || 'Active',
      province: q.province as string,
      city: q.city as string,
      postalCode: q.postalCode as string,
      minPrice: parseNum(q.minPrice),
      maxPrice: parseNum(q.maxPrice),
      minSize: parseNum(q.minSize),
      maxSize: parseNum(q.maxSize),
      bedrooms: parseNum(q.bedrooms),
      bathrooms: parseNum(q.bathrooms),
      propertyType: q.propertyType as string,
    };
    const filter = buildMLSFilter(params);
    const results = await searchMLS(filter);
    res.json(results);
  } else if (req.method === 'POST') {
    const imported = await importListingFromMLS(req.body.mlsData, session.user.id);
    res.json(imported);
  }
}
