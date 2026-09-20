export type PaywallReason = 'sites' | 'stats' | 'wait';

export const openPaywall = (reason?: PaywallReason) =>
  chrome.tabs.create({ url: chrome.runtime.getURL(`paywall.html${reason ? `?reason=${reason}` : ''}`) });

export async function closeCurrentTab() {
  const tab = await chrome.tabs.getCurrent();
  if (tab?.id != null) await chrome.tabs.remove(tab.id);
}
