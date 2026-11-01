import type { Timeframe } from "./candle";
import type { TradeSide } from "./scans";

export interface MonitorEntry {
  id: string;
  symbol: string;
  side: TradeSide;
  scanId?: string;
  scanName?: string;
  entryPrice: number;
  /** Current margin balance in USDT (after funding/fees paid). */
  usdtQuantity: number;
  /** Position size in base asset. Derived from margin × leverage when omitted. */
  quantity?: number;
  /** Maintenance margin rate as a fraction (0.005 = 0.5%). Default 0.5%. */
  maintenanceMarginRate?: number;
  /** Leverage multiplier (1 = spot/no leverage). Used to compute liquidation price. */
  leverage: number;
  /** Timeframes the user wants to track RSI on */
  timeframes: Timeframe[];
  addedAt: number;
}
