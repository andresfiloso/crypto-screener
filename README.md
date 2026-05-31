# Crypto Screener

Real-time crypto screener powered by Binance WebSocket feeds. Calculates technical indicators across multiple timeframes, runs configurable scans, and ranks symbols by momentum.

## Stack

- **Next.js 16** — App Router, API routes
- **Binance WebSocket** — live kline data
- **technicalindicators** — RSI, EMA, MACD, Bollinger Bands
- **Zustand** — in-memory market state
- **shadcn/ui + Tailwind CSS v4**

## Features

- Live indicator calculation (RSI, EMA, MACD, BB) across 15m / 1h / 4h / 1d
- Scan engine — configurable multi-condition scans (overbought, oversold, trend, momentum)
- Symbol rankings by composite score
- Feed health monitoring per symbol/timeframe
- Dark/light theme

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/          # Next.js pages and API route (/api/screener)
components/   # UI components (dashboard, symbols, shadcn/ui)
config/       # Scan, ranking, indicator, and symbol definitions
core/         # Screener engine (provider, calculator, evaluators, state)
types/        # Shared TypeScript types
```
