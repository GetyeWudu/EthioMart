"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePos({ x, y });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMouseMove(e);
    setIsZoomed(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(100, ((touch.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((touch.clientY - top) / height) * 100));
    setMousePos({ x, y });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    handleTouchMove(e);
    setIsZoomed(true);
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
        <span className="text-slate-400">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-3 lg:gap-4">
      {/* Thumbnails (Left on all devices) */}
      <div className="flex flex-col gap-2 lg:gap-3 overflow-y-auto w-16 sm:w-20 lg:w-24 shrink-0 no-scrollbar py-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedIndex(idx);
              setIsZoomed(false);
            }}
            className={cn(
              "relative aspect-square w-16 sm:w-20 lg:w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 transition-all border-2",
              selectedIndex === idx 
                ? "border-primary shadow-sm" 
                : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            )}
          >
            <Image
              src={img}
              alt={`${productName} thumbnail ${idx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 80px, 96px"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div 
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 flex-1 transition-colors cursor-crosshair group"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsZoomed(false)}
      >
        <Image
          src={images[selectedIndex]}
          alt={`${productName} image ${selectedIndex + 1}`}
          fill
          draggable={false}
          className={cn(
            "object-cover transition-transform pointer-events-none",
            isZoomed ? "scale-[2.5] duration-0" : "duration-500"
          )}
          style={
            isZoomed
              ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` }
              : { transformOrigin: "center center" }
          }
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}
