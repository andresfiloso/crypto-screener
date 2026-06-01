"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { SlidersHorizontal } from "lucide-react";
import type { SymbolState } from "@/types/symbol";
import { columns } from "./columns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SymbolTableProps {
  data: SymbolState[];
}

const ALL_TOGGLEABLE_COLUMNS = [
  "rsi_5m",
  "rsi_15m",
  "rsi_1h",
  "rsi_4h",
  "rsi_1d",
  "ema20_5m",
  "ema50_5m",
  "ema200_5m",
  "ema20_15m",
  "ema50_15m",
  "ema200_15m",
  "ema20_1h",
  "ema50_1h",
  "ema200_1h",
  "ema20_4h",
  "ema50_4h",
  "ema200_4h",
  "ema20_1d",
  "ema50_1d",
  "ema200_1d",
  "macd_5m",
  "macd_15m",
  "macd_1h",
  "macd_4h",
  "macd_1d",
];

const COLUMN_GROUPS: { label: string; ids: string[] }[] = [
  {
    label: "5m",
    ids: ["rsi_5m", "ema20_5m", "ema50_5m", "ema200_5m", "macd_5m"],
  },
  {
    label: "15m",
    ids: ["rsi_15m", "ema20_15m", "ema50_15m", "ema200_15m", "macd_15m"],
  },
  {
    label: "1h",
    ids: ["rsi_1h", "ema20_1h", "ema50_1h", "ema200_1h", "macd_1h"],
  },
  {
    label: "4h",
    ids: ["rsi_4h", "ema20_4h", "ema50_4h", "ema200_4h", "macd_4h"],
  },
  {
    label: "1d",
    ids: ["rsi_1d", "ema20_1d", "ema50_1d", "ema200_1d", "macd_1d"],
  },
];

const PRESETS: { label: string; columns: string[] }[] = [
  {
    label: "Overview",
    columns: [
      "rsi_5m",
      "rsi_15m",
      "rsi_1h",
      "rsi_4h",
      "ema20_1h",
      "ema50_1h",
      "ema200_1h",
      "macd_1h",
    ],
  },
  {
    label: "5m",
    columns: ["rsi_5m", "ema20_5m", "ema50_5m", "ema200_5m", "macd_5m"],
  },
  {
    label: "15m",
    columns: ["rsi_15m", "ema20_15m", "ema50_15m", "ema200_15m", "macd_15m"],
  },
  {
    label: "1h",
    columns: ["rsi_1h", "ema20_1h", "ema50_1h", "ema200_1h", "macd_1h"],
  },
  {
    label: "4h",
    columns: ["rsi_4h", "ema20_4h", "ema50_4h", "ema200_4h", "macd_4h"],
  },
  {
    label: "1d",
    columns: ["rsi_1d", "ema20_1d", "ema50_1d", "ema200_1d", "macd_1d"],
  },
];

function makeVisibility(visible: string[]): VisibilityState {
  const visSet = new Set(visible);
  return Object.fromEntries(
    ALL_TOGGLEABLE_COLUMNS.map((id) => [id, visSet.has(id)]),
  );
}

export function SymbolTable({ data }: SymbolTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [activePreset, setActivePreset] = useState("Overview");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => makeVisibility(PRESETS[0].columns),
  );

  function applyPreset(label: string) {
    const preset = PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setColumnVisibility(makeVisibility(preset.columns));
    setActivePreset(label);
  }

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search symbols…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.label)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                activePreset === preset.label
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="size-3.5" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {COLUMN_GROUPS.map((group, gi) => {
              const cols = group.ids
                .map((id) => table.getColumn(id))
                .filter(Boolean);
              return (
                <div key={group.label}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {cols.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col!.id}
                      checked={col!.getIsVisible()}
                      onCheckedChange={(val) => col!.toggleVisibility(val)}
                    >
                      {typeof col!.columnDef.header === "string"
                        ? col!.columnDef.header
                        : col!.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {header.column.getIsSorted() === "asc"
                    ? " ↑"
                    : header.column.getIsSorted() === "desc"
                      ? " ↓"
                      : ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="text-center text-muted-foreground py-8"
              >
                No symbols found
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
