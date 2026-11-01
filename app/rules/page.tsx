"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { ScanEditor } from "@/components/rules/scan-editor";
import { RankingEditor } from "@/components/rules/ranking-editor";
import {
  isEnabled,
  newRuleId,
  removeRanking,
  removeScan,
  resetRules,
  upsertRanking,
  upsertScan,
  useRules,
} from "@/lib/rules-store";
import type { CombinedRankingDefinition, ScanDefinition } from "@/types/scans";

function describe(scan: ScanDefinition): string {
  return scan.conditions
    .map((c) => `${c.indicator} ${c.operator} ${c.value} @${c.timeframe}`)
    .join(" · ");
}

export default function RulesPage() {
  const rules = useRules();
  // `key` forces the editor to remount with fresh form state per target.
  const [scanEditor, setScanEditor] = useState<{
    key: number;
    scan?: ScanDefinition;
  } | null>(null);
  const [rankingEditor, setRankingEditor] = useState<{
    key: number;
    ranking?: CombinedRankingDefinition;
  } | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Dashboard
            </Link>
            <h1 className="text-lg font-semibold tracking-tight">Rules</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Replace all rules with the defaults?")) {
                  resetRules();
                }
              }}
            >
              <RotateCcw /> Reset to defaults
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 space-y-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Scans</h2>
            <Button
              size="sm"
              onClick={() => setScanEditor({ key: Date.now() })}
            >
              <Plus /> New scan
            </Button>
          </div>
          <ul className="divide-y rounded-xl border">
            {rules.scans.map((scan) => (
              <li key={scan.id} className="flex items-center gap-3 p-3">
                <Switch
                  size="sm"
                  checked={isEnabled(scan)}
                  onCheckedChange={(enabled) =>
                    upsertScan({ ...scan, enabled })
                  }
                  aria-label={`Enable ${scan.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {scan.name}
                    {scan.tradeIdea && (
                      <Badge variant="outline" className="capitalize">
                        {scan.tradeIdea.side}
                      </Badge>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {describe(scan)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit"
                  onClick={() => setScanEditor({ key: Date.now(), scan })}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => removeScan(scan.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
            {rules.scans.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No scans yet.
              </li>
            )}
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Rankings</h2>
            <Button
              size="sm"
              onClick={() => setRankingEditor({ key: Date.now() })}
            >
              <Plus /> New ranking
            </Button>
          </div>
          <ul className="divide-y rounded-xl border">
            {rules.rankings.map((ranking) => (
              <li key={ranking.id} className="flex items-center gap-3 p-3">
                <Switch
                  size="sm"
                  checked={isEnabled(ranking)}
                  onCheckedChange={(enabled) =>
                    upsertRanking({ ...ranking, enabled })
                  }
                  aria-label={`Enable ${ranking.name}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{ranking.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ranking.indicator} @{ranking.timeframe} · top/bottom{" "}
                    {ranking.limit ?? 5}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit"
                  onClick={() => setRankingEditor({ key: Date.now(), ranking })}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete"
                  onClick={() => removeRanking(ranking.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
            {rules.rankings.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No rankings yet.
              </li>
            )}
          </ul>
        </section>
      </main>

      {scanEditor && (
        <ScanEditor
          key={scanEditor.key}
          scan={scanEditor.scan}
          open
          onOpenChange={(open) => !open && setScanEditor(null)}
          onSave={upsertScan}
          newId={() => newRuleId("scan")}
        />
      )}
      {rankingEditor && (
        <RankingEditor
          key={rankingEditor.key}
          ranking={rankingEditor.ranking}
          open
          onOpenChange={(open) => !open && setRankingEditor(null)}
          onSave={upsertRanking}
          newId={() => newRuleId("ranking")}
        />
      )}
    </div>
  );
}
