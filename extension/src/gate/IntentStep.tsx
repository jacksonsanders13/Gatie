import { UNLOCK_WINDOWS } from '../../../src/state/actions';
import type { UnlockIntent } from '../../../src/state/types';
import type { Site } from '../sites';
import { LockedHeader } from './shared';

type Props = {
  site: Site;
  waitMinutes: number;
  browsesLeft: number;
  browseBlockedReason: string | null;
  checkBlockedReason: string | null;
  onPick: (intent: UnlockIntent) => void;
  onWalkAway: () => void;
};

export default function IntentStep(props: Props) {
  const { site, waitMinutes, browsesLeft, browseBlockedReason, checkBlockedReason, onPick, onWalkAway } = props;

  return (
    <main className="page">
      <LockedHeader site={site} subtitle="What are you here for?" />

      <Option
        title="Buying something"
        detail={`Write down why, then a ${waitMinutes}-min wait. Open for ${UNLOCK_WINDOWS.buying} min.`}
        onClick={() => onPick('buying')}
      />
      <Option
        title="Just browsing"
        detail={`One line, no wait. Open for ${UNLOCK_WINDOWS.browsing} min. ${browsesLeft} left today.`}
        blockedReason={browseBlockedReason}
        onClick={() => onPick('browsing')}
      />
      <Option
        title="Checking an order"
        detail={`No questions. Open for ${UNLOCK_WINDOWS.checking} min.`}
        blockedReason={checkBlockedReason}
        onClick={() => onPick('checking')}
      />

      <p className="caption">Browsing and order checks get a quick check-in next time you’re back.</p>
      <div className="actions">
        <button className="btn btn-ghost" onClick={onWalkAway}>
          Never mind, I’ll skip it
        </button>
      </div>
    </main>
  );
}

type OptionProps = {
  title: string;
  detail: string;
  blockedReason?: string | null;
  onClick: () => void;
};

function Option({ title, detail, blockedReason, onClick }: OptionProps) {
  const blocked = blockedReason != null;
  return (
    <button className="option" disabled={blocked} onClick={onClick}>
      <span className="grow stack" style={{ gap: 2 }}>
        <span className={`label ${blocked ? 'muted' : ''}`}>{title}</span>
        <span className={`caption ${blocked ? 'blocked-reason' : ''}`}>{blockedReason ?? detail}</span>
      </span>
      {!blocked && <span className="chevron">›</span>}
    </button>
  );
}
