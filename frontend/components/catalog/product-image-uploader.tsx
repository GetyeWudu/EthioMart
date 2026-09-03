"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Star, AlertTriangle, Image as ImageIcon, Plus } from "lucide-react";

export interface StagedImage {
  id?: string;
  file: File | null;
  previewUrl: string;
  isPrimary: boolean;
  aspectRatioOk?: boolean;
}

interface ProductImageUploaderProps {
  images: StagedImage[];
  onChange: (images: StagedImage[]) => void;
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aspectWarning, setAspectWarning] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newStaged: StagedImage[] = [];
    let warningTriggered = false;

    Array.from(files).forEach((file, index) => {
      const previewUrl = URL.createObjectURL(file);
      const isPrimary = images.length === 0 && index === 0;

      // Check aspect ratio client-side
      const img = new window.Image();
      img.src = previewUrl;
      img.onload = () => {
        const ratio = img.width / img.height;
        const isSquare = ratio >= 0.9 && ratio <= 1.1;
        if (!isSquare && !warningTriggered) {
          setAspectWarning("Square 1:1 aspect ratio images (min 1000x1000px) are strongly recommended for high-conversion product galleries.");
          warningTriggered = true;
        }
      };

      newStaged.push({
        file,
        previewUrl,
        isPrimary,
        aspectRatioOk: true,
      });
    });

    // Make sure only the first image is primary
    const combined = [...images, ...newStaged];
    if (combined.length > 0 && !combined.some(img => img.isPrimary)) {
      combined[0].isPrimary = true;
    }

    onChange(combined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const setPrimary = (index: number) => {
    const updated = images.map((img, idx) => ({
      ...img,
      isPrimary: idx === index,
    }));
    // Sort to ensure primary is first
    const primary = updated.find(img => img.isPrimary);
    const others = updated.filter(img => !img.isPrimary);
    onChange(primary ? [primary, ...others] : updated);
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    if (images[index].isPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-bold text-slate-900 dark:text-white">Media Gallery*</label>
          <p className="text-[11px] text-slate-500">
            1:1 Square recommended (min 1000x1000px).
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {aspectWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <p>{aspectWarning}</p>
        </div>
      )}

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 auto-rows-[80px] md:auto-rows-[100px]">
        {/* Primary / Hero Slot */}
        <div className="col-span-2 row-span-2 relative group rounded-2xl overflow-hidden border-2 bg-slate-50 dark:bg-slate-900 transition-all border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].previewUrl}
                alt="Primary Thumbnail"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                HERO
              </span>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeImage(0); }}
                  className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div onClick={() => fileInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <ImageIcon className="w-8 h-8 opacity-50" />
              <span className="text-xs font-semibold px-4 text-center">Add Primary Image</span>
            </div>
          )}
        </div>

        {/* Secondary Slots */}
        {images.slice(1).map((img, idx) => (
          <div
            key={idx + 1}
            className="relative group rounded-xl overflow-hidden border-2 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.previewUrl}
              alt={`Secondary ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPrimary(idx + 1)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold rounded"
              >
                MAKE HERO
              </button>
              <button
                type="button"
                onClick={() => removeImage(idx + 1)}
                className="w-6 h-6 flex items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {/* Upload Button Slot */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl overflow-hidden border-2 border-dashed bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900 flex items-center justify-center mb-1">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold">ADD MORE</span>
        </div>
      </div>
    </div>
  );
}

import { Trash2 } from "lucide-react";
