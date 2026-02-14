import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { UI, RECENTLY_VIEWED_LIMIT } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function Profile() {
  const router = useRouter();
  const { user, isAuthenticated, status } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const userWithRole = user as { name?: string; email?: string; image?: string; role?: string } | undefined;

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      router.replace('/signin?callbackUrl=/profile');
      return;
    }
  }, [status, isAuthenticated, router]);

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
        <h2 className="text-xl font-bold text-slate-900 mb-4">{UI.RECENTLY_VIEWED_TITLE}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyViewed.filter((id): id is string => typeof id === 'string' && id.length > 0).map((id) => (
            <Link key={id} href={`/listings/${encodeURIComponent(id)}`} className="bg-white rounded-lg shadow-card border border-slate-200 block p-0 overflow-hidden hover:shadow-card-hover transition-shadow group">
              <div className="aspect-[4/3] bg-slate-200 flex items-center justify-center text-slate-500 text-sm">#{id.slice(0, 8)}</div>
              <div className="p-4">
                <span className="text-accent-600 font-semibold group-hover:text-accent-700">{UI.VIEW_LISTING} →</span>
              </div>
            </Link>
          ))}
        </div>
        {recentlyViewed.length === 0 && <p className="text-slate-500 py-10 text-center">No recently viewed listings.</p>}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
