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
            {/* <button
              onClick={play}
              title="Test pulse sound"
              className="inline-flex items-center rounded p-1 text-xs font-medium transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <AudioWaveform className="size-4" />
            </button> */}
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
        </section>{" "}
      </main>
    </div>
  );
}
