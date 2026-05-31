"use client";

import Link from "next/link";
import { useRef, useEffect } from "react";
import { Volume2, VolumeX, AudioWaveform } from "lucide-react";
import { useScreenerData } from "@/hooks/use-screener-data";
import { usePulseSound } from "@/hooks/use-pulse-sound";
import { useSoundSettings } from "@/hooks/use-sound-settings";
import { SCANS } from "@/config/scans";
import { ScanCard } from "@/components/dashboard/scan-card";
import { RankingCard } from "@/components/dashboard/ranking-card";
import { HealthIndicator } from "@/components/dashboard/health-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const { data, loading, error, lastFetchedAt } = useScreenerData();
  const { play } = usePulseSound();
  const {
    masterSoundEnabled,
    toggleMasterSound,
    isScanSoundEnabled,
    toggleScanSound,
  } = useSoundSettings();

  // Track previous scan matches to detect newly entered symbols
  const prevMatchesRef = useRef<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    if (!data?.scans) return;

    const isFirstLoad = prevMatchesRef.current.size === 0;
    let shouldPlay = false;

    for (const scan of data.scans) {
      const prev = prevMatchesRef.current.get(scan.scanId) ?? new Set<string>();
      const scanDefault =
        SCANS.find((s) => s.id === scan.scanId)?.notification?.soundEnabled ??
        true;

      if (!isFirstLoad && isScanSoundEnabled(scan.scanId, scanDefault)) {
        for (const symbol of scan.matches) {
          if (!prev.has(symbol)) {
            shouldPlay = true;
            break;
          }
        }
      }

      prevMatchesRef.current.set(scan.scanId, new Set(scan.matches));

      if (shouldPlay) break;
    }

    if (shouldPlay) {
      play();
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
