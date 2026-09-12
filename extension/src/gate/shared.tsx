import { ReactNode } from 'react';

import type { Site } from '../sites';

export function LockedHeader({ site, subtitle }: { site: Site; subtitle: string }) {
  return (
    <header className="stack">
      <span className="glyph">{site.glyph}</span>
      <h1 className="display">{site.name} is locked.</h1>
      <p className="lead">{subtitle}</p>
    </header>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="label">
        {label}
        {hint ? <span className="caption"> &nbsp;{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
