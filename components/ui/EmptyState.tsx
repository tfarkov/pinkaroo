import React from 'react';

interface Props {
  message: string;
  className?: string;
}

/** Reusable empty state message (e.g. "No listings", "No favourites yet"). */
export default function EmptyState({ message, className = '' }: Props) {
  return (
    <p className={`text-slate-500 py-10 text-center ${className}`}>
      {message}
    </p>
  );
}
