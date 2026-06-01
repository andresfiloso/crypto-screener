"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface Spark {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
  color: string;
  startY: number;
}

interface RSIMomentumBarProps {
  rsi: number;
  symbol?: string;
  timeframe?: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
  showTooltip?: boolean;
  className?: string;
}

// Color interpolation based on RSI position
// isDark=true uses light pastel shades (visible on dark bg); isDark=false uses darker saturated shades (visible on light bg)
function getSparkColor(rsi: number, isDark = true): string {
  if (rsi <= 30) {
    const t = rsi / 30;
    return isDark
      ? lerpColor("#22c55e", "#86efac", t)
      : lerpColor("#15803d", "#16a34a", t);
  }
  if (rsi >= 70) {
    const t = (rsi - 70) / 30;
    return isDark
      ? lerpColor("#fca5a5", "#ef4444", t)
      : lerpColor("#dc2626", "#b91c1c", t);
  }
  const t = (rsi - 30) / 40;
  if (t < 0.5) {
    return isDark
      ? lerpColor("#a3e635", "#f97316", t * 2)
      : lerpColor("#4d7c0f", "#c2410c", t * 2);
  }
  return isDark
    ? lerpColor("#f97316", "#fca5a5", (t - 0.5) * 2)
    : lerpColor("#c2410c", "#9f1239", (t - 0.5) * 2);
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function getZoneInfo(rsi: number): {
  zone: "oversold" | "neutral" | "overbought";
  label: string;
  color: string;
} {
  if (rsi <= 30) {
    return {
      zone: "oversold",
      label: "Oversold",
      color: "#22c55e",
    };
  }
  if (rsi >= 70) {
    return {
      zone: "overbought",
      label: "Overbought",
      color: "#ef4444",
    };
  }
  return {
    zone: "neutral",
    label: "Neutral",
    color: "#64748b",
  };
}

// Returns intensity from 0 to 1
// - Extreme zones (<=30 or >=70): higher intensity as you approach 0 or 100
// - Neutral zone (30-70): very low base intensity
function getIntensity(rsi: number): number {
  if (rsi <= 30) {
    // 0.3 base + up to 0.7 more as it approaches 0
    return 0.3 + Math.max(0, (30 - rsi) / 30) * 0.7;
  }
  if (rsi >= 70) {
    // 0.3 base + up to 0.7 more as it approaches 100
    return 0.3 + Math.max(0, (rsi - 70) / 30) * 0.7;
  }
  // Neutral zone: very low intensity (0.05 to 0.1)
  return 0.05 + Math.abs(rsi - 50) / 400;
}

// Individual Spark Component with Framer Motion
function SparkParticle({
  spark,
  onComplete,
}: {
  spark: Spark;
  onComplete: () => void;
}) {
  const randomX = Math.cos(spark.angle) * spark.distance;
  const randomY = Math.sin(spark.angle) * spark.distance;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: spark.size,
        height: spark.size,
        backgroundColor: spark.color,
        boxShadow: `0 0 ${spark.size * 2}px ${spark.color}, 0 0 ${spark.size * 3}px ${spark.color}80`,
        left: 0,
        top: spark.startY,
      }}
      initial={{
        scale: 0,
        x: 0,
        y: 0,
        opacity: 1,
      }}
      animate={{
        scale: [0, 1.2, 0.8, 0],
        x: randomX,
        y: randomY,
        opacity: [1, 1, 0.6, 0],
      }}
      transition={{
        duration: spark.duration,
        delay: spark.delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      onAnimationComplete={onComplete}
    />
  );
}

