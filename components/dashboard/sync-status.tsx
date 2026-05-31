"use client";

import { useState, useEffect } from "react";

interface SyncStatusProps {
  lastFetchedAt: number | null;
}

function formatAgo(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ${s % 60}s ago`;
}

export function SyncStatus({ lastFetchedAt }: SyncStatusProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastFetchedAt) {
    return (
      <span className="text-xs text-muted-foreground tabular-nums">
        Syncing…
      </span>
    );
  }

  const elapsed = now - lastFetchedAt;

  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      Updated {formatAgo(elapsed)}
    </span>
  );
}
