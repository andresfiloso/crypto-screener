import WebSocket from "ws";
import type { Candle, Timeframe } from "@/types/candle";
import type { MarketDataProvider } from "./types";

const BINANCE_REST_BASE = "https://api.binance.com/api/v3";
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/ws";

/** Maps our Timeframe values to Binance interval strings (they're identical in V1). */
const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

type KlineCallback = (candle: Candle, isFinal: boolean) => void;

interface ActiveSubscription {
  ws: WebSocket;
  retryCount: number;
  retryTimer: ReturnType<typeof setTimeout> | null;
  active: boolean;
}

export class BinanceProvider implements MarketDataProvider {
  private subscriptions = new Map<string, ActiveSubscription>();

  async getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number,
  ): Promise<Candle[]> {
    const interval = TIMEFRAME_TO_INTERVAL[timeframe];
    const url = `${BINANCE_REST_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Binance REST error ${res.status} for ${symbol}/${timeframe}`,
      );
    }

    const raw: [
      number,
      string,
      string,
      string,
      string,
      string,
      number,
      ...unknown[],
    ][] = await res.json();

    return raw.map((k) => ({
      openTime: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
      closeTime: k[6],
    }));
  }

  subscribeKlines(
    symbol: string,
    timeframe: Timeframe,
    callback: KlineCallback,
  ): void {
    const key = `${symbol.toLowerCase()}@kline_${timeframe}`;
    this.openConnection(symbol, timeframe, key, callback);
  }

  private openConnection(
    symbol: string,
    timeframe: Timeframe,
    key: string,
    callback: KlineCallback,
    retryCount = 0,
  ): void {
    const url = `${BINANCE_WS_BASE}/${key}`;
    const ws = new WebSocket(url);

    const sub: ActiveSubscription = {
      ws,
      retryCount,
      retryTimer: null,
      active: true,
    };
    this.subscriptions.set(key, sub);

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          k: {
            t: number;
            T: number;
            o: string;
            h: string;
            l: string;
            c: string;
            v: string;
            x: boolean;
          };
        };
        const k = msg.k;
        const candle: Candle = {
          openTime: k.t,
          closeTime: k.T,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };
        callback(candle, k.x);
      } catch {
        // malformed message — skip silently
      }
    });

    ws.on("error", (err) => {
      console.error(`[BinanceProvider] WS error for ${key}:`, err.message);
    });

    ws.on("close", () => {
      if (!sub.active) return;
      const delay = Math.min(1000 * 2 ** retryCount, 30_000);
      console.warn(
        `[BinanceProvider] WS closed for ${key}, reconnecting in ${delay}ms (attempt ${retryCount + 1})`,
      );
      sub.retryTimer = setTimeout(() => {
        this.openConnection(symbol, timeframe, key, callback, retryCount + 1);
      }, delay);
    });
  }

  unsubscribeAll(): void {
    for (const [, sub] of this.subscriptions) {
      sub.active = false;
      if (sub.retryTimer) clearTimeout(sub.retryTimer);
      sub.ws.close();
    }
    this.subscriptions.clear();
  }
}
