"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ interval = 5000 }: { interval?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Only refresh if the document is visible to save resources
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }, interval);

    return () => clearInterval(intervalId);
  }, [router, interval]);

  return null;
}
