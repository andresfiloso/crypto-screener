"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Trash2,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RSIMomentumBar } from "@/components/rsi-momemtum-bar";
import { AddToMonitorDialog } from "@/components/monitor/add-to-monitor-dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberPrice } from "@/components/ui/number-price";
import { ACTIVE_TIMEFRAMES } from "@/config/timeframes";
import type { MonitorEntry } from "@/types/monitor";
import type { SymbolState } from "@/types/symbol";

interface MonitorCardProps {
  entry: MonitorEntry;
  symbolState?: SymbolState;
  onRemove: () => void;
  onUpdate: (entry: MonitorEntry) => void;
}

function pnl(
  side: MonitorEntry["side"],
  entryPrice: number,
  currentPrice: number,
  margin: number,
  leverage: number,
) {
  const positionSize = margin * leverage;
  const baseQty = positionSize / entryPrice;
  const rawPct =
    side === "long"
      ? (currentPrice - entryPrice) / entryPrice
      : (entryPrice - currentPrice) / entryPrice;
  const pnlUsdt =
    baseQty * (currentPrice - entryPrice) * (side === "long" ? 1 : -1);
  return { pct: rawPct * 100, usdt: pnlUsdt };
}

/** Simplified isolated-margin liquidation price (ignores maintenance margin). */
function calcLiqPrice(
  side: MonitorEntry["side"],
  entryPrice: number,
  leverage: number,
) {
  if (leverage <= 1) return null;
  return side === "long"
    ? entryPrice * (1 - 1 / leverage)
    : entryPrice * (1 + 1 / leverage);
}

const TV_INTERVAL_MAP: Record<string, string> = {
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "1D",
};

export function MonitorCard({
  entry,
  symbolState,
  onRemove,
  onUpdate,
}: MonitorCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  const currentPrice = symbolState?.price ?? null;
  const isLong = entry.side === "long";
  const liqPrice = calcLiqPrice(entry.side, entry.entryPrice, entry.leverage);

  // Warn when current price is within 10% of liquidation
  const liqProximityPct =
    liqPrice !== null && currentPrice !== null
      ? Math.abs((currentPrice - liqPrice) / liqPrice) * 100
      : null;
  const isNearLiq = liqProximityPct !== null && liqProximityPct < 10;

  const pnlData =
    currentPrice !== null
      ? pnl(
          entry.side,
          entry.entryPrice,
          currentPrice,
          entry.usdtQuantity,
          entry.leverage,
        )
      : null;

  const isProfitable = (pnlData?.pct ?? 0) >= 0;

  const primaryTf = entry.timeframes[0] ?? "15m";
  const tvUrl = `https://www.tradingview.com/chart/?symbol=BINANCE%3A${entry.symbol}&interval=${TV_INTERVAL_MAP[primaryTf] ?? "60"}`;

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden border",
          isLong
            ? "border-emerald-200 dark:border-emerald-800/60"
            : "border-red-200 dark:border-red-800/60",
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <a
                href={tvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5"
              >
                <CardTitle className="font-mono text-base">
                  {entry.symbol}
                </CardTitle>
                <ExternalLink className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
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
                {entry.side.toUpperCase()}
              </span>
              {entry.leverage > 1 && (
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                  {entry.leverage}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
          {entry.scanName && (
            <CardDescription className="text-xs">
              from: {entry.scanName}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* PNL Section */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Entry
                </div>
                <div className="font-mono text-sm font-medium tabular-nums">
                  <NumberPrice
                    value={entry.entryPrice}
                    formatOptions={{ maximumFractionDigits: 4 }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Current
                </div>
                <div className="font-mono text-sm font-medium tabular-nums">
                  <NumberPrice
                    value={currentPrice}
                    fallback="—"
                    formatOptions={{ maximumFractionDigits: 4 }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Margin
                </div>
                <div className="font-mono text-sm font-medium tabular-nums">
                  $
                  {entry.usdtQuantity.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
            </div>
            {entry.leverage > 1 && (
              <div className="mt-2 text-center text-xs text-muted-foreground">
                Position{" "}
                <span className="font-mono font-medium text-foreground">
                  $
                  {(entry.usdtQuantity * entry.leverage).toLocaleString(
                    "en-US",
                    { maximumFractionDigits: 0 },
                  )}
                </span>{" "}
                &middot; {entry.leverage}x
              </div>
            )}

            {pnlData !== null && (
              <div
                className={cn(
                  "mt-3 flex items-center justify-center gap-3 rounded-md py-1.5 text-sm font-semibold",
                  isProfitable
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500",
                )}
              >
                <span className="tabular-nums">
                  {isProfitable ? "+" : ""}
                  {pnlData.pct.toFixed(2)}%
                </span>
                <span className="text-xs opacity-70">·</span>
                <span className="tabular-nums">
                  {isProfitable ? "+" : ""}
                  <NumberPrice
                    value={pnlData.usdt}
                    fallback="—"
                    formatOptions={{ maximumFractionDigits: 2 }}
                  />{" "}
                  USDT
                </span>
              </div>
            )}

            <div
              className={cn(
                "mt-2 flex items-center justify-between rounded-md px-3 py-1.5 text-xs",
                isNearLiq
                  ? "bg-orange-500/10 text-orange-500 font-semibold"
                  : "bg-muted/50 text-muted-foreground",
              )}
            >
              <span>Liq. price</span>
              <span className="font-mono tabular-nums">
                {liqPrice !== null ? (
                  <>
                    <NumberPrice
                      value={liqPrice}
                      formatOptions={{ maximumFractionDigits: 4 }}
                    />
                    {isNearLiq ? " ⚠" : ""}
                  </>
                ) : (
                  "N/A"
                )}
              </span>
            </div>
          </div>

          {/* RSI Bars */}
          <div className="space-y-4">
            {[...entry.timeframes]
              .sort(
                (a, b) =>
                  ACTIVE_TIMEFRAMES.indexOf(a) - ACTIVE_TIMEFRAMES.indexOf(b),
              )
              .map((tf) => {
                const rsiValue =
                  symbolState?.timeframes[tf]?.indicators?.RSI_14 ?? null;
                return (
                  <RSIMomentumBar
                    key={tf}
                    rsi={rsiValue ?? 50}
                    symbol={entry.symbol}
                    timeframe={tf}
                    showTooltip={false}
                    className="max-w-none"
                  />
                );
              })}
          </div>
        </CardContent>
      </Card>

      <AddToMonitorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        symbol={entry.symbol}
        side={entry.side}
        currentPrice={currentPrice ?? entry.entryPrice}
        scanId={entry.scanId}
        scanName={entry.scanName}
        suggestedTimeframes={entry.timeframes}
        initialValues={{
          entryPrice: entry.entryPrice,
          margin: entry.usdtQuantity,
          leverage: entry.leverage,
          timeframes: entry.timeframes,
        }}
        onConfirm={(updated) =>
          onUpdate({ ...updated, id: entry.id, addedAt: entry.addedAt })
        }
      />
    </>
  );
}
