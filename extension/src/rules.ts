import type { AppState } from '../../src/state/types';
import { findSite } from './sites';

const dnr = chrome.declarativeNetRequest;

export const gateUrl = (siteId: string, to: string) =>
  `${chrome.runtime.getURL('gate.html')}?site=${encodeURIComponent(siteId)}&to=${to}`;

export const isOpen = (state: AppState, siteId: string, now = Date.now()) =>
  (state.temporaryUnlocks[siteId] ?? 0) > now;

/**
 * Rebuilds the dynamic redirect rules so every blocked, not-currently-unlocked site sends top-level
 * navigations to the gate. The original URL is appended raw as the last query param (`to=`).
 */
export async function syncRules(state: AppState, now = Date.now()): Promise<void> {
  const addRules = state.blockedAppIds
    .filter((id) => !isOpen(state, id, now))
    .map((id, i): chrome.declarativeNetRequest.Rule => ({
      id: i + 1,
      priority: 1,
      action: {
        type: dnr.RuleActionType.REDIRECT,
        redirect: { regexSubstitution: gateUrl(id, '\\0') },
      },
      condition: {
        regexFilter: '^.+$',
        requestDomains: [findSite(id).domain],
        resourceTypes: [dnr.ResourceType.MAIN_FRAME],
      },
    }));

  const existing = await dnr.getDynamicRules();
  await dnr.updateDynamicRules({ removeRuleIds: existing.map((r) => r.id), addRules });
}
