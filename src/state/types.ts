export type ReflectionOutcome = 'unlocked' | 'walked_away';

export type ReflectionDraft = {
  appId: string;
  item: string;
  reasonsFor: [string, string];
  reasonAgainst: string;
  cost: number | null;
};

/** A reflection that has been written and is sitting out its wait. Persisted so closing the app doesn't reset the timer. */
export type PendingUnlock = ReflectionDraft & {
  waitEndsAt: number;
};

export type ReflectionEntry = ReflectionDraft & {
  id: string;
  createdAt: number;
  outcome: ReflectionOutcome;
};

export type Settings = {
  waitMinutes: number;
  hourlyWage: number | null;
  notificationsEnabled: boolean;
};

export type AppState = {
  hasOnboarded: boolean;
  trackingSince: number;
  blockedAppIds: string[];
  settings: Settings;
  reflections: ReflectionEntry[];
  pendingUnlock: PendingUnlock | null;
  /** appId -> timestamp the temporary unlock expires */
  temporaryUnlocks: Record<string, number>;
  /** Cached entitlement; RevenueCat is the source of truth when configured. */
  isPro: boolean;
};
