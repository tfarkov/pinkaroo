import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES, NOTIFICATION_TYPES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

/**
 * Listing approval: PENDING → APPROVED/REJECTED. Approved listings without an MLS id are not
 * shown on the public site; office staff file them on MLS outside the app, then MLS sync
 * brings live inventory (mlsId + ACTIVE) onto the site. Office admins receive a system
 * notification when a listing is approved for MLS filing.
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
    const listingBefore = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true, title: true },
    });
    if (!listingBefore) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }
    if (listingBefore.status !== 'PENDING') {
      res.status(400).json({ success: false, error: 'Only pending listings can be approved or rejected' });
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
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId: session.user.id,
          action: 'LISTING_STATUS_UPDATED',
          entityType: 'Listing',
          entityId: updated.id,
          details: { status, rejectionReason: status === 'REJECTED' ? (rejectionReason ?? null) : null },
        },
      });
      if (status === 'APPROVED') {
        const admins = await tx.user.findMany({
          where: { role: { in: ['OFFICE_ADMIN', 'SYSTEM_ADMIN'] } },
          select: { id: true },
        });
        const title = listingBefore.title?.trim() || 'Listing';
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((a: { id: string }) => ({
              userId: a.id,
              type: 'SYSTEM',
              message: NOTIFICATION_MESSAGES.LISTING_APPROVED_AWAITING_MLS(title, id),
            })),
          });
        }
      }
      const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
      if (io) io.to(listingBefore.userId).emit('notification', { message: NOTIFICATION_MESSAGES.YOUR_LISTING_STATUS(status.toLowerCase()), id: updated.id });
    });
    res.json({ success: true, changed: true });
  } catch (err) {
    console.error('[api/broker/approve-listing]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
