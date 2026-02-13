import { getSession as getNextAuthSession } from 'next-auth/react';
import type { NextApiRequest } from 'next';

export type SessionUser = { id: string; role?: string; name?: string | null; email?: string | null; image?: string | null };

export async function getSession(req: NextApiRequest) {
  const session = await getNextAuthSession({ req });
  const user = session?.user as SessionUser | undefined;
  return session ? { ...session, user } : null;
}
