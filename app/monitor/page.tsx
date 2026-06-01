"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { useMonitor } from "@/hooks/use-monitor";
import { useScreenerData } from "@/hooks/use-screener-data";
import { MonitorCard } from "@/components/monitor/monitor-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { SyncStatus } from "@/components/dashboard/sync-status";

export default function MonitorPage() {
  const { entries, remove, update } = useMonitor();
  const { data, lastFetchedAt } = useScreenerData();

  function findSymbolState(symbol: string) {
    return data?.symbols.find((s) => s.symbol === symbol);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <Activity className="size-4" />
              Monitor
            </h1>
            {entries.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {entries.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lastFetchedAt && <SyncStatus lastFetchedAt={lastFetchedAt} />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <Activity className="size-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">
              No positions being monitored.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Go to a scan, find a matching symbol, and click{" "}
              <span className="font-medium">Add to Monitor</span>.
            </p>
            <Link
              href="/"
              className="mt-2 text-sm text-primary hover:underline"
            >
              Back to dashboard →
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <MonitorCard
                key={entry.symbol}
                entry={entry}
                symbolState={findSymbolState(entry.symbol)}
                onRemove={() => remove(entry.symbol)}
                onUpdate={update}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
