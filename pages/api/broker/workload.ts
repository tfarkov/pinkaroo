import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../lib/session';
import { API_MESSAGES } from '../../../lib/constants';
import { applyRateLimit, isSafeId, parseFiniteInt, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient() as any;

async function getBrokerRealtorIds(brokerId: string): Promise<string[]> {
  const realtors = await prisma.user.findMany({
    where: { brokerId, role: 'REALTOR' },
    select: { id: true },
  });
  return realtors.map((r) => r.id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['GET', 'POST', 'PUT'])) return;
  const session = await getSession(req, res);
  if (!session || session.user.role !== 'BROKER') {
    sendError(res, 401, API_MESSAGES.UNAUTHORIZED);
    return;
  }
  try {
    const brokerId = session.user.id;
    const realtorIds = await getBrokerRealtorIds(brokerId);

    if (req.method === 'GET') {
      const assignments = await prisma.workloadAssignment.findMany({
        where: { brokerId },
        include: {
          realtor: { select: { id: true, name: true, email: true } },
          client: { select: { id: true, name: true, status: true } },
          listing: { select: { id: true, title: true, status: true } },
        },
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueAt: 'asc' }],
        take: 300,
      });
      const openByRealtor = new Map<string, number>();
      for (const id of realtorIds) openByRealtor.set(id, 0);
      for (const item of assignments) {
        if (item.status === 'DONE') continue;
        openByRealtor.set(item.realtorId, (openByRealtor.get(item.realtorId) ?? 0) + 1);
      }
      const realtors = await prisma.user.findMany({
        where: { id: { in: realtorIds } },
        select: { id: true, name: true, email: true, availableHours: true, teamId: true },
      });
      res.json({
        assignments,
        capacity: realtors.map((r) => ({
          ...r,
          openAssignments: openByRealtor.get(r.id) ?? 0,
        })),
      });
      return;
    }

    if (req.method === 'POST') {
      if (!applyRateLimit(req, res, 'broker-workload-create', { max: 40, windowMs: 60_000 })) return;
      const { title, details, realtorId, clientId, listingId, dueAt, priority } = req.body ?? {};
      const parsedTitle = parseString(title, { maxLength: 180 });
      if (!parsedTitle) {
        sendError(res, 400, 'title is required');
        return;
      }
      if (!isSafeId(realtorId) || !realtorIds.includes(realtorId)) {
        sendError(res, 400, 'Invalid realtorId');
        return;
      }
      if (clientId != null && (!isSafeId(clientId) || !(await prisma.client.findFirst({ where: { id: clientId, brokerId } })))) {
        sendError(res, 400, 'Invalid clientId');
        return;
      }
      if (listingId != null && (!isSafeId(listingId) || !(await prisma.listing.findFirst({ where: { id: listingId, userId: { in: realtorIds } } })))) {
        sendError(res, 400, 'Invalid listingId');
        return;
      }
      const assignment = await prisma.workloadAssignment.create({
        data: {
          brokerId,
          assignedById: session.user.id,
          title: parsedTitle,
          details: parseString(details, { maxLength: 4000, allowEmpty: true }),
          realtorId,
          clientId: isSafeId(clientId) ? clientId : null,
          listingId: isSafeId(listingId) ? listingId : null,
          dueAt: dueAt ? new Date(dueAt) : null,
          priority: parseFiniteInt(priority, { min: 1, max: 5 }) ?? 3,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'ASSIGNMENT_CREATED',
          entityType: 'WorkloadAssignment',
          entityId: assignment.id,
          details: { realtorId: assignment.realtorId, priority: assignment.priority },
        },
      });
      res.status(201).json(assignment);
      return;
    }

    if (!applyRateLimit(req, res, 'broker-workload-update', { max: 60, windowMs: 60_000 })) return;
    const { id, action, status, realtorId, dueAt, priority } = req.body ?? {};
    if (action === 'rebalance') {
      const openAssignments = await prisma.workloadAssignment.findMany({
        where: { brokerId, status: { in: ['OPEN', 'IN_PROGRESS', 'BLOCKED'] } },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      if (!openAssignments.length || !realtorIds.length) {
        res.json({ moved: 0 });
        return;
      }
      const counts = new Map<string, number>(realtorIds.map((rId) => [rId, 0]));
      for (const item of openAssignments) {
        counts.set(item.realtorId, (counts.get(item.realtorId) ?? 0) + 1);
      }
      let moved = 0;
      for (const item of openAssignments) {
        const sorted = [...counts.entries()].sort((a, b) => a[1] - b[1]);
        const leastLoaded = sorted[0]?.[0];
        const currentLoad = counts.get(item.realtorId) ?? 0;
        const leastLoad = counts.get(leastLoaded) ?? 0;
        if (!leastLoaded || leastLoaded === item.realtorId || currentLoad - leastLoad < 2) continue;
        await prisma.workloadAssignment.update({
          where: { id: item.id },
          data: { realtorId: leastLoaded },
        });
        counts.set(item.realtorId, currentLoad - 1);
        counts.set(leastLoaded, leastLoad + 1);
        moved += 1;
      }
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          brokerId,
          action: 'ASSIGNMENT_REBALANCED',
          entityType: 'WorkloadAssignment',
          details: { moved },
        },
      });
      res.json({ moved });
      return;
    }

    if (!isSafeId(id)) {
      sendError(res, 400, 'id is required');
      return;
    }
    const existing = await prisma.workloadAssignment.findFirst({ where: { id, brokerId } });
    if (!existing) {
      sendError(res, 404, 'Assignment not found');
      return;
    }
    if (realtorId != null && (!isSafeId(realtorId) || !realtorIds.includes(realtorId))) {
      sendError(res, 400, 'Invalid realtorId');
      return;
    }
    const updated = await prisma.workloadAssignment.update({
      where: { id },
      data: {
        ...(status && ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE'].includes(String(status)) ? { status } : {}),
        ...(realtorId ? { realtorId } : {}),
        ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
        ...(priority !== undefined ? { priority: parseFiniteInt(priority, { min: 1, max: 5 }) ?? existing.priority } : {}),
      },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        brokerId,
        action: 'ASSIGNMENT_UPDATED',
        entityType: 'WorkloadAssignment',
        entityId: id,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('[api/broker/workload]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
