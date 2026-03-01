import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES, NOTIFICATION_TYPES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * Listing Approval Workflow: Realtor listings are PENDING; brokers approve/reject with reason.
 * Schema: approvedBy, approvedAt, rejectionReason. Uses Prisma index on status for fast
 * pending queries, transaction for atomic approve/reject, and notifications only on
 * actual status change (diff check) for consistency in concurrent approvals.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['POST'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const { id, status, rejectionReason } = req.body ?? {};
    if (!id || typeof id !== 'string') {
      sendError(res, 400, 'id is required');
      return;
    }
    const listingBefore = await prisma.listing.findUnique({ where: { id }, select: { id: true, status: true, userId: true } });
    if (!listingBefore) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }
    if (listingBefore.status === status) {
      res.json({ success: true, changed: false });
      return;
    }
    await prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id },
        data: {
          status,
          approvedBy: session.user.id,
          approvedAt: status === 'APPROVED' ? new Date() : null,
          rejectionReason: status === 'REJECTED' ? (rejectionReason ?? null) : null,
        },
      });
      await tx.notification.create({
        data: { message: NOTIFICATION_MESSAGES.LISTING_STATUS_UPDATED, type: NOTIFICATION_TYPES[0], userId: listingBefore.userId },
      });
      const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
      if (io) io.to(listingBefore.userId).emit('notification', { message: NOTIFICATION_MESSAGES.YOUR_LISTING_STATUS(status.toLowerCase()), id: updated.id });
    });
    res.json({ success: true, changed: true });
  } catch (err) {
    console.error('[api/broker/approve-listing]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
