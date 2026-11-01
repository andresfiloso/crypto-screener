import { createLocalStore } from "@/lib/local-store";
import type { MonitorEntry } from "@/types/monitor";

/** Shared store so every widget/page sees monitor changes immediately. */
const store = createLocalStore<MonitorEntry[]>("crypto-screener:monitor-v1", []);

export const useMonitorEntries = store.useValue;

/** Add or replace the entry for a symbol (one entry per symbol). */
export function upsertMonitorEntry(entry: MonitorEntry): void {
  store.update((entries) =>
    entries.some((e) => e.symbol === entry.symbol)
      ? entries.map((e) => (e.symbol === entry.symbol ? entry : e))
      : [...entries, entry],
  );
}

export function removeMonitorEntry(symbol: string): void {
  store.update((entries) => entries.filter((e) => e.symbol !== symbol));
}
