"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    id: 1,
    badge: "🎧 New Arrivals — Free Delivery Over ETB 2,000",
    heading1: "Elevate Your",
    heading2: "Sound Experience",
    description: "Premium wireless headphones with active noise cancellation — discover music the way it was meant to be heard.",
    cta: { label: "Shop Headphones", href: "/products?category=electronics" },
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 2,
    badge: "🔥 Limited Time — Up to 40% Off",
    heading1: "Dress for",
    heading2: "Every Occasion",
    description: "Explore our curated fashion collection — where modern style meets timeless elegance.",
    cta: { label: "Explore Fashion", href: "/products?category=fashion" },
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: 3,
    badge: "🏡 Home & Living — New Season Collection",
    heading1: "Transform Your",
    heading2: "Living Space",
    description: "Beautiful home essentials, décor, and furniture to create the perfect sanctuary you deserve.",
    cta: { label: "Shop Home Goods", href: "/products?category=home-living" },
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const next = useCallback(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPlaying, next]);

  const slide = HERO_SLIDES[current];

  return (
    <section className="relative w-full h-[60vh] md:h-[calc(100vh-4rem)] overflow-hidden bg-slate-950">
      {/* Background Images */}
      {HERO_SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-in-out",
            i === current ? "opacity-100" : "opacity-0"
          )}
        >
          <Image
            src={s.image}
            alt={s.heading2}
            fill
            className="object-cover object-center"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dark gradient overlay — left side for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/10 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />

      {/* Content */}
      <div className="relative z-20 h-full container mx-auto px-6 flex flex-col justify-center">
        <div className="max-w-2xl">
          {/* Badge */}
          <div
            key={`badge-${current}`}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {slide.badge}
          </div>

          {/* Headline */}
          <h1
            key={`h1-${current}`}
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold leading-[1.05] tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100"
          >
            <span className="block text-primary">{slide.heading1}</span>
            <span className="block text-white">{slide.heading2}</span>
          </h1>

          {/* underline */}
          <div className="w-16 h-1 bg-primary mb-6 rounded-full animate-in fade-in slide-in-from-left-4 duration-500 delay-150" />

          {/* Description */}
          <p
            key={`desc-${current}`}
            className="text-base sm:text-lg text-slate-300 max-w-md leading-relaxed mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
          >
            {slide.description}
          </p>

          {/* CTA buttons */}
          <div
            key={`cta-${current}`}
            className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
          >
            <Link
              href={slide.cta.href}
              className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all hover:scale-105 shadow-xl shadow-primary/30"
            >
              <ShoppingBag className="h-4 w-4" />
              {slide.cta.label}
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition-all"
            >
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide number — bottom right */}
      <div className="absolute bottom-8 right-8 z-20 text-right hidden md:block">
        <p className="text-xs text-slate-400 font-mono mb-1">
          {String(current + 1).padStart(2, "0")} / {String(HERO_SLIDES.length).padStart(2, "0")}
        </p>
        <p className="text-xs text-slate-500 max-w-[180px] line-clamp-2">{slide.description}</p>
      </div>

      {/* Prev / Next arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Play / Pause — bottom left */}
      <button
        onClick={() => setIsPlaying((p) => !p)}
        className="absolute bottom-8 left-8 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
        aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
      >
        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>

      {/* Scroll indicator — bottom center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 text-slate-400">
        <span className="text-[10px] font-semibold tracking-widest uppercase">Scroll</span>
        <div className="h-6 w-4 rounded-full border border-slate-500 flex items-start justify-center pt-1">
          <div className="h-1.5 w-1 rounded-full bg-primary animate-bounce" />
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 mt-10 z-20 flex items-center gap-2 translate-y-12">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "transition-all rounded-full",
              i === current ? "w-6 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/30 hover:bg-white/60"
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
