import { useAuth } from '../../lib/hooks/useAuth';
import { API, CLIENT_STATUSES, CONTENT_TYPE, UI } from '../../lib/constants';
import { getMockClients, getMockInteractions } from '../../lib/mockData';
import { Bar, Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import ListingCard from '../../components/ListingCard';
import { useFavorites } from '../../lib/hooks/useFavorites';
import { useNotifications } from '../../lib/hooks/useNotifications';
import { useUnitToggle } from '../../lib/hooks/useUnitToggle';
import type { ListingBasic } from '../../lib/types';

type DashboardListing = {
  id: string;
  title?: string;
  status?: string;
  price?: number;
  updatedAt?: string;
};

export default function Dashboard() {
  const { role, user, isAuthenticated } = useAuth();
  const { isMetric } = useUnitToggle();
  const canUseCrm = role === 'REALTOR' || role === 'BROKER' || role === 'OFFICE_ADMIN' || role === 'SYSTEM_ADMIN';
  const [availableHours, setAvailableHours] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilitySuccess, setAvailabilitySuccess] = useState('');
  const availabilityInitialized = useRef(false);
  const { favorites, isFavorited, toggleFavorite } = useFavorites();
  const { notifications } = useNotifications();
  const userNotifications = useMemo(
    () => notifications.filter((n) => n.fromUser?.role === 'REALTOR' || n.fromUser?.role === 'BROKER').slice(0, 5),
    [notifications]
  );
  const formatDateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
  };

  const { data: myListingsData } = useQuery({
    queryKey: ['my-listings-dashboard', role, user?.email ?? 'anonymous'],
    queryFn: async () => {
      const res = await fetch(`${API.LISTINGS}?mine=1&page=0`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load my listings');
      return res.json();
    },
    enabled: isAuthenticated && role === 'USER',
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
    enabled: isAuthenticated && (role === 'REALTOR' || role === 'OFFICE_ADMIN' || role === 'SYSTEM_ADMIN'),
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
    enabled: isAuthenticated && role === 'REALTOR',
  });
  const interactions = Array.isArray(interactionsRaw) ? interactionsRaw : (interactionsRaw?.interactions ?? []);

  const { data: brokerStats } = useQuery({
    queryKey: ['broker-stats'],
    queryFn: async () => {
      const res = await fetch(API.BROKER_STATS, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load broker stats');
      return res.json();
    },
    enabled: isAuthenticated && role === 'BROKER',
  });

  const { data: profileUser } = useQuery({
    queryKey: ['dashboard-user', (user as { id?: string } | undefined)?.id ?? 'unknown'],
    queryFn: async () => {
      const res = await fetch(`${API.USERS}/${(user as { id?: string } | undefined)?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    enabled: isAuthenticated && role === 'REALTOR' && !!(user as { id?: string } | undefined)?.id,
  });

  useEffect(() => {
    if (!profileUser || availabilityInitialized.current) return;
    availabilityInitialized.current = true;
    setAvailableHours(profileUser.availableHours ?? '');
  }, [profileUser]);

  const clientChartData = useMemo(() => ({
    labels: [...CLIENT_STATUSES],
    datasets: [{
      label: 'Client Status Distribution',
      data: CLIENT_STATUSES.map(status => (clients ?? []).filter((c: { status?: string }) => c.status === status).length),
      backgroundColor: ['rgba(236, 72, 153, 0.75)', 'rgba(244, 114, 182, 0.75)', 'rgba(217, 70, 239, 0.75)', 'rgba(14, 165, 233, 0.75)', 'rgba(99, 102, 241, 0.75)'],
      borderRadius: 8,
      maxBarThickness: 42,
    }],
  }), [clients]);

  const interactionChartData = useMemo(() => {
    const list = interactions ?? [];
    return {
      labels: list.length > 0 ? list.map((i: { date?: string }) => new Date(i.date ?? 0).toLocaleDateString()) : ['No data'],
      datasets: [{
        label: 'Interactions Over Time',
        data: list.length > 0 ? list.map(() => 1) : [0],
        borderColor: 'rgba(219, 39, 119, 1)',
        backgroundColor: 'rgba(219, 39, 119, 0.14)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: 'rgba(219, 39, 119, 1)',
      }],
    };
  }, [interactions]);

  const chartOptionsBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
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

  const handleAvailabilitySave = async (event: React.FormEvent) => {
    event.preventDefault();
    const userId = (user as { id?: string } | undefined)?.id;
    if (!userId) return;
    setAvailabilityError('');
    setAvailabilitySuccess('');
    setSavingAvailability(true);
    try {
      const res = await fetch(`${API.USERS}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        credentials: 'include',
        body: JSON.stringify({ availableHours: availableHours.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setAvailabilitySuccess(UI.PROFILE_SAVED);
      setTimeout(() => setAvailabilitySuccess(''), 3000);
    } catch {
      setAvailabilityError('Failed to save. Try again.');
    } finally {
      setSavingAvailability(false);
    }
  };

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
                    return (
                      <li key={listing.id}>
                        <ListingCard
                          listing={listing as ListingBasic}
                          variant="mini"
                          isMetric={isMetric}
                          metaLine={`${listing.status ?? '—'}${listing.price != null ? ` · $${Math.round(listing.price).toLocaleString()}` : ''}`}
                        />
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
                    if (!favorite.listing?.id) return null;
                    return (
                      <li key={favorite.id}>
                        <ListingCard
                          listing={favorite.listing}
                          variant="mini"
                          isMetric={isMetric}
                          isFavorited={isFavorited(favorite.listing.id)}
                          onFavoriteClick={toggleFavorite}
                        />
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
                      From {notification.fromUser?.name || notification.fromUser?.email || 'Realtor'} · {formatDateTime(notification.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {(role === 'REALTOR' || role === 'SYSTEM_ADMIN' || role === 'OFFICE_ADMIN') && (
        <>
          {role === 'REALTOR' && (
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">{UI.AVAILABLE_HOURS}</h2>
              <form onSubmit={handleAvailabilitySave} className="space-y-3">
                <input
                  value={availableHours}
                  onChange={(event) => setAvailableHours(event.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Mon–Fri 9am–5pm"
                />
                {availabilitySuccess && <p className="text-green-600 text-sm font-medium">{availabilitySuccess}</p>}
                {availabilityError && <p className="text-red-600 text-sm">{availabilityError}</p>}
                <button type="submit" className="btn-primary" disabled={savingAvailability}>
                  {savingAvailability ? UI.LOADING : UI.SAVE_PROFILE}
                </button>
              </form>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Client status distribution</h2>
            <div className="h-[280px] min-h-0 w-full">
              <Bar
                data={clientChartData}
                options={chartOptionsBase}
              />
            </div>
          </div>
          {role === 'REALTOR' && (
            <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">User interactions over time</h2>
              <div className="h-[280px] min-h-0 w-full">
                <Line
                  data={interactionChartData}
                  options={chartOptionsBase}
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
                      {formatDateTime(notification.createdAt)}
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
