import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import DashboardLayout from '../../../../components/DashboardLayout';
import { useAuth } from '../../../../lib/hooks/useAuth';
import { API, UI, getListingPageUrl } from '../../../../lib/constants';
import { formatPrice } from '../../../../lib/format';

type RealtorDashboardResponse = {
  realtor: {
    id: string;
    name?: string | null;
    email?: string | null;
    team?: { id: string; name: string } | null;
    isTeamLead?: boolean | null;
  };
  summary: {
    totalListings: number;
    statusCounts: Record<string, number>;
    interactionsTotal: number;
  };
  charts: {
    months: string[];
    listingActivity: number[];
    interactionActivity: number[];
  };
  recentListings: { id: string; title: string; status: string; price: number; updatedAt: string }[];
};

export default function BrokerRealtorDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isBroker, status } = useAuth();

  const { data, isLoading } = useQuery<RealtorDashboardResponse>({
    queryKey: ['broker-realtor-dashboard', id],
    queryFn: async () => {
      const res = await fetch(`${API.BROKER_REALTOR_DASHBOARD}/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load realtor dashboard');
      return res.json();
    },
    enabled: isBroker && typeof id === 'string' && id.trim().length > 0,
  });

  const progressChartData = useMemo(() => ({
    labels: ['Active', 'Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Listings by status',
        data: [
          data?.summary.statusCounts.ACTIVE ?? 0,
          data?.summary.statusCounts.PENDING ?? 0,
          data?.summary.statusCounts.APPROVED ?? 0,
          data?.summary.statusCounts.REJECTED ?? 0,
        ],
        backgroundColor: ['rgba(14, 165, 233, 0.6)', 'rgba(234, 179, 8, 0.6)', 'rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
      },
    ],
  }), [data?.summary.statusCounts]);

  const activityChartData = useMemo(() => ({
    labels: data?.charts.months ?? [],
    datasets: [
      {
        label: 'Listings activity',
        data: data?.charts.listingActivity ?? [],
        borderColor: 'rgba(236, 72, 153, 1)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Interactions activity',
        data: data?.charts.interactionActivity ?? [],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
      },
    ],
  }), [data?.charts]);

  if (status === 'loading' || isLoading) {
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

  if (!data) {
    return (
      <DashboardLayout>
        <p className="py-8 text-slate-500">Realtor dashboard not found.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="py-6">
        <Link href="/dashboard/broker/realtors" className="text-sm font-medium text-accent-600 hover:text-accent-700">
          ← Back to realtor dashboards
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-slate-900">
        {data.realtor.name ?? 'Realtor'} dashboard
      </h1>
      <p className="text-slate-600 mt-2">
        {data.realtor.email ?? 'No email'} · Team: {data.realtor.team?.name ?? 'Unassigned'}{data.realtor.isTeamLead ? ' · Team lead' : ''}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Total listings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.summary.totalListings}</p>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Interactions logged</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.summary.interactionsTotal}</p>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Approved listings</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.summary.statusCounts.APPROVED ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Progress by listing status</h2>
          <div className="h-[280px]">
            <Bar
              data={progressChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Activity over time</h2>
          <div className="h-[280px]">
            <Line
              data={activityChartData}
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

      <section className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Recent listings</h2>
        {data.recentListings.length === 0 ? (
          <p className="text-slate-500">No listings yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.recentListings.map((listing) => {
              const listingUrl = getListingPageUrl(listing.id);
              return (
                <li key={listing.id} className="border border-slate-200 rounded-md p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">{listing.title}</p>
                      <p className="text-sm text-slate-500">
                        {listing.status} · Updated {new Date(listing.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-accent-600">{formatPrice(listing.price ?? 0)}</p>
                      {listingUrl && (
                        <Link href={listingUrl} className="text-sm text-accent-600 hover:text-accent-700">
                          View listing →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardLayout>
  );
}
