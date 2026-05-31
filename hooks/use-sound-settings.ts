"use client";

import { useState, useCallback } from "react";

const MASTER_KEY = "crypto-screener:master-sound";
const OVERRIDES_KEY = "crypto-screener:scan-sound-overrides";

function readMaster(): boolean {
  try {
    const raw = localStorage.getItem(MASTER_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function readOverrides(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/**
 * Manages master and per-scan sound-enabled state backed by localStorage.
 *
 * Per-scan defaults (from ScanDefinition.notification.soundEnabled) are
 * passed into `isScanSoundEnabled` so that overrides only need to be stored
 * when they differ from the default.
 */
export function useSoundSettings() {
  const [masterSoundEnabled, setMasterState] = useState<boolean>(readMaster);
  const [overrides, setOverridesState] =
    useState<Record<string, boolean>>(readOverrides);

  const toggleMasterSound = useCallback(() => {
    setMasterState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MASTER_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const isScanSoundEnabled = useCallback(
    (scanId: string, defaultEnabled = true): boolean => {
      return masterSoundEnabled && (overrides[scanId] ?? defaultEnabled);
    },
    [masterSoundEnabled, overrides],
  );

  const toggleScanSound = useCallback(
    (scanId: string, defaultEnabled = true) => {
      setOverridesState((prev) => {
        const current = prev[scanId] ?? defaultEnabled;
        const next = { ...prev, [scanId]: !current };
        try {
          localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [],
  );

  return {
    masterSoundEnabled,
    toggleMasterSound,
    isScanSoundEnabled,
    toggleScanSound,
  };
}
