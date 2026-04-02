import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useMemo } from 'react';
import { API, UI } from '../../../lib/constants';
import { getMockBrokerStats } from '../../../lib/mockData';
import DashboardLayout from '../../../components/DashboardLayout';

export default function BrokerDashboard() {
  const { data: teamStats } = useQuery({
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
  });
  const { data: performanceData } = useQuery({
    queryKey: ['broker-performance'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_PERFORMANCE, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load performance');
      return res.json();
    },
  });
  const { data: workloadData } = useQuery({
    queryKey: ['broker-workload'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_WORKLOAD, { credentials: 'include' });
      if (!res.ok) return { assignments: [], capacity: [] };
      return res.json();
    },
  });
  const { data: clientOversight } = useQuery({
    queryKey: ['broker-client-oversight'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_CLIENT_OVERSIGHT, { credentials: 'include' });
      if (!res.ok) return { stalled: [] };
      return res.json();
    },
  });
  const { data: commsData } = useQuery({
    queryKey: ['broker-comms'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_COMMS, { credentials: 'include' });
      if (!res.ok) return { broadcasts: [] };
      return res.json();
    },
  });
  const { data: adminControlData } = useQuery({
    queryKey: ['broker-admin-controls'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_ADMIN_CONTROLS, { credentials: 'include' });
      if (!res.ok) return { auditLogs: [] };
      return res.json();
    },
  });

  const listingsChartData = useMemo(() => {
    const realtors = teamStats?.realtors ?? [];
    const labels = realtors.length > 0 ? realtors.map((r: { name?: string }) => r.name ?? '') : ['—'];
    const data = realtors.length > 0 ? realtors.map((r: { listingsCount?: number }) => r.listingsCount ?? 0) : [0];
    return {
      labels,
      datasets: [{
        label: UI.LISTINGS_PER_REALTOR,
        data,
        backgroundColor: 'rgba(236, 72, 153, 0.6)',
      }],
    };
  }, [teamStats]);

  const approvalChartData = useMemo(() => ({
    labels: [UI.CHART_APPROVED, UI.CHART_PENDING, UI.CHART_REJECTED],
    datasets: [{
      data: [
        teamStats?.approved ?? 0,
        teamStats?.pending ?? 0,
        teamStats?.rejected ?? 0,
      ],
      backgroundColor: ['rgba(34,197,94,0.6)', 'rgba(234,179,8,0.6)', 'rgba(239,68,68,0.6)'],
    }],
  }), [teamStats]);

  const revenueChartData = useMemo(() => {
    const months = teamStats?.months ?? [];
    const revenue = teamStats?.revenue ?? [];
    return {
      labels: months.length > 0 ? months : ['—'],
      datasets: [{
        label: 'Revenue Over Time',
        data: revenue.length > 0 ? revenue : [0],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    };
  }, [teamStats]);

  const realtorProgressChartData = useMemo(() => {
    const realtors = teamStats?.realtors ?? [];
    return {
      labels: realtors.length > 0 ? realtors.map((r: { name?: string }) => r.name ?? '—') : ['—'],
      datasets: [
        {
          label: 'Listings',
          data: realtors.length > 0 ? realtors.map((r: { listingsCount?: number }) => r.listingsCount ?? 0) : [0],
          backgroundColor: 'rgba(236, 72, 153, 0.6)',
        },
        {
          label: 'Interactions',
          data: realtors.length > 0 ? realtors.map((r: { interactionsCount?: number }) => r.interactionsCount ?? 0) : [0],
          backgroundColor: 'rgba(99, 102, 241, 0.6)',
        },
      ],
    };
  }, [teamStats]);

  const teams = (teamStats?.teams ?? []) as { id: string; name: string; _count?: { members?: number } }[];
  const availableRealtors = (teamStats?.availableRealtors ?? []) as { id: string; name?: string; email?: string }[];
  const openAssignments = ((workloadData?.assignments as { status?: string }[] | undefined) ?? []).filter((item) => item.status !== 'DONE').length;
  const atRiskClients = ((clientOversight?.stalled as unknown[] | undefined) ?? []).length;
  const broadcastCount = ((commsData?.broadcasts as unknown[] | undefined) ?? []).length;
  const auditEventCount = ((adminControlData?.auditLogs as unknown[] | undefined) ?? []).length;
  const teamPerformance = ((performanceData?.teamPerformance as { actual?: { revenue?: number }; targets?: { revenue?: number } }[] | undefined) ?? []);
  const teamsMeetingRevenueTarget = teamPerformance.filter((item) => (item.actual?.revenue ?? 0) >= (item.targets?.revenue ?? 0)).length;

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">Broker {UI.DASHBOARD}</h1>
        <p className="text-slate-600 mb-6">Team count: {teamStats?.teamCount ?? 0}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Teams managed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats?.teamCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Available realtors</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{availableRealtors.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Pending approvals</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{teamStats?.pending ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Open assignments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{openAssignments}</p>
            <Link href="/dashboard/broker/workload" className="text-sm text-accent-600 hover:text-accent-700">Manage workload →</Link>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">At-risk clients</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{atRiskClients}</p>
            <Link href="/dashboard/broker/client-oversight" className="text-sm text-accent-600 hover:text-accent-700">Open oversight →</Link>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Recent broadcasts</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{broadcastCount}</p>
            <Link href="/dashboard/broker/communications" className="text-sm text-accent-600 hover:text-accent-700">Open comms →</Link>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Teams hitting revenue targets</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{teamsMeetingRevenueTarget}/{teamPerformance.length || 0}</p>
            <Link href="/dashboard/broker/admin-controls" className="text-sm text-accent-600 hover:text-accent-700">Review controls →</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-lg font-bold text-slate-900">Management center</h2>
            <span className="text-sm text-slate-500">{auditEventCount} audit events logged</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/broker/performance" className="btn-secondary">Performance</Link>
            <Link href="/dashboard/broker/workload" className="btn-secondary">Workload</Link>
            <Link href="/dashboard/broker/client-oversight" className="btn-secondary">Client oversight</Link>
            <Link href="/dashboard/broker/communications" className="btn-secondary">Communications</Link>
            <Link href="/dashboard/broker/admin-controls" className="btn-secondary">Admin controls</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{UI.TEAM_MANAGEMENT}</h2>
              <p className="text-slate-600 text-sm mt-1">Create teams and assign realtors. Designate team leads to allow them to edit realtor profiles.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/broker/team" className="btn-primary shrink-0">
                Manage teams
              </Link>
              <Link href="/dashboard/broker/realtors" className="btn-secondary shrink-0">
                Realtor dashboards
              </Link>
            </div>
          </div>
          {teams.length > 0 && (
            <ul className="space-y-2">
              {teams.slice(0, 5).map((team) => (
                <li key={team.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  {team.name} · {(team._count?.members ?? 0)} member{(team._count?.members ?? 0) !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Available realtors</h2>
          {availableRealtors.length === 0 ? (
            <p className="text-slate-500 text-sm">All realtors are assigned to teams.</p>
          ) : (
            <ul className="space-y-2">
              {availableRealtors.slice(0, 8).map((realtor) => (
                <li key={realtor.id} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-slate-900 font-medium">{realtor.name ?? 'Unnamed realtor'}</span>
                    <Link href={`/dashboard/broker/realtors/${encodeURIComponent(realtor.id)}`} className="text-accent-600 hover:text-accent-700">
                      View realtor dashboard →
                    </Link>
                  </div>
                  <p className="text-slate-500">{realtor.email ?? 'No email'}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Realtor progress</h2>
            <div className="h-[280px] min-h-0 w-full">
              <Bar
                data={realtorProgressChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="h-[280px] min-h-0 w-full">
              <Bar
                data={listingsChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="h-[280px] min-h-0 w-full">
              <Pie
                data={approvalChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: true, position: 'bottom' } },
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="h-[280px] min-h-0 w-full">
              <Line
                data={revenueChartData}
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

          {/* CRM */}
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">CRM – Client management</h2>
              <Link href="/dashboard/crm" className="btn-primary shrink-0">
                Open CRM
              </Link>
            </div>
            <p className="text-slate-600 text-sm mb-2">
              Manage your clients, leads, and interactions in one place.
            </p>
            <p className="text-slate-500 text-sm">
              Add clients, track status (lead → qualified → closed), and log calls, meetings, and emails.
            </p>
          </div>
        </div>
    </DashboardLayout>
  );
}
