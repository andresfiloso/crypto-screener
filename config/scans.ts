import type { ScanDefinition } from "@/types/scans";

export const SCANS: ScanDefinition[] = [
  {
    id: "overbought",
    name: "Overbought",
    description: "RSI 14 above 70 on both 15m and 1h",
    conditions: [
      { indicator: "RSI_14", timeframe: "15m", operator: ">", value: 70 },
      { indicator: "RSI_14", timeframe: "1h", operator: ">", value: 70 },
    ],
    tradeIdea: {
      side: "short",
      rationale:
        "RSI overbought on 15m and 1h — look for short entries on rejection",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "oversold",
    name: "Oversold",
    description: "RSI 14 below 30 on both 15m and 1h",
    conditions: [
      { indicator: "RSI_14", timeframe: "15m", operator: "<", value: 30 },
      { indicator: "RSI_14", timeframe: "1h", operator: "<", value: 30 },
    ],
    tradeIdea: {
      side: "long",
      rationale: "RSI oversold on 15m and 1h — look for long entries on bounce",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "short-opportunity",
    name: "Short Opportunity",
    description: "RSI 14 above 70 on 15m, 1h, and 4h",
    conditions: [
      { indicator: "RSI_14", timeframe: "15m", operator: ">", value: 70 },
      { indicator: "RSI_14", timeframe: "1h", operator: ">", value: 70 },
      { indicator: "RSI_14", timeframe: "4h", operator: ">", value: 70 },
    ],
    tradeIdea: {
      side: "short",
      rationale:
        "RSI overbought across 15m/1h/4h — high-confidence short setup",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "long-opportunity",
    name: "Long Opportunity",
    description: "RSI 14 below 30 on 15m, 1h, and 4h",
    conditions: [
      { indicator: "RSI_14", timeframe: "15m", operator: "<", value: 30 },
      { indicator: "RSI_14", timeframe: "1h", operator: "<", value: 30 },
      { indicator: "RSI_14", timeframe: "4h", operator: "<", value: 30 },
    ],
    tradeIdea: {
      side: "long",
      rationale: "RSI oversold across 15m/1h/4h — high-confidence long setup",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "rsi-momentum-up",
    name: "RSI Momentum Up",
    description: "RSI 3 above 80 on 5m (short-term momentum burst)",
    conditions: [
      { indicator: "RSI_3", timeframe: "5m", operator: ">", value: 80 },
    ],
    tradeIdea: {
      side: "short",
      rationale: "Short-term momentum exhaustion — scalp short on 5m",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "rsi-momentum-down",
    name: "RSI Momentum Down",
    description: "RSI 3 below 20 on 5m (short-term momentum collapse)",
    conditions: [
      { indicator: "RSI_3", timeframe: "5m", operator: "<", value: 20 },
    ],
    tradeIdea: {
      side: "long",
      rationale: "Short-term momentum exhaustion — scalp long on 5m",
    },
    notification: { soundEnabled: true },
  },
  // ── Custom scans ──────────────────────────────────────────────────────────
  {
    id: "custom-overbought-rsi14-rsi3",
    name: "Overbought RSI14 + RSI3",
    description: "RSI 14 and RSI 3 both above 70 on 15m and 1h",
    group: "custom",
    conditions: [
      { indicator: "RSI_14", timeframe: "1h", operator: ">", value: 70 },
      { indicator: "RSI_3", timeframe: "1h", operator: ">", value: 70 },
      { indicator: "RSI_14", timeframe: "15m", operator: ">", value: 70 },
      { indicator: "RSI_3", timeframe: "15m", operator: ">", value: 70 },
    ],
    tradeIdea: {
      side: "short",
      rationale:
        "RSI 14 and RSI 3 overbought on both 15m and 1h — strong short setup",
    },
    notification: { soundEnabled: true },
  },
  {
    id: "custom-oversold-rsi14-rsi3",
    name: "Oversold RSI14 + RSI3",
    description: "RSI 14 and RSI 3 both below 30 on 15m and 1h",
    group: "custom",
    conditions: [
      { indicator: "RSI_14", timeframe: "1h", operator: "<", value: 30 },
      { indicator: "RSI_3", timeframe: "1h", operator: "<", value: 30 },
      { indicator: "RSI_14", timeframe: "15m", operator: "<", value: 30 },
      { indicator: "RSI_3", timeframe: "15m", operator: "<", value: 30 },
    ],
    tradeIdea: {
      side: "long",
      rationale:
        "RSI 14 and RSI 3 oversold on both 15m and 1h — strong long setup",
    },
    notification: { soundEnabled: true },
  },
];
