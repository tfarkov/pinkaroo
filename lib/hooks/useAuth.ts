import { useSession } from 'next-auth/react';
import type { Role } from '../constants';

export function useAuth() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const u = session?.user as { role?: Role; brokerId?: string | null; isTeamLead?: boolean } | undefined;
  const role = u?.role;
  const isSystemAdmin = role === 'SYSTEM_ADMIN';
  const isOfficeAdmin = role === 'OFFICE_ADMIN';
  const isAdmin = isSystemAdmin; // legacy alias
  const isRealtor = role === 'REALTOR';
  const isBroker = role === 'BROKER';
  const isTeamLead = !!(isRealtor && u?.isTeamLead);
  const canManageBrokersRealtors = isSystemAdmin || isOfficeAdmin;
  const canManageSystemSettings = isSystemAdmin;
  const canEditRealtorProfiles = canManageBrokersRealtors || isBroker || isTeamLead;
  return {
    isAuthenticated,
    role,
    isSystemAdmin,
    isOfficeAdmin,
    isAdmin,
    isRealtor,
    isBroker,
    isTeamLead,
    canManageBrokersRealtors,
    canManageSystemSettings,
    canEditRealtorProfiles,
    user: session?.user,
    status,
  };
}
