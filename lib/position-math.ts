import type { MonitorEntry } from "@/types/monitor";
import type { TradeSide } from "@/types/scans";

/** Binance USDⓈ-M tier 1 maintenance margin rate (0.5%). */
export const DEFAULT_MMR = 0.005;

type PositionInput = Pick<
  MonitorEntry,
  "entryPrice" | "usdtQuantity" | "leverage" | "quantity"
>;

/** Base-asset quantity: the user's real figure, else derived from margin × leverage. */
export function positionQty(e: PositionInput): number {
  return e.quantity ?? (e.usdtQuantity * e.leverage) / e.entryPrice;
}

/**
 * Isolated-margin liquidation price using Binance's formula
 * (maintenance amount ignored, i.e. tier 1):
 *   long  = (qty × entry − margin) / (qty × (1 − mmr))
 *   short = (qty × entry + margin) / (qty × (1 + mmr))
 * `margin` is the current margin balance, so funding/fees paid are reflected.
 */
export function liquidationPrice(
  side: TradeSide,
  e: PositionInput,
  mmr = DEFAULT_MMR,
): number | null {
  if (e.leverage <= 1) return null;
  const qty = positionQty(e);
  const s = side === "long" ? 1 : -1;
  const liq = (s * qty * e.entryPrice - e.usdtQuantity) / (qty * (s - mmr));
  return liq > 0 && Number.isFinite(liq) ? liq : null;
}

export function unrealizedPnl(
  side: TradeSide,
  e: PositionInput,
  currentPrice: number,
) {
  const s = side === "long" ? 1 : -1;
  const usdt = positionQty(e) * (currentPrice - e.entryPrice) * s;
  return { usdt, pct: e.usdtQuantity ? (usdt / e.usdtQuantity) * 100 : 0 };
}
