import { useEffect, useState } from 'react';

import type { BillingStatus } from './billingStatus';
import { BILLING_KEY, syncEntitlement } from './entitlement';

/**
 * Cached subscription status, refreshed on mount and whenever the page regains focus
 * (e.g. coming back from the checkout tab). Null with mock billing or before the first sync.
 */
export function useBilling(): BillingStatus | null {
  const [status, setStatus] = useState<BillingStatus | null>(null);

  useEffect(() => {
    let alive = true;
    chrome.storage.local.get(BILLING_KEY).then((r) => alive && setStatus((r[BILLING_KEY] as BillingStatus) ?? null));

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[BILLING_KEY]) setStatus((changes[BILLING_KEY].newValue as BillingStatus) ?? null);
    };
    const refresh = () => void syncEntitlement();

    chrome.storage.onChanged.addListener(onChanged);
    window.addEventListener('focus', refresh);
    refresh();

    return () => {
      alive = false;
      chrome.storage.onChanged.removeListener(onChanged);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return status;
}
