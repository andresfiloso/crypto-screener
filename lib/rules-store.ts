import { SCANS } from "@/config/scans";
import { RANKINGS } from "@/config/rankings";
import { createLocalStore } from "@/lib/local-store";
import type { CombinedRankingDefinition, ScanDefinition } from "@/types/scans";

export interface RulesConfig {
  scans: ScanDefinition[];
  rankings: CombinedRankingDefinition[];
}

const DEFAULT_RULES: RulesConfig = { scans: SCANS, rankings: RANKINGS };

const store = createLocalStore<RulesConfig>(
  "crypto-screener:rules-v1",
  DEFAULT_RULES,
);

export const useRules = store.useValue;
export const resetRules = store.reset;

export function newRuleId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function upsertScan(scan: ScanDefinition): void {
  store.update((r) => {
    const exists = r.scans.some((s) => s.id === scan.id);
    return {
      ...r,
      scans: exists
        ? r.scans.map((s) => (s.id === scan.id ? scan : s))
        : [...r.scans, scan],
    };
  });
}

export function removeScan(id: string): void {
  store.update((r) => ({ ...r, scans: r.scans.filter((s) => s.id !== id) }));
}

export function upsertRanking(ranking: CombinedRankingDefinition): void {
  store.update((r) => {
    const exists = r.rankings.some((x) => x.id === ranking.id);
    return {
      ...r,
      rankings: exists
        ? r.rankings.map((x) => (x.id === ranking.id ? ranking : x))
        : [...r.rankings, ranking],
    };
  });
}

export function removeRanking(id: string): void {
  store.update((r) => ({
    ...r,
    rankings: r.rankings.filter((x) => x.id !== id),
  }));
}

export function isEnabled(rule: { enabled?: boolean }): boolean {
  return rule.enabled !== false;
}
