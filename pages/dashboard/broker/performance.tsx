import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';
import { getMockBrokerPerformance } from '../../../lib/mockData';

type TeamPerf = {
  id: string;
  name: string;
  targets: { listings: number; revenue: number; interactions: number };
  actual: { listings: number; revenue: number; interactions: number };
};

export default function BrokerPerformancePage() {
  const { isBroker } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['broker-performance'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_PERFORMANCE, { credentials: 'include' });
      if (!res.ok) return getMockBrokerPerformance();
      return res.json();
    },
    enabled: isBroker,
  });

  if (!isBroker) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">{UI.ACCESS_DENIED}</p>
      </DashboardLayout>
    );
  }

  const teams = (data?.teamPerformance ?? []) as TeamPerf[];
  const realtors = (data?.realtorPerformance ?? []) as { id: string; name: string; listings: number; revenue: number; interactions: number }[];

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.BROKER_PERFORMANCE}</h1>
      {isLoading ? (
        <p className="text-slate-500">{UI.LOADING}</p>
      ) : (
        <>
          <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Team KPI attainment</h2>
            {teams.length === 0 ? (
              <p className="text-slate-500 text-sm">No teams available yet.</p>
            ) : (
              <ul className="space-y-3">
                {teams.map((team) => (
                  <li key={team.id} className="border border-slate-200 rounded-md p-3">
                    <p className="font-semibold text-slate-900">{team.name}</p>
                    <p className="text-sm text-slate-600">
                      Listings: {team.actual.listings}/{team.targets.listings} · Revenue: ${Math.round(team.actual.revenue).toLocaleString()}/${Math.round(team.targets.revenue).toLocaleString()} · Interactions: {team.actual.interactions}/{team.targets.interactions}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Realtor leaderboard</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-3 text-slate-700">Realtor</th>
                    <th className="text-left p-3 text-slate-700">Listings</th>
                    <th className="text-left p-3 text-slate-700">Revenue</th>
                    <th className="text-left p-3 text-slate-700">Interactions</th>
                  </tr>
                </thead>
                <tbody>
                  {realtors.map((realtor) => (
                    <tr key={realtor.id} className="border-b border-slate-200">
                      <td className="p-3 text-slate-900">{realtor.name}</td>
                      <td className="p-3 text-slate-700">{realtor.listings}</td>
                      <td className="p-3 text-slate-700">${Math.round(realtor.revenue).toLocaleString()}</td>
                      <td className="p-3 text-slate-700">{realtor.interactions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </DashboardLayout>
  );
}