export function RSIMomentumBar({
  rsi,
  symbol = "BTCUSDT",
  timeframe = "15m",
  showTooltip = true,
  className,
}: RSIMomentumBarProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkIdCounter = useRef(0);
  const barHeight = 12;

  const zoneInfo = useMemo(() => getZoneInfo(rsi), [rsi]);
  const intensity = useMemo(() => getIntensity(rsi), [rsi]);
  const isExtreme = rsi <= 30 || rsi >= 70;

  // Smooth spring animation for RSI value
  const springConfig = { stiffness: 120, damping: 25, mass: 0.5 };
  const animatedRsi = useSpring(rsi, springConfig);
  const displayRsi = useTransform(animatedRsi, (v) => v.toFixed(1));

  // Update spring when RSI changes
  useEffect(() => {
    animatedRsi.set(rsi);
  }, [rsi, animatedRsi]);

  // Generate sparks continuously - always active, just varies in intensity
  useEffect(() => {
    const generateSparkBurst = () => {
      // Spark count based on intensity: 1-2 for neutral, up to 12 for extreme
      const sparkCount = Math.max(1, Math.floor(1 + intensity * 11));
      const newSparks: Spark[] = [];

      for (let i = 0; i < sparkCount; i++) {
        // Sparks spread upward from the line with some horizontal variance
        const angleBase = -Math.PI / 2;
        const angleSpread = Math.PI * 0.7;
        const angle = angleBase + (Math.random() - 0.5) * angleSpread;

        // Random start position along the line height
        const startY = (Math.random() - 0.5) * barHeight;

        // Base color from RSI position with slight variation
        const baseColor = getSparkColor(
          rsi + (Math.random() - 0.5) * 5,
          isDark,
        );

        newSparks.push({
          id: sparkIdCounter.current++,
          angle,
          distance: 15 + Math.random() * 35 * (0.5 + intensity),
          size: 1.5 + Math.random() * 2 * (0.5 + intensity * 0.5),
          delay: Math.random() * 0.08,
          duration: 0.3 + Math.random() * 0.25,
          color: baseColor,
          startY,
        });
      }

      setSparks((prev) => [...prev, ...newSparks]);
    };

    generateSparkBurst();
    // Interval varies: slower for neutral (400ms), faster for extreme (60ms)
    const intervalMs = Math.max(60, 400 - intensity * 340);
    const interval = setInterval(generateSparkBurst, intervalMs);

    return () => clearInterval(interval);
  }, [intensity, rsi, barHeight, isDark]);

  const removeSpark = useCallback((id: number) => {
    setSparks((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Line color based on RSI position
  const lineColor = getSparkColor(rsi, isDark);

  return (
    <div className={cn("relative w-full max-w-md select-none", className)}>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">
            {symbol}
          </span>
          <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
            RSI {timeframe}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-mono text-xs font-medium",
              zoneInfo.zone === "oversold" &&
                "bg-green-500/20 text-green-700 dark:text-green-400",
              zoneInfo.zone === "overbought" &&
                "bg-red-500/20 text-red-700 dark:text-red-400",
              zoneInfo.zone === "neutral" &&
                "bg-slate-500/20 text-slate-600 dark:text-slate-400",
            )}
          >
            {zoneInfo.label}
          </span>
          <motion.span
            className={cn(
              "font-mono text-lg font-bold tabular-nums",
              zoneInfo.zone === "oversold" &&
                "text-green-700 dark:text-green-400",
              zoneInfo.zone === "overbought" &&
                "text-red-700 dark:text-red-400",
              zoneInfo.zone === "neutral" &&
                "text-slate-700 dark:text-slate-300",
            )}
          >
            {displayRsi}
          </motion.span>
        </div>
      </div>

      {/* Main Bar Container */}
      <div className="relative">
        {/* Background Bar with Zones */}
        <div
          className="relative w-full overflow-visible rounded-full bg-secondary/80"
          style={{ height: barHeight }}
        >
          {/* Zone gradients */}
          <div className="absolute inset-0 flex rounded-full overflow-hidden">
            <div className="h-full w-[30%] bg-gradient-to-r from-green-200/80 via-green-100/50 to-green-100/30 dark:from-green-950/80 dark:via-green-900/50 dark:to-green-900/30" />
            <div className="h-full w-[40%] bg-gradient-to-r from-slate-200/30 via-slate-100/20 to-slate-200/30 dark:from-slate-800/30 dark:via-slate-700/20 dark:to-slate-800/30" />
            <div className="h-full w-[30%] bg-gradient-to-r from-red-100/30 via-red-100/50 to-red-200/80 dark:from-red-900/30 dark:via-red-900/50 dark:to-red-950/80" />
          </div>

          {/* Zone divider lines */}
          <div className="absolute left-[30%] top-0 h-full w-px bg-green-500/30" />
          <div className="absolute left-[70%] top-0 h-full w-px bg-red-500/30" />
        </div>

        {/* LINE INDICATOR with Sparks */}
        <motion.div
          className="absolute top-0 pointer-events-none"
          style={{
            height: barHeight,
            x: "-50%",
          }}
          initial={false}
          animate={{
            left: `${rsi}%`,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 25 }}
        >
          {/* Spark Container */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-visible"
            style={{ width: 1, height: barHeight }}
          >
            <AnimatePresence>
              {sparks.map((spark) => (
                <SparkParticle
                  key={spark.id}
                  spark={spark}
                  onComplete={() => removeSpark(spark.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* The Line Indicator - simple vertical line */}
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-0.5 rounded-full"
            style={{
              height: barHeight,
              backgroundColor: lineColor,
              boxShadow: isExtreme
                ? `0 0 ${4 + intensity * 6}px ${lineColor}, 0 0 ${8 + intensity * 10}px ${lineColor}60`
                : `0 0 2px ${lineColor}40`,
            }}
          />
        </motion.div>

        {/* Scale Labels */}
        <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>0</span>
          <span className="text-green-500/70">30</span>
          <span>50</span>
          <span className="text-red-500/70">70</span>
          <span>100</span>
        </div>
      </div>

      {/* Tooltip Panel */}
      {showTooltip && (
        <div
          className={cn(
            "mt-4 overflow-hidden rounded-lg border bg-card/80 backdrop-blur-sm",
            isExtreme ? "border-opacity-40" : "border-border",
          )}
          style={{
            borderColor: isExtreme ? `${lineColor}40` : undefined,
          }}
        >
          <div className="p-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Value
                </div>
                <motion.div
                  className={cn(
                    "font-mono text-sm font-semibold",
                    zoneInfo.zone === "oversold" &&
                      "text-green-700 dark:text-green-400",
                    zoneInfo.zone === "overbought" &&
                      "text-red-700 dark:text-red-400",
                    zoneInfo.zone === "neutral" && "text-foreground",
                  )}
                >
                  {displayRsi}
                </motion.div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Timeframe
                </div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {timeframe}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Intensity
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-1 rounded-full transition-colors duration-200"
                      style={{
                        backgroundColor:
                          i < Math.ceil(intensity * 5)
                            ? lineColor
                            : "hsl(var(--muted))",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
