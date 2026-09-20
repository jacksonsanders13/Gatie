import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen } from '../../components/ui';
import { useNow } from '../../hooks/useNow';
import type { BlockableApp } from '../../services/blocking';
import { effectiveWaitMinutes, startWait, UNLOCK_WINDOWS } from '../../state/actions';
import {
  formatCountdown,
  hoursOfWork,
  isReflectionComplete,
  MIN_REASON_LENGTH,
  parseMoney,
} from '../../state/selectors';
import { useStore } from '../../state/store';
import type { ReflectionDraft } from '../../state/types';
import { colors, space, type } from '../../theme';
import { Field, inputStyles, LockedHeader } from './shared';

type Props = {
  app: BlockableApp;
  onUnlock: (draft: ReflectionDraft) => void;
  onWalkAway: (draft: ReflectionDraft) => void;
  onBack: () => void;
};

export default function BuyingStep({ app, onUnlock, onWalkAway, onBack }: Props) {
  const { state, update } = useStore();

  // A wait already running for this app survives leaving the screen or closing the app.
  const pending = state.pendingUnlock?.appId === app.id ? state.pendingUnlock : null;

  const [item, setItem] = useState(pending?.item ?? '');
  const [reasonsFor, setReasonsFor] = useState<[string, string]>(pending?.reasonsFor ?? ['', '']);
  const [reasonAgainst, setReasonAgainst] = useState(pending?.reasonAgainst ?? '');
  const [costText, setCostText] = useState(pending?.cost != null ? String(pending.cost) : '');

  const now = useNow(pending != null);
  const draft: ReflectionDraft = {
    appId: app.id,
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

  const onPrimary = () => (pending ? onUnlock(pending) : update((s) => startWait(s, draft)));

  let primaryLabel: string;
  if (!pending && !complete) primaryLabel = 'Write your reasons to unlock';
  else if (!pending) primaryLabel = `Unlock · ${effectiveWaitMinutes(state)} min wait`;
  else if (remaining! > 0) primaryLabel = `Unlock in ${formatCountdown(remaining!)}`;
  else primaryLabel = `Open for ${UNLOCK_WINDOWS.buying} min`;

  return (
    <Screen
      footer={
        <>
          <Button label={primaryLabel} onPress={onPrimary} disabled={pending ? remaining! > 0 : !complete} />
          <Button label="Never mind, I’ll skip it" variant="ghost" onPress={() => onWalkAway(pending ?? draft)} />
        </>
      }
    >
      <LockedHeader app={app} subtitle="Take a second. Write it down, and you can go in." />

      <Field label="What are you about to buy?" hint="Optional">
        <TextInput
          style={inputStyles.input}
          value={item}
          onChangeText={setItem}
          editable={!locked}
          placeholder="e.g. another pair of sneakers"
          placeholderTextColor={colors.disabled}
        />
      </Field>

      <Field label="Two reasons you want it">
        <View style={styles.stack}>
          {([0, 1] as const).map((i) => (
            <TextInput
              key={i}
              style={[inputStyles.input, inputStyles.multiline]}
              value={reasonsFor[i]}
              onChangeText={(t) => setReasonFor(i, t)}
              editable={!locked}
              multiline
              placeholder={i === 0 ? 'First reason' : 'Second reason'}
              placeholderTextColor={colors.disabled}
            />
          ))}
        </View>
      </Field>

      <Field label="One reason you don’t need it">
        <TextInput
          style={[inputStyles.input, inputStyles.multiline]}
          value={reasonAgainst}
          onChangeText={setReasonAgainst}
          editable={!locked}
          multiline
          placeholder="Be honest"
          placeholderTextColor={colors.disabled}
        />
      </Field>

      <Field label="Roughly how much?" hint="Optional">
        <TextInput
          style={inputStyles.input}
          value={costText}
          onChangeText={setCostText}
          editable={!locked}
          keyboardType="decimal-pad"
          placeholder="$0"
          placeholderTextColor={colors.disabled}
        />
        {draft.cost != null &&
          (hours != null ? (
            <Card style={styles.reframe}>
              <Text style={type.label}>
                About {hours < 1 ? `${Math.round(hours * 60)} minutes` : `${hours.toFixed(1)} hours`} of work.
              </Text>
            </Card>
          ) : (
            <Text style={type.caption}>Add your hourly pay in Settings to see this as hours of work.</Text>
          ))}
      </Field>

      {locked ? (
        <Text style={type.caption}>
          Your answers are locked in. Sit with them while the timer runs — you can still walk away.
        </Text>
      ) : (
        <>
          {!complete && <Text style={type.caption}>Each reason needs at least {MIN_REASON_LENGTH} characters.</Text>}
          <Button label="Not buying? Pick a different reason" variant="ghost" onPress={onBack} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space.sm },
  reframe: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
});
