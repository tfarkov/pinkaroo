import React, { useState } from 'react';

interface Props {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  placeholder?: React.ReactNode;
}

/** Renders a listing image with fallback when src is missing or fails to load. */
export default function SafeListingImage({ src, alt = '', className = '', placeholder }: Props) {
  const [error, setError] = useState(false);
  const showImage = src && !error;

  if (!showImage) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-slate-500 text-sm bg-slate-200 ${className}`}>
        {placeholder ?? 'No image'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}
