"use client";

import { useState } from "react";
import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MAX_SYMBOLS,
  SYMBOL_PATTERN,
  addSymbol,
  normalizeSymbol,
  removeSymbol,
  resetSymbols,
  symbolExists,
  useSymbols,
} from "@/lib/symbols-store";

export function SymbolManager() {
  const symbols = useSymbols();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const symbol = normalizeSymbol(input);
    if (!symbol) return;
    if (!SYMBOL_PATTERN.test(symbol)) {
      setError("Use Binance pair format, e.g. BTCUSDT");
      return;
    }
    if (symbols.includes(symbol)) {
      setError(`${symbol} already tracked`);
      return;
    }
    if (symbols.length >= MAX_SYMBOLS) {
      setError(`Max ${MAX_SYMBOLS} symbols`);
      return;
    }
    setChecking(true);
    const ok = await symbolExists(symbol);
    setChecking(false);
    if (!ok) {
      setError(`${symbol} not found on Binance spot`);
      return;
    }
    addSymbol(symbol);
    setInput("");
    setError(null);
  }

  return (
    <section className="mb-8 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">
          Tracked symbols{" "}
          <span className="text-xs text-muted-foreground">
            ({symbols.length}/{MAX_SYMBOLS})
          </span>
        </h2>
        <Button variant="ghost" size="sm" onClick={resetSymbols}>
          <RotateCcw /> Reset to defaults
        </Button>
      </div>
      <form onSubmit={handleAdd} className="flex max-w-sm gap-2">
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          placeholder="BTCUSDT"
          aria-label="Symbol"
          aria-invalid={error ? true : undefined}
        />
        <Button type="submit" disabled={checking || !input.trim()}>
          <Plus /> {checking ? "Checking…" : "Add"}
        </Button>
      </form>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {symbols.map((symbol) => (
          <Badge key={symbol} variant="secondary" className="gap-1 pr-1">
            {symbol}
            <button
              onClick={() => removeSymbol(symbol)}
              aria-label={`Remove ${symbol}`}
              className="rounded p-0.5 hover:bg-background/60"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {symbols.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No symbols. Add one to start.
          </p>
        )}
      </div>
    </section>
  );
}
