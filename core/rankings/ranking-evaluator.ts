import type {
  RankingDefinition,
  RankingResult,
  CombinedRankingDefinition,
  CombinedRankingResult,
} from "@/types/scans";
import type { SymbolState } from "@/types/symbol";
import type { IndicatorValues } from "@/types/indicators";

function resolveValue(
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

/** Rank symbols by a single indicator/timeframe combination. */
export function evaluateRanking(
  ranking: RankingDefinition,
  symbols: SymbolState[],
): RankingResult {
  const entries = symbols
    .map((s) => {
      const indicators = s.timeframes[ranking.timeframe]?.indicators;
      const value = indicators
        ? resolveValue(indicators, ranking.indicator)
        : undefined;
      return value !== undefined ? { symbol: s.symbol, value } : null;
    })
    .filter((e): e is { symbol: string; value: number } => e !== null);

  entries.sort((a, b) =>
    ranking.direction === "desc" ? b.value - a.value : a.value - b.value,
  );

  const limited =
    ranking.limit !== undefined ? entries.slice(0, ranking.limit) : entries;

  return {
    rankingId: ranking.id,
    name: ranking.name,
    entries: limited,
  };
}

/** Run all rankings and return results. */
export function runAllRankings(
  rankings: RankingDefinition[],
  symbols: SymbolState[],
): RankingResult[] {
  return rankings.map((r) => evaluateRanking(r, symbols));
}

/** Evaluate a combined ranking (top N highest + bottom N lowest). */
export function evaluateCombinedRanking(
  ranking: CombinedRankingDefinition,
  symbols: SymbolState[],
): CombinedRankingResult {
  const limit = ranking.limit ?? 5;

  const entries = symbols
    .map((s) => {
      const indicators = s.timeframes[ranking.timeframe]?.indicators;
      const value = indicators
        ? resolveValue(indicators, ranking.indicator)
        : undefined;
      return value !== undefined ? { symbol: s.symbol, value } : null;
    })
    .filter((e): e is { symbol: string; value: number } => e !== null);

  const desc = [...entries].sort((a, b) => b.value - a.value);
  const asc = [...entries].sort((a, b) => a.value - b.value);

  return {
    rankingId: ranking.id,
    name: ranking.name,
    top: desc.slice(0, limit),
    bottom: asc.slice(0, limit),
  };
}

/** Run all combined rankings and return results. */
export function runAllCombinedRankings(
  rankings: CombinedRankingDefinition[],
  symbols: SymbolState[],
): CombinedRankingResult[] {
  return rankings.map((r) => evaluateCombinedRanking(r, symbols));
}
