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
        const res = await fetch(API.BROKER_STATS);
        if (res.ok) return res.json();
        return getMockBrokerStats();
      } catch {
        return getMockBrokerStats();
      }
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

  return (
    <DashboardLayout>
      <h1 className="text-3xl font-bold text-slate-900 py-8">Broker {UI.DASHBOARD}</h1>
        <p className="text-slate-600 mb-6">Team count: {teamStats?.teamCount ?? 0}</p>
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
