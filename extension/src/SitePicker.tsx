import { FormEvent, useState } from 'react';

import { findSite, isCustomSite, normalizeDomain, originsFor, SHOPPING_SITES } from './sites';

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
};

export default function SitePicker({ selected, onChange }: Props) {
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const domain = normalizeDomain(custom);
    if (!domain) {
      setError('Enter a site like bestbuy.com');
      return;
    }
    const id = SHOPPING_SITES.find((s) => s.domain === domain)?.id ?? domain;
    // Built-in sites are covered by the manifest; anything else needs the user to grant access.
    if (isCustomSite(id) && !(await chrome.permissions.request({ origins: originsFor(domain) }))) {
      setError('Gatie needs permission for that site to be able to lock it.');
      return;
    }
    if (!selected.includes(id)) onChange([...selected, id]);
    setCustom('');
    setError(null);
  };

  const sites = [...SHOPPING_SITES, ...selected.filter(isCustomSite).map(findSite)];

  return (
    <div className="stack">
      <div className="grid">
        {sites.map((site) => {
          const on = selected.includes(site.id);
          return (
            <button key={site.id} type="button" className="tile" aria-pressed={on} onClick={() => toggle(site.id)}>
              <span className="glyph">{site.glyph}</span>
              <span className="label">{site.name}</span>
              <span className="caption">{on ? 'Blocked' : 'Click to block'}</span>
            </button>
          );
        })}
      </div>
      <form className="row" onSubmit={add}>
        <input
          className="input grow"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add another site, e.g. bestbuy.com"
          aria-label="Add another site"
        />
        <button type="submit" className="btn btn-secondary btn-small">
          Add
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
