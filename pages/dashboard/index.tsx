import { useAuth } from '../../lib/hooks/useAuth';
import { API, CLIENT_STATUSES, UI } from '../../lib/constants';
import { getMockClients, getMockInteractions } from '../../lib/mockData';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import BottomNav from '../../components/ui/BottomNav';

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
      data: CLIENT_STATUSES.map(status => clients?.filter(c => c.status === status).length || 0),
      backgroundColor: 'rgba(255, 105, 180, 0.6)',
    }],
  }), [clients]);

  const interactionChartData = useMemo(() => ({
    labels: interactions?.map(i => new Date(i.date).toLocaleDateString()) || [],
    datasets: [{
      label: 'Interactions Over Time',
      data: interactions?.map(i => 1) || [], // Count per day, can aggregate
      borderColor: 'rgba(255, 105, 180, 1)',
      tension: 0.1,
    }],
  }), [interactions]);

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width max-w-5xl mx-auto pb-14 md:pb-8">
        <h1 className="text-3xl font-bold text-slate-900 py-8">{role} {UI.DASHBOARD}</h1>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
          <Bar data={clientChartData} options={{ responsive: true }} />
        </div>
        {role === 'REALTOR' && (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <Line data={interactionChartData} options={{ responsive: true }} />
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
