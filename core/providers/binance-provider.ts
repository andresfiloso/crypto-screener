import type { Candle, Timeframe } from "@/types/candle";
import type { KlineCallback, MarketDataProvider } from "./types";

const BINANCE_REST_BASE = "https://api.binance.com/api/v3";
const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";

/** Maps our Timeframe values to Binance interval strings (they're identical in V1). */
const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

interface ActiveSubscription {
  ws: WebSocket | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
  active: boolean;
}

/** Browser-side Binance provider: REST for history, one combined WS per symbol. */
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

  subscribeSymbol(
    symbol: string,
    timeframes: Timeframe[],
    callback: KlineCallback,
  ): void {
    this.unsubscribeSymbol(symbol);
    const sub: ActiveSubscription = { ws: null, retryTimer: null, active: true };
    this.subscriptions.set(symbol, sub);
    this.openConnection(symbol, timeframes, callback, sub, 0);
  }

  private openConnection(
    symbol: string,
    timeframes: Timeframe[],
    callback: KlineCallback,
    sub: ActiveSubscription,
    retryCount: number,
  ): void {
    const streams = timeframes
      .map((tf) => `${symbol.toLowerCase()}@kline_${TIMEFRAME_TO_INTERVAL[tf]}`)
      .join("/");
    const ws = new WebSocket(`${BINANCE_WS_BASE}?streams=${streams}`);
    sub.ws = ws;

    ws.onopen = () => {
      retryCount = 0;
    };

    ws.onmessage = (event) => {
      try {
        const { stream, data } = JSON.parse(event.data as string) as {
          stream: string;
          data: {
            k: {
              t: number;
              T: number;
              i: string;
              o: string;
              h: string;
              l: string;
              c: string;
              v: string;
              x: boolean;
            };
          };
        };
        const k = data.k;
        const timeframe = timeframes.find(
          (tf) => TIMEFRAME_TO_INTERVAL[tf] === k.i,
        );
        if (!timeframe || !stream) return;
        callback(
          timeframe,
          {
            openTime: k.t,
            closeTime: k.T,
            open: parseFloat(k.o),
            high: parseFloat(k.h),
            low: parseFloat(k.l),
            close: parseFloat(k.c),
            volume: parseFloat(k.v),
          },
          k.x,
        );
      } catch {
        // malformed message — skip silently
      }
    };

    ws.onclose = () => {
      if (!sub.active) return;
      const delay = Math.min(1000 * 2 ** retryCount, 30_000);
      sub.retryTimer = setTimeout(() => {
        if (!sub.active) return;
        this.openConnection(symbol, timeframes, callback, sub, retryCount + 1);
      }, delay);
    };
  }

  unsubscribeSymbol(symbol: string): void {
    const sub = this.subscriptions.get(symbol);
    if (!sub) return;
    sub.active = false;
    if (sub.retryTimer) clearTimeout(sub.retryTimer);
    sub.ws?.close();
    this.subscriptions.delete(symbol);
  }

  unsubscribeAll(): void {
    for (const symbol of [...this.subscriptions.keys()]) {
      this.unsubscribeSymbol(symbol);
    }
  }
}
