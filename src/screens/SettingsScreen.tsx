import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen, SectionTitle } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { isMockPurchases } from '../services/purchases';
import { DEFAULT_WAIT_MINUTES, setPro, updateSettings, WAIT_OPTIONS } from '../state/actions';
import { parseMoney } from '../state/selectors';
import { useStore } from '../state/store';
import { colors, radius, type } from '../theme';

export default function SettingsScreen({ navigation }: ScreenProps<'Settings'>) {
  const { state, update, reset } = useStore();
  const { settings, isPro } = state;
  const [wageText, setWageText] = useState(settings.hourlyWage != null ? String(settings.hourlyWage) : '');

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
      <SectionTitle>Wait after reflecting</SectionTitle>
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
                <Text style={[type.label, on && styles.chipLabelOn]}>{m} min</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={type.caption}>
          {isPro
            ? 'The reflection does the work. The wait just slows you down a little.'
            : `Free plan uses a ${DEFAULT_WAIT_MINUTES}-minute wait. Pro lets you choose.`}
        </Text>
      </Card>

      <SectionTitle>Hours of work</SectionTitle>
      <Card>
        <Text style={type.label}>Your hourly pay (after tax)</Text>
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

      <SectionTitle>General</SectionTitle>
      <Card style={styles.row}>
        <Text style={[type.label, styles.flex]}>Notifications</Text>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => update((s) => updateSettings(s, { notificationsEnabled: v }))}
          trackColor={{ true: colors.primary }}
        />
      </Card>
      <Button label="Edit blocked apps" variant="secondary" onPress={() => navigation.navigate('AppPicker')} />

      <SectionTitle>Subscription</SectionTitle>
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
          <SectionTitle>Developer</SectionTitle>
          {isMockPurchases && (
            <Button
              label={isPro ? 'Turn off mock Pro' : 'Turn on mock Pro'}
              variant="secondary"
              onPress={() => update((s) => setPro(s, !isPro))}
            />
          )}
          <Button label="Reset all data" variant="ghost" onPress={confirmReset} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipLabelOn: { color: colors.onPrimary },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
});
