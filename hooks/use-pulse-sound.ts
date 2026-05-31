"use client";

import { useRef, useCallback } from "react";

export function usePulseSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/notification.mp3");
      }
      // Rewind and play — works even if already playing
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked until first user interaction
      });
    } catch {
      // Audio may be unavailable in SSR or restricted environments
    }
  }, []);

  return { play };
}
