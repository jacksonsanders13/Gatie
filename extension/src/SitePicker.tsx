import { FormEvent, useState } from 'react';

import { findSite, isCustomSite, normalizeDomain, originsFor, SHOPPING_SITES } from './sites';

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Max sites allowed (free plan); adding past it calls onLimit instead. */
  limit?: number;
  onLimit?: () => void;
};

export default function SitePicker({ selected, onChange, limit, onLimit }: Props) {
  const [custom, setCustom] = useState('');
  const [error, setError] = useState<string | null>(null);

  const atLimit = limit != null && selected.length >= limit;

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else if (atLimit) onLimit?.();
    else onChange([...selected, id]);
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    const domain = normalizeDomain(custom);
    if (!domain) {
      setError('Enter a site like bestbuy.com');
      return;
    }
    const id = SHOPPING_SITES.find((s) => s.domain === domain)?.id ?? domain;
    if (selected.includes(id)) {
      setCustom('');
      return;
    }
    if (atLimit) {
      onLimit?.();
      return;
    }
    // Built-in sites are covered by the manifest; anything else needs the user to grant access.
    if (isCustomSite(id) && !(await chrome.permissions.request({ origins: originsFor(domain) }))) {
      setError('Gatie needs permission for that site to be able to lock it.');
      return;
    }
    onChange([...selected, id]);
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
      {limit != null && (
        <p className="caption">
          Free plan blocks {limit} site.{' '}
          <a href="#" onClick={(e) => (e.preventDefault(), onLimit?.())}>
            Gatie Pro
          </a>{' '}
          blocks as many as you need.
        </p>
      )}
    </div>
  );
}
