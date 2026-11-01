"use client";

import { useCallback } from "react";
import {
  removeMonitorEntry,
  upsertMonitorEntry,
  useMonitorEntries,
} from "@/lib/monitor-repository";
import {
  addMonitorWidgetToActive,
  removeMonitorWidgets,
} from "@/lib/dashboards-store";
import type { MonitorEntry } from "@/types/monitor";

export function useMonitor() {
  const entries = useMonitorEntries();

  const add = useCallback((entry: MonitorEntry) => {
    upsertMonitorEntry(entry);
    addMonitorWidgetToActive(entry.symbol);
  }, []);

  const remove = useCallback((symbol: string) => {
    removeMonitorEntry(symbol);
    removeMonitorWidgets(symbol);
  }, []);

  const update = useCallback((entry: MonitorEntry) => {
    upsertMonitorEntry(entry);
  }, []);

  const isMonitored = useCallback(
    (symbol: string) => entries.some((e) => e.symbol === symbol),
    [entries],
  );

  return { entries, add, remove, update, isMonitored };
}
