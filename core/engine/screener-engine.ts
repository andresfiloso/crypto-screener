import type { Candle, Timeframe } from "@/types/candle";
import type { FeedHealth, ServiceStatus } from "@/types/api";
import type { SymbolState } from "@/types/symbol";
import { ACTIVE_TIMEFRAMES, CANDLE_HISTORY_LIMIT } from "@/config/timeframes";
import { BinanceProvider } from "@/core/providers/binance-provider";
import { MarketStateStore } from "@/core/state/market-state-store";
import { FeedHealthTracker } from "@/core/health/feed-health-tracker";

export interface EngineSnapshot {
  status: ServiceStatus;
  symbols: SymbolState[];
  health: FeedHealth[];
  /** 0 until the engine has been told which symbols to track. */
  updatedAt: number;
}

export const EMPTY_SNAPSHOT: EngineSnapshot = {
  status: "warming_up",
  symbols: [],
  health: [],
  updatedAt: 0,
};

/** Min gap between snapshots; WS ticks arrive far more often than the UI needs. */
const EMIT_INTERVAL_MS = 1000;

/**
 * Browser-side market data pipeline: historical hydration → indicators →
 * WebSocket streams. Tracks whatever symbol list it is given via setSymbols().
 * Runs entirely in the client so the app needs no long-lived server (Vercel).
 */
export class ScreenerEngine {
  private provider = new BinanceProvider();
  private store = new MarketStateStore();
  private health = new FeedHealthTracker();
  private tracked = new Set<string>();
  private hydrating = new Set<string>();
  private listeners = new Set<() => void>();
  private snapshot: EngineSnapshot = EMPTY_SNAPSHOT;
  private emitTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEmit = 0;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): EngineSnapshot => this.snapshot;

  setSymbols(next: string[]): void {
    const wanted = new Set(next);

    for (const symbol of [...this.tracked]) {
      if (wanted.has(symbol)) continue;
      this.tracked.delete(symbol);
      this.hydrating.delete(symbol);
      this.provider.unsubscribeSymbol(symbol);
      this.store.removeSymbol(symbol);
      this.health.removeSymbol(symbol);
    }

    for (const symbol of wanted) {
      if (this.tracked.has(symbol)) continue;
      this.tracked.add(symbol);
      this.store.initSymbol(symbol);
      void this.startSymbol(symbol);
    }

    this.emit(true);
  }

  private async startSymbol(symbol: string): Promise<void> {
    this.hydrating.add(symbol);
    await Promise.allSettled(
      ACTIVE_TIMEFRAMES.map((tf) => this.hydrateOne(symbol, tf)),
    );
    this.hydrating.delete(symbol);
    // Removed while hydrating.
    if (!this.tracked.has(symbol)) return;

    this.provider.subscribeSymbol(
      symbol,
      ACTIVE_TIMEFRAMES,
      (timeframe: Timeframe, candle: Candle, isFinal: boolean) => {
        if (!this.tracked.has(symbol)) return;
        this.health.recordUpdate(symbol, timeframe);
        this.health.markConnected(symbol, timeframe);
        this.store.updatePrice(symbol, candle.close);
        if (isFinal) this.store.appendCandle(symbol, timeframe, candle);
        this.emit(isFinal);
      },
    );
    this.emit(true);
  }

  private async hydrateOne(symbol: string, timeframe: Timeframe) {
    try {
      const candles = await this.provider.getHistoricalCandles(
        symbol,
        timeframe,
        CANDLE_HISTORY_LIMIT,
      );
      if (!this.tracked.has(symbol)) return;
      this.store.setCandles(symbol, timeframe, candles);
      if (candles.length > 0) {
        this.store.updatePrice(symbol, candles[candles.length - 1].close);
      }
      this.health.markConnected(symbol, timeframe);
    } catch {
      if (this.tracked.has(symbol)) this.health.markDisconnected(symbol, timeframe);
    }
  }

  private computeStatus(health: FeedHealth[]): ServiceStatus {
    if (this.hydrating.size > 0) return "warming_up";
    if (health.length === 0) return "healthy";
    return health.every((f) => f.connected) ? "healthy" : "degraded";
  }

  /** Publish a new immutable snapshot, throttled unless `force`. */
  private emit(force: boolean): void {
    const now = Date.now();
    if (!force && now - this.lastEmit < EMIT_INTERVAL_MS) {
      if (!this.emitTimer) {
        this.emitTimer = setTimeout(() => {
          this.emitTimer = null;
          this.emit(true);
        }, EMIT_INTERVAL_MS);
      }
      return;
    }
    this.lastEmit = now;
    const health = this.health.getAll();
    this.snapshot = {
      status: this.computeStatus(health),
      // Shallow copies so React sees new references for in-place store mutations.
      symbols: this.store
        .getAllSymbols()
        .map((s) => ({ ...s, timeframes: { ...s.timeframes } })),
      health,
      updatedAt: now,
    };
    this.listeners.forEach((l) => l());
  }
}

let engine: ScreenerEngine | null = null;

export function getEngine(): ScreenerEngine {
  if (!engine) engine = new ScreenerEngine();
  return engine;
}
