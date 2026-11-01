import { SYMBOLS } from "@/config/symbols";
import { createLocalStore } from "@/lib/local-store";

const store = createLocalStore<string[]>("crypto-screener:symbols-v1", SYMBOLS);

export const SYMBOL_PATTERN = /^[A-Z0-9]{3,20}$/;
export const MAX_SYMBOLS = 50;

export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}

export const useSymbols = store.useValue;

export function addSymbol(symbol: string): void {
  store.update((list) => (list.includes(symbol) ? list : [...list, symbol]));
}

export function removeSymbol(symbol: string): void {
  store.update((list) => list.filter((s) => s !== symbol));
}

export const resetSymbols = store.reset;

/** Check against Binance that a spot pair exists. */
export async function symbolExists(symbol: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`,
    );
    return res.ok;
  } catch {
    return false;
  }
}
