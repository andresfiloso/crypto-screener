"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny localStorage-backed store with a React hook. All persisted user config
 * (symbols, rules, dashboards) goes through this so a later DB adapter only
 * needs to replace this file.
 *
 * Server and first client render use `defaultValue`, so hydration is safe.
 */
export function createLocalStore<T>(key: string, defaultValue: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cached: T = defaultValue;

  function read(): T {
    if (typeof window === "undefined") return defaultValue;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {}
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
      cached = raw ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      cached = defaultValue;
    }
    return cached;
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  function write(next: T) {
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
    emit();
  }

  /** Drop the stored value so the default applies again. */
  function reset() {
    try {
      localStorage.removeItem(key);
    } catch {}
    emit();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, read, () => defaultValue);
  }

  return {
    read,
    write,
    reset,
    update: (fn: (current: T) => T) => write(fn(read())),
    useValue,
  };
}
