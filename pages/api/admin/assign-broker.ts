import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';
import { canManageBrokersAndRealtors, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * Admin assigns realtor to broker (or unassigns with brokerId null). Optimistic updates
 * on the client for responsive UI; notification sent to realtor.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['POST'])) return;
  const session = await getSession(req, res);
  if (!session || !canManageBrokersAndRealtors(session.user.role)) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  const { realtorId, brokerId } = req.body ?? {};
  if (typeof realtorId !== 'string' || !realtorId.trim()) {
    sendError(res, 400, 'realtorId is required');
    return;
  }
  const realtor = await prisma.user.update({
    where: { id: realtorId.trim() },
    data: { brokerId: typeof brokerId === 'string' ? brokerId.trim() || null : null },
  });
  const io = (globalThis as { io?: { to: (id: string) => { emit: (event: string, data: unknown) => void } } }).io;
  if (io) io.to(realtorId).emit('notification', { message: NOTIFICATION_MESSAGES.ASSIGNED_TO_BROKER });
  res.json(realtor);
  } catch (err) {
    console.error('[api/admin/assign-broker]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
