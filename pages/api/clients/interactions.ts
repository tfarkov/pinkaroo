import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();
const DEFAULT_PAGE_SIZE = 20;

/**
 * Interactions log: type, details, date. GET supports pagination (page, limit) for
 * infinite scroll; indexed by userId and (clientId, date) for fast filtering/sorting.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const page = Math.max(0, parseInt(String(req.query.page), 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || DEFAULT_PAGE_SIZE));
    const [interactions, total] = await Promise.all([
      prisma.interaction.findMany({
        where: { userId: session.user.id },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' },
        skip: page * limit,
        take: limit,
      }),
      prisma.interaction.count({ where: { userId: session.user.id } }),
    ]);
    const nextPage = (page + 1) * limit < total ? page + 1 : null;
    res.json({ interactions, nextPage, total });
    return;
  }
  if (req.method === 'POST') {
    const { clientId, type, details, date } = req.body ?? {};
    if (!clientId || !type || !details || !date) {
      sendError(res, 400, 'clientId, type, details, and date are required');
      return;
    }
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client || client.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    const interaction = await prisma.interaction.create({
      data: { clientId, type, details, date: new Date(date as string), userId: session.user.id },
    });
    res.json(interaction);
  }
  } catch (err) {
    console.error('[api/clients/interactions]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
