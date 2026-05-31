"use client";

import { useState, useEffect, useCallback } from "react";
import type { ScreenerResponse } from "@/types/api";

const POLL_INTERVAL_MS = 10_000;

export function useScreenerData() {
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/screener");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ScreenerResponse = await res.json();
      setData(json);
      setLastFetchedAt(Date.now());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, lastFetchedAt, refetch: fetchData };
}

export { POLL_INTERVAL_MS };
