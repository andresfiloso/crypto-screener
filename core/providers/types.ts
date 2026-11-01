import type { Candle, Timeframe } from "@/types/candle";

export type KlineCallback = (
  timeframe: Timeframe,
  candle: Candle,
  isFinal: boolean,
) => void;

export interface MarketDataProvider {
  getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number,
  ): Promise<Candle[]>;

  /** Subscribe to every given timeframe of a symbol over one connection. */
  subscribeSymbol(
    symbol: string,
    timeframes: Timeframe[],
    callback: KlineCallback,
  ): void;

  unsubscribeSymbol(symbol: string): void;

  unsubscribeAll(): void;
}
