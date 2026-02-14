import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { API, CONTENT_TYPE, STALE_TIME_5_MIN, MAX_FAVORITES, ANONYMOUS_FAVORITES_KEY } from '../constants';
import type { FavoriteItem } from '../types';

type MinimalListing = { id: string; title?: string; price?: number; images?: string[] };

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

function saveAnonymousFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ANONYMOUS_FAVORITES_KEY, JSON.stringify(items.slice(0, MAX_FAVORITES)));
  } catch {
    // ignore
  }
}

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [anonymousList, setAnonymousList] = useState<FavoriteItem[]>([]);

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
  });

  useEffect(() => {
    if (!isAuthenticated) setAnonymousList(loadAnonymousFavorites());
  }, [isAuthenticated]);

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
            listing: {
              id: listingId,
              title: listing?.title,
              price: listing?.price,
              images: listing?.images,
            },
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
