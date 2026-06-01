"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { Volume2, VolumeX, AudioWaveform, Activity } from "lucide-react";
import { useScreenerData } from "@/hooks/use-screener-data";
import { usePulseSound } from "@/hooks/use-pulse-sound";
import { useSoundSettings } from "@/hooks/use-sound-settings";
import { SCANS } from "@/config/scans";
import { useMonitor } from "@/hooks/use-monitor";
import { ScanCard } from "@/components/dashboard/scan-card";
import { MonitorCard } from "@/components/monitor/monitor-card";
import { RankingCard } from "@/components/dashboard/ranking-card";
import { HealthIndicator } from "@/components/dashboard/health-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const { data, loading, error, lastFetchedAt } = useScreenerData();
  const { entries, remove, update } = useMonitor();
  const { play } = usePulseSound();
  const {
    masterSoundEnabled,
    toggleMasterSound,
    isScanSoundEnabled,
    toggleScanSound,
  } = useSoundSettings();

  // Track previous scan matches to detect newly entered symbols
  const prevMatchesRef = useRef<Map<string, Set<string>>>(new Map());
  const newTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [newMatches, setNewMatches] = useState<Record<string, Set<string>>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = newTimersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!data?.scans) return;

    const isFirstLoad = prevMatchesRef.current.size === 0;
    let shouldPlay = false;
    const freshNew: Record<string, string[]> = {};

    for (const scan of data.scans) {
      const prev = prevMatchesRef.current.get(scan.scanId) ?? new Set<string>();
      const scanDefault =
        SCANS.find((s) => s.id === scan.scanId)?.notification?.soundEnabled ??
        true;

      if (!isFirstLoad && isScanSoundEnabled(scan.scanId, scanDefault)) {
        for (const symbol of scan.matches) {
          if (!prev.has(symbol)) {
            shouldPlay = true;
            if (!freshNew[scan.scanId]) freshNew[scan.scanId] = [];
            freshNew[scan.scanId].push(symbol);
          }
        }
      }

      prevMatchesRef.current.set(scan.scanId, new Set(scan.matches));
    }

    if (shouldPlay) {
      play();
    }

    if (Object.keys(freshNew).length > 0) {
      setNewMatches((prev) => {
        const next: Record<string, Set<string>> = {};
        for (const [k, v] of Object.entries(prev)) next[k] = new Set(v);
        for (const [scanId, symbols] of Object.entries(freshNew)) {
          if (!next[scanId]) next[scanId] = new Set();
          for (const s of symbols) next[scanId].add(s);
        }
        return next;
      });

      const timer = setTimeout(() => {
        setNewMatches((prev) => {
          const next: Record<string, Set<string>> = {};
          for (const [k, v] of Object.entries(prev)) next[k] = new Set(v);
          for (const [scanId, symbols] of Object.entries(freshNew)) {
            for (const s of symbols) next[scanId]?.delete(s);
            if (!next[scanId]?.size) delete next[scanId];
          }
          return next;
        });
      }, 30_000);

      newTimersRef.current.push(timer);
    }
  }, [data?.scans, isScanSoundEnabled, play]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">
              Crypto Screener
            </h1>
            {data && (
              <Badge
                variant={
                  data.status === "healthy"
                    ? "default"
                    : data.status === "warming_up"
                      ? "secondary"
                      : "outline"
                }
                className="capitalize"
              >
                {data.status.replace("_", " ")}
              </Badge>
            )}
          </div>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link
              href="/symbols"
              className="hover:text-foreground transition-colors"
            >
              Symbols
            </Link>
            <Link
              href="/monitor"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Activity className="size-3.5" />
              Monitor
            </Link>
            {data && <HealthIndicator feeds={data.health} />}
            <SyncStatus lastFetchedAt={lastFetchedAt} />
            <button
              onClick={play}
              title="Test pulse sound"
              className="inline-flex items-center rounded p-1 text-xs font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <AudioWaveform className="size-4" />
            </button>
            <button
              onClick={toggleMasterSound}
              title={
                masterSoundEnabled
                  ? "Mute all scan sounds"
                  : "Unmute all scan sounds"
              }
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
            >
              {masterSoundEnabled ? (
                <Volume2 className="size-4" />
              ) : (
                <VolumeX className="size-4" />
              )}
            </button>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        <section>
          <h2 className="mb-4 text-base font-medium">Opportunity Scans</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.scans
                .filter((s) => !s.group)
                .map((scan) => {
                  const scanDefault =
                    SCANS.find((s) => s.id === scan.scanId)?.notification
                      ?.soundEnabled ?? true;
                  return (
                    <ScanCard
                      key={scan.scanId}
                      scan={scan}
                      soundEnabled={isScanSoundEnabled(
                        scan.scanId,
                        scanDefault,
                      )}
                      onToggleSound={() =>
                        toggleScanSound(scan.scanId, scanDefault)
                      }
                      symbols={data?.symbols}
                      newSymbols={newMatches[scan.scanId]}
                    />
                  );
                })}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-base font-medium">Custom Scans</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data?.scans
                .filter((s) => s.group === "custom")
                .map((scan) => {
                  const scanDefault =
                    SCANS.find((s) => s.id === scan.scanId)?.notification
                      ?.soundEnabled ?? true;
                  return (
                    <ScanCard
                      key={scan.scanId}
                      scan={scan}
                      soundEnabled={isScanSoundEnabled(
                        scan.scanId,
                        scanDefault,
                      )}
                      onToggleSound={() =>
                        toggleScanSound(scan.scanId, scanDefault)
                      }
                      symbols={data?.symbols}
                      newSymbols={newMatches[scan.scanId]}
                    />
                  );
                })}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-4 text-base font-medium">Rankings</h2>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data?.rankings.map((ranking) => (
                <RankingCard key={ranking.rankingId} ranking={ranking} />
              ))}
            </div>
          )}
        </section>
        {entries.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-medium flex items-center gap-2">
                <Activity className="size-4" />
                Monitor
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {entries.length}
                </span>
              </h2>
              <Link
                href="/monitor"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <MonitorCard
                  key={entry.symbol}
                  entry={entry}
                  symbolState={data?.symbols.find(
                    (s) => s.symbol === entry.symbol,
                  )}
                  onRemove={() => remove(entry.symbol)}
                  onUpdate={update}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t mt-10">
        <div className="mx-auto max-w-7xl px-4 py-4 flex justify-center">
          <a
            href="https://github.com/andresfiloso/crypto-screener"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="View on GitHub"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
