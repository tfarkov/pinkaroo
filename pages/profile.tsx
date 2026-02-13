import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UI } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';

export default function Profile() {
  const { user } = useAuth();
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const userWithRole = user as { name?: string; email?: string; image?: string; role?: string } | undefined;

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(viewed);
  }, []);

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
          {recentlyViewed.map(id => (
            <Link key={id} href={`/listings/${id}`} className="bg-white rounded-lg shadow-card border border-slate-200 block p-0 overflow-hidden hover:shadow-card-hover transition-shadow group">
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
