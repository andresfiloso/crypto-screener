"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ScanResult, TradeSide } from "@/types/scans";

function tvUrl(symbol: string) {
  return `https://www.tradingview.com/chart?symbol=BINANCE%3A${symbol}`;
}

interface ScanCardProps {
  scan: ScanResult;
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

export function ScanCard({ scan }: ScanCardProps) {
  const count = scan.matches.length;
  const idea = scan.tradeIdea;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <Link href={`/scans/${scan.scanId}`} className="hover:underline">
              {scan.name}
            </Link>
          </CardTitle>
          <Badge variant={count > 0 ? "default" : "outline"}>
            {count} {count === 1 ? "match" : "matches"}
          </Badge>
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
                      href={tvUrl(symbol)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-1"
                    >
                      <Badge variant="secondary" className="font-mono text-xs">
                        {symbol}
                      </Badge>
                      <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
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
                  href={tvUrl(symbol)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1"
                >
                  <Badge variant="secondary" className="font-mono">
                    {symbol}
                  </Badge>
                  <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
