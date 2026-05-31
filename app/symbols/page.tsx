"use client";

import Link from "next/link";
import { useScreenerData } from "@/hooks/use-screener-data";
import { SymbolTable } from "@/components/symbols/symbol-table";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthIndicator } from "@/components/dashboard/health-indicator";
import { SyncStatus } from "@/components/dashboard/sync-status";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SymbolsPage() {
  const { data, loading, error, lastFetchedAt } = useScreenerData();

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
            <h1 className="text-lg font-semibold tracking-tight">Symbols</h1>
          </div>
          <div className="flex items-center gap-3">
            {data && <HealthIndicator feeds={data.health} />}
            <SyncStatus lastFetchedAt={lastFetchedAt} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (
          <SymbolTable data={data?.symbols ?? []} />
        )}
      </main>
    </div>
  );
}
