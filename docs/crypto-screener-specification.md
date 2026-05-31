# Crypto Screener - Technical Specification

## Overview

Build a crypto screener application focused on identifying trading opportunities using technical indicators and predefined scans.

The application is intended as a lightweight alternative to TradingView screeners, optimized for monitoring a curated list of crypto assets and evaluating indicator-based conditions across multiple timeframes.

## Goals

- Monitor a configurable list of crypto assets.
- Calculate technical indicators in near real time.
- Update indicators only when a candle closes.
- Execute predefined scans against all monitored assets.
- Provide rankings and opportunity discovery.
- Operate without a database in V1.
- Be architected for future expansion.

---

# Scope (V1)

## Included

- Binance market data provider.
- Fixed list of assets.
- Fixed set of supported indicators.
- Fixed set of supported timeframes.
- Scan engine.
- Ranking engine.
- In-memory state management.
- Screener UI.
- Health monitoring.

## Excluded

- Authentication.
- Multi-user support.
- Alerts.
- Historical persistence.
- Backtesting.
- Charting.
- Portfolio tracking.
- Order execution.

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- ShadCN UI
- TanStack Table

## Backend

- Next.js Route Handlers
- TypeScript

## Technical Analysis

Recommended:

- technicalindicators

Alternative:

- @ixjb94/indicators

---

# Supported Assets

Initially:

- BTCUSDT
- ETHUSDT
- BNBUSDT
- SOLUSDT
- XRPUSDT

Additional symbols should be configurable.

Expected initial scale:

- 10–20 assets

Future scale:

- 100+ assets

---

# Supported Timeframes

```ts
export const TIMEFRAMES = [
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
  "1w",
] as const;
```

---

# Architecture

```text
Market Data Provider
        ↓
Indicator Engine
        ↓
In-Memory State
        ↓
Scan Engine
        ↓
Ranking Engine
        ↓
UI
```

---

# Market Data Layer

## Goal

Abstract data providers.

## Interface

```ts
interface MarketDataProvider {
  getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number
  ): Promise<Candle[]>;

  subscribeKlines(
    symbol: string,
    timeframe: Timeframe,
    callback: (candle: Candle) => void
  ): void;
}
```

## Initial Provider

```ts
class BinanceProvider implements MarketDataProvider {}
```

Future providers:

- Coinbase
- Bybit
- Kraken
- Yahoo Finance

---

# Candle Model

```ts
interface Candle {
  openTime: number;
  closeTime: number;

  open: number;
  high: number;
  low: number;
  close: number;

  volume: number;
}
```

---

# Indicator Engine

## Goal

Calculate indicators from candle data.

Indicators are calculated when a candle closes.

Do not recalculate indicators on every scan execution.

---

## Supported Indicators

### Core Indicators

- RSI 14
- RSI 3
- EMA 20
- EMA 50
- EMA 200
- MACD
- ATR
- Volume

### Future Indicators

- ADX
- VWAP
- Supertrend
- Bollinger Bands
- Stochastic RSI

---

## Indicator Definitions

```ts
interface IndicatorDefinition {
  id: string;
  name: string;
}
```

Example:

```ts
{
  id: "RSI_14",
  name: "RSI 14"
}
```

---

# In-Memory State

No database is used in V1.

All market state remains in memory.

```ts
interface SymbolState {
  symbol: string;

  price: number;

  indicators: Record<
    Timeframe,
    Record<string, number>
  >;

  lastUpdate: number;
}
```

Store:

```ts
Map<string, SymbolState>
```

---

# Health Monitoring

Track feed health.

```ts
interface FeedHealth {
  symbol: string;
  timeframe: string;

  connected: boolean;

  lastUpdate: number;
}
```

Purpose:

- Detect stale feeds.
- Detect disconnected streams.
- Provide operational visibility.

---

# Scan Engine

## Goal

Evaluate configured conditions against all assets.

Scans are configuration-driven.

Scans are NOT hardcoded.

---

## Condition Model

```ts
interface Condition {
  indicator: string;

  timeframe: string;

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

## Scan Definition

```ts
interface ScanDefinition {
  id: string;

  name: string;

  description?: string;

  conditions: Condition[];
}
```

---

## Example

```ts
{
  id: "overbought-multi-tf",
  name: "Overbought Multi TF",
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
    },
  ],
}
```

---

# Default Scans

## Overbought

RSI14 > 70

## Oversold

RSI14 < 30

## Bull Trend

EMA20 > EMA50 > EMA200

## Bear Trend

EMA20 < EMA50 < EMA200

## Potential Long

Example:

- RSI14 15m < 30
- RSI14 1h < 40
- MACD improving

## Potential Short

Example:

- RSI14 15m > 70
- RSI14 1h > 70
- RSI14 4h > 70
- MACD positive

---

# Ranking Engine

## Goal

Sort assets using indicator values.

---

## Ranking Definition

```ts
interface RankingDefinition {
  id: string;

  name: string;

  sortBy: {
    indicator: string;
    timeframe: string;
    direction: "asc" | "desc";
  };
}
```

---

## Examples

### Highest RSI 4H

Descending RSI14 on 4H.

### Lowest RSI 4H

Ascending RSI14 on 4H.

### Highest Volume

Descending Volume.

### Largest Distance From EMA200

Descending absolute distance.

---

# Application Configuration

## Assets

```ts
export const SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
];
```

## Timeframes

```ts
export const TIMEFRAMES = [
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
  "1w",
];
```

## Indicators

Configured centrally.

## Scans

Configured centrally.

## Rankings

Configured centrally.

---

# Data Flow

## Startup

1. Load configuration.
2. Load symbols.
3. Download historical candles.
4. Calculate indicators.
5. Populate state.
6. Start websocket subscriptions.

---

## Runtime

When candle closes:

1. Receive candle.
2. Update candle history.
3. Recalculate indicators.
4. Update symbol state.
5. Re-evaluate scans.
6. Recompute rankings.
7. Push updates to UI.

---

# User Interface

The exact UI is intentionally exploratory.

V1 starts with a table-based screener.

---

## Page: Dashboard

Purpose:

- High level overview.
- Scan summaries.
- Rankings.

Potential widgets:

- Overbought assets.
- Oversold assets.
- Long opportunities.
- Short opportunities.
- Top rankings.

---

## Page: Symbols

Primary screener table.

Example columns:

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
- MACD

Supports:

- Sorting
- Filtering
- Search

---

## Page: Scan Detail

Shows:

- Scan metadata.
- Matching assets.
- Indicator values.

---

# Performance Requirements

Initial target:

- 10–20 assets
- 6 timeframes
- Multiple indicators

Must operate entirely in memory.

No database required.

No Redis required.

No message queue required.

---

# Future Roadmap

## Phase 2

- Database
- User accounts
- Watchlists
- Saved scans
- Saved rankings

## Phase 3

- Alerts
- Telegram integration
- Push notifications
- Email notifications

## Phase 4

- Multi-provider support
- Portfolio tracking
- Backtesting
- Strategy evaluation

---

# Design Principles

1. Indicators are infrastructure.
2. Scans are the product.
3. Rankings are first-class citizens.
4. Configuration over hardcoded logic.
5. In-memory state in V1.
6. Provider abstraction from day one.
7. Database only when persistence becomes necessary.
8. Optimize for opportunity discovery rather than charting.
