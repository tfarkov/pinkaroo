import { useSession } from 'next-auth/react';
import type { Role } from '../constants';

export function useAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const u = session?.user as { role?: Role; brokerId?: string | null; isTeamLead?: boolean } | undefined;
  const role = u?.role;
  const isAdmin = role === 'ADMIN';
  const isRealtor = role === 'REALTOR';
  const isBroker = role === 'BROKER';
  const isTeamLead = !!(isRealtor && u?.isTeamLead);
  const canEditRealtorProfiles = isAdmin || isBroker || isTeamLead;
  return { isAuthenticated, role, isAdmin, isRealtor, isBroker, isTeamLead, canEditRealtorProfiles, user: session?.user, status };
}
