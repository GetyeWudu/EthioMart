"use client";

export function HeroSlider() {
  return (
    <section className="relative w-full min-h-screen h-screen overflow-hidden bg-slate-950 flex items-center">
      {/* Permanent Fullscreen Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none scale-[1.01]"
      >
        <source src="/hero/ethimart.mp4" type="video/mp4" />
      </video>

      {/* Cinematic Multi-layered Gradient Overlays */}
      {/* Primary reading backdrop from left */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30 z-10" />
      {/* Top navbar shade & bottom transition to content */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 z-10" />
      {/* Brand Radial soft glows: EthioMart Blue (#1261C9) & EthioMart Orange (#FF7900) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#1261C9]/20 rounded-full blur-3xl pointer-events-none z-10" />
      <div className="absolute bottom-1/4 -right-24 w-80 h-80 bg-[#FF7900]/15 rounded-full blur-3xl pointer-events-none z-10" />

      {/* Hero Content Container — elevated upwards */}
      <div className="relative z-20 w-full container mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 flex flex-col justify-center -mt-16 sm:-mt-24">
        <div className="max-w-xl">
          {/* Main Headline — Minimized Paragraph in Brand Colors Only */}
          <p className="text-xs sm:text-sm font-semibold tracking-wide leading-relaxed mb-3">
            <span className="text-[#1261C9]">Shop Local.</span>{" "}
            <span className="text-[#FF7900]">Support Ethiopia</span>
          </p>

          {/* Accent rule — Brand colors only */}
          <div className="w-12 h-1 bg-gradient-to-r from-[#1261C9] to-[#FF7900] rounded-full" />
        </div>
      </div>

      {/* Scroll indicator — bottom center in brand colors */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
          }
        }}
        className="absolute bottom-7 sm:bottom-9 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none transition-all duration-300"
        aria-label="Scroll down"
      >
        <span className="font-serif text-[11px] sm:text-xs tracking-[0.28em] uppercase text-slate-300 group-hover:text-[#FF7900] transition-colors">
          SCROLL
        </span>
        <div className="w-[18px] h-[28px] rounded-full border-[1.5px] border-white/60 group-hover:border-[#FF7900] transition-colors flex items-start justify-center pt-1.5 shadow-sm">
          <span className="w-[2px] h-[6px] bg-[#FF7900] rounded-full animate-bounce" />
        </div>
      </button>
    </section>
  );
}
