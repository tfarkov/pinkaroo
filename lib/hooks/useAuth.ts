import { useSession } from 'next-auth/react';
import type { Role } from '../constants';

export function useAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const role = (session?.user as { role?: Role } | undefined)?.role;
  const isAdmin = role === 'ADMIN';
  const isRealtor = role === 'REALTOR';
  const isBroker = role === 'BROKER';
  return { isAuthenticated, role, isAdmin, isRealtor, isBroker, user: session?.user, status };
}
