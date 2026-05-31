import type { Timeframe } from "@/types/candle";

export const ACTIVE_TIMEFRAMES: Timeframe[] = ["5m", "15m", "1h", "4h", "1d"];

/** Number of historical candles to fetch and retain per symbol/timeframe. */
export const CANDLE_HISTORY_LIMIT = 300;
