# Crypto Screener V1 - Technical Implementation Specification (Iteration 2)

## Objective

This document defines the concrete implementation details, folder structure, contracts, state model, websocket architecture, scan DSL, and UI architecture required to build V1.

---

# Recommended Stack

- Next.js (App Router)
- TypeScript
- React
- ShadCN UI
- TanStack Table
- technicalindicators
- Zustand (UI state only)
- Native Node EventEmitter
- Binance WebSocket Streams

---

# Folder Structure

```text
src/
├── app/
│   ├── page.tsx
│   ├── symbols/page.tsx
│   ├── scans/[id]/page.tsx
│   └── api/
│       └── screener/
│           └── route.ts
│
├── components/
│   ├── dashboard/
│   ├── symbols/
│   ├── scans/
│   └── rankings/
│
├── config/
│   ├── symbols.ts
│   ├── indicators.ts
│   ├── scans.ts
│   └── rankings.ts
│
├── core/
│   ├── providers/
│   ├── indicators/
│   ├── scans/
│   ├── rankings/
│   ├── state/
│   └── streams/
│
├── types/
│   ├── candle.ts
│   ├── indicators.ts
│   ├── scans.ts
│   └── symbol.ts
│
└── lib/
```

---

# State Architecture

Single source of truth:

```ts
class MarketStateStore {
  symbols: Map<string, SymbolState>;
}
```

Everything derives from this state.

No duplicated caches.

No database.

---

# Symbol State

```ts
interface SymbolState {
  symbol: string;

  price: number;

  updatedAt: number;

  timeframes: Record<
    Timeframe,
    TimeframeState
  >;
}
```

---

# Timeframe State

```ts
interface TimeframeState {
  candles: Candle[];

  indicators: {
    RSI_14?: number;
    RSI_3?: number;

    EMA_20?: number;
    EMA_50?: number;
    EMA_200?: number;

    ATR?: number;

    MACD?: {
      value: number;
      signal: number;
      histogram: number;
    };

    volume?: number;
  };
}
```

---

# Startup Sequence

## Step 1

Load configuration.

```ts
symbols
indicators
scans
rankings
```

## Step 2

Download historical candles.

Recommended:

```ts
300 candles
```

per:

```ts
symbol + timeframe
```

## Step 3

Calculate indicators.

## Step 4

Populate state.

## Step 5

Open websocket subscriptions.

## Step 6

Begin scan evaluation.

---

# Binance Architecture

Use one websocket stream per symbol/timeframe pair.

Example:

```text
btcusdt@kline_5m
btcusdt@kline_15m
btcusdt@kline_1h
```

For V1 scale (10-20 symbols), this is acceptable.

Optimization can come later.

---

# Candle Update Strategy

Ignore partial candles.

Process only:

```ts
kline.isFinal === true
```

Workflow:

```text
Closed Candle
    ↓
Append Candle
    ↓
Trim History
    ↓
Recalculate Indicators
    ↓
Update State
    ↓
Execute Scans
    ↓
Update Rankings
```

---

# Indicator Engine

Interface:

```ts
interface IndicatorCalculator {
  calculate(
    candles: Candle[]
  ): number | object;
}
```

Examples:

```ts
RSI14Calculator
EMA20Calculator
MACDCalculator
```

Registry:

```ts
const indicatorRegistry = {
  RSI_14,
  RSI_3,
  EMA_20,
  EMA_50,
  EMA_200,
  MACD,
  ATR,
};
```

---

# Scan DSL

Scans are configuration.

Never hardcoded.

---

# Condition

```ts
interface Condition {
  indicator: string;

  timeframe: Timeframe;

  operator:
    | ">"
    | "<"
    | ">="
    | "<="
    | "=";

  value: number;
}
```

---

# Scan

```ts
interface ScanDefinition {
  id: string;

  name: string;

  description?: string;

  conditions: Condition[];
}
```

---

# Example

```ts
{
  id: "short-opportunity",
  name: "Short Opportunity",
  conditions: [
    {
      indicator: "RSI_14",
      timeframe: "15m",
      operator: ">",
      value: 70,
    },
    {
      indicator: "RSI_14",
      timeframe: "1h",
      operator: ">",
      value: 70,
    },
    {
      indicator: "RSI_14",
      timeframe: "4h",
      operator: ">",
      value: 70,
    }
  ]
}
```

---

# Scan Engine

```ts
evaluateScan(
  scan: ScanDefinition,
  symbol: SymbolState
): boolean
```

Result:

```ts
string[]
```

Matching symbols.

---

# Ranking DSL

```ts
interface RankingDefinition {
  id: string;

  name: string;

  indicator: string;

  timeframe: Timeframe;

  direction: "asc" | "desc";

  limit?: number;
}
```

---

# Examples

Highest RSI 4H

```ts
{
  indicator: "RSI_14",
  timeframe: "4h",
  direction: "desc"
}
```

Lowest RSI 4H

```ts
{
  indicator: "RSI_14",
  timeframe: "4h",
  direction: "asc"
}
```

---

# API Layer

Single endpoint.

```text
GET /api/screener
```

Response:

```ts
{
  symbols,
  rankings,
  scans,
  updatedAt
}
```

---

# UI Strategy

## Dashboard

Cards:

- Overbought
- Oversold
- Long Opportunities
- Short Opportunities
- Rankings

---

## Symbols Page

TanStack Table.

Columns:

- Symbol
- Price
- RSI 5m
- RSI 15m
- RSI 1h
- RSI 4h
- RSI 1d
- EMA20
- EMA50
- EMA200
- MACD Histogram

Features:

- Sort
- Search
- Filter

---

## Scan Detail Page

Shows:

- Scan definition
- Matching symbols
- Indicator values

---

# Realtime Updates

Preferred approach:

```text
Server Memory
     ↓
SSE
     ↓
React UI
```

Use Server Sent Events.

Avoid introducing custom websocket infrastructure in V1.

---

# Health Monitoring

```ts
interface FeedHealth {
  symbol: string;

  timeframe: string;

  connected: boolean;

  lastUpdate: number;
}
```

Display stale feeds.

---

# Future Compatibility

Architecture must support future:

- PostgreSQL
- Drizzle ORM
- User accounts
- Saved scans
- Saved rankings
- Alerts
- Telegram notifications
- Multi-provider data sources

Without requiring major refactors.
