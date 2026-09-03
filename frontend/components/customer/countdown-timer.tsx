"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetHours?: number;
  className?: string;
  onExpire?: () => void;
}

export function CountdownTimer({ 
  targetHours = 24, 
  className,
  onExpire 
}: CountdownTimerProps) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    setMounted(true);
    
    // Simulate a target time (e.g., 24 hours from when component mounts)
    // In a real app, this would be passed from a server or fixed date
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + targetHours);
    targetDate.setMinutes(targetDate.getMinutes() + 45); // offset for realism
    targetDate.setSeconds(targetDate.getSeconds() + 30);

    const intervalId = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(intervalId);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetHours, onExpire]);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <TimeUnit value="00" label="Hours" />
        <span className="text-xl font-bold text-slate-400 pb-5">:</span>
        <TimeUnit value="00" label="Mins" />
        <span className="text-xl font-bold text-slate-400 pb-5">:</span>
        <TimeUnit value="00" label="Secs" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TimeUnit 
        value={timeLeft.hours.toString().padStart(2, "0")} 
        label="Hours" 
      />
      <span className="text-xl sm:text-2xl font-black text-rose-500/50 pb-5 animate-pulse">:</span>
      <TimeUnit 
        value={timeLeft.minutes.toString().padStart(2, "0")} 
        label="Mins" 
      />
      <span className="text-xl sm:text-2xl font-black text-rose-500/50 pb-5 animate-pulse">:</span>
      <TimeUnit 
        value={timeLeft.seconds.toString().padStart(2, "0")} 
        label="Secs" 
      />
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-md relative overflow-hidden">
        {/* Subtle glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5" />
        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight relative z-10 font-mono">
          {value}
        </span>
      </div>
      <span className="mt-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </span>
    </div>
  );
}
