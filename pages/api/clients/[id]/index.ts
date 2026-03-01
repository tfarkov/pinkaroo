import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from '../../../../lib/session';
import { PrismaClient } from '@prisma/client';
import { API_MESSAGES } from '../../../../lib/constants';
import { requireMethod, requireIdParam, sendError } from '../../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'PUT', 'DELETE'])) return;
  const id = requireIdParam(req, res);
  if (id === null) return;
  const session = await getSession(req, res);
  const role = session?.user?.role as string | undefined;
  if (!session || (role !== 'REALTOR' && role !== 'BROKER')) {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
  if (req.method === 'GET') {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client || client.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    let linkedUserId: string | null = null;
    if (client.email?.trim()) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: client.email.trim() },
        select: { id: true },
      });
      if (userByEmail) linkedUserId = userByEmail.id;
    }
    res.json({ ...client, linkedUserId });
    return;
  }
  if (req.method === 'PUT') {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    const client = await prisma.client.update({ where: { id }, data: req.body });
    res.json(client);
    return;
  }
  if (req.method === 'DELETE') {
    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      sendError(res, 403, API_MESSAGES.FORBIDDEN);
      return;
    }
    await prisma.client.delete({ where: { id } });
    res.status(204).end();
  }
  } catch (err) {
    console.error('[api/clients/[id]]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
