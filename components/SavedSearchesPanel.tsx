import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, UI } from '../lib/constants';
import { useAuth } from '../lib/hooks/useAuth';
import type { FilterParams } from '../lib/utils/queryParams';

export type HomeFilterShape = {
  province: string;
  city: string;
  minPrice: string | number;
  maxPrice: string | number;
  bedrooms: string | number;
  bathrooms: string | number;
  propertyType: string;
};

type SavedSearchRow = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  notifyNewMatch: boolean;
  lastSeenAt: string;
  newSinceSeenCount: number;
};

const FILTER_KEYS = ['province', 'city', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'propertyType'] as const;

function serializeFilters(f: FilterParams): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of FILTER_KEYS) {
    const v = f[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = v;
  }
  return out;
}

/**
 * Persisted filter sets for signed-in users; server may enqueue system notifications when new listings match (GET list).
 */
export default function SavedSearchesPanel({
  currentFilters,
  onApplyFilters,
}: {
  currentFilters: FilterParams;
  onApplyFilters: (data: HomeFilterShape) => void;
}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      const res = await fetch(API.SAVED_SEARCHES);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? (data as SavedSearchRow[]) : [];
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  const handleSave = async () => {
    const name = saveName.trim();
    const filters = serializeFilters(currentFilters);
    if (!name) {
      setError('Enter a name for this search.');
      return;
    }
    if (Object.keys(filters).length === 0) {
      setError('Adjust filters before saving.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(API.SAVED_SEARCHES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, filters, notifyNewMatch: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(typeof err?.error === 'string' ? err.error : 'Could not save search.');
        return;
      }
      setSaveName('');
      invalidate();
    } finally {
      setSaving(false);
    }
  };

  const applyRow = async (row: SavedSearchRow) => {
    const f = row.filters as HomeFilterShape;
    onApplyFilters({
      province: typeof f.province === 'string' ? f.province : '',
      city: typeof f.city === 'string' ? f.city : '',
      minPrice: (f.minPrice as string | number) ?? '',
      maxPrice: (f.maxPrice as string | number) ?? '',
      bedrooms: (f.bedrooms as string | number) ?? '',
      bathrooms: (f.bathrooms as string | number) ?? '',
      propertyType: typeof f.propertyType === 'string' ? f.propertyType : '',
    });
    await fetch(`${API.SAVED_SEARCHES}/${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markSeen: true }),
    });
    invalidate();
  };

  const toggleNotify = async (row: SavedSearchRow) => {
    await fetch(`${API.SAVED_SEARCHES}/${encodeURIComponent(row.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifyNewMatch: !row.notifyNewMatch }),
    });
    invalidate();
  };

  const removeRow = async (id: string) => {
    await fetch(`${API.SAVED_SEARCHES}/${encodeURIComponent(id)}`, { method: 'DELETE' });
    invalidate();
  };

  if (!isAuthenticated) {
    return (
      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <p className="mb-2">{UI.SIGN_IN_TO_SAVE_SEARCHES}</p>
        <Link href="/signin" className="font-semibold text-accent-600 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm p-4" aria-labelledby="saved-searches-title">
      <h3 id="saved-searches-title" className="text-lg font-bold text-slate-900 mb-3">
        {UI.SAVED_SEARCHES_TITLE}
      </h3>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-end mb-4">
        <div className="flex-1 min-w-0">
          <label htmlFor="saved-search-name" className="label">
            {UI.SAVED_SEARCH_NAME_LABEL}
          </label>
          <input
            id="saved-search-name"
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="e.g. Barrie under $800k"
            className="input-field w-full"
            maxLength={120}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="btn-primary whitespace-nowrap shrink-0"
        >
          {saving ? UI.LOADING : UI.SAVE_THIS_SEARCH}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-slate-500">{UI.LOADING}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No saved searches yet. Set filters above, name your search, and save.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-slate-100 rounded-md p-3 bg-slate-50/80"
            >
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-900 truncate">{row.name}</span>
                {row.newSinceSeenCount > 0 && (
                  <span className="text-xs font-semibold bg-accent-100 text-accent-800 px-2 py-0.5 rounded-full">
                    {UI.NEW_MATCHES_BADGE} · {row.newSinceSeenCount}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button type="button" className="text-sm font-semibold text-accent-600 hover:underline" onClick={() => void applyRow(row)}>
                  {UI.APPLY_SAVED_SEARCH}
                </button>
                <label className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={row.notifyNewMatch}
                    onChange={() => void toggleNotify(row)}
                    aria-label={UI.NOTIFY_NEW_MATCHES}
                  />
                  <span className="hidden sm:inline">{UI.NOTIFY_NEW_MATCHES}</span>
                  <span className="sm:hidden">Alerts</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-slate-500 hover:text-red-600"
                  onClick={() => void removeRow(row.id)}
                >
                  {UI.DELETE_SAVED_SEARCH}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
