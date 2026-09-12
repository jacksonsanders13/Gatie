import { FormEvent, useState } from 'react';

import { UNLOCK_WINDOWS } from '../../../src/state/actions';
import { isFilled } from '../../../src/state/selectors';
import type { Site } from '../sites';
import { Field, LockedHeader } from './shared';

type Props = {
  site: Site;
  onUnlock: (note: string) => void;
  onBack: () => void;
};

export default function BrowseStep({ site, onUnlock, onBack }: Props) {
  const [note, setNote] = useState('');
  const ready = isFilled(note);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (ready) onUnlock(note);
  };

  return (
    <form className="page" onSubmit={submit}>
      <LockedHeader site={site} subtitle="Just browsing is fine. Say what for, so future you can check." />
      <Field label="What are you looking for?">
        <input
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
          placeholder="e.g. nothing really, just bored"
        />
      </Field>
      <p className="caption">
        {site.name} locks again after {UNLOCK_WINDOWS.browsing} minutes, even mid-scroll. Next time, Gatie will ask
        whether you bought anything.
      </p>
      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={!ready}>
          Open {site.name} for {UNLOCK_WINDOWS.browsing} min
        </button>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>
    </form>
  );
}
