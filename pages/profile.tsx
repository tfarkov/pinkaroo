import { useAuth } from '../lib/hooks/useAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UI } from '../lib/constants';
import Header from '../components/Header';
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
    <div className="page-container">
      <Header />
      <main className="content-width pb-16 md:pb-8">
        <h1 className="text-3xl font-bold text-primary-900 py-6">{UI.PROFILE}</h1>
        <div className="card p-6 mb-8">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <dt className="text-primary-500">{UI.NAME}</dt>
            <dd className="font-medium text-primary-900">{userWithRole?.name ?? '—'}</dd>
            <dt className="text-primary-500">{UI.ROLE}</dt>
            <dd className="font-medium text-primary-900">{userWithRole?.role ?? '—'}</dd>
          </dl>
        </div>
        <h2 className="section-heading">{UI.RECENTLY_VIEWED_TITLE}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentlyViewed.map(id => (
            <Link key={id} href={`/listings/${id}`} className="card block p-5 hover:shadow-card-hover">
              <div className="property-card-image rounded-lg mb-3 text-sm">#{id.slice(0, 8)}</div>
              <span className="text-accent-600 font-medium">{UI.VIEW_LISTING} →</span>
            </Link>
          ))}
        </div>
        {recentlyViewed.length === 0 && <p className="text-primary-500 py-8 text-center">No recently viewed listings.</p>}
      </main>
      <BottomNav />
    </div>
  );
}
