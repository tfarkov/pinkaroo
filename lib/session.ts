import { getServerSession } from 'next-auth/next';
import type { NextApiRequest, NextApiResponse } from 'next';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export type SessionUser = { id: string; role?: string; brokerId?: string | null; isTeamLead?: boolean; name?: string | null; email?: string | null; image?: string | null };

/**
 * Minimal response mock so getServerSession always receives an object with .status().
 * Avoids "response.status is not a function" when res is omitted or invalid.
 */
function noopRes(): NextApiResponse {
  const noop = () => {};
  return {
    status: () => ({ json: noop, end: noop, setHeader: noop, send: noop }),
    setHeader: noop,
    send: noop,
    end: noop,
    json: noop,
  } as unknown as NextApiResponse;
}

/** Get current session for API routes; returns null if not signed in. */
export async function getSession(req: NextApiRequest, res?: NextApiResponse) {
  // NextAuth expects res to have .status() (NextApiResponse)
  const resArg =
    res && typeof (res as NextApiResponse).status === 'function'
      ? res
      : noopRes();
  const session = await getServerSession(req, resArg, authOptions);
  const user = session?.user as SessionUser | undefined;
  return session ? { ...session, user } : null;
}
