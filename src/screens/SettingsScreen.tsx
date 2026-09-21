import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen, SectionHeader } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { blocking } from '../services/blocking';
import {
  ensureNotificationPermission,
  getNotificationPermission,
  sendTestUnlockNotification,
} from '../services/notifications';
import { isMockPurchases } from '../services/purchases';
import { DEFAULT_WAIT_MINUTES, setPro, updateSettings, WAIT_OPTIONS } from '../state/actions';
import { parseMoney } from '../state/selectors';
import { useStore } from '../state/store';
import { colors, radius, space, type } from '../theme';

export default function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { state, update, reset } = useStore();
  const { settings, isPro } = state;
  const [wageText, setWageText] = useState(settings.hourlyWage != null ? String(settings.hourlyWage) : '');
  const [permission, setPermission] = useState('checking');

  useEffect(() => {
    getNotificationPermission().then(setPermission).catch(() => setPermission('unknown'));
  }, []);

  const pickWait = (minutes: number) => {
    if (!isPro) {
      navigation.navigate('Paywall', { reason: 'wait' });
      return;
    }
    update((s) => updateSettings(s, { waitMinutes: minutes }));
  };

  const confirmReset = () =>
    Alert.alert('Reset everything?', 'This clears your blocked apps, streak and history on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          reset();
          navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
        },
      },
    ]);

  const activeWait = isPro ? settings.waitMinutes : DEFAULT_WAIT_MINUTES;

  return (
    <Screen>
      <SectionHeader>Wait after reflecting</SectionHeader>
      <Card>
        <View style={styles.chips}>
          {WAIT_OPTIONS.map((m) => {
            const on = m === activeWait;
            return (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => pickWait(m)}
                style={[styles.chip, on && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{m} min</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={type.caption}>
          {isPro
            ? 'The reflection does the work. The wait just slows you down a little.'
            : `Free uses a ${DEFAULT_WAIT_MINUTES}-minute wait. Pro lets you choose.`}
        </Text>
      </Card>

      <SectionHeader>Hours of work</SectionHeader>
      <Card>
        <Text style={type.label}>Your hourly pay, after tax</Text>
        <TextInput
          style={styles.input}
          value={wageText}
          onChangeText={setWageText}
          onEndEditing={() => update((s) => updateSettings(s, { hourlyWage: parseMoney(wageText) }))}
          keyboardType="decimal-pad"
          placeholder="$0"
          placeholderTextColor={colors.disabled}
        />
        <Text style={type.caption}>Used only to show prices as hours of work. Stays on this phone.</Text>
      </Card>

      <SectionHeader>General</SectionHeader>
      <Card style={styles.row}>
        <Text style={[type.label, styles.rowLabel]}>Notifications</Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => update((s) => updateSettings(s, { notificationsEnabled: v }))}
          trackColor={{ true: colors.primary }}
        />
      </Card>
      <Button label="Edit blocked apps" variant="secondary" onPress={() => navigation.navigate('AppPicker')} />

      <SectionHeader>Subscription</SectionHeader>
      {isPro ? (
        <Card>
          <Text style={type.label}>Gatie Pro is active</Text>
          <Text style={type.caption}>Manage or cancel in your Apple ID subscription settings.</Text>
        </Card>
      ) : (
        <Button label="Upgrade to Gatie Pro" onPress={() => navigation.navigate('Paywall')} />
      )}

      {__DEV__ && (
        <>
          <SectionHeader>Developer</SectionHeader>
          {isMockPurchases && (
            <Button
              label={isPro ? 'Turn off mock Pro' : 'Turn on mock Pro'}
              variant="secondary"
              onPress={() => update((s) => setPro(s, !isPro))}
            />
          )}
          <Text style={type.caption}>
            Screen Time: {String(blocking.isNative)} · shield up: {String(blocking.isShieldUp())} · notifications:{' '}
            {permission}
          </Text>
          <Button
            label="Re-apply blocks and shield"
            variant="secondary"
            onPress={async () => {
              await ensureNotificationPermission();
              setPermission(await getNotificationPermission());
              await blocking.applyShields(state.selection);
              Alert.alert('Re-applied', 'The shield now carries the current button setup.');
            }}
          />
          <Button
            label="Send test notification"
            variant="secondary"
            onPress={async () => {
              await ensureNotificationPermission();
              await sendTestUnlockNotification();
              Alert.alert('Sent', 'Leave Gatie to see it. Tapping it should open the reflection screen.');
            }}
          />
          <Button
            label="Clear all blocks"
            variant="secondary"
            onPress={() => {
              void blocking.clearEverything();
              Alert.alert('Blocks cleared', 'Every shield Gatie owns has been removed.');
            }}
          />
          <Button label="Reset all data" variant="ghost" onPress={confirmReset} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabel: { fontSize: 14, fontWeight: '600', color: colors.inkSoft },
  chipLabelOn: { color: colors.onPrimary },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    color: colors.ink,
  },
});
