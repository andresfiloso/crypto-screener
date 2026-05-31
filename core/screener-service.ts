import type { Candle, Timeframe } from "@/types/candle";
import type { ScreenerResponse, ServiceStatus } from "@/types/api";
import type { ScanResult, CombinedRankingResult } from "@/types/scans";

import { SYMBOLS } from "@/config/symbols";
import { ACTIVE_TIMEFRAMES, CANDLE_HISTORY_LIMIT } from "@/config/timeframes";
import { SCANS } from "@/config/scans";
import { RANKINGS } from "@/config/rankings";

import { BinanceProvider } from "@/core/providers/binance-provider";
import { MarketStateStore } from "@/core/state/market-state-store";
import { FeedHealthTracker } from "@/core/health/feed-health-tracker";
import { runAllScans } from "@/core/scans/scan-evaluator";
import { runAllCombinedRankings } from "@/core/rankings/ranking-evaluator";

/**
 * ScreenerService is a singleton that manages the full data pipeline:
 * historical hydration → indicator calculation → WebSocket streams → scan/ranking updates.
 *
 * It is lazily initialized on the first call to getInstance().start().
 */
export class ScreenerService {
  private static instance: ScreenerService | null = null;

  private provider = new BinanceProvider();
  private store = new MarketStateStore();
  private health = new FeedHealthTracker();

  private status: ServiceStatus = "warming_up";
  private scanResults: ScanResult[] = [];
  private rankingResults: CombinedRankingResult[] = [];
  private updatedAt = 0;
  private started = false;

  // Private constructor — use getInstance()
  private constructor() {}

  static getInstance(): ScreenerService {
    if (!ScreenerService.instance) {
      ScreenerService.instance = new ScreenerService();
    }
    return ScreenerService.instance;
  }

  /** Start the service. Idempotent — safe to call multiple times. */
  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    console.log("[ScreenerService] Starting…");

    try {
      // Step 1: Init symbols in state
      for (const symbol of SYMBOLS) {
        this.store.initSymbol(symbol);
      }

      // Step 2 + 3 + 4: Download historical candles, calculate indicators, populate state
      await this.hydrateAllHistory();

      // Step 5: Open WebSocket subscriptions
      this.openAllSubscriptions();

      // Step 6: Initial scan + ranking evaluation
      this.refreshResults();

      this.status = "healthy";
      console.log("[ScreenerService] Ready.");
    } catch (err) {
      this.status = "degraded";
      console.error("[ScreenerService] Startup failed:", err);
    }
  }

  getSnapshot(): ScreenerResponse {
    return {
      status: this.status,
      symbols: this.store.getAllSymbols(),
      scans: this.scanResults,
      rankings: this.rankingResults,
      health: this.health.getAll(),
      updatedAt: this.updatedAt,
    };
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async hydrateAllHistory(): Promise<void> {
    const tasks: Promise<void>[] = [];

    for (const symbol of SYMBOLS) {
      for (const timeframe of ACTIVE_TIMEFRAMES) {
        tasks.push(this.hydrateOne(symbol, timeframe));
      }
    }

    await Promise.allSettled(tasks);
  }

  private async hydrateOne(
    symbol: string,
    timeframe: Timeframe,
  ): Promise<void> {
    try {
      console.log(`[ScreenerService] Hydrating ${symbol}/${timeframe}…`);
      const candles = await this.provider.getHistoricalCandles(
        symbol,
        timeframe,
        CANDLE_HISTORY_LIMIT,
      );
      this.store.setCandles(symbol, timeframe, candles);
      // Seed latest price from the most recent candle
      if (candles.length > 0) {
        this.store.updatePrice(symbol, candles[candles.length - 1].close);
      }
      this.health.markConnected(symbol, timeframe);
    } catch (err) {
      console.error(
        `[ScreenerService] Failed to hydrate ${symbol}/${timeframe}:`,
        err,
      );
      this.health.markDisconnected(symbol, timeframe);
    }
  }

  private openAllSubscriptions(): void {
    for (const symbol of SYMBOLS) {
      for (const timeframe of ACTIVE_TIMEFRAMES) {
        this.provider.subscribeKlines(
          symbol,
          timeframe,
          (candle: Candle, isFinal: boolean) => {
            this.health.recordUpdate(symbol, timeframe);
            this.health.markConnected(symbol, timeframe);

            if (!isFinal) return; // ignore partial candles

            this.store.appendCandle(symbol, timeframe, candle);
            this.refreshResults();
          },
        );
        this.health.markConnected(symbol, timeframe);
      }
    }
  }

  private refreshResults(): void {
    const symbols = this.store.getAllSymbols();
    this.scanResults = runAllScans(SCANS, symbols);
    this.rankingResults = runAllCombinedRankings(RANKINGS, symbols);
    this.updatedAt = Date.now();
  }
}
