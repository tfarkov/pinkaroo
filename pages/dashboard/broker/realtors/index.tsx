import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { API, UI } from '../../../../lib/constants';
import { getMockBrokerStats } from '../../../../lib/mockData';

type BrokerRealtor = {
  id: string;
  name?: string | null;
  email?: string | null;
  teamId?: string | null;
  isTeamLead?: boolean | null;
  listingsCount?: number | null;
  interactionsCount?: number | null;
};

export default function BrokerRealtorsIndexPage() {
  const { isBroker, status } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ['broker-stats'],
    queryFn: async () => {
      try {
        const res = await fetch(API.BROKER_STATS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockBrokerStats();
      } catch {
        return getMockBrokerStats();
      }
    },
    enabled: isBroker,
  });

  if (status === 'loading') {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.LOADING}</p>
      </DashboardLayout>
    );
  }

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const realtors = ((stats?.realtors as BrokerRealtor[] | undefined) ?? []);
  const prioritized = [...realtors].sort((a, b) => (b.listingsCount ?? 0) - (a.listingsCount ?? 0));

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">Realtor dashboards</h1>
      <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4 mb-6">
        <p className="text-sm text-slate-600">
          Workload prioritization: realtors are ordered by active listing volume to help identify where reassignment may reduce bottlenecks.
        </p>
      </div>
      {realtors.length === 0 ? (
        <p className="text-slate-500">No realtors found.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {prioritized.map((realtor) => (
            <article key={realtor.id} className="bg-white rounded-lg shadow-card border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-900">{realtor.name ?? 'Unnamed realtor'}</h2>
              <p className="text-sm text-slate-500 mt-1">{realtor.email ?? 'No email'}</p>
              <p className="text-sm text-slate-600 mt-2">
                Listings: {realtor.listingsCount ?? 0} · Interactions: {realtor.interactionsCount ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Team: {realtor.teamId ? 'Assigned' : 'Unassigned'}{realtor.isTeamLead ? ' · Team lead' : ''}
              </p>
              <Link
                href={`/dashboard/broker/realtors/${encodeURIComponent(realtor.id)}`}
                className="inline-block mt-3 text-sm font-medium text-accent-600 hover:text-accent-700"
              >
                View realtor dashboard →
              </Link>
            </article>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
