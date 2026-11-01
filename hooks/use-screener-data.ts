"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { ScreenerResponse } from "@/types/api";
import { EMPTY_SNAPSHOT, getEngine } from "@/core/engine/screener-engine";
import { runAllScans } from "@/core/scans/scan-evaluator";
import { runAllCombinedRankings } from "@/core/rankings/ranking-evaluator";
import { useSymbols } from "@/lib/symbols-store";
import { isEnabled, useRules } from "@/lib/rules-store";

const subscribe = (listener: () => void) => getEngine().subscribe(listener);
const getSnapshot = () => getEngine().getSnapshot();
const getServerSnapshot = () => EMPTY_SNAPSHOT;

/**
 * Live market data for the user's symbols, with the user's rules applied.
 * Everything runs in the browser; symbols and rules come from localStorage.
 */
export function useScreenerData() {
  const symbols = useSymbols();
  const rules = useRules();
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    getEngine().setSymbols(symbols);
  }, [symbols]);

  const data = useMemo<ScreenerResponse | null>(() => {
    if (snapshot.updatedAt === 0) return null;
    return {
      status: snapshot.status,
      symbols: snapshot.symbols,
      health: snapshot.health,
      updatedAt: snapshot.updatedAt,
      scans: runAllScans(rules.scans.filter(isEnabled), snapshot.symbols),
      rankings: runAllCombinedRankings(
        rules.rankings.filter(isEnabled),
        snapshot.symbols,
      ),
    };
  }, [snapshot, rules]);

  return {
    data,
    loading: data === null,
    error: null as string | null,
    lastFetchedAt: data ? data.updatedAt : null,
  };
}
