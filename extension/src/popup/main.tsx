import { createRoot } from 'react-dom/client';

import { daysSinceGaveIn } from '../../../src/state/selectors';
import { isOpen } from '../rules';
import { findSite } from '../sites';
import '../styles.css';
import { useAppState, useNow } from '../useAppState';

function Popup() {
  const { state } = useAppState();
  const now = useNow(true, 15_000);
  if (!state) return null;

  if (!state.hasOnboarded) {
    return (
      <main className="page popup">
        <p className="brand">Gatie</p>
        <p className="muted">Pick the shopping sites you want locked.</p>
        <button className="btn btn-primary" onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })}>
          Set up Gatie
        </button>
      </main>
    );
  }

  const days = daysSinceGaveIn(state, now);

  return (
    <main className="page popup">
      <p className="brand">Gatie</p>
      <div className="card hero">
        <span className="number">{days}</span>
        <span className="caption">{days === 1 ? 'day' : 'days'} since you last gave in</span>
      </div>
      {state.blockedAppIds.map((id) => {
        const site = findSite(id);
        const open = isOpen(state, id, now);
        return (
          <div key={id} className="row">
            <span>{site.glyph}</span>
            <span className="grow label">{site.name}</span>
            {open ? (
              <span className="badge-open">{Math.ceil((state.temporaryUnlocks[id] - now) / 60_000)} min left</span>
            ) : (
              <span className="caption">Locked</span>
            )}
          </div>
        );
      })}
      <button className="btn btn-secondary btn-small" onClick={() => chrome.runtime.openOptionsPage()}>
        Open dashboard
      </button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
