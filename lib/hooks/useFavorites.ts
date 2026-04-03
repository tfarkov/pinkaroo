import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { API, CONTENT_TYPE, STALE_TIME_5_MIN, MAX_FAVORITES, ANONYMOUS_FAVORITES_KEY } from '../constants';
import type { FavoriteItem, ListingBasic } from '../types';

type MinimalListing = ListingBasic;

/** Load saved favorites from localStorage for guests (no auth). Returns [] on server. */
function loadAnonymousFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ANONYMOUS_FAVORITES_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr.slice(0, MAX_FAVORITES) : [];
  } catch {
    return [];
  }
}

/** Persist guest favorites to localStorage. */
function saveAnonymousFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANONYMOUS_FAVORITES_KEY, JSON.stringify(items.slice(0, MAX_FAVORITES)));
  } catch {
    // ignore
  }
}

function needsListingBackfill(item: FavoriteItem): boolean {
  if (!item.listing?.id) return false;
  return item.listing.bedroomsTotal == null || item.listing.bathroomsTotal == null || item.listing.sizeSqm == null;
}

/**
 * Favorites state: from API when authenticated, from localStorage when not.
 * Initial anonymous list is [] to avoid hydration mismatch (server has no localStorage).
 */
export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  // Start with [] so server and client first paint match (no localStorage on server)
  const [anonymousList, setAnonymousList] = useState<FavoriteItem[]>([]);

  /** Fetched favorites when user is signed in (GET /api/favorites). */
  const { data: apiFavorites = [], isLoading: isLoadingApi } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const res = await fetch(API.FAVORITES, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch favourites');
      return res.json();
    },
    staleTime: STALE_TIME_5_MIN,
    enabled: isAuthenticated,
  });

  /** Add/remove favorite when authenticated (POST/DELETE /api/favorites). */
  const apiMutation = useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      const res = await fetch(API.FAVORITES, {
        method: isFavorited ? 'DELETE' : 'POST',
        headers: { 'Content-Type': CONTENT_TYPE.JSON },
        credentials: 'include',
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok && res.status !== 400) throw new Error('Failed to update favourite');
      return res;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  /** After mount, hydrate anonymous list from localStorage when not signed in. */
  useEffect(() => {
    if (!isAuthenticated) setAnonymousList(loadAnonymousFavorites());
  }, [isAuthenticated]);

  /** Sync anonymous list from storage when window gains focus (e.g. back from another tab). */
  useEffect(() => {
    if (isAuthenticated) return;
    const onFocus = () => setAnonymousList(loadAnonymousFavorites());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated]);

  /** Upgrade older anonymous favorites that only stored minimal listing fields. */
  useEffect(() => {
    if (isAuthenticated || anonymousList.length === 0) return;
    const idsToBackfill = anonymousList.filter(needsListingBackfill).map((item) => item.listing!.id);
    if (idsToBackfill.length === 0) return;

    let cancelled = false;
    (async () => {
      const fetched = await Promise.all(
        idsToBackfill.map(async (listingId) => {
          try {
            const res = await fetch(`${API.LISTINGS}/${listingId}`, { credentials: 'same-origin' });
            if (!res.ok) return null;
            const listing = (await res.json()) as ListingBasic | null;
            if (!listing?.id) return null;
            return listing;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;

      const byId = new Map(fetched.filter((listing): listing is ListingBasic => !!listing).map((listing) => [listing.id, listing]));
      if (byId.size === 0) return;

      setAnonymousList((prev) => {
        const next = prev.map((item) => {
          const listingId = item.listing?.id;
          if (!listingId) return item;
          const full = byId.get(listingId);
          if (!full) return item;
          return { ...item, listing: { ...item.listing, ...full, id: listingId } };
        });
        saveAnonymousFavorites(next);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, anonymousList]);

  /** Current list: from API when auth, else from in-memory anonymous list (backed by localStorage). */
  const favorites: FavoriteItem[] = isAuthenticated ? apiFavorites : anonymousList;

  const isFavorited = useCallback(
    (listingId: string) => favorites.some((f) => f.listing?.id === listingId),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (listingId: string, listing?: MinimalListing) => {
      if (isAuthenticated) {
        apiMutation.mutate({ listingId, isFavorited: isFavorited(listingId) });
        return;
      }
      setAnonymousList((prev) => {
        const exists = prev.some((f) => f.listing?.id === listingId);
        let next: FavoriteItem[];
        if (exists) {
          next = prev.filter((f) => f.listing?.id !== listingId);
        } else {
          const item: FavoriteItem = {
            id: `anon-${listingId}`,
            listing: listing ? { ...listing, id: listingId } : { id: listingId },
          };
          next = [...prev, item].slice(0, MAX_FAVORITES);
        }
        saveAnonymousFavorites(next);
        return next;
      });
    },
    [isAuthenticated, isFavorited, apiMutation]
  );

  const isLoading = isAuthenticated ? apiMutation.isPending || isLoadingApi : false;

  return { favorites, isFavorited, toggleFavorite, isLoading };
}
