"use client";

import "react-grid-layout/css/styles.css";
import { useEffect, useMemo } from "react";
import ReactGridLayout, {
  getCompactor,
  useContainerWidth,
  verticalCompactor,
} from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanCard } from "@/components/dashboard/scan-card";
import { RankingCard } from "@/components/dashboard/ranking-card";
import { MonitorCard } from "@/components/monitor/monitor-card";
import { useMonitor } from "@/hooks/use-monitor";
import {
  GRID_COLS,
  ensureLayout,
  expandLegacyMonitor,
  removeWidget,
  setLayout,
} from "@/lib/dashboards-store";
import type { Dashboard, PlacedWidget } from "@/lib/dashboards-store";
import type { ScreenerResponse } from "@/types/api";
import type { ScanDefinition } from "@/types/scans";

const ROW_HEIGHT = 40;
const GAP = 12;
/** Below this width the grid is replaced by a plain stacked list. */
const STACK_BELOW_PX = 768;

const freeCompactor = getCompactor(null, false, true);

interface DashboardViewProps {
  dashboard: Dashboard;
  data: ScreenerResponse | null;
  scanDefs: ScanDefinition[];
  editing: boolean;
  isScanSoundEnabled: (scanId: string, defaultEnabled?: boolean) => boolean;
  toggleScanSound: (scanId: string, defaultEnabled?: boolean) => void;
  newMatches: Record<string, Set<string>>;
}

function MonitorWidget({
  symbol,
  data,
}: {
  symbol: string;
  data: ScreenerResponse;
}) {
  const { entries, remove, update } = useMonitor();
  const entry = entries.find((e) => e.symbol === symbol);
  if (!entry) return null;
  return (
    <MonitorCard
      entry={entry}
      symbolState={data.symbols.find((s) => s.symbol === symbol)}
      onRemove={() => remove(symbol)}
      onUpdate={update}
    />
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
  const { width, containerRef, mounted } = useContainerWidth();
  const { entries } = useMonitor();
  const monitored = useMemo(
    () => new Set(entries.map((e) => e.symbol)),
    [entries],
  );
  const allPlaced = useMemo(
    () => ensureLayout(dashboard.widgets),
    [dashboard.widgets],
  );
  // Widgets whose scan/ranking was deleted or disabled are hidden, not shown as holes.
  const placed = useMemo(
    () =>
      allPlaced.filter((w) => {
        if (w.type === "scan") {
          return data?.scans.some((s) => s.scanId === w.refId) ?? true;
        }
        if (w.type === "ranking") {
          return data?.rankings.some((r) => r.rankingId === w.refId) ?? true;
        }
        return monitored.has(w.refId ?? "");
      }),
    [allPlaced, data, monitored],
  );

  useEffect(() => {
    // Empty set can just mean localStorage has not hydrated yet; wait for entries.
    if (
      monitored.size > 0 &&
      dashboard.widgets.some((w) => w.type === "monitor" && !w.refId)
    ) {
      expandLegacyMonitor(dashboard.id, [...monitored]);
    }
  }, [dashboard.id, dashboard.widgets, monitored]);

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  function renderWidget(widget: PlacedWidget): React.ReactNode {
    if (widget.type === "scan") {
      const scan = data!.scans.find((s) => s.scanId === widget.refId);
      if (!scan) return null;
      const scanDefault =
        scanDefs.find((s) => s.id === widget.refId)?.notification
          ?.soundEnabled ?? true;
      return (
        <ScanCard
          scan={scan}
          soundEnabled={isScanSoundEnabled(scan.scanId, scanDefault)}
          onToggleSound={() => toggleScanSound(scan.scanId, scanDefault)}
          symbols={data!.symbols}
          newSymbols={newMatches[scan.scanId]}
        />
      );
    }
    if (widget.type === "ranking") {
      const ranking = data!.rankings.find((r) => r.rankingId === widget.refId);
      if (!ranking) return null;
      return <RankingCard ranking={ranking} />;
    }
    return <MonitorWidget symbol={widget.refId!} data={data!} />;
  }

  if (placed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Empty dashboard. Press Edit, then Add widget.
      </p>
    );
  }

  const stacked = mounted && width < STACK_BELOW_PX;

  function handleLayoutChange(layout: Layout) {
    const changed = layout.some((l) => {
      const w = placed.find((p) => p.id === l.i);
      return !w || w.x !== l.x || w.y !== l.y || w.w !== l.w || w.h !== l.h;
    });
    if (!changed) return;
    setLayout(
      dashboard.id,
      layout.map((l) => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })),
    );
  }

  return (
    <div ref={containerRef}>
      {stacked ? (
        <div className="space-y-4">
          {[...placed]
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((w) => {
              const node = renderWidget(w);
              return node ? <div key={w.id}>{node}</div> : null;
            })}
        </div>
      ) : (
        mounted && (
          <div className="relative">
            <ReactGridLayout
              width={width}
              layout={placed.map((w) => ({
                i: w.id,
                x: w.x,
                y: w.y,
                w: w.w,
                h: w.h,
                minW: 2,
                minH: 3,
              }))}
              gridConfig={{
                cols: GRID_COLS,
                rowHeight: ROW_HEIGHT,
                margin: [GAP, GAP],
                containerPadding: [0, 0],
              }}
              dragConfig={{ enabled: editing, cancel: ".widget-remove" }}
              resizeConfig={{ enabled: editing }}
              compactor={
                dashboard.autoLayout === false
                  ? freeCompactor
                  : verticalCompactor
              }
              onLayoutChange={handleLayoutChange}
            >
              {placed.map((w) => (
                <div
                  key={w.id}
                  className={
                    editing
                      ? "group/widget cursor-grab rounded-xl transition-shadow hover:ring-1 hover:ring-primary/40 hover:ring-offset-4 hover:ring-offset-background active:cursor-grabbing"
                      : undefined
                  }
                >
                  {editing && (
                    <Button
                      variant="outline"
                      size="icon-xs"
                      className="widget-remove absolute -top-2 -right-2 z-10 rounded-full bg-background opacity-0 transition-opacity group-hover/widget:opacity-100"
                      onClick={() => removeWidget(dashboard.id, w.id)}
                      aria-label="Remove widget"
                    >
                      <X />
                    </Button>
                  )}
                  <div
                    className={
                      editing
                        ? "h-full overflow-hidden rounded-xl *:pointer-events-none [&>[data-slot=card]]:h-full"
                        : "h-full overflow-auto [&>[data-slot=card]]:h-full"
                    }
                  >
                    {renderWidget(w)}
                  </div>
                </div>
              ))}
            </ReactGridLayout>
          </div>
        )
      )}
    </div>
  );
}
