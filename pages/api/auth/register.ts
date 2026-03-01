import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from './[...nextauth]';
import { ROLES } from '../../../lib/constants';
import { requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['POST'])) return;
  const { email, password, name, role = 'USER' } = req.body || {};
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    sendError(res, 400, 'Email and password required');
    return;
  }
  if (password.length < 8) {
    sendError(res, 400, 'Password must be at least 8 characters');
    return;
  }
  if (!ROLES.includes(role)) {
    sendError(res, 400, 'Invalid role');
    return;
  }
  try {
  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) {
    sendError(res, 400, 'Email already registered');
    return;
  }
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: hashed,
      name: name?.trim() || null,
      role,
    },
    select: { id: true, email: true, name: true, role: true },
  });
  res.status(201).json(user);
  } catch (err) {
    console.error('[api/auth/register]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
