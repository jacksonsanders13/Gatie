import { BROWSE_UNLOCKS_PER_DAY, UNLOCK_WINDOWS } from './actions';
import type { AppState, QuickIntent, ReflectionDraft, ReflectionEntry } from './types';

const DAY = 86_400_000;

/** Minimum non-whitespace characters per reason, so a single keystroke doesn't count as reflecting. */
export const MIN_REASON_LENGTH = 3;

/** Quick unlocks that turned into purchases within this many recent check-ins switch quick unlocks off. */
const ESCALATION_LOOKBACK = 3;
const ESCALATION_THRESHOLD = 2;

export const isFilled = (text: string) => text.trim().length >= MIN_REASON_LENGTH;

export const isReflectionComplete = (d: ReflectionDraft): boolean =>
  d.reasonsFor.every(isFilled) && isFilled(d.reasonAgainst);

/** Going in to buy counts as giving in; a quick unlock only counts if the check-in says they bought. */
export const gaveIn = (r: ReflectionEntry): boolean =>
  r.intent === 'buying' ? r.outcome === 'unlocked' : r.boughtSomething === true;

export function daysSinceGaveIn(s: AppState, now = Date.now()): number {
  const lastGaveIn = s.reflections.find(gaveIn)?.createdAt;
  return Math.max(0, Math.floor((now - (lastGaveIn ?? s.trackingSince)) / DAY));
}

export function describeEntry(r: ReflectionEntry): string {
  if (r.outcome === 'walked_away') return 'Walked away';
  if (r.intent === 'buying') return 'Went in to buy';
  const base = r.intent === 'browsing' ? 'Browsed' : 'Checked an order';
  return r.boughtSomething ? `${base}, bought something` : base;
}

export const moneyNotSpent =(s: AppState): number =>
  s.reflections.reduce((sum, r) => (r.outcome === 'walked_away' && r.cost ? sum + r.cost : sum), 0);

export const walkAwayCount = (s: AppState): number =>
  s.reflections.filter((r) => r.outcome === 'walked_away').length;

/** The most recent quick unlock, once its window has closed, if nobody has said whether it ended in a purchase. */
export function dueCheckIn(s: AppState, now = Date.now()): ReflectionEntry | null {
  const last = s.reflections.find((r) => r.intent !== 'buying');
  if (!last || last.boughtSomething !== null) return null;
  return last.createdAt + UNLOCK_WINDOWS[last.intent] * 60_000 <= now ? last : null;
}

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const browsesLeftToday = (s: AppState, now = Date.now()): number =>
  Math.max(
    0,
    BROWSE_UNLOCKS_PER_DAY -
      s.reflections.filter((r) => r.intent === 'browsing' && r.createdAt >= startOfDay(now)).length,
  );

/** Why a quick unlock isn't available right now, or null if it is. */
export function quickUnlockBlockedReason(s: AppState, intent: QuickIntent, now = Date.now()): string | null {
  const recent = s.reflections
    .filter((r) => r.intent !== 'buying' && r.boughtSomething !== null && r.createdAt >= now - 7 * DAY)
    .slice(0, ESCALATION_LOOKBACK);
  if (recent.filter((r) => r.boughtSomething).length >= ESCALATION_THRESHOLD) {
    return 'Your last few quick visits ended in a purchase, so it’s the full reflection for this week.';
  }
  if (intent === 'browsing' && browsesLeftToday(s, now) === 0) {
    return `You’ve used today’s ${BROWSE_UNLOCKS_PER_DAY} browses.`;
  }
  return null;
}

export const hoursOfWork = (cost: number | null, hourlyWage: number | null): number | null =>
  cost && hourlyWage ? cost / hourlyWage : null;

export function parseMoney(text: string): number | null {
  const n = Number(text.replace(/[^0-9.]/g, ''));
  return text.trim() && Number.isFinite(n) && n > 0 ? n : null;
}

export const formatMoney = (n: number): string =>
  `$${n.toLocaleString('en-US', { maximumFractionDigits: n < 100 ? 2 : 0 })}`;

export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
