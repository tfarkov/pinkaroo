import React, { useState } from 'react';
import Image from 'next/image';

interface Props {
  images: string[];
}

export default function PropertyGallery({ images }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const safeImages = images?.length ? images : [];
  const currentImage = safeImages[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : safeImages.length - 1));
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev < safeImages.length - 1 ? prev + 1 : 0));
  };

  if (safeImages.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-primary-100 flex items-center justify-center text-primary-500">
        No photos
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="aspect-[4/3] w-full bg-primary-100 relative overflow-hidden">
        <Image
          src={currentImage}
          alt="Property"
          fill
          className="object-cover"
          priority={currentIndex === 0}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card flex items-center justify-center text-primary-700 hover:bg-white transition-colors"
          aria-label="Previous image"
        >
          ←
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-card flex items-center justify-center text-primary-700 hover:bg-white transition-colors"
          aria-label="Next image"
        >
          →
        </button>
      </div>
      <div className="flex gap-2 p-3 overflow-x-auto bg-primary-50">
        {safeImages.map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
              index === currentIndex ? 'border-accent-500' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <Image src={img} alt="" width={64} height={48} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
