'use client';

import { useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { photoPublicUrl } from '@/lib/supabase';

export default function PhotoSection() {
  const dayPhotos = useAppStore((s) => s.dayPhotos);
  const uploadPhoto = useAppStore((s) => s.uploadPhoto);
  const openGallery = useAppStore((s) => s.openGallery);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#ededed]">
          {dayPhotos.length > 0 ? `${dayPhotos.length} fotos` : 'Fotos'}
        </span>
        <button
          className="bg-white/5 active:bg-white/10 rounded-xl px-4 py-2.5 text-sm text-[#ededed]"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 Foto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {dayPhotos.length === 0 ? (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Sin fotos
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {dayPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="rounded-xl overflow-hidden aspect-square"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPublicUrl(photo.storage_path)}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer active:opacity-80"
                onClick={() => openGallery(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
