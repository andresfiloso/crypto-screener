import type { FeedHealth } from "@/types/api";
import type { Timeframe } from "@/types/candle";

/** Threshold in ms after which a feed is considered stale. */
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export class FeedHealthTracker {
  private feeds = new Map<string, FeedHealth>();

  private key(symbol: string, timeframe: Timeframe | string): string {
    return `${symbol}:${timeframe}`;
  }

  markConnected(symbol: string, timeframe: Timeframe | string): void {
    const k = this.key(symbol, timeframe);
    this.feeds.set(k, {
      symbol,
      timeframe,
      connected: true,
      lastUpdate: Date.now(),
    });
  }

  markDisconnected(symbol: string, timeframe: Timeframe | string): void {
    const k = this.key(symbol, timeframe);
    const existing = this.feeds.get(k);
    this.feeds.set(k, {
      symbol,
      timeframe,
      connected: false,
      lastUpdate: existing?.lastUpdate ?? 0,
    });
  }

  recordUpdate(symbol: string, timeframe: Timeframe | string): void {
    const k = this.key(symbol, timeframe);
    const existing = this.feeds.get(k);
    if (existing) {
      existing.lastUpdate = Date.now();
    }
  }

  getAll(): FeedHealth[] {
    const now = Date.now();
    return Array.from(this.feeds.values()).map((f) => ({
      ...f,
      connected: f.connected && now - f.lastUpdate < STALE_THRESHOLD_MS,
    }));
  }

  isHealthy(): boolean {
    const all = this.getAll();
    if (all.length === 0) return false;
    return all.every((f) => f.connected);
  }
}
