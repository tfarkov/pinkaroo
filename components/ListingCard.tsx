import Link from 'next/link';
import { UI } from '../lib/constants';
import { formatPrice, formatArea } from '../lib/format';
import type { ListingBasic } from '../lib/types';
import SafeListingImage from './ui/SafeListingImage';

type ListingCardProps = {
  listing: ListingBasic;
  isMetric?: boolean;
  variant?: 'default' | 'recent';
  imagePlaceholder?: string;
  isFavorited?: boolean;
  onFavoriteClick?: (listingId: string) => void;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

export default function ListingCard(props: ListingCardProps) {
  const { listing, isMetric = false, variant = 'default', imagePlaceholder, isFavorited = false, onFavoriteClick } = props;
  const href = '/listings/' + encodeURIComponent(listing.id);
  const showPrice = variant === 'default' && listing.price != null;
  const areaStr = listing.sizeSqm != null ? ' · ' + formatArea(listing.sizeSqm, isMetric) : '';

  return (
    <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group relative">
      <Link href={href} className="block">
        <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden relative">
          <SafeListingImage src={listing.images?.[0]} placeholder={imagePlaceholder} />
          {onFavoriteClick != null && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteClick(listing.id);
              }}
              className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors z-10 ${isFavorited ? 'text-red-500 hover:text-red-600' : 'text-slate-700 hover:text-accent-600'}`}
              aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
            >
              <HeartIcon filled={isFavorited} />
            </button>
          )}
        </div>
      <div className="p-4">
        {showPrice && (
          <p className="text-xl font-bold text-accent-600">{formatPrice(listing.price ?? 0)}</p>
        )}
        <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-accent-600 transition-colors line-clamp-2">
          {listing.title ?? 'Listing'}
        </h3>
        {variant === 'default' && (
          <p className="mt-2 text-sm text-slate-600">
            {listing.bedroomsTotal ?? '—'} bed · {listing.bathroomsTotal ?? '—'} bath{areaStr}
          </p>
        )}
        {listing.location && <p className="mt-1 text-sm text-slate-500">{listing.location}</p>}
        <span className="inline-block mt-3 text-accent-600 font-semibold text-sm">
          {UI.VIEW_LISTING} →
        </span>
      </div>
      </Link>
    </div>
  );
}
