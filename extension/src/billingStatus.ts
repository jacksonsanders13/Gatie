/** What the extension needs to know about a subscription, derived from ExtensionPay's user record. */
export type BillingStatus = {
  isPro: boolean;
  /** Paid and in good standing (may still be set to cancel at period end). */
  paid: boolean;
  /** Never started a trial and never paid. */
  trialAvailable: boolean;
  /** When the current free trial ends; null if not in a trial. */
  trialEndsAt: number | null;
  /** When a paid subscription is set to end; null if it renews. */
  cancelAt: number | null;
  /** Last renewal payment failed. */
  pastDue: boolean;
};

export const TRIAL_DAYS = 7;

const DAY = 86_400_000;

type UserLike = {
  paid: boolean;
  trialStartedAt: Date | null;
  subscriptionStatus?: 'active' | 'past_due' | 'canceled';
  subscriptionCancelAt?: Date | null;
};

/** ExtensionPay only records when a trial started; the trial length is ours to enforce. */
export function statusFromUser(user: UserLike, now = Date.now()): BillingStatus {
  const trialStart = user.trialStartedAt?.getTime() ?? null;
  const trialEnd = trialStart != null ? trialStart + TRIAL_DAYS * DAY : null;
  const inTrial = trialEnd != null && now < trialEnd;

  return {
    isPro: user.paid || inTrial,
    paid: user.paid,
    trialAvailable: trialStart == null && !user.paid,
    trialEndsAt: inTrial && !user.paid ? trialEnd : null,
    cancelAt: user.paid ? (user.subscriptionCancelAt?.getTime() ?? null) : null,
    pastDue: user.subscriptionStatus === 'past_due',
  };
}
