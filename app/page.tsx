"use client";

import Link from "next/link";
import { useScreenerData } from "@/hooks/use-screener-data";
import { ScanCard } from "@/components/dashboard/scan-card";
import { RankingCard } from "@/components/dashboard/ranking-card";
import { HealthIndicator } from "@/components/dashboard/health-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardPage() {
  const { data, loading, error, lastFetchedAt } = useScreenerData();

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
                .map((scan) => (
                  <ScanCard key={scan.scanId} scan={scan} />
                ))}
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
                .map((scan) => (
                  <ScanCard key={scan.scanId} scan={scan} />
                ))}
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
