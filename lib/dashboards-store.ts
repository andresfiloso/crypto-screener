import { createLocalStore } from "@/lib/local-store";
import { SCANS } from "@/config/scans";
import { RANKINGS } from "@/config/rankings";

export type WidgetType = "scan" | "ranking" | "monitor";

export const GRID_COLS = 12;

export interface Widget {
  id: string;
  type: WidgetType;
  /** Scan id, ranking id, or monitored symbol. Missing on legacy monitor widgets. */
  refId?: string;
  /** Grid position and size in cells. Missing on legacy data; see ensureLayout. */
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  /** Compact widgets upward automatically. Undefined means on. */
  autoLayout?: boolean;
}

export type PlacedWidget = Widget & { x: number; y: number; w: number; h: number };

const DEFAULT_SIZE: Record<WidgetType, { w: number; h: number }> = {
  scan: { w: 4, h: 5 },
  ranking: { w: 4, h: 8 },
  monitor: { w: 4, h: 11 },
};

/** Give every widget a position, flowing left-to-right then wrapping. */
export function ensureLayout(widgets: Widget[]): PlacedWidget[] {
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  return widgets.map((widget) => {
    const size = DEFAULT_SIZE[widget.type];
    const w = widget.w ?? size.w;
    const h = widget.h ?? size.h;
    if (widget.x !== undefined && widget.y !== undefined) {
      return { ...widget, x: widget.x, y: widget.y, w, h };
    }
    if (cx + w > GRID_COLS) {
      cx = 0;
      cy += rowH;
      rowH = 0;
    }
    const placed = { ...widget, x: cx, y: cy, w, h };
    cx += w;
    rowH = Math.max(rowH, h);
    return placed;
  });
}

export interface DashboardsConfig {
  activeId: string;
  dashboards: Dashboard[];
}

const DEFAULT_DASHBOARD: Dashboard = {
  id: "default",
  name: "Main",
  widgets: [
    ...SCANS.map((s) => ({
      id: `scan-${s.id}`,
      type: "scan" as const,
      refId: s.id,
    })),
    ...RANKINGS.map((r) => ({
      id: `ranking-${r.id}`,
      type: "ranking" as const,
      refId: r.id,
    })),
  ],
};

const DEFAULT_CONFIG: DashboardsConfig = {
  activeId: DEFAULT_DASHBOARD.id,
  dashboards: [DEFAULT_DASHBOARD],
};

const store = createLocalStore<DashboardsConfig>(
  "crypto-screener:dashboards-v1",
  DEFAULT_CONFIG,
);

export const useDashboards = store.useValue;
export const resetDashboards = store.reset;

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function mapDashboard(id: string, fn: (d: Dashboard) => Dashboard) {
  store.update((c) => ({
    ...c,
    dashboards: c.dashboards.map((d) => (d.id === id ? fn(d) : d)),
  }));
}

export function setActiveDashboard(id: string): void {
  store.update((c) => ({ ...c, activeId: id }));
}

export function createDashboard(name: string): void {
  const dashboard: Dashboard = { id: uid("dash"), name, widgets: [] };
  store.update((c) => ({
    activeId: dashboard.id,
    dashboards: [...c.dashboards, dashboard],
  }));
}

export function renameDashboard(id: string, name: string): void {
  mapDashboard(id, (d) => ({ ...d, name }));
}

export function deleteDashboard(id: string): void {
  store.update((c) => {
    if (c.dashboards.length <= 1) return c;
    const dashboards = c.dashboards.filter((d) => d.id !== id);
    return {
      dashboards,
      activeId: c.activeId === id ? dashboards[0].id : c.activeId,
    };
  });
}

export function addWidget(
  dashboardId: string,
  type: WidgetType,
  refId?: string,
): void {
  mapDashboard(dashboardId, (d) => appendWidget(d, type, refId));
}

export function removeWidget(dashboardId: string, widgetId: string): void {
  mapDashboard(dashboardId, (d) => ({
    ...d,
    widgets: d.widgets.filter((w) => w.id !== widgetId),
  }));
}

export interface WidgetRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function setLayout(dashboardId: string, rects: WidgetRect[]): void {
  mapDashboard(dashboardId, (d) => ({
    ...d,
    widgets: d.widgets.map((widget) => {
      const r = rects.find((x) => x.id === widget.id);
      return r ? { ...widget, x: r.x, y: r.y, w: r.w, h: r.h } : widget;
    }),
  }));
}

export function setAutoLayout(dashboardId: string, autoLayout: boolean): void {
  mapDashboard(dashboardId, (d) => ({ ...d, autoLayout }));
}

function appendWidget(
  d: Dashboard,
  type: WidgetType,
  refId: string | undefined,
): Dashboard {
  const placed = ensureLayout(d.widgets);
  const bottom = placed.reduce((m, w) => Math.max(m, w.y + w.h), 0);
  return {
    ...d,
    widgets: [
      ...placed,
      { id: uid("w"), type, refId, x: 0, y: bottom, ...DEFAULT_SIZE[type] },
    ],
  };
}

/** Put a newly monitored symbol on the active dashboard (once). */
export function addMonitorWidgetToActive(symbol: string): void {
  store.update((c) => ({
    ...c,
    dashboards: c.dashboards.map((d) =>
      d.id !== c.activeId ||
      d.widgets.some((w) => w.type === "monitor" && w.refId === symbol)
        ? d
        : appendWidget(d, "monitor", symbol),
    ),
  }));
}

/** Drop every widget of a symbol that is no longer monitored. */
export function removeMonitorWidgets(symbol: string): void {
  store.update((c) => ({
    ...c,
    dashboards: c.dashboards.map((d) => ({
      ...d,
      widgets: d.widgets.filter(
        (w) => !(w.type === "monitor" && w.refId === symbol),
      ),
    })),
  }));
}

/** Replace the old single "all monitors" widget by one widget per symbol. */
export function expandLegacyMonitor(
  dashboardId: string,
  symbols: string[],
): void {
  mapDashboard(dashboardId, (d) => {
    const legacy = d.widgets.filter((w) => w.type === "monitor" && !w.refId);
    if (legacy.length === 0) return d;
    let next: Dashboard = {
      ...d,
      widgets: d.widgets.filter((w) => !legacy.includes(w)),
    };
    for (const symbol of symbols) {
      if (!next.widgets.some((w) => w.type === "monitor" && w.refId === symbol)) {
        next = appendWidget(next, "monitor", symbol);
      }
    }
    return next;
  });
}
