import type { Candle } from "@/types/candle";

/**
 * Regular RSI divergence, same logic as TradingView's built-in "Divergence
 * Indicator": pivots on the RSI line, compared with the previous pivot of the
 * same kind, price taken at the pivot candle.
 *
 *  - bullish: RSI higher low  + price lower low
 *  - bearish: RSI lower high  + price higher high
 */
export const DIVERGENCE_PIVOT_LEFT = 5;
export const DIVERGENCE_PIVOT_RIGHT = 5;
/** Min/max candles between the two pivots. */
export const DIVERGENCE_RANGE: readonly [number, number] = [5, 60];

export interface DivergenceResult {
  /** Candles since the latest bullish divergence was confirmed (0 = this candle). */
  bullish?: number;
  bearish?: number;
}

function pivots(rsi: number[], kind: "low" | "high"): number[] {
  const L = DIVERGENCE_PIVOT_LEFT;
  const R = DIVERGENCE_PIVOT_RIGHT;
  const better = (a: number, b: number, strict: boolean) =>
    kind === "low" ? (strict ? a < b : a <= b) : strict ? a > b : a >= b;
  const out: number[] = [];
  for (let k = L; k < rsi.length - R; k++) {
    let ok = true;
    for (let j = k - L; j < k && ok; j++) ok = better(rsi[k], rsi[j], true);
    for (let j = k + 1; j <= k + R && ok; j++) ok = better(rsi[k], rsi[j], false);
    if (ok) out.push(k);
  }
  return out;
}

/**
 * @param rsi RSI series; rsi[k] belongs to candles[k + offset].
 * Pivots are only known DIVERGENCE_PIVOT_RIGHT candles after they happen, so a
 * divergence can never be reported on the pivot candle itself — the result is
 * measured from the confirmation candle.
 */
export function detectRsiDivergence(
  candles: Candle[],
  rsi: number[],
): DivergenceResult {
  const offset = candles.length - rsi.length;
  const [minGap, maxGap] = DIVERGENCE_RANGE;
  const lastIdx = rsi.length - 1;
  const result: DivergenceResult = {};

  const scan = (kind: "low" | "high") => {
    const list = pivots(rsi, kind);
    for (let n = list.length - 1; n > 0; n--) {
      const cur = list[n];
      const prev = list[n - 1];
      const gap = cur - prev;
      if (gap < minGap || gap > maxGap) continue;
      const priceCur =
        kind === "low" ? candles[cur + offset].low : candles[cur + offset].high;
      const pricePrev =
        kind === "low" ? candles[prev + offset].low : candles[prev + offset].high;
      const diverges =
        kind === "low"
          ? rsi[cur] > rsi[prev] && priceCur < pricePrev
          : rsi[cur] < rsi[prev] && priceCur > pricePrev;
      if (diverges) return lastIdx - (cur + DIVERGENCE_PIVOT_RIGHT);
    }
    return undefined;
  };

  result.bullish = scan("low");
  result.bearish = scan("high");
  return result;
}
