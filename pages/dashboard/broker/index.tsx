import { useQuery } from '@tanstack/react-query';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useMemo } from 'react';
import { API, UI } from '../../../lib/constants';
import { getMockBrokerStats } from '../../../lib/mockData';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import BottomNav from '../../../components/ui/BottomNav';

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
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl mx-auto pb-14 md:pb-8">
        <h1 className="text-3xl font-bold text-slate-900 py-8">Broker {UI.DASHBOARD}</h1>
        <p className="text-slate-600 mb-6">Team count: {teamStats?.teamCount ?? 0}</p>
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <Bar data={listingsChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <Pie data={approvalChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <Line data={revenueChartData} options={{ responsive: true }} />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
