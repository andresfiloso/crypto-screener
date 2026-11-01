"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import {
  addWidget,
  createDashboard,
  deleteDashboard,
  renameDashboard,
  setActiveDashboard,
} from "@/lib/dashboards-store";
import type {
  Dashboard,
  DashboardsConfig,
  WidgetType,
} from "@/lib/dashboards-store";
import type { RulesConfig } from "@/lib/rules-store";

interface DashboardToolbarProps {
  config: DashboardsConfig;
  active: Dashboard;
  rules: RulesConfig;
  editing: boolean;
  onToggleEditing: () => void;
}

function AddWidgetDialog({
  dashboard,
  rules,
  onClose,
}: {
  dashboard: Dashboard;
  rules: RulesConfig;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState("");
  const used = new Set(dashboard.widgets.map((w) => `${w.type}:${w.refId}`));

  const options = [
    ...rules.scans.map((s) => ({
      value: `scan:${s.id}`,
      label: `Scan — ${s.name}`,
    })),
    ...rules.rankings.map((r) => ({
      value: `ranking:${r.id}`,
      label: `Ranking — ${r.name}`,
    })),
    { value: "monitor:", label: "Monitor" },
  ].filter((o) => !used.has(o.value === "monitor:" ? "monitor:undefined" : o.value));

  function handleAdd() {
    const [type, refId] = choice.split(":");
    addWidget(dashboard.id, type as WidgetType, refId || undefined);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add widget</DialogTitle>
        </DialogHeader>
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Everything is already on this dashboard. Create more in Rules.
          </p>
        ) : (
          <NativeSelect
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="w-full"
            aria-label="Widget"
          >
            <NativeSelectOption value="">Select…</NativeSelectOption>
            {options.map((o) => (
              <NativeSelectOption key={o.value} value={o.value}>
                {o.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!choice} onClick={handleAdd}>
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DashboardToolbar({
  config,
  active,
  rules,
  editing,
  onToggleEditing,
}: DashboardToolbarProps) {
  const [adding, setAdding] = useState(false);

  function handleNew() {
    const name = prompt("Dashboard name");
    if (name?.trim()) createDashboard(name.trim());
  }

  function handleRename() {
    const name = prompt("Rename dashboard", active.name);
    if (name?.trim()) renameDashboard(active.id, name.trim());
  }

  function handleDelete() {
    if (confirm(`Delete dashboard "${active.name}"?`)) {
      deleteDashboard(active.id);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1">
        {config.dashboards.map((d) => (
          <button
            key={d.id}
            onClick={() => setActiveDashboard(d.id)}
            className={cn(
              "rounded-lg px-3 py-1 text-sm transition-colors",
              d.id === active.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {d.name}
          </button>
        ))}
        <Button variant="ghost" size="icon-sm" onClick={handleNew} aria-label="New dashboard">
          <Plus />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        {editing && (
          <>
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus /> Add widget
            </Button>
            <Button variant="outline" size="sm" onClick={handleRename}>
              Rename
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={config.dashboards.length <= 1}
              onClick={handleDelete}
            >
              <Trash2 /> Delete
            </Button>
          </>
        )}
        <Button
          variant={editing ? "default" : "outline"}
          size="sm"
          onClick={onToggleEditing}
        >
          {editing ? <Check /> : <Pencil />}
          {editing ? "Done" : "Edit"}
        </Button>
      </div>
      {adding && (
        <AddWidgetDialog
          dashboard={active}
          rules={rules}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
