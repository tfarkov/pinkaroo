import React from 'react';

interface Props {
  /** Optional size: 'sm' (default) or 'lg' */
  size?: 'sm' | 'lg';
  className?: string;
  /** Accessibility: set to true when this is the only loading indicator in view */
  'aria-label'?: string;
}

/** Reusable spinner for loading states. */
export default function LoadingSpinner({ size = 'sm', className = '', 'aria-label': ariaLabel }: Props) {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
  return (
    <div
      className={`relative shrink-0 ${sizeClass} ${className}`}
      role={ariaLabel ? 'status' : undefined}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      <div className="absolute inset-0 rounded-full border-2 border-slate-200" aria-hidden />
      <div className="absolute inset-0 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" aria-hidden />
    </div>
  );
}
