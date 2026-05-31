import { RSI, EMA, MACD, ATR } from "technicalindicators";
import type { Candle } from "@/types/candle";
import type { IndicatorValues } from "@/types/indicators";

/** Calculate all supported indicators from a candle history.
 *  Returns only the latest value for each indicator.
 *  Requires at minimum ~200 candles for EMA_200; returns undefined for
 *  indicators that cannot be computed from the available history.
 */
export function calculateIndicators(candles: Candle[]): IndicatorValues {
  if (candles.length === 0) return {};

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

  // RSI 14
  const rsi14 = last(RSI.calculate({ values: closes, period: 14 }));

  // RSI 3
  const rsi3 = last(RSI.calculate({ values: closes, period: 3 }));

  // EMA 20
  const ema20 = last(EMA.calculate({ values: closes, period: 20 }));

  // EMA 50
  const ema50 = last(EMA.calculate({ values: closes, period: 50 }));

  // EMA 200 — needs at least 200 candles
  const ema200 =
    closes.length >= 200
      ? last(EMA.calculate({ values: closes, period: 200 }))
      : undefined;

  // ATR 14
  const atrValues =
    candles.length >= 14
      ? ATR.calculate({ high: highs, low: lows, close: closes, period: 14 })
      : [];
  const atr = last(atrValues);

  // MACD (12, 26, 9)
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const lastMacd = last(macdValues);
  const macd =
    lastMacd?.MACD !== undefined &&
    lastMacd?.signal !== undefined &&
    lastMacd?.histogram !== undefined
      ? {
          value: lastMacd.MACD,
          signal: lastMacd.signal,
          histogram: lastMacd.histogram,
        }
      : undefined;

  // Volume — last candle volume
  const volume = last(volumes);

  return {
    RSI_14: rsi14,
    RSI_3: rsi3,
    EMA_20: ema20,
    EMA_50: ema50,
    EMA_200: ema200,
    ATR: atr,
    MACD: macd,
    volume,
  };
}
