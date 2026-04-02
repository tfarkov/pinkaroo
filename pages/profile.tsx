import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { API, CONTENT_TYPE, UI, RECENTLY_VIEWED_LIMIT, getListingPageUrl } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, status, isRealtor } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const userWithRole = user as {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    role?: string;
    availableHours?: string | null;
  } | undefined;
  const [availableHours, setAvailableHours] = useState('');
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [availabilitySuccess, setAvailabilitySuccess] = useState('');
  const availabilityInitialized = useRef(false);

  const { data: profileUser } = useQuery({
    queryKey: ['profile-user', userWithRole?.id ?? 'unknown'],
    queryFn: async () => {
      const res = await fetch(`${API.USERS}/${userWithRole?.id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load profile');
      return res.json();
    },
    enabled: !!userWithRole?.id && isRealtor,
  });

  useEffect(() => {
    if (!profileUser || availabilityInitialized.current) return;
    availabilityInitialized.current = true;
    setAvailableHours(profileUser.availableHours ?? '');
  }, [profileUser]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      router.replace('/signin?callbackUrl=/profile');
      return;
    }
  }, [status, isAuthenticated, router]);

  const handleAvailabilitySave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userWithRole?.id) return;
    setAvailabilityError('');
    setAvailabilitySuccess('');
    setSavingAvailability(true);
    try {
      const res = await fetch(`${API.USERS}/${userWithRole.id}`, {
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

  useEffect(() => {
    let viewed: string[] = [];
    try {
      const raw = localStorage.getItem('recentlyViewed');
      const parsed = JSON.parse(raw || '[]');
      viewed = Array.isArray(parsed) ? parsed.filter((v: unknown) => typeof v === 'string' && (v as string).trim()) : [];
    } catch {
      viewed = [];
    }
    setRecentlyViewed(viewed.slice(-RECENTLY_VIEWED_LIMIT));
  }, []);

  if (status === 'loading' || !isAuthenticated) {
    return (
      <div className="page-container flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 content-width py-12 flex items-center justify-center">
          <p className="text-slate-500">{status === 'loading' ? UI.LOADING : 'Redirecting…'}</p>
        </main>
        <Footer />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width pb-14">
        <h1 className="text-3xl font-bold text-slate-900 py-8">{UI.PROFILE}</h1>
        <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <dt className="text-slate-500">{UI.NAME}</dt>
            <dd className="font-semibold text-slate-900">{userWithRole?.name ?? '—'}</dd>
            <dt className="text-slate-500">{UI.ROLE}</dt>
            <dd className="font-semibold text-slate-900">{userWithRole?.role ?? '—'}</dd>
          </dl>
        </div>
        {isRealtor && (
          <div className="bg-white rounded-lg shadow-card border border-slate-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{UI.EDIT_REALTOR_PROFILE}</h2>
            <form onSubmit={handleAvailabilitySave} className="space-y-3">
              <div>
                <label className="label">{UI.AVAILABLE_HOURS}</label>
                <input
                  value={availableHours}
                  onChange={(event) => setAvailableHours(event.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. Mon–Fri 9am–5pm"
                />
              </div>
              {availabilitySuccess && <p className="text-green-600 text-sm font-medium">{availabilitySuccess}</p>}
              {availabilityError && <p className="text-red-600 text-sm">{availabilityError}</p>}
              <button type="submit" className="btn-primary" disabled={savingAvailability}>
                {savingAvailability ? UI.LOADING : UI.SAVE_PROFILE}
              </button>
            </form>
          </div>
        )}
        <h2 className="text-xl font-bold text-slate-900 mb-4">{UI.RECENTLY_VIEWED_TITLE}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyViewed.filter((id): id is string => typeof id === 'string' && id.length > 0).map((id) => {
            const url = getListingPageUrl(id);
            return url ? (
            <Link key={id} href={url} className="bg-white rounded-lg shadow-card border border-slate-200 block p-0 overflow-hidden hover:shadow-card-hover transition-shadow group">
              <div className="aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">#{id.slice(0, 8)}</div>
              <div className="p-4">
                <span className="text-accent-600 font-semibold group-hover:text-accent-700">{UI.VIEW_LISTING} →</span>
              </div>
            </Link>
            ) : (
              <div key={id} className="bg-white rounded-lg shadow-card border border-slate-200 block p-0 overflow-hidden">
                <div className="aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">#{id.slice(0, 8)}</div>
                <div className="p-4"><span className="text-slate-500 font-semibold">{UI.VIEW_LISTING} →</span></div>
              </div>
            );
          })}
        </div>
        {recentlyViewed.length === 0 && <p className="text-slate-500 py-10 text-center">No recently viewed listings.</p>}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
