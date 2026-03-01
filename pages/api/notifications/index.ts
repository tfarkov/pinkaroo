import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { id: true, name: true, email: true, role: true } },
      },
    });
    res.json(notifications);
    return;
  }
  if (req.method === 'POST') {
    const { toUserId, message } = req.body ?? {};
    if (!toUserId || typeof toUserId !== 'string' || !message || typeof message !== 'string') {
      sendError(res, 400, 'toUserId and message required');
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) {
      sendError(res, 400, 'message required');
      return;
    }
    const role = session.user.role as string;
    // Users can only message realtors/brokers (e.g. from Contact a Realtor). Users cannot message each other.
    if (role === 'USER') {
      const toUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { role: true },
      });
      if (!toUser || (toUser.role !== 'REALTOR' && toUser.role !== 'BROKER')) {
        sendError(res, 403, 'You can only message realtors or brokers from Contact a Realtor.');
        return;
      }
    } else if (role === 'REALTOR' || role === 'BROKER') {
      // Brokers and realtors can only message users who have already contacted them (e.g. about a listing).
      const toUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { role: true },
      });
      if (toUser?.role === 'USER') {
        const userContactedFirst = await prisma.notification.findFirst({
          where: {
            userId: session.user.id,
            fromUserId: toUserId,
            type: 'MESSAGE',
          },
        });
        if (!userContactedFirst) {
          sendError(res, 403, 'You can only message users who have contacted you first (e.g. via Contact a Realtor).');
          return;
        }
      }
    }
    // Admins can message any signed-up user (no "contacted first" check).
    await prisma.notification.create({
      data: {
        message: trimmed,
        type: 'MESSAGE',
        userId: toUserId,
        fromUserId: session.user.id,
      },
    });
    res.status(201).end();
    return;
  }
  if (req.method === 'PUT') {
    const { id, read, replyText, flagged } = req.body ?? {};
    if (!id || typeof id !== 'string') {
      sendError(res, 400, 'id required');
      return;
    }
    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
      include: { fromUser: { select: { id: true } } },
    });
    if (!notification) {
      sendError(res, 404, 'Notification not found');
      return;
    }
    const data: { read?: boolean; replyText?: string; repliedAt?: Date; flagged?: boolean } = {};
    if (typeof read === 'boolean') data.read = read;
    if (typeof flagged === 'boolean') data.flagged = flagged;
    if (typeof replyText === 'string' && replyText.trim()) {
      data.replyText = replyText.trim();
      data.repliedAt = new Date();
    }
    await prisma.notification.update({ where: { id }, data });

    // If this was a reply to a message from another user, notify the sender
    const replyContent = typeof replyText === 'string' ? replyText.trim() : '';
    if (replyContent && notification.fromUserId) {
      const senderName = session.user.name || session.user.email || 'Someone';
      await prisma.notification.create({
        data: {
          message: `Reply from ${senderName}: ${replyContent}`,
          type: 'MESSAGE',
          userId: notification.fromUserId,
          fromUserId: session.user.id,
        },
      });
    }
    res.status(204).end();
  }
  } catch (err) {
    console.error('[api/notifications]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
