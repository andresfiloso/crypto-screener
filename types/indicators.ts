export interface MACDResult {
  value: number;
  signal: number;
  histogram: number;
}

export interface IndicatorValues {
  RSI_14?: number;
  RSI_3?: number;
  /** Candles since the latest bullish RSI(14) divergence was confirmed. Undefined if none. */
  RSI_DIV_BULL?: number;
  /** Candles since the latest bearish RSI(14) divergence was confirmed. Undefined if none. */
  RSI_DIV_BEAR?: number;
  EMA_20?: number;
  EMA_50?: number;
  EMA_200?: number;
  ATR?: number;
  MACD?: MACDResult;
  volume?: number;
}

export type IndicatorKey = keyof IndicatorValues;
