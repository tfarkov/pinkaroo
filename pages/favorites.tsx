import { useEffect } from 'react';
import { openDB } from 'idb';
import { IDB_NAME, IDB_VERSION, UI } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/ui/BottomNav';
import ListingCard from '../components/ListingCard';
import { useFavorites } from '../lib/hooks/useFavorites';
import { useUnitToggle } from '../lib/hooks/useUnitToggle';
import type { FavoriteItem, ListingBasic } from '../lib/types';

function hasRenderableListing(favorite: FavoriteItem): favorite is FavoriteItem & { listing: ListingBasic } {
  return !!favorite.listing?.id;
}

export default function Favorites() {
  const { favorites, toggleFavorite, isFavorited, isLoading } = useFavorites();
  const { isMetric } = useUnitToggle();
  const renderableFavorites = favorites.filter(hasRenderableListing);

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
        {isLoading && <p className="text-slate-500 mb-4">{UI.LOADING}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {renderableFavorites.map((favorite) => (
              <ListingCard
                key={favorite.id}
                listing={favorite.listing}
                isMetric={isMetric}
                isFavorited={isFavorited(favorite.listing.id)}
                onFavoriteClick={toggleFavorite}
              />
          ))}
        </div>
        {!isLoading && renderableFavorites.length === 0 && <p className="text-slate-500 py-12 text-center">No favourites yet.</p>}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
