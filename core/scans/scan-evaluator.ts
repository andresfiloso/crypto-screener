import type { IndicatorValues } from "@/types/indicators";
import type { ScanDefinition, ScanResult } from "@/types/scans";
import type { SymbolState } from "@/types/symbol";
import type { Operator } from "@/types/scans";

/**
 * Resolve an indicator value from IndicatorValues.
 * For MACD we expose sub-keys: MACD.value, MACD.signal, MACD.histogram.
 */
function resolveIndicatorValue(
  indicators: IndicatorValues,
  indicatorKey: string,
): number | undefined {
  if (indicatorKey.startsWith("MACD.")) {
    const sub = indicatorKey.slice(5) as keyof NonNullable<
      IndicatorValues["MACD"]
    >;
    return indicators.MACD?.[sub];
  }
  return indicators[indicatorKey as keyof IndicatorValues] as
    | number
    | undefined;
}

function applyOperator(lhs: number, op: Operator, rhs: number): boolean {
  switch (op) {
    case ">":
      return lhs > rhs;
    case "<":
      return lhs < rhs;
    case ">=":
      return lhs >= rhs;
    case "<=":
      return lhs <= rhs;
    case "=":
      return lhs === rhs;
  }
}

/** Returns true if the symbol satisfies ALL conditions of the scan. */
export function evaluateScan(
  scan: ScanDefinition,
  symbol: SymbolState,
): boolean {
  return scan.conditions.every((cond) => {
    const indicators = symbol.timeframes[cond.timeframe]?.indicators;
    if (!indicators) return false;
    const value = resolveIndicatorValue(indicators, cond.indicator);
    if (value === undefined) return false;
    return applyOperator(value, cond.operator, cond.value);
  });
}

/** Run all scans against all symbols and return results. */
export function runAllScans(
  scans: ScanDefinition[],
  symbols: SymbolState[],
): ScanResult[] {
  return scans.map((scan) => ({
    scanId: scan.id,
    name: scan.name,
    description: scan.description,
    conditions: scan.conditions,
    tradeIdea: scan.tradeIdea,
    group: scan.group,
    matches: symbols.filter((s) => evaluateScan(scan, s)).map((s) => s.symbol),
  }));
}
