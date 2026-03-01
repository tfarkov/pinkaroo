import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';
import { requireMethod, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * Broker Team Management: Brokers can create teams and assign/remove realtors (teamId on User).
 * List returns teams with member summaries; full member details lazy-loaded on team page.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const teams = await prisma.team.findMany({
      where: { brokerId: session.user.id },
      include: { members: { select: { id: true, name: true, email: true, isTeamLead: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(teams);
    return;
  }
  if (req.method === 'POST') {
    const { name } = req.body ?? {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      sendError(res, 400, 'name is required');
      return;
    }
    const team = await prisma.team.create({
      data: { name: name.trim(), brokerId: session.user.id },
    });
    res.json(team);
  }
  } catch (err) {
    console.error('[api/broker/teams]', err);
    if (!res.headersSent) sendError(res, 500, 'Failed to process request');
  }
}
