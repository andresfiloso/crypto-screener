"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Volume2,
  VolumeX,
  Plus,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMonitor } from "@/hooks/use-monitor";
import { AddToMonitorDialog } from "@/components/monitor/add-to-monitor-dialog";
import type { ScanResult, TradeSide } from "@/types/scans";
import type { SymbolState } from "@/types/symbol";
import type { Timeframe } from "@/types/candle";

const TV_INTERVAL_MAP: Record<string, string> = {
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "1D",
  "1w": "1W",
  "1M": "1M",
};

const TIMEFRAME_ORDER = ["5m", "15m", "1h", "4h", "1d", "1w", "1M"];

function getPrimaryInterval(
  conditions: import("@/types/scans").Condition[],
): string {
  const sorted = [...conditions].sort(
    (a, b) =>
      TIMEFRAME_ORDER.indexOf(a.timeframe) -
      TIMEFRAME_ORDER.indexOf(b.timeframe),
  );
  return TV_INTERVAL_MAP[sorted[0]?.timeframe ?? "1h"] ?? "60";
}

function tvUrl(symbol: string, interval: string) {
  return `https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol}&interval=${interval}`;
}

interface ScanCardProps {
  scan: ScanResult;
  soundEnabled: boolean;
  onToggleSound: () => void;
  symbols?: SymbolState[];
  newSymbols?: Set<string>;
}

function SidePill({ side }: { side: TradeSide }) {
  const isLong = side === "long";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        isLong
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
      )}
    >
      {isLong ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {isLong ? "LONG" : "SHORT"}
    </span>
  );
}

export function ScanCard({
  scan,
  soundEnabled,
  onToggleSound,
  symbols = [],
  newSymbols,
}: ScanCardProps) {
  const count = scan.matches.length;
  const idea = scan.tradeIdea;
  const { add, isMonitored } = useMonitor();
  const [dialogSymbol, setDialogSymbol] = useState<string | null>(null);

  const scanTimeframes: Timeframe[] = [
    ...new Set(scan.conditions.map((c) => c.timeframe)),
  ];

  const dialogSymbolState = dialogSymbol
    ? symbols.find((s) => s.symbol === dialogSymbol)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <Link href={`/scans/${scan.scanId}`} className="hover:underline">
              {scan.name}
            </Link>
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onToggleSound}
              title={
                soundEnabled
                  ? "Sound on — click to mute"
                  : "Sound off — click to enable"
              }
              className={cn(
                "inline-flex items-center rounded p-1 text-xs font-medium transition-colors",
                soundEnabled
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {soundEnabled ? (
                <Volume2 className="size-3.5" />
              ) : (
                <VolumeX className="size-3.5" />
              )}
            </button>
            <Badge variant={count > 0 ? "default" : "outline"}>
              {count} {count === 1 ? "match" : "matches"}
            </Badge>
          </div>
        </div>
        {scan.description && (
          <CardDescription>{scan.description}</CardDescription>
        )}
      </CardHeader>

      {count > 0 && (
        <CardContent className="space-y-3">
          {/* Trade idea section */}
          {idea && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <SidePill side={idea.side} />
                <span className="text-xs text-muted-foreground">
                  {idea.rationale}
                </span>
              </div>
              <ul className="space-y-1">
                {scan.matches.map((symbol) => (
                  <li key={symbol} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground text-xs w-4">→</span>
                    <span className="text-xs text-muted-foreground">
                      Open {idea.side.toUpperCase()}
                    </span>
                    <a
                      href={tvUrl(symbol, getPrimaryInterval(scan.conditions))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1"
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-mono text-xs",
                          newSymbols?.has(symbol) &&
                            "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400/50",
                        )}
                      >
                        {symbol}
                      </Badge>
                      <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <button
                      onClick={() =>
                        isMonitored(symbol)
                          ? undefined
                          : setDialogSymbol(symbol)
                      }
                      title={
                        isMonitored(symbol)
                          ? "Already monitoring"
                          : "Add to Monitor"
                      }
                      className={cn(
                        "inline-flex items-center rounded p-0.5 transition-colors",
                        isMonitored(symbol)
                          ? "text-emerald-500 cursor-default"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      {isMonitored(symbol) ? (
                        <Check className="size-3" />
                      ) : (
                        <Plus className="size-3" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No trade idea: just show symbol chips */}
          {!idea && (
            <div className="flex flex-wrap gap-1.5">
              {scan.matches.map((symbol) => (
                <a
                  key={symbol}
                  href={tvUrl(symbol, getPrimaryInterval(scan.conditions))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1"
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "font-mono",
                      newSymbols?.has(symbol) &&
                        "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400/50",
                    )}
                  >
                    {symbol}
                  </Badge>
                  <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      )}

      {dialogSymbol && idea && (
        <AddToMonitorDialog
          open={!!dialogSymbol}
          onOpenChange={(open) => !open && setDialogSymbol(null)}
          symbol={dialogSymbol}
          side={idea.side}
          currentPrice={dialogSymbolState?.price ?? 0}
          scanId={scan.scanId}
          scanName={scan.name}
          suggestedTimeframes={scanTimeframes}
          onConfirm={(entry) => {
            add(entry);
            setDialogSymbol(null);
          }}
        />
      )}
    </Card>
  );
}
