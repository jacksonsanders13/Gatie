import { setPro } from '../../src/state/actions';
import { getStatus } from './billing';
import type { BillingStatus } from './billingStatus';
import { loadState, saveState } from './storage';

export const BILLING_KEY = 'gatie/billing/v1';

/**
 * Pulls subscription status from ExtensionPay, caches it, and mirrors isPro into app state.
 * No-op with mock billing. If ExtensionPay can't be reached, the last known state stands.
 */
export async function syncEntitlement(): Promise<BillingStatus | null> {
  let status: BillingStatus | null;
  try {
    status = await getStatus();
  } catch (e) {
    console.warn('Gatie: could not reach ExtensionPay', e);
    return null;
  }
  if (!status) return null;

  await chrome.storage.local.set({ [BILLING_KEY]: status });
  const state = await loadState();
  if (state.isPro !== status.isPro) await saveState(setPro(state, status.isPro));
  return status;
}
