export interface MACDResult {
  value: number;
  signal: number;
  histogram: number;
}

export interface IndicatorValues {
  RSI_14?: number;
  RSI_3?: number;
  EMA_20?: number;
  EMA_50?: number;
  EMA_200?: number;
  ATR?: number;
  MACD?: MACDResult;
  volume?: number;
}

export type IndicatorKey = keyof IndicatorValues;
