"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RULE_INDICATORS } from "@/config/indicators";
import { TIMEFRAMES } from "@/types/candle";
import type { Timeframe } from "@/types/candle";
import type {
  Condition,
  Operator,
  ScanDefinition,
  TradeSide,
} from "@/types/scans";

const OPERATORS: Operator[] = [">", "<", ">=", "<=", "="];

const NEW_CONDITION: Condition = {
  indicator: "RSI_14",
  timeframe: "1h",
  operator: ">",
  value: 70,
};

interface ScanEditorProps {
  /** Scan to edit; omit for a new one. */
  scan?: ScanDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (scan: ScanDefinition) => void;
  newId: () => string;
}

export function ScanEditor({
  scan,
  open,
  onOpenChange,
  onSave,
  newId,
}: ScanEditorProps) {
  const [name, setName] = useState(scan?.name ?? "");
  const [description, setDescription] = useState(scan?.description ?? "");
  const [conditions, setConditions] = useState<Condition[]>(
    scan?.conditions ?? [NEW_CONDITION],
  );
  const [side, setSide] = useState<TradeSide | "none">(
    scan?.tradeIdea?.side ?? "none",
  );
  const [rationale, setRationale] = useState(scan?.tradeIdea?.rationale ?? "");
  const [sound, setSound] = useState(scan?.notification?.soundEnabled ?? true);

  const valid =
    name.trim() !== "" &&
    conditions.length > 0 &&
    conditions.every((c) => Number.isFinite(c.value));

  function patchCondition(i: number, patch: Partial<Condition>) {
    setConditions((list) =>
      list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    );
  }

  function handleSave() {
    onSave({
      ...scan,
      id: scan?.id ?? newId(),
      name: name.trim(),
      description: description.trim() || undefined,
      conditions,
      tradeIdea:
        side === "none"
          ? undefined
          : { side, rationale: rationale.trim() || `${side} setup` },
      notification: { soundEnabled: sound },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{scan ? "Edit scan" : "New scan"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="scan-name">Name</Label>
            <Input
              id="scan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scan-desc">Description</Label>
            <Input
              id="scan-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Conditions (all must match)</Label>
            {conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <NativeSelect
                  value={c.indicator}
                  onChange={(e) =>
                    patchCondition(i, { indicator: e.target.value })
                  }
                  aria-label="Indicator"
                >
                  {RULE_INDICATORS.map((id) => (
                    <NativeSelectOption key={id} value={id}>
                      {id}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={c.timeframe}
                  onChange={(e) =>
                    patchCondition(i, {
                      timeframe: e.target.value as Timeframe,
                    })
                  }
                  aria-label="Timeframe"
                >
                  {TIMEFRAMES.map((tf) => (
                    <NativeSelectOption key={tf} value={tf}>
                      {tf}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <NativeSelect
                  value={c.operator}
                  onChange={(e) =>
                    patchCondition(i, { operator: e.target.value as Operator })
                  }
                  aria-label="Operator"
                >
                  {OPERATORS.map((op) => (
                    <NativeSelectOption key={op} value={op}>
                      {op}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Input
                  type="number"
                  step="any"
                  className="w-24"
                  value={Number.isFinite(c.value) ? c.value : ""}
                  onChange={(e) =>
                    patchCondition(i, {
                      value: e.target.value === "" ? NaN : Number(e.target.value),
                    })
                  }
                  aria-label="Value"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={conditions.length === 1}
                  onClick={() =>
                    setConditions((list) => list.filter((_, idx) => idx !== i))
                  }
                  aria-label="Remove condition"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConditions((l) => [...l, NEW_CONDITION])}
            >
              <Plus /> Add condition
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <div className="space-y-1.5">
              <Label>Trade idea</Label>
              <NativeSelect
                value={side}
                onChange={(e) => setSide(e.target.value as TradeSide | "none")}
                className="w-full"
              >
                <NativeSelectOption value="none">None</NativeSelectOption>
                <NativeSelectOption value="long">Long</NativeSelectOption>
                <NativeSelectOption value="short">Short</NativeSelectOption>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scan-rationale">Rationale</Label>
              <Input
                id="scan-rationale"
                value={rationale}
                disabled={side === "none"}
                onChange={(e) => setRationale(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={sound} onCheckedChange={setSound} id="scan-sound" />
            <Label htmlFor="scan-sound">Sound on new match</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
