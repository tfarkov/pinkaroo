import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { searchMLS, importListingFromMLS, buildMLSFilter } from '../../../lib/mls';
import { API_MESSAGES } from '../../../lib/constants';
import { parseQueryNum } from '../../../lib/utils/parse';
import { requireMethod, requireRole, sendError } from '../../../lib/apiHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  if (!requireRole(res, session.user.role, ['REALTOR', 'BROKER', 'OFFICE_ADMIN', 'SYSTEM_ADMIN'])) {
    return;
  }
  try {
  if (req.method === 'GET') {
    const q = req.query as Record<string, string | string[] | undefined>;
    const params: Record<string, string | number | undefined> = {
      standardStatus: (q.standardStatus as string) || 'Active',
      province: q.province as string,
      city: q.city as string,
      postalCode: q.postalCode as string,
      minPrice: parseQueryNum(q.minPrice),
      maxPrice: parseQueryNum(q.maxPrice),
      minSize: parseQueryNum(q.minSize),
      maxSize: parseQueryNum(q.maxSize),
      bedrooms: parseQueryNum(q.bedrooms),
      bathrooms: parseQueryNum(q.bathrooms),
      propertyType: q.propertyType as string,
    };
    const filter = buildMLSFilter(params);
    const results = await searchMLS(filter);
    res.json(results);
    return;
  }
  if (req.method === 'POST') {
    const mlsData = req.body?.mlsData;
    if (!mlsData) {
      sendError(res, 400, 'mlsData is required');
      return;
    }
    const imported = await importListingFromMLS(mlsData, session.user.id);
    res.json(imported);
  }
  } catch (err) {
    console.error('[api/mls/search]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
