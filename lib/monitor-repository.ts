import type { MonitorEntry } from "@/types/monitor";

/**
 * Abstraction layer for persisting monitor entries.
 * Swap the implementation (currently localStorage) for a DB adapter later
 * without touching any component or hook code.
 */
export interface MonitorRepository {
  getAll(): MonitorEntry[];
  /** Add or replace the entry for a symbol (one entry per symbol). */
  upsert(entry: MonitorEntry): void;
  remove(symbol: string): void;
}

const STORAGE_KEY = "crypto-screener:monitor-v1";

class LocalStorageMonitorRepository implements MonitorRepository {
  getAll(): MonitorEntry[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as MonitorEntry[]) : [];
    } catch {
      return [];
    }
  }

  upsert(entry: MonitorEntry): void {
    const entries = this.getAll();
    const idx = entries.findIndex((e) => e.symbol === entry.symbol);
    if (idx >= 0) {
      entries[idx] = entry;
    } else {
      entries.push(entry);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  remove(symbol: string): void {
    const filtered = this.getAll().filter((e) => e.symbol !== symbol);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

/** Singleton — replace with a DB-backed repository when needed. */
export const monitorRepository: MonitorRepository =
  new LocalStorageMonitorRepository();
