import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  createInitialState,
  DEFAULT_WAIT_MINUTES,
  effectiveWaitMinutes,
  FREE_APP_LIMIT,
  setBlockedApps,
  setPro,
  updateSettings,
  WAIT_OPTIONS,
} from '../../../src/state/actions';
import {
  daysSinceGaveIn,
  describeEntry,
  formatMoney,
  moneyNotSpent,
  parseMoney,
  walkAwayCount,
} from '../../../src/state/selectors';
import type { AppState } from '../../../src/state/types';
import { isMockBilling, manageSubscription } from '../billing';
import type { BillingStatus } from '../billingStatus';
import { openPaywall } from '../nav';
import { isOpen } from '../rules';
import { findSite } from '../sites';
import SitePicker from '../SitePicker';
import '../styles.css';
import { Update, useAppState, useNow } from '../useAppState';
import { useBilling } from '../useBilling';

function Dashboard() {
  const { state, update } = useAppState();
  const billing = useBilling();
  const now = useNow(true, 15_000);
  const [wageText, setWageText] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.hasOnboarded) location.replace(chrome.runtime.getURL('welcome.html'));
  }, [state]);

  if (!state?.hasOnboarded) return null;

  const days = daysSinceGaveIn(state, now);
  const wage = wageText ?? (state.settings.hourlyWage != null ? String(state.settings.hourlyWage) : '');
  const activeWait = effectiveWaitMinutes(state);

  const pickWait = (minutes: number) => {
    if (!state.isPro) void openPaywall('wait');
    else void update((s) => updateSettings(s, { waitMinutes: minutes }));
  };

  const resetAll = () => {
    if (confirm('Reset everything? This clears your blocked sites, streak and history in this browser.')) {
      void update(() => createInitialState());
    }
  };

  return (
    <main className="page wide">
      <p className="brand">Gatie</p>
      <div className="columns">
        <section className="stack">
          <div className="card hero">
            <span className="number">{days}</span>
            <span className="caption">{days === 1 ? 'day' : 'days'} since you last gave in</span>
          </div>

          {state.isPro ? (
            <div className="stats">
              <div className="card">
                <span className="title">{formatMoney(moneyNotSpent(state))}</span>
                <span className="caption">not spent</span>
              </div>
              <div className="card">
                <span className="title">{walkAwayCount(state)}</span>
                <span className="caption">times you walked away</span>
              </div>
            </div>
          ) : (
            <button className="card card-button" onClick={() => void openPaywall('stats')}>
              <span className="label">See what you haven’t spent</span>
              <span className="caption">Money saved and your walk-away history come with Gatie Pro.</span>
            </button>
          )}

          <h2 className="section-title">Right now</h2>
          {state.blockedAppIds.map((id) => {
            const site = findSite(id);
            const open = isOpen(state, id, now);
            return (
              <div key={id} className="card row">
                <span className="glyph" style={{ fontSize: 26 }}>
                  {site.glyph}
                </span>
                <span className="grow stack" style={{ gap: 0 }}>
                  <span className="label">{site.name}</span>
                  <span className="caption">
                    {open
                      ? `Open · locks again in ${Math.ceil((state.temporaryUnlocks[id] - now) / 60_000)} min`
                      : 'Locked'}
                  </span>
                </span>
                {open ? <span className="badge-open">Open</span> : <span>🔒</span>}
              </div>
            );
          })}

          {state.isPro && state.reflections.length > 0 && (
            <>
              <h2 className="section-title">Recent</h2>
              {state.reflections.slice(0, 8).map((r) => (
                <div key={r.id} className="card">
                  <span className="label">
                    {describeEntry(r)} · {findSite(r.appId).name}
                    {r.cost ? ` · ${formatMoney(r.cost)}` : ''}
                  </span>
                  {r.item ? <span>{r.item}</span> : null}
                  {r.reasonAgainst ? <span className="caption">Reason not to: {r.reasonAgainst}</span> : null}
                </div>
              ))}
            </>
          )}
        </section>

        <section className="stack">
          <h2 className="section-title">Blocked sites</h2>
          <div className="card">
            <SitePicker
              selected={state.blockedAppIds}
              onChange={(ids) => void update((s) => setBlockedApps(s, ids))}
              limit={state.isPro ? undefined : FREE_APP_LIMIT}
              onLimit={() => void openPaywall('sites')}
            />
          </div>

          <h2 className="section-title">Wait after reflecting</h2>
          <div className="card">
            <div className="chips">
              {WAIT_OPTIONS.map((m) => (
                <button key={m} className="chip" aria-pressed={m === activeWait} onClick={() => pickWait(m)}>
                  {m} min
                </button>
              ))}
            </div>
            <p className="caption">
              {state.isPro
                ? 'The reflection does the work. The wait just slows you down a little.'
                : `Free plan uses a ${DEFAULT_WAIT_MINUTES}-minute wait. Pro lets you choose.`}
            </p>
          </div>

          <h2 className="section-title">Hours of work</h2>
          <label className="card field">
            <span className="label">Your hourly pay (after tax)</span>
            <input
              className="input"
              inputMode="decimal"
              placeholder="$0"
              value={wage}
              onChange={(e) => setWageText(e.target.value)}
              onBlur={() => void update((s) => updateSettings(s, { hourlyWage: parseMoney(wage) }))}
            />
            <span className="caption">Used only to show prices as hours of work. Stays in this browser.</span>
          </label>

          <h2 className="section-title">Subscription</h2>
          <ProSection state={state} update={update} billing={billing} />

          <button className="btn btn-ghost" onClick={resetAll}>
            Reset all data
          </button>
        </section>
      </div>
    </main>
  );
}

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

type ProSectionProps = { state: AppState; update: Update; billing: BillingStatus | null };

function ProSection({ state, update, billing }: ProSectionProps) {
  if (billing?.pastDue) {
    return (
      <div className="card">
        <span className="label">Your last payment didn’t go through</span>
        <span className="caption">Pro is paused until your card is updated.</span>
        <button className="btn btn-primary btn-small" onClick={() => void manageSubscription()}>
          Update payment
        </button>
      </div>
    );
  }

  if (!state.isPro) {
    return (
      <button className="btn btn-primary" onClick={() => void openPaywall()}>
        Upgrade to Gatie Pro
      </button>
    );
  }

  if (isMockBilling) {
    return (
      <div className="card">
        <span className="label">Gatie Pro is active</span>
        <span className="caption">Simulated purchase. Payments aren’t connected.</span>
        <button className="btn btn-ghost btn-small" onClick={() => void update((s) => setPro(s, false))}>
          Turn off mock Pro
        </button>
      </div>
    );
  }

  if (billing?.trialEndsAt) {
    return (
      <div className="card">
        <span className="label">Free trial</span>
        <span className="caption">Ends {formatDate(billing.trialEndsAt)}. Pick a plan to keep Pro.</span>
        <button className="btn btn-primary btn-small" onClick={() => void openPaywall()}>
          Choose a plan
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <span className="label">Gatie Pro is active</span>
      <span className="caption">
        {billing?.cancelAt ? `Ends ${formatDate(billing.cancelAt)}.` : 'Renews automatically.'}
      </span>
      <button className="btn btn-secondary btn-small" onClick={() => void manageSubscription()}>
        Manage subscription
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
