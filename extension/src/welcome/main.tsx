import { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { completeOnboarding, FREE_APP_LIMIT, setBlockedApps } from '../../../src/state/actions';
import { openPaywall } from '../nav';
import SitePicker from '../SitePicker';
import '../styles.css';
import { useAppState } from '../useAppState';

// One idea per page, adapted from the mobile onboarding for the browser.
const PAGES = [
  {
    eyebrow: 'Why Gatie',
    title: 'Blocks you. Then makes you think.',
    body:
      'Other tools make you reflect — if you remember to open them. Other blockers stop you — then let you through with a click. Gatie does both: it locks the site, and won’t let you back in until you’ve actually written down why.',
  },
  {
    eyebrow: 'How you get back in',
    title: 'Not a timer. A reason.',
    body:
      'To get back in, you write why you want it — and one reason you don’t. That’s the part research shows works: a passive delay didn’t reduce impulse buying at all, because people just kept browsing while they waited. A short, active reflection did.',
  },
  {
    eyebrow: 'Private by design',
    title: 'Nothing leaves your browser.',
    body:
      'No bank account to link. No account to create. No spending data sent anywhere. Just a gate between you and the sites that get you — and a real reason to walk through it.',
  },
];

function Welcome() {
  const { state, update } = useAppState();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[] | null>(null);

  if (!state) return null;
  const sites = selected ?? state.blockedAppIds;

  if (page < PAGES.length) {
    const p = PAGES[page];
    return (
      <main className="page">
        <p className="brand">Gatie</p>
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 className="display">{p.title}</h1>
        <p className="lead">{p.body}</p>
        <div className="dots" aria-hidden>
          {PAGES.map((x, i) => (
            <span key={x.title} className={`dot ${i === page ? 'active' : ''}`} />
          ))}
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => setPage(page + 1)}>
            {page === PAGES.length - 1 ? 'Choose sites to block' : 'Next'}
          </button>
        </div>
      </main>
    );
  }

  const finish = async () => {
    await update((s) => completeOnboarding(setBlockedApps(s, sites)));
    location.href = chrome.runtime.getURL('dashboard.html');
  };

  return (
    <main className="page">
      <p className="brand">Gatie</p>
      <h1 className="display">Which sites get you?</h1>
      <p className="lead">Gatie will lock them until you’ve written down why you’re going in.</p>
      <SitePicker
        selected={sites}
        onChange={setSelected}
        limit={state.isPro ? undefined : FREE_APP_LIMIT}
        onLimit={() => void openPaywall('sites')}
      />
      <div className="actions">
        <button className="btn btn-primary" disabled={!sites.length} onClick={() => void finish()}>
          {sites.length ? `Block ${sites.length} site${sites.length > 1 ? 's' : ''}` : 'Pick at least one site'}
        </button>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Welcome />);
