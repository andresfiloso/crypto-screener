import type { Timeframe } from "./candle";
import type { TradeSide } from "./scans";

export interface MonitorEntry {
  id: string;
  symbol: string;
  side: TradeSide;
  scanId?: string;
  scanName?: string;
  entryPrice: number;
  usdtQuantity: number;
  /** Leverage multiplier (1 = spot/no leverage). Used to compute liquidation price. */
  leverage: number;
  /** Timeframes the user wants to track RSI on */
  timeframes: Timeframe[];
  addedAt: number;
}
