import { getServerSession } from 'next-auth/next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export type SessionUser = { id: string; role?: string; brokerId?: string | null; isTeamLead?: boolean; name?: string | null; email?: string | null; image?: string | null };

export async function getSession(req: NextApiRequest, res?: NextApiResponse) {
  const session = await getServerSession(req, res ?? ({} as NextApiResponse), authOptions);
  const user = session?.user as SessionUser | undefined;
  return session ? { ...session, user } : null;
}
