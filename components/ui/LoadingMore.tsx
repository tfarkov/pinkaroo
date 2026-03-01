import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface Props {
  label?: string;
}

/** Full "loading more" block with spinner and label (e.g. for infinite scroll sentinel). */
export default function LoadingMore({ label = 'Loading more...' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" aria-label="Loading" />
        <p className="text-slate-500 text-sm font-medium">{label}</p>
      </div>
    </div>
  );
}
