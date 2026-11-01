import { createLocalStore } from "@/lib/local-store";
import { SCANS } from "@/config/scans";
import { RANKINGS } from "@/config/rankings";

export type WidgetType = "scan" | "ranking" | "monitor";

export interface Widget {
  id: string;
  type: WidgetType;
  /** Scan or ranking id. Unused for monitor. */
  refId?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
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
    { id: "monitor", type: "monitor" as const },
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
  mapDashboard(dashboardId, (d) => ({
    ...d,
    widgets: [...d.widgets, { id: uid("w"), type, refId }],
  }));
}

export function removeWidget(dashboardId: string, widgetId: string): void {
  mapDashboard(dashboardId, (d) => ({
    ...d,
    widgets: d.widgets.filter((w) => w.id !== widgetId),
  }));
}

export function moveWidget(
  dashboardId: string,
  widgetId: string,
  delta: -1 | 1,
): void {
  mapDashboard(dashboardId, (d) => {
    const i = d.widgets.findIndex((w) => w.id === widgetId);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= d.widgets.length) return d;
    const widgets = [...d.widgets];
    [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
    return { ...d, widgets };
  });
}
