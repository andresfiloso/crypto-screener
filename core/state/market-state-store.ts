import type { Candle, Timeframe } from "@/types/candle";
import type { SymbolState, TimeframeState } from "@/types/symbol";
import type { IndicatorValues } from "@/types/indicators";
import { ACTIVE_TIMEFRAMES, CANDLE_HISTORY_LIMIT } from "@/config/timeframes";
import { calculateIndicators } from "@/core/indicators/calculator";

function makeEmptyTimeframeState(): TimeframeState {
  return { candles: [], indicators: {} };
}

function makeEmptySymbolState(symbol: string): SymbolState {
  const timeframes = Object.fromEntries(
    ACTIVE_TIMEFRAMES.map((tf) => [tf, makeEmptyTimeframeState()]),
  ) as Record<Timeframe, TimeframeState>;

  return { symbol, price: 0, updatedAt: 0, timeframes };
}

/**
 * Single in-memory source of truth for all symbol market data.
 * Never duplicate this store — use the singleton exported below.
 */
export class MarketStateStore {
  private symbols: Map<string, SymbolState> = new Map();

  initSymbol(symbol: string): void {
    if (!this.symbols.has(symbol)) {
      this.symbols.set(symbol, makeEmptySymbolState(symbol));
    }
  }

  /** Replace the full candle history for a symbol/timeframe (used during hydration). */
  setCandles(symbol: string, timeframe: Timeframe, candles: Candle[]): void {
    const state = this.getOrCreate(symbol);
    state.timeframes[timeframe].candles = candles.slice(-CANDLE_HISTORY_LIMIT);
    this.recalculate(state, timeframe);
    state.updatedAt = Date.now();
  }

  /** Append a single closed candle and recalculate indicators. */
  appendCandle(symbol: string, timeframe: Timeframe, candle: Candle): void {
    const state = this.getOrCreate(symbol);
    const tf = state.timeframes[timeframe];
    tf.candles.push(candle);
    if (tf.candles.length > CANDLE_HISTORY_LIMIT) {
      tf.candles.shift();
    }
    state.price = candle.close;
    state.updatedAt = Date.now();
    this.recalculate(state, timeframe);
  }

  updatePrice(symbol: string, price: number): void {
    const state = this.getOrCreate(symbol);
    state.price = price;
    state.updatedAt = Date.now();
  }

  getSymbol(symbol: string): SymbolState | undefined {
    return this.symbols.get(symbol);
  }

  getAllSymbols(): SymbolState[] {
    return Array.from(this.symbols.values());
  }

  getIndicators(symbol: string, timeframe: Timeframe): IndicatorValues {
    return this.symbols.get(symbol)?.timeframes[timeframe]?.indicators ?? {};
  }

  private recalculate(state: SymbolState, timeframe: Timeframe): void {
    const tf = state.timeframes[timeframe];
    tf.indicators = calculateIndicators(tf.candles);
  }

  private getOrCreate(symbol: string): SymbolState {
    if (!this.symbols.has(symbol)) {
      this.symbols.set(symbol, makeEmptySymbolState(symbol));
    }
    return this.symbols.get(symbol)!;
  }
}
