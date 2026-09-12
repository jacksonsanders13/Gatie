export type Site = {
  id: string;
  name: string;
  domain: string;
  glyph: string;
};

/** Built-in sites. Ids match the mobile app's app ids. Their hosts are in manifest host_permissions. */
export const SHOPPING_SITES: Site[] = [
  { id: 'amazon', name: 'Amazon', domain: 'amazon.com', glyph: '📦' },
  { id: 'shein', name: 'Shein', domain: 'shein.com', glyph: '👗' },
  { id: 'temu', name: 'Temu', domain: 'temu.com', glyph: '🛍️' },
  { id: 'ebay', name: 'eBay', domain: 'ebay.com', glyph: '🏷️' },
  { id: 'wish', name: 'Wish', domain: 'wish.com', glyph: '⭐' },
  { id: 'aliexpress', name: 'AliExpress', domain: 'aliexpress.com', glyph: '🚚' },
  { id: 'walmart', name: 'Walmart', domain: 'walmart.com', glyph: '🛒' },
  { id: 'target', name: 'Target', domain: 'target.com', glyph: '🎯' },
  { id: 'etsy', name: 'Etsy', domain: 'etsy.com', glyph: '🧶' },
];

/** Custom sites are stored with their domain as the id. */
export const findSite = (id: string): Site =>
  SHOPPING_SITES.find((s) => s.id === id) ?? { id, name: id, domain: id, glyph: '🔒' };

export const isCustomSite = (id: string) => !SHOPPING_SITES.some((s) => s.id === id);

/** "https://www.BestBuy.com/foo" -> "bestbuy.com"; null if it doesn't look like a domain. */
export function normalizeDomain(input: string): string | null {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#:]/)[0]
    .replace(/^www\./, '');
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

export const originsFor = (domain: string) => [`*://*.${domain}/*`];
