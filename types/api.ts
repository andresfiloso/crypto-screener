import type { SymbolState } from "./symbol";
import type { ScanResult, CombinedRankingResult } from "./scans";

export interface FeedHealth {
  symbol: string;
  timeframe: string;
  connected: boolean;
  lastUpdate: number;
}

export type ServiceStatus = "warming_up" | "healthy" | "degraded";

export interface ScreenerResponse {
  status: ServiceStatus;
  symbols: SymbolState[];
  scans: ScanResult[];
  rankings: CombinedRankingResult[];
  health: FeedHealth[];
  updatedAt: number;
}
