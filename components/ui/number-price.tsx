"use client";

import NumberFlow from "@number-flow/react";
import type { Format } from "@number-flow/react";

interface NumberPriceProps {
  value: number | null | undefined;
  fallback?: string;
  className?: string;
  formatOptions?: Format;
}

export function NumberPrice({
  value,
  fallback = "N/A",
  className,
  formatOptions,
}: NumberPriceProps) {
  if (value === null || value === undefined) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={className}>
      <NumberFlow
        value={value}
        locales="en-US"
        format={{
          style: "currency",
          currency: "USD",
          ...formatOptions,
        }}
      />
    </span>
  );
}
