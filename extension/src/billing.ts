import ExtPay from 'extpay';

import { BillingStatus, statusFromUser, TRIAL_DAYS } from './billingStatus';

/**
 * ExtensionPay (Stripe) billing. Set VITE_EXTPAY_ID to the extension id registered on
 * extensionpay.com; without it, billing is simulated so the paywall can be built and tested.
 */

const EXTPAY_ID = import.meta.env.VITE_EXTPAY_ID;
export const isMockBilling = !EXTPAY_ID;

// ExtensionPay recommends a fresh instance per use, since service worker callbacks can lose it.
const extpay = () => ExtPay(EXTPAY_ID!);

export type Plan = {
  id: string;
  nickname: string | null;
  title: string;
  price: string;
  /** null for one-time purchases */
  period: string | null;
  badge: string | null;
};

/** 'done': Pro right now (mock). 'opened': ExtensionPay opened checkout and will report back through the background. */
export type CheckoutResult = 'done' | 'opened';

const MOCK_PLANS: Plan[] = [
  { id: 'annual', nickname: null, title: 'Yearly', price: '$24.99', period: 'year', badge: 'Save 65%' },
  { id: 'monthly', nickname: null, title: 'Monthly', price: '$5.99', period: 'month', badge: null },
];

const INTERVAL_ORDER = { year: 0, month: 1, once: 2 } as const;

export async function getPlans(): Promise<Plan[]> {
  if (isMockBilling) return MOCK_PLANS;
  const plans = await extpay().getPlans();
  return [...plans]
    .sort((a, b) => INTERVAL_ORDER[a.interval] - INTERVAL_ORDER[b.interval])
    .map((p, i) => ({
      id: p.nickname ? String(p.nickname) : `${p.interval}-${i}`,
      nickname: p.nickname ? String(p.nickname) : null,
      title: p.interval === 'year' ? 'Yearly' : p.interval === 'month' ? 'Monthly' : 'Lifetime',
      price: new Intl.NumberFormat('en-US', { style: 'currency', currency: p.currency.toUpperCase() }).format(
        p.unitAmountCents / 100,
      ),
      period: p.interval === 'once' ? null : p.interval,
      badge: null,
    }));
}

/** Null with mock billing, where the stored isPro flag is the only source of truth. */
export async function getStatus(): Promise<BillingStatus | null> {
  if (isMockBilling) return null;
  return statusFromUser(await extpay().getUser());
}

export async function checkout(plan: Plan): Promise<CheckoutResult> {
  if (isMockBilling) return 'done';
  await extpay().openPaymentPage(plan.nickname ?? undefined);
  return 'opened';
}

/** ExtensionPay's trial page only asks for an email, no card. */
export async function startTrial(): Promise<CheckoutResult> {
  if (isMockBilling) return 'done';
  await extpay().openTrialPage(`${TRIAL_DAYS}-day`);
  return 'opened';
}

/** Email login for people who already paid (new browser, reinstall). */
export async function restorePurchase(): Promise<CheckoutResult | 'none'> {
  if (isMockBilling) return 'none';
  await extpay().openLoginPage();
  return 'opened';
}

/** Stripe's page to change card, switch plan or cancel. */
export async function manageSubscription(): Promise<void> {
  if (!isMockBilling) await extpay().openPaymentPage();
}

/** Call once at the top level of the service worker. */
export function startBillingBackground(onChange: () => void): void {
  if (isMockBilling) return;
  const instance = extpay();
  instance.startBackground();
  instance.onPaid.addListener(onChange);
  instance.onTrialStarted.addListener(onChange);
}
