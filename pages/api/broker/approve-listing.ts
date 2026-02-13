import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES, NOTIFICATION_TYPES } from '../../../lib/constants';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession(req);
  if (!session || session.user.role !== 'BROKER') return res.status(401).json({ error: API_MESSAGES.UNAUTHORIZED });

  if (req.method === 'POST') {
    const { id, status, rejectionReason } = req.body;
    await prisma.$transaction(async (tx) => {
      const listing = await tx.listing.findUnique({ where: { id } });
      if (!listing || listing.status === status) return;
      const updated = await tx.listing.update({
        where: { id },
        data: { status, approvedBy: session.user.id, approvedAt: status === 'APPROVED' ? new Date() : null, rejectionReason: status === 'REJECTED' ? rejectionReason : null },
      });
      await tx.notification.create({
        data: { message: NOTIFICATION_MESSAGES.LISTING_STATUS_UPDATED, type: NOTIFICATION_TYPES[0], userId: listing.userId },
      });
      const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
      if (io) io.to(listing.userId).emit('notification', { message: NOTIFICATION_MESSAGES.YOUR_LISTING_STATUS(status.toLowerCase()), id: updated.id });
    });
    res.json({ success: true });
  }
}
