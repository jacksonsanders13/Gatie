import type { AppState } from '../../src/state/types';
import { gateUrl, isOpen, syncRules } from './rules';
import { findSite } from './sites';
import { loadState, STORAGE_KEY } from './storage';

const RELOCK_PREFIX = 'relock:';

async function refresh(): Promise<AppState> {
  const state = await loadState();
  await syncRules(state);
  const now = Date.now();
  for (const [siteId, until] of Object.entries(state.temporaryUnlocks)) {
    if (until > now) chrome.alarms.create(RELOCK_PREFIX + siteId, { when: until });
  }
  return state;
}

/** When an unlock window ends, send any tabs still on that site back to the gate, even mid-scroll. */
async function relockTabs(siteId: string) {
  const state = await refresh();
  if (!state.blockedAppIds.includes(siteId) || isOpen(state, siteId)) return;
  const tabs = await chrome.tabs.query({ url: `*://*.${findSite(siteId).domain}/*` });
  await Promise.all(
    tabs.map((tab) => (tab.id != null && tab.url ? chrome.tabs.update(tab.id, { url: gateUrl(siteId, tab.url) }) : null)),
  );
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await refresh();
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  }
});

chrome.runtime.onStartup.addListener(() => void refresh());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && STORAGE_KEY in changes) void refresh();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith(RELOCK_PREFIX)) void relockTabs(alarm.name.slice(RELOCK_PREFIX.length));
});
