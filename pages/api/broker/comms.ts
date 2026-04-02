import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, isSafeId, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  const brokerId = session.user.id;
  try {
    if (req.method === 'GET') {
      const [templates, broadcasts, teams] = await Promise.all([
        prisma.commsTemplate.findMany({
          where: { brokerId },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        }),
        prisma.brokerBroadcast.findMany({
          where: { brokerId },
          include: {
            team: { select: { id: true, name: true } },
            sentBy: { select: { id: true, name: true, email: true } },
            template: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        prisma.team.findMany({
          where: { brokerId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
      ]);
      res.json({ templates, broadcasts, teams });
      return;
    }

    if (!applyRateLimit(req, res, 'broker-comms-write', { max: 25, windowMs: 60_000 })) return;
    const { mode } = req.body ?? {};
    if (mode === 'template') {
      const name = parseString(req.body?.name, { maxLength: 120 });
      const body = parseString(req.body?.body, { maxLength: 5000 });
      if (!name || !body) {
        sendError(res, 400, 'name and body are required');
        return;
      }
      const template = await prisma.commsTemplate.create({
        data: { brokerId, name, body },
      });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'COMMS_TEMPLATE_CREATED',
          entityType: 'CommsTemplate',
          entityId: template.id,
        },
      });
      res.status(201).json(template);
      return;
    }

    if (mode === 'broadcast') {
      const subject = parseString(req.body?.subject, { maxLength: 160 });
      const message = parseString(req.body?.message, { maxLength: 5000 });
      const teamIdRaw = req.body?.teamId;
      const templateIdRaw = req.body?.templateId;
      const teamId = isSafeId(teamIdRaw) ? teamIdRaw : null;
      const templateId = isSafeId(templateIdRaw) ? templateIdRaw : null;
      if (!subject || !message) {
        sendError(res, 400, 'subject and message are required');
        return;
      }
      if (teamId) {
        const team = await prisma.team.findFirst({ where: { id: teamId, brokerId }, select: { id: true } });
        if (!team) {
          sendError(res, 400, 'Invalid teamId');
          return;
        }
      }
      if (templateId) {
        const template = await prisma.commsTemplate.findFirst({ where: { id: templateId, brokerId }, select: { id: true } });
        if (!template) {
          sendError(res, 400, 'Invalid templateId');
          return;
        }
      }

      const recipients = await prisma.user.findMany({
        where: {
          brokerId,
          role: 'REALTOR',
          ...(teamId ? { teamId } : {}),
        },
        select: { id: true },
      });
      const broadcast = await prisma.brokerBroadcast.create({
        data: {
          brokerId,
          teamId,
          templateId,
          sentById: session.user.id,
          subject,
          message,
        },
      });
      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map((recipient) => ({
            userId: recipient.id,
            fromUserId: session.user.id,
            type: 'SYSTEM',
            message: `[Broadcast] ${subject}: ${message}`,
          })),
        });
      }
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'BROADCAST_SENT',
          entityType: 'BrokerBroadcast',
          entityId: broadcast.id,
          details: { recipientCount: recipients.length, teamId },
        },
      });
      res.status(201).json({ ...broadcast, recipientCount: recipients.length });
      return;
    }

    sendError(res, 400, 'mode must be template or broadcast');
  } catch (err) {
    console.error('[api/broker/comms]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
