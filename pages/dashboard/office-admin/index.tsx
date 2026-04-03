import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DashboardLayout from '../../../components/DashboardLayout';
import { API, UI } from '../../../lib/constants';
import { useAuth } from '../../../lib/hooks/useAuth';
import { getMockBrokers, getMockRealtors } from '../../../lib/mockData';

export default function OfficeAdminDashboardPage() {
  const { isOfficeAdmin } = useAuth();

  const { data: brokers = [] } = useQuery({
    queryKey: ['office-admin-brokers'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_BROKERS, { credentials: 'include' });
      if (!res.ok) return getMockBrokers();
      return res.json();
    },
    enabled: isOfficeAdmin,
  });

  const { data: realtors = [] } = useQuery({
    queryKey: ['office-admin-realtors'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_REALTORS, { credentials: 'include' });
      if (!res.ok) return getMockRealtors();
      return res.json();
    },
    enabled: isOfficeAdmin,
  });
  const { data: awaitingMls = [] } = useQuery({
    queryKey: ['office-admin-awaiting-mls'],
    queryFn: async () => {
      const res = await fetch(API.OFFICE_ADMIN_AWAITING_MLS, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOfficeAdmin,
  });

  const { data: weeklyKpis } = useQuery({
    queryKey: ['office-admin-weekly-kpis'],
    queryFn: async () => {
      const res = await fetch(API.ADMIN_WEEKLY_KPIS, { credentials: 'include' });
      if (!res.ok) return { labels: [], newBrokers: [], newRealtors: [], assignmentUpdates: [] };
      return res.json();
    },
    enabled: isOfficeAdmin,
  });

  const weeklyKpiChartData = useMemo(() => ({
    labels: weeklyKpis?.labels ?? [],
    datasets: [
      {
        label: 'New brokers',
        data: weeklyKpis?.newBrokers ?? [],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'New realtors',
        data: weeklyKpis?.newRealtors ?? [],
        borderColor: 'rgba(219, 39, 119, 1)',
        backgroundColor: 'rgba(219, 39, 119, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Assignment updates',
        data: weeklyKpis?.assignmentUpdates ?? [],
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: 'rgba(14, 165, 233, 0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }), [weeklyKpis]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true as const,
          pointStyle: 'circle' as const,
          boxWidth: 10,
          boxHeight: 10,
          color: '#334155',
          font: { size: 12, weight: 600 as const },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b' },
        grid: { color: 'rgba(148, 163, 184, 0.15)', drawBorder: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b', precision: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.15)', drawBorder: false },
      },
    },
  };

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

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{UI.AWAITING_MLS_TITLE}</h2>
        <p className="text-sm text-slate-600 mb-4">{UI.AWAITING_MLS_HELP}</p>
        {(awaitingMls as { id: string; title?: string; user?: { name?: string } }[]).length === 0 ? (
          <p className="text-slate-500 text-sm">No listings waiting for MLS filing.</p>
        ) : (
          <ul className="space-y-2">
            {(awaitingMls as { id: string; title?: string; user?: { name?: string } }[]).map((row) => (
              <li key={row.id} className="border border-slate-200 rounded-md p-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="font-medium text-slate-900">{row.title ?? row.id}</span>
                <span className="text-slate-600">Realtor: {row.user?.name ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
        <h2 className="text-xl font-bold text-slate-900 mb-4">Weekly KPI trend</h2>
        <div className="h-[280px] min-h-0 w-full mb-2">
          <Line data={weeklyKpiChartData} options={chartOptions} />
        </div>
      </section>

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
