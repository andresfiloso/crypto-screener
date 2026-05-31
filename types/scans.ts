import type { Timeframe } from "./candle";

export type Operator = ">" | "<" | ">=" | "<=" | "=";

export type TradeSide = "long" | "short";

export interface TradeIdea {
  side: TradeSide;
  /** One-line rationale shown on the card, e.g. "RSI overbought across 15m/1h/4h" */
  rationale: string;
}

export interface Condition {
  indicator: string;
  timeframe: Timeframe;
  operator: Operator;
  value: number;
}

export interface ScanDefinition {
  id: string;
  name: string;
  description?: string;
  conditions: Condition[];
  /** Optional trade idea surfaced when this scan has matches. */
  tradeIdea?: TradeIdea;
  /** Optional group tag used to separate scans into dashboard sections. */
  group?: string;
}

export interface RankingDefinition {
  id: string;
  name: string;
  indicator: string;
  timeframe: Timeframe;
  direction: "asc" | "desc";
  limit?: number;
}

/** A ranking that returns the top N highest and bottom N lowest symbols. */
export interface CombinedRankingDefinition {
  id: string;
  name: string;
  indicator: string;
  timeframe: Timeframe;
  /** How many symbols to show at each end (top & bottom). Default 5. */
  limit?: number;
}

export interface CombinedRankingResult {
  rankingId: string;
  name: string;
  /** Sorted descending — highest values first. */
  top: RankingEntry[];
  /** Sorted ascending — lowest values first. */
  bottom: RankingEntry[];
}

export interface ScanResult {
  scanId: string;
  name: string;
  description?: string;
  conditions: Condition[];
  matches: string[];
  tradeIdea?: TradeIdea;
  group?: string;
}

export interface RankingEntry {
  symbol: string;
  value: number;
}

export interface RankingResult {
  rankingId: string;
  name: string;
  entries: RankingEntry[];
}
