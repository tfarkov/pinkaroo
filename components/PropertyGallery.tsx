import React, { useState } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
}

const isValidImageUrl = (url: unknown): url is string =>
  typeof url === 'string' && /^https?:\/\//i.test(url) && url.trim().length > 0;

export default function PropertyGallery({ images }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const safeImages = Array.isArray(images) ? images.filter(isValidImageUrl) : [];
  const loadableImages = safeImages.filter((url) => !failedUrls.has(url));
  const clampedIndex = Math.min(currentIndex, Math.max(0, loadableImages.length - 1));
  const currentImage = loadableImages[clampedIndex];

  const handleImageError = (url: string) => {
    setFailedUrls((prev) => new Set([...prev, url]));
    setCurrentIndex(0);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : loadableImages.length - 1));
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < loadableImages.length - 1 ? prev + 1 : 0));
  };

  if (loadableImages.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-slate-200 flex items-center justify-center text-slate-500">
        No photos
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-[4/3] w-full bg-slate-200 relative overflow-hidden">
        <Image
          src={currentImage}
          alt="Property"
          fill
          className="object-cover"
          priority={clampedIndex === 0}
          sizes="(max-width: 768px) 100vw, 800px"
          onError={() => currentImage && handleImageError(currentImage)}
        />
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card flex items-center justify-center text-slate-700 hover:bg-white transition-colors"
          aria-label="Next image"
        >
          →
        </button>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto bg-slate-100">
        {loadableImages.map((img, index) => (
          <button
            key={img}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
              index === clampedIndex ? 'border-accent-500' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={img} alt="" width={64} height={48} className="w-full h-full object-cover" onError={() => handleImageError(img)} />
          </button>
        ))}
      </div>
    </div>
  );
}
