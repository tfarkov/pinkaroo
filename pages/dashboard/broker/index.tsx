import { useQuery } from '@tanstack/react-query';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useMemo } from 'react';
import { API, UI } from '../../../lib/constants';
import Header from '../../../components/Header';
import BottomNav from '../../../components/ui/BottomNav';

export default function BrokerDashboard() {
  const { data: teamStats } = useQuery({ queryKey: ['broker-stats'], queryFn: () => fetch(API.BROKER_STATS).then(res => res.json()) });

  const listingsChartData = useMemo(() => ({
    labels: teamStats?.realtors.map(r => r.name),
    datasets: [{
      label: UI.LISTINGS_PER_REALTOR,
      data: teamStats?.realtors.map(r => r.listingsCount),
      backgroundColor: 'rgba(255, 105, 180, 0.6)',
    }],
  }), [teamStats]);

  const approvalChartData = useMemo(() => ({
    labels: [UI.CHART_APPROVED, UI.CHART_PENDING, UI.CHART_REJECTED],
    datasets: [{
      data: [teamStats?.approved, teamStats?.pending, teamStats?.rejected],
      backgroundColor: ['rgba(34,197,94,0.6)', 'rgba(234,179,8,0.6)', 'rgba(239,68,68,0.6)'],
    }],
  }), [teamStats]);

  const revenueChartData = useMemo(() => ({
    labels: teamStats?.months || [],
    datasets: [{
      label: 'Revenue Over Time',
      data: teamStats?.revenue || [],
      borderColor: 'rgba(255, 105, 180, 1)',
      tension: 0.1,
    }],
  }), [teamStats]);

  return (
    <div>
      <Header />
      <main className="p-4 max-w-5xl mx-auto pb-16 md:pb-0">
        <h1 className="text-3xl mb-4">Broker {UI.DASHBOARD}</h1>
        <p className="mb-4">Team Count: {teamStats?.teamCount || 0}</p>
        <Bar data={listingsChartData} options={{ responsive: true }} />
        <Pie data={approvalChartData} options={{ responsive: true }} />
        <Line data={revenueChartData} options={{ responsive: true }} />
      </main>
      <BottomNav />
    </div>
  );
}
