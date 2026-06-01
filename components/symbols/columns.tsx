"use client";

import type React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { SymbolState } from "@/types/symbol";
import type { Timeframe } from "@/types/candle";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

function tvUrl(symbol: string) {
  return `https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol}&interval=60`;
}

// Inline styles avoid Tailwind v4 purge issues for data-driven colors
function rsiStyle(value: number | undefined): React.CSSProperties {
  if (value === undefined) return {};
  // ── Overbought ────────────────────────────────────────
  if (value >= 85) return { color: "#dc2626", fontWeight: 600 }; // red-600
  if (value >= 75) return { color: "#ef4444" }; // red-500
  if (value >= 70) return { color: "#f97316" }; // orange-500
  if (value >= 60) return { color: "#f59e0b" }; // amber-500
  // ── Oversold ──────────────────────────────────────────
  if (value <= 15) return { color: "#059669", fontWeight: 600 }; // emerald-600
  if (value <= 25) return { color: "#22c55e" }; // green-500
  if (value <= 30) return { color: "#84cc16" }; // lime-500
  if (value <= 40) return { color: "#a3e635" }; // lime-400
  // ── Neutral ───────────────────────────────────────────
  return {};
}

function fmt(value: number | undefined, decimals = 2): string {
  if (value === undefined) return "—";
  return value.toFixed(decimals);
}

function emaStyle(price: number, ema: number | undefined): React.CSSProperties {
  if (ema === undefined) return {};
  return price > ema
    ? { color: "#22c55e" } // green-500 — price above EMA
    : { color: "#ef4444" }; // red-500  — price below EMA
}

function fmtPrice(value: number): string {
  if (value >= 1000)
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

function rsiCell(tf: Timeframe) {
  return function RsiCell({ row }: { row: { original: SymbolState } }) {
    const val = row.original.timeframes[tf]?.indicators?.RSI_14;
    const style = rsiStyle(val);
    return (
      <span className="tabular-nums text-muted-foreground" style={style}>
        {fmt(val, 1)}
      </span>
    );
  };
}

export const columns: ColumnDef<SymbolState>[] = [
  {
    accessorKey: "symbol",
    header: "Symbol",
    cell: ({ row }) => (
      <a
        href={tvUrl(row.original.symbol)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-1.5"
      >
        <Badge variant="secondary" className="font-mono text-xs">
          {row.original.symbol}
        </Badge>
        <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    ),
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <span className="tabular-nums font-medium">
        {fmtPrice(row.original.price)}
      </span>
    ),
  },
  {
    id: "rsi_5m",
    header: "RSI 5m",
    accessorFn: (row) => row.timeframes["5m"]?.indicators?.RSI_14,
    cell: rsiCell("5m"),
  },
  {
    id: "rsi_15m",
    header: "RSI 15m",
    accessorFn: (row) => row.timeframes["15m"]?.indicators?.RSI_14,
    cell: rsiCell("15m"),
  },
  {
    id: "rsi_1h",
    header: "RSI 1h",
    accessorFn: (row) => row.timeframes["1h"]?.indicators?.RSI_14,
    cell: rsiCell("1h"),
  },
  {
    id: "rsi_4h",
    header: "RSI 4h",
    accessorFn: (row) => row.timeframes["4h"]?.indicators?.RSI_14,
    cell: rsiCell("4h"),
  },
  {
    id: "ema20",
    header: "EMA 20",
    accessorFn: (row) => row.timeframes["1h"]?.indicators?.EMA_20,
    cell: ({ row }) => {
      const val = row.original.timeframes["1h"]?.indicators?.EMA_20;
      return (
        <span
          className="tabular-nums"
          style={emaStyle(row.original.price, val)}
        >
          {fmt(val)}
        </span>
      );
    },
  },
  {
    id: "ema50",
    header: "EMA 50",
    accessorFn: (row) => row.timeframes["1h"]?.indicators?.EMA_50,
    cell: ({ row }) => {
      const val = row.original.timeframes["1h"]?.indicators?.EMA_50;
      return (
        <span
          className="tabular-nums"
          style={emaStyle(row.original.price, val)}
        >
          {fmt(val)}
        </span>
      );
    },
  },
  {
    id: "ema200",
    header: "EMA 200",
    accessorFn: (row) => row.timeframes["1h"]?.indicators?.EMA_200,
    cell: ({ row }) => {
      const val = row.original.timeframes["1h"]?.indicators?.EMA_200;
      return (
        <span
          className="tabular-nums"
          style={emaStyle(row.original.price, val)}
        >
          {fmt(val)}
        </span>
      );
    },
  },
  {
    id: "macd_histogram",
    header: "MACD Hist",
    accessorFn: (row) => row.timeframes["1h"]?.indicators?.MACD?.histogram,
    cell: ({ row }) => {
      const val = row.original.timeframes["1h"]?.indicators?.MACD?.histogram;
      const color =
        val !== undefined && val > 0
          ? "#22c55e"
          : val !== undefined && val < 0
            ? "#ef4444"
            : undefined;
      return (
        <span
          className="tabular-nums text-muted-foreground"
          style={color ? { color } : undefined}
        >
          {fmt(val, 4)}
        </span>
      );
    },
  },
];
