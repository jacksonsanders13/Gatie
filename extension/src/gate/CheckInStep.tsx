import type { ReflectionEntry } from '../../../src/state/types';
import { findSite } from '../sites';

type Props = {
  entry: ReflectionEntry;
  onAnswer: (bought: boolean) => void;
};

export default function CheckInStep({ entry, onAnswer }: Props) {
  const site = findSite(entry.appId);
  const what = entry.intent === 'browsing' ? 'just browsing' : 'checking an order';

  return (
    <main className="page">
      <span className="glyph">{site.glyph}</span>
      <h1 className="display">Quick check-in</h1>
      <p className="lead">
        Last time you opened {site.name}, you said you were {what}.
      </p>
      {entry.item ? (
        <div className="card">
          <p className="caption">You were looking for</p>
          <p>{entry.item}</p>
        </div>
      ) : null}
      <h2 className="title">Did you end up buying anything?</h2>
      <p className="caption">Be honest. Nobody sees this but you, and it keeps quick unlocks working.</p>
      <div className="actions">
        <button className="btn btn-primary" onClick={() => onAnswer(false)}>
          No, I just looked
        </button>
        <button className="btn btn-secondary" onClick={() => onAnswer(true)}>
          Yes, I bought something
        </button>
      </div>
    </main>
  );
}
