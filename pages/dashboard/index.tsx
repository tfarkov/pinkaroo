import { useAuth } from '../../lib/hooks/useAuth';
import { API, CLIENT_STATUSES, UI } from '../../lib/constants';
import { getMockClients, getMockInteractions } from '../../lib/mockData';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { getListingPageUrl } from '../../lib/constants';
import { formatPrice } from '../../lib/format';

type DashboardListing = {
  id: string;
  title?: string;
  status?: string;
  price?: number;
  updatedAt?: string;
};

export default function Dashboard() {
  const { role, user } = useAuth();
  const canUseCrm = role === 'REALTOR' || role === 'BROKER' || role === 'ADMIN';
  const { favorites } = useFavorites();
  const { notifications } = useNotifications();
  const userNotifications = useMemo(
    () => notifications.filter((n) => n.fromUser?.role === 'REALTOR' || n.fromUser?.role === 'BROKER').slice(0, 5),
    [notifications]
  );

  const { data: myListingsData } = useQuery({
    queryKey: ['my-listings-dashboard', role, user?.id],
    queryFn: async () => {
      const res = await fetch(`${API.LISTINGS}?mine=1&page=0`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load my listings');
      return res.json();
    },
    enabled: role === 'USER',
  });
  const myListings = ((myListingsData?.listings as DashboardListing[] | undefined) ?? []).slice(0, 5);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const res = await fetch(API.CLIENTS, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockClients();
      } catch {
        return getMockClients();
      }
    },
  });
  const { data: interactionsRaw } = useQuery({
    queryKey: ['interactions', 0],
    queryFn: async () => {
      try {
        const res = await fetch(`${API.CLIENTS_INTERACTIONS}?page=0&limit=100`, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockInteractions();
      } catch {
        return getMockInteractions();
      }
    },
    enabled: role === 'REALTOR',
  });
  const interactions = Array.isArray(interactionsRaw) ? interactionsRaw : (interactionsRaw?.interactions ?? []);

  const { data: brokerStats } = useQuery({
    queryKey: ['broker-stats'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_STATS, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load broker stats');
      return res.json();
    },
    enabled: role === 'BROKER',
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

      {role === 'USER' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <p className="text-sm text-slate-500">My listings</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{myListingsData?.listings?.length ?? 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <p className="text-sm text-slate-500">My favourites</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{favorites.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Messages from realtors</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{userNotifications.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900">My listings</h2>
                <Link href="/listings" className="text-sm font-medium text-accent-600 hover:text-accent-700">Browse listings</Link>
              </div>
              {myListings.length === 0 ? (
                <p className="text-sm text-slate-500">No listings yet.</p>
              ) : (
                <ul className="space-y-2">
                  {myListings.map((listing) => {
                    const url = getListingPageUrl(listing.id);
                    return (
                      <li key={listing.id} className="border border-slate-200 rounded-md p-3">
                        <p className="font-medium text-slate-900">{listing.title ?? 'Listing'}</p>
                        <p className="text-sm text-slate-500">
                          {listing.status ?? '—'} · {formatPrice(listing.price ?? 0)}
                        </p>
                        {url && (
                          <Link href={url} className="text-sm text-accent-600 hover:text-accent-700">
                            View listing →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-900">My favourites</h2>
                <Link href="/favorites" className="text-sm font-medium text-accent-600 hover:text-accent-700">Open favourites</Link>
              </div>
              {favorites.length === 0 ? (
                <p className="text-sm text-slate-500">No favourites yet.</p>
              ) : (
                <ul className="space-y-2">
                  {favorites.slice(0, 5).map((favorite) => {
                    const listingId = favorite.listing?.id;
                    const url = getListingPageUrl(listingId);
                    return (
                      <li key={favorite.id} className="border border-slate-200 rounded-md p-3">
                        <p className="font-medium text-slate-900">{favorite.listing?.title ?? 'Listing'}</p>
                        {url && (
                          <Link href={url} className="text-sm text-accent-600 hover:text-accent-700">
                            View listing →
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Communications with realtors</h2>
              <Link href="/dashboard/notifications" className="text-sm font-medium text-accent-600 hover:text-accent-700">
                Open notifications
              </Link>
            </div>
            {userNotifications.length === 0 ? (
              <p className="text-sm text-slate-500">No recent messages from realtors.</p>
            ) : (
              <ul className="space-y-2">
                {userNotifications.map((notification) => (
                  <li key={notification.id} className="border border-slate-200 rounded-md p-3">
                    <p className="font-medium text-slate-900 line-clamp-2">{notification.message}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      From {notification.fromUser?.name || notification.fromUser?.email || 'Realtor'} · {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {(role === 'REALTOR' || role === 'ADMIN') && (
        <>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Client status distribution</h2>
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
              <h2 className="text-lg font-bold text-slate-900 mb-4">User interactions over time</h2>
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
        </>
      )}

      {role === 'BROKER' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Teams managed</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{brokerStats?.teamCount ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Available realtors</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{brokerStats?.availableRealtors?.length ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Pending approvals</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{brokerStats?.pending ?? 0}</p>
          </div>
        </div>
      )}

      {canUseCrm && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                {interactions.length > 0 && (
                  <p className="text-slate-500 text-sm">
                    {interactions.length} interaction(s) logged.
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
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">Notifications & communications</h2>
              <Link href="/dashboard/notifications" className="btn-primary shrink-0">
                Open notifications
              </Link>
            </div>
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent notifications.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <li key={notification.id} className="rounded-md border border-slate-200 p-3">
                    <p className="font-medium text-slate-900 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {role === 'BROKER' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/dashboard/broker" className="btn-secondary">
                  Broker dashboard
                </Link>
                <Link href="/dashboard/broker/realtors" className="btn-secondary">
                  Realtor dashboards
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
