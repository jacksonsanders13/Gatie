import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { createInitialState, setBlockedApps, updateSettings, WAIT_OPTIONS } from '../../../src/state/actions';
import {
  daysSinceGaveIn,
  describeEntry,
  formatMoney,
  moneyNotSpent,
  parseMoney,
  walkAwayCount,
} from '../../../src/state/selectors';
import { isOpen } from '../rules';
import { findSite } from '../sites';
import SitePicker from '../SitePicker';
import '../styles.css';
import { useAppState, useNow } from '../useAppState';

function Dashboard() {
  const { state, update } = useAppState();
  const now = useNow(true, 15_000);
  const [wageText, setWageText] = useState<string | null>(null);

  useEffect(() => {
    if (state && !state.hasOnboarded) location.replace(chrome.runtime.getURL('welcome.html'));
  }, [state]);

  if (!state?.hasOnboarded) return null;

  const days = daysSinceGaveIn(state, now);
  const wage = wageText ?? (state.settings.hourlyWage != null ? String(state.settings.hourlyWage) : '');

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

          {state.reflections.length > 0 && (
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
            />
          </div>

          <h2 className="section-title">Wait after reflecting</h2>
          <div className="card">
            <div className="chips">
              {WAIT_OPTIONS.map((m) => (
                <button
                  key={m}
                  className="chip"
                  aria-pressed={m === state.settings.waitMinutes}
                  onClick={() => void update((s) => updateSettings(s, { waitMinutes: m }))}
                >
                  {m} min
                </button>
              ))}
            </div>
            <p className="caption">The reflection does the work. The wait just slows you down a little.</p>
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

          <button className="btn btn-ghost" onClick={resetAll}>
            Reset all data
          </button>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Dashboard />);
