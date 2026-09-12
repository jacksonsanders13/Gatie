export type ReflectionOutcome = 'unlocked' | 'walked_away';

/** Why the user is opening a blocked app. Buying gets the full reflection; the others are lighter and followed up with a check-in. */
export type UnlockIntent = 'buying' | 'browsing' | 'checking';
export type QuickIntent = Exclude<UnlockIntent, 'buying'>;

export type ReflectionDraft = {
  appId: string;
  /** For buying: what they're buying. For browsing: what they're looking for. */
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
  intent: UnlockIntent;
  outcome: ReflectionOutcome;
  /** Check-in answer for browsing/checking unlocks; null until answered (and always null for buying). */
  boughtSomething: boolean | null;
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
