import type { AppState, ReflectionDraft, ReflectionOutcome, Settings } from './types';

export const DEFAULT_WAIT_MINUTES = 4;
export const WAIT_OPTIONS = [2, 3, 4, 5, 7, 10];
export const FREE_APP_LIMIT = 1;
export const UNLOCK_WINDOW_MINUTES = 15;

const MINUTE = 60_000;

export function createInitialState(now = Date.now()): AppState {
  return {
    hasOnboarded: false,
    trackingSince: now,
    blockedAppIds: [],
    settings: {
      waitMinutes: DEFAULT_WAIT_MINUTES,
      hourlyWage: null,
      notificationsEnabled: true,
    },
    reflections: [],
    pendingUnlock: null,
    temporaryUnlocks: {},
    isPro: false,
  };
}

export const completeOnboarding = (s: AppState): AppState => ({ ...s, hasOnboarded: true });

export const setBlockedApps = (s: AppState, blockedAppIds: string[]): AppState => ({ ...s, blockedAppIds });

export const updateSettings = (s: AppState, patch: Partial<Settings>): AppState => ({
  ...s,
  settings: { ...s.settings, ...patch },
});

export const setPro = (s: AppState, isPro: boolean): AppState => ({ ...s, isPro });

/** Custom wait time is a Pro feature; free users always get the default. */
export const effectiveWaitMinutes = (s: AppState): number =>
  s.isPro ? s.settings.waitMinutes : DEFAULT_WAIT_MINUTES;

export function startWait(s: AppState, draft: ReflectionDraft, now = Date.now()): AppState {
  return {
    ...s,
    pendingUnlock: { ...draft, waitEndsAt: now + effectiveWaitMinutes(s) * MINUTE },
  };
}

export function resolveReflection(
  s: AppState,
  draft: ReflectionDraft,
  outcome: ReflectionOutcome,
  now = Date.now(),
): AppState {
  const entry = { ...draft, id: `${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, outcome };
  const temporaryUnlocks =
    outcome === 'unlocked'
      ? { ...s.temporaryUnlocks, [draft.appId]: now + UNLOCK_WINDOW_MINUTES * MINUTE }
      : s.temporaryUnlocks;
  return {
    ...s,
    reflections: [entry, ...s.reflections],
    pendingUnlock: null,
    temporaryUnlocks,
  };
}
