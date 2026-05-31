"use client";

import { use } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useScreenerData } from "@/hooks/use-screener-data";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SymbolState } from "@/types/symbol";
import type { ScanResult, Condition, TradeSide } from "@/types/scans";
import type { Timeframe } from "@/types/candle";

interface ScanPageProps {
  params: Promise<{ id: string }>;
}

function getIndicatorValue(
  symbol: SymbolState,
  timeframe: Timeframe,
  indicator: string,
): string {
  const ind = symbol.timeframes[timeframe]?.indicators;
  if (!ind) return "—";
  if (indicator.startsWith("MACD.")) {
    const sub = indicator.slice(5) as "value" | "signal" | "histogram";
    return ind.MACD?.[sub]?.toFixed(4) ?? "—";
  }
  const val = ind[indicator as keyof typeof ind];
  if (typeof val === "number") return val.toFixed(2);
  return "—";
}

function TradeIdeaBanner({
  side,
  rationale,
  matchCount,
}: {
  side: TradeSide;
  rationale: string;
  matchCount: number;
}) {
  const isLong = side === "long";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        isLong
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
          : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
      )}
    >
      <div
        className={cn(
          "mt-0.5 rounded-full p-1.5",
          isLong
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-400",
        )}
      >
        {isLong ? (
          <TrendingUp className="size-4" />
        ) : (
          <TrendingDown className="size-4" />
        )}
      </div>
      <div className="space-y-0.5">
        <p
          className={cn(
            "text-sm font-semibold",
            isLong
              ? "text-emerald-800 dark:text-emerald-300"
              : "text-red-800 dark:text-red-300",
          )}
        >
          {isLong ? "Long" : "Short"} opportunity · {matchCount}{" "}
          {matchCount === 1 ? "symbol" : "symbols"}
        </p>
        <p className="text-xs text-muted-foreground">{rationale}</p>
      </div>
    </div>
  );
}

function ConditionBadge({ cond }: { cond: Condition }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-mono">
      <span className="text-muted-foreground">{cond.timeframe}</span>
      <span>{cond.indicator}</span>
      <span className="text-muted-foreground">{cond.operator}</span>
      <span>{cond.value}</span>
    </span>
  );
}

export default function ScanDetailPage({ params }: ScanPageProps) {
  // params is a Promise in Next.js 16 — must be unwrapped with `use()`
  const { id } = use(params);
  const { data, loading, error } = useScreenerData();

  const scan: ScanResult | undefined = data?.scans.find((s) => s.scanId === id);

  const matchingSymbols: SymbolState[] =
    scan && data
      ? data.symbols.filter((s) => scan.matches.includes(s.symbol))
      : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Dashboard
          </Link>
          {scan ? (
            <h1 className="text-lg font-semibold tracking-tight">
              {scan.name}
            </h1>
          ) : (
            <h1 className="text-lg font-semibold tracking-tight">
              Scan Detail
            </h1>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-8">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        ) : !scan ? (
          <p className="text-muted-foreground">
            Scan &quot;{id}&quot; not found.
          </p>
        ) : (
          <>
            {/* Trade idea banner */}
            {scan.tradeIdea && scan.matches.length > 0 && (
              <TradeIdeaBanner
                side={scan.tradeIdea.side}
                rationale={scan.tradeIdea.rationale}
                matchCount={scan.matches.length}
              />
            )}

            {/* Scan definition */}
            <Card>
              <CardHeader>
                <CardTitle>{scan.name}</CardTitle>
                {scan.description && (
                  <CardDescription>{scan.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {scan.conditions.map((cond, i) => (
                  <ConditionBadge key={i} cond={cond} />
                ))}
              </CardContent>
            </Card>

            {/* Matching symbols */}
            <section>
              <h2 className="mb-4 text-base font-medium">
                Matching Symbols{" "}
                <Badge variant="outline" className="ml-1">
                  {scan.matches.length}
                </Badge>
              </h2>

              {matchingSymbols.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No symbols currently match this scan.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {matchingSymbols.map((sym) => (
                    <Card key={sym.symbol}>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="font-mono">
                            {sym.symbol}
                          </CardTitle>
                          {scan.tradeIdea && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                                scan.tradeIdea.side === "long"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                              )}
                            >
                              {scan.tradeIdea.side === "long" ? (
                                <TrendingUp className="size-3" />
                              ) : (
                                <TrendingDown className="size-3" />
                              )}
                              {scan.tradeIdea.side.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <CardDescription>
                          Price:{" "}
                          {sym.price.toLocaleString("en-US", {
                            maximumFractionDigits: 4,
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {scan.conditions.map((cond, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="text-muted-foreground font-mono text-xs">
                                {cond.timeframe} {cond.indicator}
                              </span>
                              <span className="tabular-nums font-medium">
                                {getIndicatorValue(
                                  sym,
                                  cond.timeframe,
                                  cond.indicator,
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
