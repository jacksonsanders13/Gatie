import type { AppState, ReflectionDraft } from './types';

const DAY = 86_400_000;

/** Minimum non-whitespace characters per reason, so a single keystroke doesn't count as reflecting. */
export const MIN_REASON_LENGTH = 3;

const filled = (text: string) => text.trim().length >= MIN_REASON_LENGTH;

export const isReflectionComplete = (d: ReflectionDraft): boolean =>
  d.reasonsFor.every(filled) && filled(d.reasonAgainst);

export function daysSinceGaveIn(s: AppState, now = Date.now()): number {
  const lastGaveIn = s.reflections.find((r) => r.outcome === 'unlocked')?.createdAt;
  return Math.max(0, Math.floor((now - (lastGaveIn ?? s.trackingSince)) / DAY));
}

export const moneyNotSpent = (s: AppState): number =>
  s.reflections.reduce((sum, r) => (r.outcome === 'walked_away' && r.cost ? sum + r.cost : sum), 0);

export const walkAwayCount = (s: AppState): number =>
  s.reflections.filter((r) => r.outcome === 'walked_away').length;

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
