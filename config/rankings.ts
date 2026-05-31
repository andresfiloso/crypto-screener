import type { CombinedRankingDefinition } from "@/types/scans";

export const RANKINGS: CombinedRankingDefinition[] = [
  {
    id: "rsi-15m",
    name: "RSI 15m",
    indicator: "RSI_14",
    timeframe: "15m",
    limit: 5,
  },
  {
    id: "rsi-1h",
    name: "RSI 1h",
    indicator: "RSI_14",
    timeframe: "1h",
    limit: 5,
  },
  {
    id: "rsi-4h",
    name: "RSI 4h",
    indicator: "RSI_14",
    timeframe: "4h",
    limit: 5,
  },
  {
    id: "rsi-1d",
    name: "RSI 1d",
    indicator: "RSI_14",
    timeframe: "1d",
    limit: 5,
  },
];
