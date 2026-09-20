import { useEffect, useState } from 'react';

import {
  answerCheckIn,
  effectiveWaitMinutes,
  emptyDraft,
  quickUnlock,
  resolveReflection,
} from '../../../src/state/actions';
import { browsesLeftToday, dueCheckIn, formatMoney, quickUnlockBlockedReason } from '../../../src/state/selectors';
import type { AppState, ReflectionDraft, UnlockIntent } from '../../../src/state/types';
import { closeCurrentTab } from '../nav';
import { isOpen, syncRules } from '../rules';
import { findSite, Site } from '../sites';
import { Update, useAppState } from '../useAppState';
import BrowseStep from './BrowseStep';
import BuyingStep from './BuyingStep';
import CheckInStep from './CheckInStep';
import IntentStep from './IntentStep';

/** The redirect rule appends the original URL raw after `&to=`, so it can contain its own `&`s. */
function readParams(): { siteId: string; to: string | null } {
  const search = location.search;
  const split = search.indexOf('&to=');
  const siteId = new URLSearchParams(split >= 0 ? search.slice(0, split) : search).get('site') ?? '';
  let to: string | null = null;
  try {
    const url = new URL(search.slice(split + 4));
    if (split >= 0 && (url.protocol === 'https:' || url.protocol === 'http:')) to = url.href;
  } catch {
    // Missing or malformed; fall back to the site's homepage.
  }
  return { siteId, to };
}

export default function Gate() {
  const { state, update } = useAppState();
  const [{ siteId, to }] = useState(readParams);
  const [initialState, setInitialState] = useState<AppState | null>(null);
  const site = findSite(siteId);
  const destination = to ?? `https://${site.domain}`;

  useEffect(() => {
    document.title = `${site.name} is locked · Gatie`;
  }, [site.name]);

  useEffect(() => {
    if (state && !initialState) setInitialState(state);
  }, [state, initialState]);

  // Judged only on the state the gate loaded with: an unlock in progress navigates itself once rules are cleared.
  const stale = initialState != null && (!initialState.blockedAppIds.includes(siteId) || isOpen(initialState, siteId));

  useEffect(() => {
    // Landed here from an outdated rule (site unblocked or already open): fix the rules, then continue.
    if (stale) void syncRules(initialState!).then(() => location.replace(destination));
  }, [stale]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || !initialState || stale) return null;

  return <GateFlow initialState={initialState} state={state} update={update} site={site} destination={destination} />;
}

type Step = 'checkIn' | 'intent' | 'buying' | 'browsing' | 'walkedAway';

type FlowProps = {
  initialState: AppState;
  state: AppState;
  update: Update;
  site: Site;
  destination: string;
};

function GateFlow({ initialState, state, update, site, destination }: FlowProps) {
  const [checkIn] = useState(() => dueCheckIn(initialState));
  const [step, setStep] = useState<Step>(() =>
    initialState.pendingUnlock?.appId === site.id ? 'buying' : checkIn ? 'checkIn' : 'intent',
  );
  const [walkAwayMessage, setWalkAwayMessage] = useState('');

  const unlock = async (apply: (s: AppState) => AppState) => {
    const next = await update(apply);
    // Drop the redirect rule before navigating, or we'd bounce straight back here.
    await syncRules(next);
    location.replace(destination);
  };

  const walkAway = async (draft: ReflectionDraft = emptyDraft(site.id)) => {
    await update((s) => resolveReflection(s, draft, 'walked_away'));
    setWalkAwayMessage(draft.cost ? `${formatMoney(draft.cost)} stays in your pocket.` : 'That counts. Your streak keeps going.');
    setStep('walkedAway');
  };

  const answer = (bought: boolean) => {
    void update((s) => answerCheckIn(s, checkIn!.id, bought));
    setStep('intent');
  };

  const pickIntent = (intent: UnlockIntent) => {
    if (intent === 'checking') void unlock((s) => quickUnlock(s, site.id, 'checking'));
    else setStep(intent);
  };

  switch (step) {
    case 'checkIn':
      return <CheckInStep entry={checkIn!} onAnswer={answer} />;
    case 'buying':
      return (
        <BuyingStep
          state={state}
          update={update}
          site={site}
          onUnlock={(draft) => void unlock((s) => resolveReflection(s, draft, 'unlocked'))}
          onWalkAway={walkAway}
          onBack={() => setStep('intent')}
        />
      );
    case 'browsing':
      return (
        <BrowseStep
          site={site}
          onUnlock={(note) => void unlock((s) => quickUnlock(s, site.id, 'browsing', note))}
          onBack={() => setStep('intent')}
        />
      );
    case 'intent':
      return (
        <IntentStep
          site={site}
          waitMinutes={effectiveWaitMinutes(state)}
          browsesLeft={browsesLeftToday(state)}
          browseBlockedReason={quickUnlockBlockedReason(state, 'browsing')}
          checkBlockedReason={quickUnlockBlockedReason(state, 'checking')}
          onPick={pickIntent}
          onWalkAway={() => void walkAway()}
        />
      );
    case 'walkedAway':
      return <WalkedAway message={walkAwayMessage} />;
  }
}

function WalkedAway({ message }: { message: string }) {
  return (
    <main className="page">
      <span className="glyph">🌿</span>
      <h1 className="display">Good call.</h1>
      <p className="lead">{message}</p>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => void closeCurrentTab()}>
          Close this tab
        </button>
        <button className="btn btn-ghost" onClick={() => chrome.runtime.openOptionsPage()}>
          Open Gatie dashboard
        </button>
      </div>
    </main>
  );
}
