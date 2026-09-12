import { ReactNode, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen } from '../components/ui';
import { useNow } from '../hooks/useNow';
import type { ScreenProps } from '../navigation/types';
import { blocking, findApp } from '../services/blocking';
import { effectiveWaitMinutes, resolveReflection, startWait, UNLOCK_WINDOW_MINUTES } from '../state/actions';
import {
  formatCountdown,
  formatMoney,
  hoursOfWork,
  isReflectionComplete,
  MIN_REASON_LENGTH,
  parseMoney,
} from '../state/selectors';
import { useStore } from '../state/store';
import type { ReflectionDraft } from '../state/types';
import { colors, radius, type } from '../theme';

export default function ReflectionUnlockScreen({ navigation, route }: ScreenProps<'ReflectionUnlock'>) {
  const { appId } = route.params;
  const { state, update } = useStore();
  const app = findApp(appId);

  // A wait already in progress for this app survives leaving the screen or closing the app.
  const pending = state.pendingUnlock?.appId === appId ? state.pendingUnlock : null;

  const [item, setItem] = useState(pending?.item ?? '');
  const [reasonsFor, setReasonsFor] = useState<[string, string]>(pending?.reasonsFor ?? ['', '']);
  const [reasonAgainst, setReasonAgainst] = useState(pending?.reasonAgainst ?? '');
  const [costText, setCostText] = useState(pending?.cost != null ? String(pending.cost) : '');

  const now = useNow(pending != null);
  const draft: ReflectionDraft = { appId, item: item.trim(), reasonsFor, reasonAgainst, cost: parseMoney(costText) };
  const complete = isReflectionComplete(draft);
  const remaining = pending ? Math.max(0, pending.waitEndsAt - now) : null;
  const waitMinutes = effectiveWaitMinutes(state);
  const hours = hoursOfWork(draft.cost, state.settings.hourlyWage);

  const close = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard'));

  const setReasonFor = (i: 0 | 1, text: string) =>
    setReasonsFor(i === 0 ? [text, reasonsFor[1]] : [reasonsFor[0], text]);

  const onPrimary = async () => {
    if (!pending) {
      update((s) => startWait(s, draft));
      return;
    }
    await blocking.unblockTemporarily(appId, UNLOCK_WINDOW_MINUTES);
    update((s) => resolveReflection(s, pending, 'unlocked'));
    Alert.alert(`${app.name} is open`, `It locks again in ${UNLOCK_WINDOW_MINUTES} minutes.`);
    close();
  };

  const walkAway = () => {
    update((s) => resolveReflection(s, pending ?? draft, 'walked_away'));
    Alert.alert(
      'Good call.',
      draft.cost ? `${formatMoney(draft.cost)} stays in your pocket.` : 'That counts. Your streak keeps going.',
    );
    close();
  };

  let primaryLabel = 'Unlock';
  if (!pending && !complete) primaryLabel = 'Write your reasons to unlock';
  else if (!pending) primaryLabel = `Unlock (${waitMinutes}-min wait)`;
  else if (remaining! > 0) primaryLabel = `Unlock in ${formatCountdown(remaining!)}`;
  else primaryLabel = `Open ${app.name} for ${UNLOCK_WINDOW_MINUTES} min`;

  const locked = pending != null;

  return (
    <Screen
      footer={
        <>
          <Button
            label={primaryLabel}
            onPress={onPrimary}
            disabled={pending ? remaining! > 0 : !complete}
          />
          <Button label="Never mind, I’ll skip it" variant="ghost" onPress={walkAway} />
        </>
      }
    >
      <View style={styles.header}>
        <Text style={styles.glyph}>{app.glyph}</Text>
        <Text style={type.display}>{app.name} is locked.</Text>
        <Text style={[type.body, styles.muted]}>
          Take a second. Write it down, and you can go in.
        </Text>
      </View>

      <Field label="What are you about to buy?" hint="Optional">
        <TextInput
          style={styles.input}
          value={item}
          onChangeText={setItem}
          editable={!locked}
          placeholder="e.g. another pair of sneakers"
          placeholderTextColor={colors.disabled}
        />
      </Field>

      <Field label="Two reasons you want it">
        {([0, 1] as const).map((i) => (
          <TextInput
            key={i}
            style={[styles.input, styles.multiline]}
            value={reasonsFor[i]}
            onChangeText={(t) => setReasonFor(i, t)}
            editable={!locked}
            multiline
            placeholder={i === 0 ? 'First reason' : 'Second reason'}
            placeholderTextColor={colors.disabled}
          />
        ))}
      </Field>

      <Field label="One reason you don’t need it">
        <TextInput
          style={[styles.input, styles.multiline]}
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
          style={styles.input}
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
                That’s about {hours < 1 ? `${Math.round(hours * 60)} minutes` : `${hours.toFixed(1)} hours`} of work.
              </Text>
            </Card>
          ) : (
            <Text style={type.caption}>Add your hourly pay in Settings to see this as hours of work.</Text>
          ))}
      </Field>

      {!locked && !complete && (
        <Text style={type.caption}>Each reason needs at least {MIN_REASON_LENGTH} characters.</Text>
      )}
      {locked && (
        <Text style={type.caption}>
          Your answers are locked in. Sit with them while the timer runs. You can still walk away.
        </Text>
      )}
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>
        {label}
        {hint ? <Text style={type.caption}>  {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 4 },
  glyph: { fontSize: 40 },
  muted: { color: colors.muted },
  field: { gap: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  reframe: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
});
