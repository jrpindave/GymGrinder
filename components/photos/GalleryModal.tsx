'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { photoPublicUrl } from '@/lib/supabase';

export default function GalleryModal() {
  const {
    galleryOpen,
    galleryIndex,
    dayPhotos,
    closeGallery,
    setGalleryIndex,
    deletePhoto,
  } = useAppStore();

  const touchStartX = useRef<number | null>(null);

  const total = dayPhotos.length;
  const safeIndex = total === 0 ? 0 : Math.min(galleryIndex, total - 1);
  const currentPhoto = total > 0 ? dayPhotos[safeIndex] : null;

  // Auto-close if no photos
  useEffect(() => {
    if (galleryOpen && total === 0) {
      closeGallery();
    }
  }, [galleryOpen, total, closeGallery]);

  // Correct out-of-bounds index
  useEffect(() => {
    if (galleryOpen && total > 0 && galleryIndex >= total) {
      setGalleryIndex(total - 1);
    }
  }, [galleryOpen, galleryIndex, total, setGalleryIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'Escape') closeGallery();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  if (!galleryOpen || !currentPhoto) return null;

  function handlePrev() {
    if (safeIndex > 0) setGalleryIndex(safeIndex - 1);
  }

  function handleNext() {
    if (safeIndex < total - 1) setGalleryIndex(safeIndex + 1);
  }

  function handleDelete() {
    deletePhoto(currentPhoto!.id);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta > 50) handlePrev();
    else if (delta < -50) handleNext();
  }

  return (
    <div
      className="fixed inset-0 bg-black z-[600] flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="relative flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
        {/* Close */}
        <button
          onClick={closeGallery}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 text-[#ededed] text-lg"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20 text-[#ededed] text-lg"
          aria-label="Eliminar foto"
        >
          🗑
        </button>
      </div>

      {/* Image area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoPublicUrl(currentPhoto.storage_path)}
          alt={`Foto ${safeIndex + 1}`}
          className="w-full h-full object-contain select-none"
          draggable={false}
        />

        {/* Prev button */}
        {safeIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 active:bg-black/60 text-white text-xl"
            aria-label="Anterior"
          >
            ‹
          </button>
        )}

        {/* Next button */}
        {safeIndex < total - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 active:bg-black/60 text-white text-xl"
            aria-label="Siguiente"
          >
            ›
          </button>
        )}
      </div>

      {/* Bottom counter */}
      <div className="flex-shrink-0 pb-6 pt-3 flex items-center justify-center">
        <span style={{ color: 'rgba(255,255,255,0.45)' }} className="text-sm tabular-nums">
          {safeIndex + 1} / {total}
        </span>
      </div>
    </div>
  );
}
