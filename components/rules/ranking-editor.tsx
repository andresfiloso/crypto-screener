"use client";

import { useState } from "react";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { RULE_INDICATORS } from "@/config/indicators";
import { TIMEFRAMES } from "@/types/candle";
import type { Timeframe } from "@/types/candle";
import type { CombinedRankingDefinition } from "@/types/scans";

interface RankingEditorProps {
  ranking?: CombinedRankingDefinition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (ranking: CombinedRankingDefinition) => void;
  newId: () => string;
}

export function RankingEditor({
  ranking,
  open,
  onOpenChange,
  onSave,
  newId,
}: RankingEditorProps) {
  const [name, setName] = useState(ranking?.name ?? "");
  const [indicator, setIndicator] = useState(ranking?.indicator ?? "RSI_14");
  const [timeframe, setTimeframe] = useState<Timeframe>(
    ranking?.timeframe ?? "1h",
  );
  const [limit, setLimit] = useState(ranking?.limit ?? 5);

  const valid = name.trim() !== "" && Number.isInteger(limit) && limit > 0;

  function handleSave() {
    onSave({
      ...ranking,
      id: ranking?.id ?? newId(),
      name: name.trim(),
      indicator,
      timeframe,
      limit,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{ranking ? "Edit ranking" : "New ranking"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rank-name">Name</Label>
            <Input
              id="rank-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Indicator</Label>
              <NativeSelect
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                className="w-full"
              >
                {RULE_INDICATORS.map((id) => (
                  <NativeSelectOption key={id} value={id}>
                    {id}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Timeframe</Label>
              <NativeSelect
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full"
              >
                {TIMEFRAMES.map((tf) => (
                  <NativeSelectOption key={tf} value={tf}>
                    {tf}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rank-limit">Entries per side</Label>
            <Input
              id="rank-limit"
              type="number"
              min={1}
              max={20}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            />
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
