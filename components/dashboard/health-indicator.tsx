"use client";

import type { FeedHealth } from "@/types/api";
import { cn } from "@/lib/utils";

interface HealthIndicatorProps {
  feeds: FeedHealth[];
}

export function HealthIndicator({ feeds }: HealthIndicatorProps) {
  if (feeds.length === 0) return null;

  const connected = feeds.filter((f) => f.connected).length;
  const total = feeds.length;
  const allHealthy = connected === total;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          allHealthy ? "bg-green-500" : "bg-yellow-500",
        )}
      />
      <span>
        {connected}/{total} feeds connected
      </span>
    </div>
  );
}
