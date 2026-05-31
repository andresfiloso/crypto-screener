export const INDICATOR_IDS = [
  "RSI_14",
  "RSI_3",
  "EMA_20",
  "EMA_50",
  "EMA_200",
  "MACD",
  "ATR",
  "volume",
] as const;

export type IndicatorId = (typeof INDICATOR_IDS)[number];
