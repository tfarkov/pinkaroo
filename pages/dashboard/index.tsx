import { useAuth } from '../../lib/hooks/useAuth';
import { API, CLIENT_STATUSES, UI } from '../../lib/constants';
import { getMockClients, getMockInteractions } from '../../lib/mockData';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';

export default function Dashboard() {
  const { role, user } = useAuth();
  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const res = await fetch(API.CLIENTS);
        if (res.ok) return res.json();
        return getMockClients();
      } catch {
        return getMockClients();
      }
    },
  });
  const { data: interactions } = useQuery({
    queryKey: ['interactions'],
    queryFn: async () => {
      try {
        const res = await fetch(API.CLIENTS_INTERACTIONS);
        if (res.ok) return res.json();
        return getMockInteractions();
      } catch {
        return getMockInteractions();
      }
    },
    enabled: role === 'REALTOR',
  });

  const clientChartData = useMemo(() => ({
    labels: [...CLIENT_STATUSES],
    datasets: [{
      label: 'Client Status Distribution',
      data: CLIENT_STATUSES.map(status => (clients ?? []).filter((c: { status?: string }) => c.status === status).length),
      backgroundColor: 'rgba(236, 72, 153, 0.6)',
    }],
  }), [clients]);

  const interactionChartData = useMemo(() => {
    const list = interactions ?? [];
    return {
      labels: list.length > 0 ? list.map((i: { date?: string }) => new Date(i.date ?? 0).toLocaleDateString()) : ['No data'],
      datasets: [{
        label: 'Interactions Over Time',
        data: list.length > 0 ? list.map(() => 1) : [0],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };
  }, [interactions]);

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">{role} {UI.DASHBOARD}</h1>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
          <div className="h-[280px] min-h-0 w-full">
            <Bar
              data={clientChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: true } },
              }}
            />
          </div>
        </div>
        {role === 'REALTOR' && (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
            <div className="h-[280px] min-h-0 w-full">
              <Line
                data={interactionChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                  scales: {
                    x: { display: true },
                    y: { display: true, beginAtZero: true },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* CRM - Realtor & Broker */}
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-slate-900">CRM – Client management</h2>
            <Link href="/dashboard/crm" className="btn-primary shrink-0">
              Open CRM
            </Link>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Add clients, track status, and log interactions (calls, meetings, emails).
          </p>
          {role === 'REALTOR' && (clients?.length ?? 0) > 0 && (
            <>
              <p className="text-slate-700 font-medium mb-2">
                Recent clients ({clients?.length ?? 0} total)
              </p>
              <ul className="space-y-2 mb-4">
                {(clients ?? []).slice(0, 5).map((c: { id: string; name?: string; status?: string; email?: string }) => (
                  <li key={c.id}>
                    <Link href="/dashboard/crm" className="block p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-accent-200 transition-colors">
                      <span className="font-medium text-slate-900">{c.name ?? '—'}</span>
                      <span className="text-slate-500 text-sm"> — {c.status ?? '—'}</span>
                      {c.email && <span className="text-slate-500 text-sm block truncate">{c.email}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {(interactions?.length ?? 0) > 0 && (
                <p className="text-slate-500 text-sm">
                  {(interactions ?? []).length} interaction(s) logged.
                </p>
              )}
            </>
          )}
          {(role !== 'REALTOR' || !clients?.length) && (
            <p className="text-slate-500 text-sm">
              {role === 'REALTOR' ? 'No clients yet. Go to CRM to add your first client.' : 'Use CRM to manage your clients and leads.'}
            </p>
          )}
        </div>
    </DashboardLayout>
  );
}
