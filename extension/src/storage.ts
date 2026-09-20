import { normalizeState } from '../../src/state/actions';
import type { AppState } from '../../src/state/types';

export const STORAGE_KEY = 'gatie/state/v1';

export const fromStorage = (raw: unknown): AppState => normalizeState(raw as Partial<AppState> | undefined);

export async function loadState(): Promise<AppState> {
  const { [STORAGE_KEY]: raw } = await chrome.storage.local.get(STORAGE_KEY);
  const state = fromStorage(raw);
  // Persist the first load so trackingSince doesn't move every time.
  if (raw == null) await saveState(state);
  return state;
}

export const saveState = (state: AppState) => chrome.storage.local.set({ [STORAGE_KEY]: state });
