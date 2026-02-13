import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import Link from 'next/link';
import { openDB } from 'idb';
import { API, IDB_NAME, IDB_VERSION, UI } from '../lib/constants';
import Header from '../components/Header';
import BottomNav from '../components/ui/BottomNav';

export default function Favorites() {
  const { data: favorites = [] } = useQuery({ queryKey: ['favorites'], queryFn: () => fetch(API.FAVORITES).then(res => res.json()) });

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
    <div className="page-container">
      <Header />
      <main className="content-width pb-16 md:pb-8">
        <h1 className="text-3xl font-bold text-primary-900 py-6 mb-4">Favorites</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((f: any) => (
            <article key={f.id} className="card group">
              <Link href={`/listings/${f.listing?.id}`} className="block p-4">
                <div className="aspect-[4/3] w-full bg-primary-100 rounded-lg mb-3 flex items-center justify-center text-primary-400 text-sm overflow-hidden">
                  {f.listing?.images?.[0] ? <img src={f.listing.images[0]} alt="" className="w-full h-full object-cover" /> : 'No image'}
                </div>
                <h2 className="font-semibold text-primary-900 group-hover:text-accent-600 line-clamp-2">{f.listing?.title}</h2>
                <span className="inline-block mt-2 text-accent-600 font-medium text-sm">{UI.VIEW} →</span>
              </Link>
            </article>
          ))}
        </div>
        {favorites.length === 0 && <p className="text-primary-500 py-12 text-center">No favorites yet.</p>}
      </main>
      <BottomNav />
    </div>
  );
}
