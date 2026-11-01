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

/** Indicator keys selectable in rule conditions (MACD exposes sub-keys). */
export const RULE_INDICATORS: string[] = [
  ...INDICATOR_IDS.filter((id) => id !== "MACD"),
  "MACD.value",
  "MACD.signal",
  "MACD.histogram",
];
