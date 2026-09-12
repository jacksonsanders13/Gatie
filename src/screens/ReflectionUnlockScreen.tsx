import { useState } from 'react';
import { Alert } from 'react-native';

import type { ScreenProps } from '../navigation/types';
import { blocking, findApp } from '../services/blocking';
import {
  answerCheckIn,
  effectiveWaitMinutes,
  emptyDraft,
  quickUnlock,
  resolveReflection,
  UNLOCK_WINDOWS,
} from '../state/actions';
import { browsesLeftToday, dueCheckIn, formatMoney, quickUnlockBlockedReason } from '../state/selectors';
import { useStore } from '../state/store';
import type { AppState, ReflectionDraft, UnlockIntent } from '../state/types';
import BrowseStep from './unlock/BrowseStep';
import BuyingStep from './unlock/BuyingStep';
import CheckInStep from './unlock/CheckInStep';
import IntentStep from './unlock/IntentStep';

type Step = 'checkIn' | 'intent' | 'buying' | 'browsing';

/** The gate: check in on the last quick unlock if needed, ask why they're going in, then run the matching unlock. */
export default function ReflectionUnlockScreen({ navigation, route }: ScreenProps<'ReflectionUnlock'>) {
  const { appId } = route.params;
  const { state, update } = useStore();
  const app = findApp(appId);

  const [checkIn] = useState(() => dueCheckIn(state));
  const [step, setStep] = useState<Step>(() =>
    state.pendingUnlock?.appId === appId ? 'buying' : checkIn ? 'checkIn' : 'intent',
  );

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'));

  const unlock = async (intent: UnlockIntent, apply: (s: AppState) => AppState) => {
    await blocking.unblockTemporarily(appId, UNLOCK_WINDOWS[intent]);
    update(apply);
    Alert.alert(`${app.name} is open`, `It locks again in ${UNLOCK_WINDOWS[intent]} minutes.`);
    close();
  };

  const walkAway = (draft: ReflectionDraft = emptyDraft(appId)) => {
    update((s) => resolveReflection(s, draft, 'walked_away'));
    Alert.alert(
      'Good call.',
      draft.cost ? `${formatMoney(draft.cost)} stays in your pocket.` : 'That counts. Your streak keeps going.',
    );
    close();
  };

  const answer = (bought: boolean) => {
    update((s) => answerCheckIn(s, checkIn!.id, bought));
    if (bought) Alert.alert('Thanks for being honest.', 'Your streak starts over today, and that’s okay.');
    setStep('intent');
  };

  const pickIntent = (intent: UnlockIntent) => {
    if (intent === 'checking') unlock('checking', (s) => quickUnlock(s, appId, 'checking'));
    else setStep(intent);
  };

  switch (step) {
    case 'checkIn':
      return <CheckInStep entry={checkIn!} onAnswer={answer} />;
    case 'buying':
      return (
        <BuyingStep
          app={app}
          onUnlock={(draft) => unlock('buying', (s) => resolveReflection(s, draft, 'unlocked'))}
          onWalkAway={walkAway}
          onBack={() => setStep('intent')}
        />
      );
    case 'browsing':
      return (
        <BrowseStep
          app={app}
          onUnlock={(note) => unlock('browsing', (s) => quickUnlock(s, appId, 'browsing', note))}
          onBack={() => setStep('intent')}
        />
      );
    case 'intent':
      return (
        <IntentStep
          app={app}
          waitMinutes={effectiveWaitMinutes(state)}
          browsesLeft={browsesLeftToday(state)}
          browseBlockedReason={quickUnlockBlockedReason(state, 'browsing')}
          checkBlockedReason={quickUnlockBlockedReason(state, 'checking')}
          onPick={pickIntent}
          onWalkAway={() => walkAway()}
        />
      );
  }
}
