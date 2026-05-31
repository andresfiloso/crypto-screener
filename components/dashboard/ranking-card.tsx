"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import type { CombinedRankingResult, RankingEntry } from "@/types/scans";

const TV_INTERVAL_MAP: Record<string, string> = {
  "5m": "5",
  "15m": "15",
  "1h": "60",
  "4h": "240",
  "1d": "1D",
  "1w": "1W",
  "1M": "1M",
};

function tvUrl(symbol: string, timeframe: string) {
  const interval = TV_INTERVAL_MAP[timeframe] ?? "60";
  return `https://www.tradingview.com/chart/?symbol=BINANCE%3A${symbol}&interval=${interval}`;
}

interface RankingCardProps {
  ranking: CombinedRankingResult;
}

function rsiStyle(value: number): React.CSSProperties {
  if (value >= 85) return { color: "#dc2626", fontWeight: 600 };
  if (value >= 75) return { color: "#ef4444" };
  if (value >= 70) return { color: "#f97316" };
  if (value >= 60) return { color: "#f59e0b" };
  if (value <= 15) return { color: "#059669", fontWeight: 600 };
  if (value <= 25) return { color: "#22c55e" };
  if (value <= 30) return { color: "#84cc16" };
  if (value <= 40) return { color: "#a3e635" };
  return {};
}

function EntryRow({
  entry,
  rank,
  timeframe,
}: {
  entry: RankingEntry;
  rank: number;
  timeframe: string;
}) {
  return (
    <li className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="w-5 text-right text-muted-foreground text-xs">
          {rank}.
        </span>
        <a
          href={tvUrl(entry.symbol, timeframe)}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1"
        >
          <Badge variant="secondary" className="font-mono">
            {entry.symbol}
          </Badge>
          <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>
      <span className="tabular-nums font-medium" style={rsiStyle(entry.value)}>
        {entry.value.toFixed(2)}
      </span>
    </li>
  );
}

export function RankingCard({ ranking }: RankingCardProps) {
  const hasData = ranking.top.length > 0 || ranking.bottom.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ranking.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-3">
            {/* Highest */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Highest
              </p>
              <ol className="space-y-1.5">
                {ranking.top.map((entry, idx) => (
                  <EntryRow
                    key={entry.symbol}
                    entry={entry}
                    rank={idx + 1}
                    timeframe={ranking.timeframe}
                  />
                ))}
              </ol>
            </div>

            <Separator />

            {/* Lowest */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lowest
              </p>
              <ol className="space-y-1.5">
                {ranking.bottom.map((entry, idx) => (
                  <EntryRow
                    key={entry.symbol}
                    entry={entry}
                    rank={idx + 1}
                    timeframe={ranking.timeframe}
                  />
                ))}
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
