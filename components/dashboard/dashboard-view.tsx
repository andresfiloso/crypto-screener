"use client";

import Link from "next/link";
import { Activity, ArrowDown, ArrowUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanCard } from "@/components/dashboard/scan-card";
import { RankingCard } from "@/components/dashboard/ranking-card";
import { MonitorCard } from "@/components/monitor/monitor-card";
import { useMonitor } from "@/hooks/use-monitor";
import { moveWidget, removeWidget } from "@/lib/dashboards-store";
import type { Dashboard, Widget } from "@/lib/dashboards-store";
import type { ScreenerResponse } from "@/types/api";
import type { ScanDefinition } from "@/types/scans";

interface DashboardViewProps {
  dashboard: Dashboard;
  data: ScreenerResponse | null;
  scanDefs: ScanDefinition[];
  editing: boolean;
  isScanSoundEnabled: (scanId: string, defaultEnabled?: boolean) => boolean;
  toggleScanSound: (scanId: string, defaultEnabled?: boolean) => void;
  newMatches: Record<string, Set<string>>;
}

function EditControls({
  dashboardId,
  widget,
  index,
  count,
}: {
  dashboardId: string;
  widget: Widget;
  index: number;
  count: number;
}) {
  return (
    <div className="absolute -top-3 right-2 z-10 flex gap-0.5 rounded-lg border bg-background p-0.5 shadow-sm">
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={index === 0}
        onClick={() => moveWidget(dashboardId, widget.id, -1)}
        aria-label="Move earlier"
      >
        <ArrowUp />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        disabled={index === count - 1}
        onClick={() => moveWidget(dashboardId, widget.id, 1)}
        aria-label="Move later"
      >
        <ArrowDown />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => removeWidget(dashboardId, widget.id)}
        aria-label="Remove widget"
      >
        <X />
      </Button>
    </div>
  );
}

function MonitorWidget({
  data,
}: {
  data: ScreenerResponse | null;
}) {
  const { entries, remove, update } = useMonitor();

  return (
    <section className="col-span-full space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium flex items-center gap-2">
          <Activity className="size-4" />
          Monitor
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {entries.length}
          </span>
        </h2>
        <Link
          href="/monitor"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Ver todos →
        </Link>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No monitored trades. Add one from a scan card.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <MonitorCard
              key={entry.symbol}
              entry={entry}
              symbolState={data?.symbols.find((s) => s.symbol === entry.symbol)}
              onRemove={() => remove(entry.symbol)}
              onUpdate={update}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardView({
  dashboard,
  data,
  scanDefs,
  editing,
  isScanSoundEnabled,
  toggleScanSound,
  newMatches,
}: DashboardViewProps) {
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (dashboard.widgets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Empty dashboard. Press Edit, then Add widget.
      </p>
    );
  }

  return (
    <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
      {dashboard.widgets.map((widget, index) => {
        let content: React.ReactNode = null;

        if (widget.type === "scan") {
          const scan = data.scans.find((s) => s.scanId === widget.refId);
          const def = scanDefs.find((s) => s.id === widget.refId);
          if (scan) {
            const scanDefault = def?.notification?.soundEnabled ?? true;
            content = (
              <ScanCard
                scan={scan}
                soundEnabled={isScanSoundEnabled(scan.scanId, scanDefault)}
                onToggleSound={() => toggleScanSound(scan.scanId, scanDefault)}
                symbols={data.symbols}
                newSymbols={newMatches[scan.scanId]}
              />
            );
          } else if (editing) {
            content = (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Scan missing or disabled
              </div>
            );
          }
        } else if (widget.type === "ranking") {
          const ranking = data.rankings.find(
            (r) => r.rankingId === widget.refId,
          );
          if (ranking) {
            content = <RankingCard ranking={ranking} />;
          } else if (editing) {
            content = (
              <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Ranking missing or disabled
              </div>
            );
          }
        } else {
          content = <MonitorWidget data={data} />;
        }

        if (!content) return null;
        return (
          <div
            key={widget.id}
            className={
              widget.type === "monitor" ? "relative col-span-full" : "relative"
            }
          >
            {editing && (
              <EditControls
                dashboardId={dashboard.id}
                widget={widget}
                index={index}
                count={dashboard.widgets.length}
              />
            )}
            {content}
          </div>
        );
      })}
    </div>
  );
}
