/**
 * Screen Time boundary.
 *
 * Phase 1: a mock with a hard-coded list of shopping apps so every screen can be built and tested in Expo Go.
 * Phase 2: replace these bodies with react-native-device-activity (FamilyControls authorization,
 * ManagedSettings shields, DeviceActivity events). Note that the real picker returns opaque tokens,
 * not app names — the UI should not assume it can display names for blocked apps.
 */

export type BlockableApp = {
  id: string;
  name: string;
  glyph: string;
};

export const MOCK_SHOPPING_APPS: BlockableApp[] = [
  { id: 'amazon', name: 'Amazon', glyph: '📦' },
  { id: 'shein', name: 'Shein', glyph: '👗' },
  { id: 'temu', name: 'Temu', glyph: '🛍️' },
  { id: 'ebay', name: 'eBay', glyph: '🏷️' },
  { id: 'wish', name: 'Wish', glyph: '⭐' },
  { id: 'aliexpress', name: 'AliExpress', glyph: '🚚' },
  { id: 'walmart', name: 'Walmart', glyph: '🛒' },
  { id: 'target', name: 'Target', glyph: '🎯' },
  { id: 'etsy', name: 'Etsy', glyph: '🧶' },
];

export const findApp = (id: string): BlockableApp =>
  MOCK_SHOPPING_APPS.find((a) => a.id === id) ?? { id, name: 'This app', glyph: '🔒' };

export const blocking = {
  /** False until the Family Controls entitlement + dev client are in place. */
  isNative: false,

  async requestAuthorization(): Promise<boolean> {
    return true;
  },

  async applyShields(_appIds: string[]): Promise<void> {},

  async unblockTemporarily(_appId: string, _minutes: number): Promise<void> {},
};
