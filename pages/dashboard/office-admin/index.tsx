import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';

export default function OfficeAdminDashboardPage() {
  const { isOfficeAdmin } = useAuth();

  const { data: brokers = [] } = useQuery({
    queryKey: ['office-admin-brokers'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_BROKERS, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOfficeAdmin,
  });

  const { data: realtors = [] } = useQuery({
    queryKey: ['office-admin-realtors'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_REALTORS, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOfficeAdmin,
  });

  if (!isOfficeAdmin) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.OFFICE_ADMIN_DASHBOARD}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Brokers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{brokers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Realtors</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{realtors.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Assignments center</p>
          <Link href="/admin" className="text-accent-600 hover:text-accent-700 font-medium text-sm">Open management →</Link>
        </div>
      </div>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Brokers overview</h2>
        <ul className="space-y-2">
          {(brokers as { id: string; name?: string; teamMembers?: unknown[] }[]).slice(0, 10).map((broker) => (
            <li key={broker.id} className="border border-slate-200 rounded-md p-3 text-sm">
              <span className="font-medium text-slate-900">{broker.name ?? 'Unnamed broker'}</span>
              <span className="text-slate-600"> · Realtors: {broker.teamMembers?.length ?? 0}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-3">Realtors needing assignment</h2>
        <ul className="space-y-2">
          {(realtors as { id: string; name?: string; brokerId?: string | null }[]).filter((r) => !r.brokerId).slice(0, 20).map((realtor) => (
            <li key={realtor.id} className="border border-slate-200 rounded-md p-3 text-sm">
              <span className="font-medium text-slate-900">{realtor.name ?? 'Unnamed realtor'}</span>
              <span className="text-slate-600"> · Unassigned</span>
            </li>
          ))}
          {(realtors as { brokerId?: string | null }[]).every((r) => !!r.brokerId) && (
            <li className="text-slate-500 text-sm">All realtors are assigned to a broker.</li>
          )}
        </ul>
      </section>
    </DashboardLayout>
  );
}
