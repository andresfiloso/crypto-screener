import type { Candle, Timeframe } from "@/types/candle";

export interface MarketDataProvider {
  getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number,
  ): Promise<Candle[]>;

  subscribeKlines(
    symbol: string,
    timeframe: Timeframe,
    callback: (candle: Candle, isFinal: boolean) => void,
  ): void;

  unsubscribeAll(): void;
}
