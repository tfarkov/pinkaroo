import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(notifications);
    return;
  }
  const { id } = req.body ?? {};
  if (!id || typeof id !== 'string') {
    sendError(res, 400, 'id is required');
    return;
  }
  const notification = await prisma.notification.findFirst({ where: { id, userId: session.user.id } });
  if (!notification) {
    sendError(res, 404, 'Notification not found');
    return;
  }
  await prisma.notification.update({ where: { id }, data: { read: true } });
  res.status(204).end();
  } catch (err) {
    console.error('[api/notifications/notifications]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
