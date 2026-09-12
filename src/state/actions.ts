import type {
  AppState,
  QuickIntent,
  ReflectionDraft,
  ReflectionEntry,
  ReflectionOutcome,
  Settings,
  UnlockIntent,
} from './types';

export const DEFAULT_WAIT_MINUTES = 4;
export const WAIT_OPTIONS = [2, 3, 4, 5, 7, 10];
export const FREE_APP_LIMIT = 1;
export const BROWSE_UNLOCKS_PER_DAY = 2;

/** How long a blocked app stays open after each kind of unlock. */
export const UNLOCK_WINDOWS: Record<UnlockIntent, number> = { buying: 15, browsing: 10, checking: 5 };

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

export const emptyDraft = (appId: string, item = ''): ReflectionDraft => ({
  appId,
  item,
  reasonsFor: ['', ''],
  reasonAgainst: '',
  cost: null,
});

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

function addEntry(s: AppState, entry: ReflectionEntry): AppState {
  const temporaryUnlocks =
    entry.outcome === 'unlocked'
      ? { ...s.temporaryUnlocks, [entry.appId]: entry.createdAt + UNLOCK_WINDOWS[entry.intent] * MINUTE }
      : s.temporaryUnlocks;
  return {
    ...s,
    reflections: [entry, ...s.reflections],
    pendingUnlock: s.pendingUnlock?.appId === entry.appId ? null : s.pendingUnlock,
    temporaryUnlocks,
  };
}

const makeEntry = (
  draft: ReflectionDraft,
  intent: UnlockIntent,
  outcome: ReflectionOutcome,
  now: number,
): ReflectionEntry => ({
  ...draft,
  id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: now,
  intent,
  outcome,
  boughtSomething: null,
});

/** Ends a buying reflection, either by going in or walking away. */
export const resolveReflection = (
  s: AppState,
  draft: ReflectionDraft,
  outcome: ReflectionOutcome,
  now = Date.now(),
): AppState => addEntry(s, makeEntry(draft, 'buying', outcome, now));

/** Browsing / checking an order: no reflection or wait, a shorter window, and a check-in afterwards. */
export const quickUnlock = (
  s: AppState,
  appId: string,
  intent: QuickIntent,
  note = '',
  now = Date.now(),
): AppState => addEntry(s, makeEntry(emptyDraft(appId, note.trim()), intent, 'unlocked', now));

export const answerCheckIn = (s: AppState, entryId: string, bought: boolean): AppState => ({
  ...s,
  reflections: s.reflections.map((r) => (r.id === entryId ? { ...r, boughtSomething: bought } : r)),
});
