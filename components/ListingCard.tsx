import { memo } from 'react';
import Link from 'next/link';
import { UI, getListingPageUrl } from '../lib/constants';
import { formatPrice, formatArea } from '../lib/format';
import { getEcoRatingDisplay } from '../lib/ecoRating';
import type { ListingBasic } from '../lib/types';
import SafeListingImage from './ui/SafeListingImage';

/** Props for a single listing card (browse list, recent, etc.). Favorite button is outside Link to avoid navigation on click. */
type ListingCardProps = {
  listing: ListingBasic;
  isMetric?: boolean;
  variant?: 'default' | 'recent' | 'mini';
  imagePlaceholder?: string;
  isFavorited?: boolean;
  onFavoriteClick?: (listingId: string) => void;
  metaLine?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg className="w-5 h-5" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function ListingCard(props: ListingCardProps) {
  const {
    listing,
    isMetric = false,
    variant = 'default',
    imagePlaceholder,
    isFavorited = false,
    onFavoriteClick,
    metaLine,
  } = props;
  const listingUrl = getListingPageUrl(listing.id);
  const showPrice = variant === 'default' && listing.price != null;
  const areaStr = listing.sizeSqm != null ? ' · ' + formatArea(listing.sizeSqm, isMetric) : '';

  const imageBlock = (
    <div className="block w-full h-full">
      <SafeListingImage src={listing.images?.[0]} placeholder={imagePlaceholder} />
    </div>
  );
  const contentBlock = (
    <>
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
      {listing.ecoRatingScore != null && listing.ecoRatingScore >= 7 && (
        <p className="mt-1 text-sm text-green-700 font-medium">
          Eco {getEcoRatingDisplay(listing.ecoRatingScore)}
        </p>
      )}
      {listing.location && <p className="mt-1 text-sm text-slate-500">{listing.location}</p>}
      <span className="inline-block mt-3 text-accent-600 font-semibold text-sm">
        {UI.VIEW_LISTING} →
      </span>
    </>
  );

  if (variant === 'mini') {
    const miniInfo = (
      <>
        <h3 className="font-medium text-slate-900 group-hover:text-accent-600 transition-colors line-clamp-2 text-sm">
          {listing.title ?? 'Listing'}
        </h3>
        {metaLine ? (
          <p className="mt-1 text-sm text-slate-500 line-clamp-1">{metaLine}</p>
        ) : listing.price != null ? (
          <p className="mt-1 text-sm font-semibold text-accent-600">{formatPrice(listing.price)}</p>
        ) : null}
        <span className="inline-block mt-2 text-accent-600 font-semibold text-sm">{UI.VIEW_LISTING} →</span>
      </>
    );
    return (
      <div className="bg-white border border-slate-200 rounded-md p-2 hover:bg-slate-50 transition-colors group">
        <div className="flex gap-3">
          <div className="w-20 h-16 shrink-0 rounded overflow-hidden bg-slate-200 relative">
            {imageBlock}
            {onFavoriteClick != null && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFavoriteClick(listing.id);
                }}
                className={`absolute top-1 right-1 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors z-10 ${isFavorited ? 'text-red-500 hover:text-red-600' : 'text-slate-700 hover:text-accent-600'}`}
                aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
              >
                <HeartIcon filled={isFavorited} />
              </button>
            )}
          </div>
          {listingUrl ? (
            <Link href={listingUrl} className="block min-w-0 flex-1">
              {miniInfo}
            </Link>
          ) : (
            <div className="block min-w-0 flex-1">{miniInfo}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-card border border-slate-200 overflow-hidden hover:shadow-card-hover transition-shadow group relative">
      <div className="aspect-[4/3] w-full bg-slate-200 overflow-hidden relative">
        {imageBlock}
        {onFavoriteClick != null && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteClick(listing.id);
            }}
            className={`absolute top-2 right-2 w-11 h-11 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition-colors z-10 ${isFavorited ? 'text-red-500 hover:text-red-600' : 'text-slate-700 hover:text-accent-600'}`}
            aria-label={isFavorited ? 'Remove from favourites' : 'Add to favourites'}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}
      </div>
      {listingUrl ? (
        <Link href={listingUrl} className="block p-4">
          {contentBlock}
        </Link>
      ) : (
        <div className="block p-4">{contentBlock}</div>
      )}
    </div>
  );
}

export default memo(ListingCard);
