import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import Link from 'next/link';
import { openDB } from 'idb';
import { API, IDB_NAME, IDB_VERSION, UI } from '../lib/constants';
import { getMockFavorites } from '../lib/mockData';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import SafeListingImage from '../components/ui/SafeListingImage';

export default function Favorites() {
  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const res = await fetch(API.FAVORITES, { credentials: 'include' });
        if (res.ok) return res.json();
        return getMockFavorites();
      } catch {
        return getMockFavorites();
      }
    },
  });

  useEffect(() => {
    const dbPromise = openDB(IDB_NAME, IDB_VERSION, {
      upgrade(db) {
        db.createObjectStore('favorites');
      },
    });
    dbPromise.then(db => {
      const tx = db.transaction('favorites', 'readwrite');
      favorites.forEach(f => tx.store.put(f, f.id));
      tx.done;
    });
  }, [favorites]);

  return (
    <div className="page-container flex flex-col">
      <Header />
      <main className="flex-1 content-width pb-14">
        <h1 className="text-3xl font-bold text-slate-900 py-8 mb-6">My Favourites</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f: any) => (
            <article key={f.id} className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group">
              <Link href={`/listings/${f.listing?.id}`} className="block">
                <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden">
                  <SafeListingImage src={f.listing?.images?.[0]} />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-slate-900 group-hover:text-accent-600 line-clamp-2">{f.listing?.title}</h2>
                  <span className="inline-block mt-2 text-accent-600 font-semibold text-sm">{UI.VIEW} →</span>
                </div>
              </Link>
            </article>
          ))}
        </div>
        {favorites.length === 0 && <p className="text-slate-500 py-12 text-center">No favourites yet.</p>}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
