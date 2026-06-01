"use client";

import { useState, useEffect } from "react";
import { TIMEFRAMES } from "@/types/candle";
import type { Timeframe } from "@/types/candle";
import type { TradeSide } from "@/types/scans";
import type { MonitorEntry } from "@/types/monitor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface InitialValues {
  entryPrice: number;
  margin: number;
  leverage: number;
  timeframes: Timeframe[];
}

interface AddToMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symbol: string;
  side: TradeSide;
  currentPrice: number;
  scanId?: string;
  scanName?: string;
  /** Timeframes present in the scan conditions — pre-selected by default */
  suggestedTimeframes?: Timeframe[];
  /** Pre-fill values when editing an existing entry */
  initialValues?: InitialValues;
  onConfirm: (entry: MonitorEntry) => void;
}

export function AddToMonitorDialog({
  open,
  onOpenChange,
  symbol,
  side,
  currentPrice,
  scanId,
  scanName,
  suggestedTimeframes,
  initialValues,
  onConfirm,
}: AddToMonitorDialogProps) {
  const defaultTimeframes = suggestedTimeframes?.length
    ? suggestedTimeframes
    : (["15m", "1h", "4h"] as Timeframe[]);

  const [entryPrice, setEntryPrice] = useState(
    (initialValues?.entryPrice ?? currentPrice).toString(),
  );
  const [margin, setMargin] = useState(
    initialValues?.margin ? initialValues.margin.toString() : "",
  );
  const [leverage, setLeverage] = useState(
    (initialValues?.leverage ?? 1).toString(),
  );
  const [selectedTimeframes, setSelectedTimeframes] = useState<Timeframe[]>(
    initialValues?.timeframes ?? defaultTimeframes,
  );

  // Re-sync state whenever the dialog opens (handles edit case)
  useEffect(() => {
    if (!open) return;
    setEntryPrice((initialValues?.entryPrice ?? currentPrice).toString());
    setMargin(initialValues?.margin ? initialValues.margin.toString() : "");
    setLeverage((initialValues?.leverage ?? 1).toString());
    setSelectedTimeframes(initialValues?.timeframes ?? defaultTimeframes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isLong = side === "long";

  const parsedEntry = parseFloat(entryPrice);
  const parsedLev = parseFloat(leverage);
  const parsedMargin = parseFloat(margin);

  const positionSize =
    !isNaN(parsedMargin) &&
    parsedMargin > 0 &&
    !isNaN(parsedLev) &&
    parsedLev >= 1
      ? parsedMargin * parsedLev
      : null;

  const liqPrice = (() => {
    if (
      isNaN(parsedEntry) ||
      parsedEntry <= 0 ||
      isNaN(parsedLev) ||
      parsedLev <= 1
    )
      return null;
    return isLong
      ? parsedEntry * (1 - 1 / parsedLev)
      : parsedEntry * (1 + 1 / parsedLev);
  })();

  function toggleTimeframe(tf: Timeframe) {
    setSelectedTimeframes((prev) =>
      prev.includes(tf) ? prev.filter((t) => t !== tf) : [...prev, tf],
    );
  }

  function handleConfirm() {
    if (isNaN(parsedEntry) || parsedEntry <= 0) return;
    if (isNaN(parsedMargin) || parsedMargin <= 0) return;
    if (isNaN(parsedLev) || parsedLev < 1) return;
    if (selectedTimeframes.length === 0) return;

    const entry: MonitorEntry = {
      id: crypto.randomUUID(),
      symbol,
      side,
      scanId,
      scanName,
      entryPrice: parsedEntry,
      usdtQuantity: parsedMargin,
      leverage: parsedLev,
      timeframes: selectedTimeframes,
      addedAt: Date.now(),
    };
    onConfirm(entry);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{symbol}</span>
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
              {side.toUpperCase()}
            </span>
          </DialogTitle>
          {scanName && (
            <p className="text-xs text-muted-foreground">from: {scanName}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-price">Entry price (USDT)</Label>
            <Input
              id="entry-price"
              type="number"
              min="0"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="margin">Margin (USDT)</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 100"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="leverage">Leverage</Label>
              <Input
                id="leverage"
                type="number"
                min="1"
                max="125"
                step="1"
                placeholder="1"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Derived info */}
          <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Position size</span>
              <span className="font-mono font-medium text-foreground">
                {positionSize !== null
                  ? `$${positionSize.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Liq. price</span>
              <span
                className={cn(
                  "font-mono font-medium",
                  liqPrice !== null ? "text-orange-500" : "text-foreground",
                )}
              >
                {liqPrice !== null
                  ? liqPrice.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })
                  : "N/A"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Timeframes to monitor</Label>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((tf) => (
                <label
                  key={tf}
                  className="flex cursor-pointer items-center gap-1.5"
                >
                  <Checkbox
                    checked={selectedTimeframes.includes(tf)}
                    onCheckedChange={() => toggleTimeframe(tf)}
                  />
                  <span className="font-mono text-sm">{tf}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              !entryPrice ||
              !margin ||
              parsedEntry <= 0 ||
              parsedMargin <= 0 ||
              parsedLev < 1 ||
              selectedTimeframes.length === 0
            }
          >
            Add to Monitor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
