import { useState, useEffect } from 'react';
import { RECENTLY_VIEWED_LIMIT } from '../constants';

const STORAGE_KEY = 'recentlyViewed';

function parseStored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((v: unknown): v is string => typeof v === 'string' && (v as string).trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

/**
 * Returns the list of recently viewed listing IDs (newest last, capped at RECENTLY_VIEWED_LIMIT).
 * Read-only from localStorage on mount; use trackRecentlyViewed elsewhere to push new IDs.
 */
export function useRecentlyViewed(): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(parseStored().slice(-RECENTLY_VIEWED_LIMIT));
  }, []);

  return ids;
}
