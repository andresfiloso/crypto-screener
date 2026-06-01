"use client";

import { useState, useEffect, useCallback } from "react";
import { monitorRepository } from "@/lib/monitor-repository";
import type { MonitorEntry } from "@/types/monitor";

export function useMonitor() {
  const [entries, setEntries] = useState<MonitorEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(monitorRepository.getAll());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    (entry: MonitorEntry) => {
      monitorRepository.upsert(entry);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    (symbol: string) => {
      monitorRepository.remove(symbol);
      refresh();
    },
    [refresh],
  );

  const update = useCallback(
    (entry: MonitorEntry) => {
      monitorRepository.upsert(entry);
      refresh();
    },
    [refresh],
  );

  const isMonitored = useCallback(
    (symbol: string) => entries.some((e) => e.symbol === symbol),
    [entries],
  );

  return { entries, add, remove, update, isMonitored };
}
