import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { setPro } from '../../../src/state/actions';
import { checkout, CheckoutResult, getPlans, isMockBilling, Plan, restorePurchase, startTrial } from '../billing';
import { TRIAL_DAYS } from '../billingStatus';
import { closeCurrentTab, PaywallReason } from '../nav';
import '../styles.css';
import { useAppState } from '../useAppState';
import { useBilling } from '../useBilling';

const HEADLINES: Record<PaywallReason | 'default', string> = {
  sites: 'Block every site that gets you.',
  stats: 'See what you didn’t spend.',
  wait: 'Set your own wait.',
  default: 'Get the full gate.',
};

const BENEFITS = ['Block unlimited sites', 'Money-not-spent tracking and walk-away history', 'Choose your own wait time'];

type Busy = 'trial' | 'buy' | 'restore' | null;

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

function Paywall() {
  const { state, update } = useAppState();
  const billing = useBilling();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const reason = (new URLSearchParams(location.search).get('reason') as PaywallReason | null) ?? 'default';

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p);
        setSelectedId(p[0]?.id ?? null);
      })
      .catch(() => setPlans([]));
  }, []);

  if (!state) return null;

  if (state.isPro) {
    return (
      <main className="page">
        <p className="eyebrow">Gatie Pro</p>
        <h1 className="display">You’re all set.</h1>
        <p className="lead">
          {billing?.trialEndsAt
            ? `Your free trial runs until ${formatDate(billing.trialEndsAt)}. Every Pro feature is on.`
            : 'Every Pro feature is on in this browser.'}
        </p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => void closeCurrentTab()}>
            Done
          </button>
        </div>
      </main>
    );
  }

  const selected = plans?.find((p) => p.id === selectedId);
  const trialAvailable = isMockBilling || (billing?.trialAvailable ?? true);

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<CheckoutResult | 'none'>) => {
    setBusy(kind);
    setMessage(null);
    try {
      const result = await action();
      if (result === 'done') await update((s) => setPro(s, true));
      else if (result === 'opened') setWaiting(true);
      else setMessage('No active Gatie Pro subscription was found.');
    } catch {
      setMessage('Couldn’t reach the payment service. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="page">
      <p className="eyebrow">Gatie Pro</p>
      <h1 className="display">{HEADLINES[reason] ?? HEADLINES.default}</h1>
      <ul className="benefits">
        {BENEFITS.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      {isMockBilling && (
        <p className="notice">Sandbox preview. Payments aren’t connected, so purchases are simulated and free.</p>
      )}
      {billing?.pastDue && (
        <p className="notice">Your last payment didn’t go through. Update your card to turn Pro back on.</p>
      )}

      {trialAvailable && (
        <div className="card">
          <span className="title">Try it free for {TRIAL_DAYS} days</span>
          <span className="caption">No card needed. Just confirm your email.</span>
          <button className="btn btn-primary" disabled={busy != null} onClick={() => void run('trial', startTrial)}>
            {busy === 'trial' ? 'Opening…' : `Start ${TRIAL_DAYS}-day free trial`}
          </button>
        </div>
      )}

      {plans === null ? null : plans.length === 0 ? (
        <p className="caption">Plans aren’t available right now. Try again later.</p>
      ) : (
        <div className="stack" role="radiogroup" aria-label="Plans">
          {plans.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={p.id === selectedId}
              className="option plan"
              onClick={() => setSelectedId(p.id)}
            >
              <span className="grow label">{p.title}</span>
              {p.badge && <span className="badge">{p.badge}</span>}
              <span className="label">
                {p.price}
                <span className="caption">{p.period ? `/${p.period}` : ' once'}</span>
              </span>
            </button>
          ))}
          <button
            className={`btn ${trialAvailable ? 'btn-secondary' : 'btn-primary'}`}
            disabled={!selected || busy != null}
            onClick={() => void run('buy', () => checkout(selected!))}
          >
            {busy === 'buy' ? 'Opening…' : selected ? `Subscribe · ${selected.price}${selected.period ? `/${selected.period}` : ''}` : 'Subscribe'}
          </button>
          {selected?.period && <p className="caption" style={{ textAlign: 'center' }}>Cancel anytime.</p>}
        </div>
      )}

      {waiting && (
        <p className="notice">Finish up in the window that just opened. This page updates on its own when you’re done.</p>
      )}
      {message && <p className="error">{message}</p>}

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <button className="btn btn-ghost btn-small" disabled={busy != null} onClick={() => void run('restore', restorePurchase)}>
          {busy === 'restore' ? 'Opening…' : 'Already paid? Log in'}
        </button>
        <button className="btn btn-ghost btn-small" onClick={() => void closeCurrentTab()}>
          Not now
        </button>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Paywall />);
