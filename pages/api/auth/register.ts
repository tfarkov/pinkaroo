import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from './[...nextauth]';
import { applyRateLimit, parseString, requireMethod, sendError } from '../../../lib/apiHelpers';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMethod(req, res, ['POST'])) return;
  if (!applyRateLimit(req, res, 'auth-register', { max: 10, windowMs: 60_000 })) return;
  const { email, password, name } = req.body || {};
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    sendError(res, 400, 'Email and password required');
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = parseString(name, { maxLength: 120, allowEmpty: true });
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    sendError(res, 400, 'Invalid email');
    return;
  }
  if (password.length < 8) {
    sendError(res, 400, 'Password must be at least 8 characters');
    return;
  }
  try {
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    sendError(res, 400, 'Email already registered');
    return;
  }
  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: normalizedName || null,
      role: 'USER',
    },
    select: { id: true, email: true, name: true, role: true },
  });
  res.status(201).json(user);
  } catch (err) {
    console.error('[api/auth/register]', err);
    if (!res.headersSent) sendError(res, 500);
  }
}
