import { useCallback, useEffect, useState } from 'react';

import type { AppState } from '../../src/state/types';
import { fromStorage, loadState, saveState, STORAGE_KEY } from './storage';

export type Update = (fn: (s: AppState) => AppState) => Promise<AppState>;

/** App state from chrome.storage, kept live across the popup, gate, and dashboard. Null until loaded. */
export function useAppState(): { state: AppState | null; update: Update } {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    let alive = true;
    loadState().then((s) => alive && setState(s));
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[STORAGE_KEY]) setState(fromStorage(changes[STORAGE_KEY].newValue));
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => {
      alive = false;
      chrome.storage.onChanged.removeListener(onChanged);
    };
  }, []);

  const update = useCallback<Update>(async (fn) => {
    const next = fn(await loadState());
    setState(next);
    await saveState(next);
    return next;
  }, []);

  return { state, update };
}

/** Current time, re-rendering every `intervalMs` while `active`. */
export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
