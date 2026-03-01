import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES, NOTIFICATION_MESSAGES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

/**
 * CRM Client Management: Full CRUD for clients (name, email, phone, notes, status:
 * LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED). Interactions log via /api/clients/interactions
 * and /api/clients/[id]/interactions (paginated). Prisma indexes on Client.status and Client.userId
 * for faster filtering/sorting.
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
    const clients = await prisma.client.findMany({ where: { userId: session.user.id } });
    res.json(clients);
    return;
  }
  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown> & { linkedUserId?: string; fromUserId?: string; email?: string };
    const linkedId = body.linkedUserId ?? body.fromUserId;
    // Only allow adding users (USER role) as clients, not other brokers or realtors.
    if (linkedId && typeof linkedId === 'string') {
      const linkedUser = await prisma.user.findUnique({ where: { id: linkedId }, select: { role: true } });
      if (!linkedUser || linkedUser.role !== 'USER') {
        sendError(res, 403, 'Only users (consumers) can be added as clients, not other realtors or brokers.');
        return;
      }
    } else if (body.email && typeof body.email === 'string' && body.email.trim()) {
      const byEmail = await prisma.user.findUnique({ where: { email: body.email.trim() }, select: { role: true } });
      if (byEmail && byEmail.role !== 'USER') {
        sendError(res, 403, 'Only users (consumers) can be added as clients, not other realtors or brokers.');
        return;
      }
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      sendError(res, 400, 'name is required');
      return;
    }
    const email = typeof body.email === 'string' ? body.email.trim() || null : null;
    const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null;
    const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
    const status = typeof body.status === 'string' && ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED'].includes(body.status) ? body.status : 'LEAD';
    const client = await prisma.client.create({
      data: { name, email, phone, notes, status: status as 'LEAD', userId: session.user.id },
    });
    const io = (global as { io?: { to: (id: string) => { emit: (e: string, d: unknown) => void } } }).io;
    if (io) io.to(session.user.id).emit('notification', { message: NOTIFICATION_MESSAGES.NEW_CLIENT_ADDED });
    res.json(client);
  }
  } catch (err) {
    console.error('[api/clients]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
