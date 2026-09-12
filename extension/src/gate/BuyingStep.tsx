import { useState } from 'react';

import { effectiveWaitMinutes, startWait, UNLOCK_WINDOWS } from '../../../src/state/actions';
import {
  formatCountdown,
  hoursOfWork,
  isReflectionComplete,
  MIN_REASON_LENGTH,
  parseMoney,
} from '../../../src/state/selectors';
import type { AppState, ReflectionDraft } from '../../../src/state/types';
import type { Site } from '../sites';
import { Update, useNow } from '../useAppState';
import { Field, LockedHeader } from './shared';

type Props = {
  state: AppState;
  update: Update;
  site: Site;
  onUnlock: (draft: ReflectionDraft) => void;
  onWalkAway: (draft: ReflectionDraft) => void;
  onBack: () => void;
};

export default function BuyingStep({ state, update, site, onUnlock, onWalkAway, onBack }: Props) {
  // A wait already in progress for this site survives closing the tab.
  const pending = state.pendingUnlock?.appId === site.id ? state.pendingUnlock : null;

  const [item, setItem] = useState(pending?.item ?? '');
  const [reasonsFor, setReasonsFor] = useState<[string, string]>(pending?.reasonsFor ?? ['', '']);
  const [reasonAgainst, setReasonAgainst] = useState(pending?.reasonAgainst ?? '');
  const [costText, setCostText] = useState(pending?.cost != null ? String(pending.cost) : '');

  const now = useNow(pending != null);
  const draft: ReflectionDraft = {
    appId: site.id,
    item: item.trim(),
    reasonsFor,
    reasonAgainst,
    cost: parseMoney(costText),
  };
  const complete = isReflectionComplete(draft);
  const remaining = pending ? Math.max(0, pending.waitEndsAt - now) : null;
  const hours = hoursOfWork(draft.cost, state.settings.hourlyWage);
  const locked = pending != null;

  const setReasonFor = (i: 0 | 1, text: string) =>
    setReasonsFor(i === 0 ? [text, reasonsFor[1]] : [reasonsFor[0], text]);

  const onPrimary = () => (pending ? onUnlock(pending) : void update((s) => startWait(s, draft)));

  let primaryLabel: string;
  if (!pending && !complete) primaryLabel = 'Write your reasons to unlock';
  else if (!pending) primaryLabel = `Unlock (${effectiveWaitMinutes(state)}-min wait)`;
  else if (remaining! > 0) primaryLabel = `Unlock in ${formatCountdown(remaining!)}`;
  else primaryLabel = `Open ${site.name} for ${UNLOCK_WINDOWS.buying} min`;

  return (
    <main className="page">
      <LockedHeader site={site} subtitle="Take a second. Write it down, and you can go in." />

      <Field label="What are you about to buy?" hint="Optional">
        <input
          className="input"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          disabled={locked}
          placeholder="e.g. another pair of sneakers"
        />
      </Field>

      <Field label="Two reasons you want it">
        {([0, 1] as const).map((i) => (
          <textarea
            key={i}
            className="input"
            value={reasonsFor[i]}
            onChange={(e) => setReasonFor(i, e.target.value)}
            disabled={locked}
            placeholder={i === 0 ? 'First reason' : 'Second reason'}
          />
        ))}
      </Field>

      <Field label="One reason you don’t need it">
        <textarea
          className="input"
          value={reasonAgainst}
          onChange={(e) => setReasonAgainst(e.target.value)}
          disabled={locked}
          placeholder="Be honest"
        />
      </Field>

      <Field label="Roughly how much?" hint="Optional">
        <input
          className="input"
          value={costText}
          onChange={(e) => setCostText(e.target.value)}
          disabled={locked}
          inputMode="decimal"
          placeholder="$0"
        />
      </Field>
      {draft.cost != null &&
        (hours != null ? (
          <div className="card reframe">
            That’s about {hours < 1 ? `${Math.round(hours * 60)} minutes` : `${hours.toFixed(1)} hours`} of work.
          </div>
        ) : (
          <p className="caption">Add your hourly pay in the Gatie dashboard to see this as hours of work.</p>
        ))}

      {locked ? (
        <p className="caption">Your answers are locked in. Sit with them while the timer runs. You can still walk away.</p>
      ) : (
        !complete && <p className="caption">Each reason needs at least {MIN_REASON_LENGTH} characters.</p>
      )}

      <div className="actions">
        <button className="btn btn-primary" onClick={onPrimary} disabled={pending ? remaining! > 0 : !complete}>
          {primaryLabel}
        </button>
        <button className="btn btn-ghost" onClick={() => onWalkAway(pending ?? draft)}>
          Never mind, I’ll skip it
        </button>
        {!locked && (
          <button className="btn btn-ghost" onClick={onBack}>
            Not buying? Pick a different reason
          </button>
        )}
      </div>
    </main>
  );
}
