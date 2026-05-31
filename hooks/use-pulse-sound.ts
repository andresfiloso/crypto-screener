"use client";

import { useRef, useCallback } from "react";

/**
 * Synthesizes a short radar-ping pulse using the Web Audio API.
 * No external file required — the tone is generated in real time.
 *
 * Characteristics:
 *  - Frequency: 880 Hz (clean high-pitch ping)
 *  - Duration: ~180 ms with exponential decay
 *  - Gain: subtle (0.25 peak)
 */
export function usePulseSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const play = useCallback(() => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }

      const ctx = ctxRef.current;

      const pulse = (time: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.value = 1250;

        gainNode.gain.setValueAtTime(0.12, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);

        oscillator.start(time);
        oscillator.stop(time + 0.05);
      };

      pulse(ctx.currentTime);
      pulse(ctx.currentTime + 0.09);
      pulse(ctx.currentTime + 0.18);
    } catch {
      // AudioContext may be unavailable in SSR or restricted environments
    }
  }, []);

  return { play };
}
