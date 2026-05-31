import type { Candle, Timeframe } from "./candle";
import type { IndicatorValues } from "./indicators";

export interface TimeframeState {
  candles: Candle[];
  indicators: IndicatorValues;
}

export interface SymbolState {
  symbol: string;
  price: number;
  updatedAt: number;
  timeframes: Record<Timeframe, TimeframeState>;
}
