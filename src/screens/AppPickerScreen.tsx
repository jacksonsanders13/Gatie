import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeviceActivitySelectionSheetView } from 'react-native-device-activity';

import { Button, Card, Monogram, Notice, Screen, StatusPill } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { blocking, MOCK_SHOPPING_APPS } from '../services/blocking';
import { ensureNotificationPermission } from '../services/notifications';
import { completeOnboarding, FREE_APP_LIMIT, setBlockedApps, setSelection } from '../state/actions';
import { useStore } from '../state/store';
import type { AppState, SelectionSnapshot } from '../state/types';
import { colors, space, type } from '../theme';

export default function AppPickerScreen({ navigation, route }: ScreenProps<'AppPicker'>) {
  const { state, update } = useStore();
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const native = blocking.isNative;

  // Apple's picker returns one opaque selection; the preview picker returns app ids.
  const [picked, setPicked] = useState<SelectionSnapshot | null>(state.selection);
  const [selected, setSelected] = useState<string[]>(state.blockedAppIds);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const count = native ? (picked ? picked.appCount + picked.categoryCount + picked.webCount : 0) : selected.length;
  const overFreeLimit = !state.isPro && count > FREE_APP_LIMIT;

  const openPicker = async () => {
    if (!(await ensureAuthorized())) return;
    setPickerOpen(true);
  };

  const ensureAuthorized = async () => {
    if (await blocking.requestAuthorization()) return true;
    Alert.alert('Screen Time access needed', 'Gatie can’t lock anything without it. You can grant it in Settings → Screen Time.');
    return false;
  };

  const toggle = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter((x) => x !== id));
    else if (!state.isPro && selected.length >= FREE_APP_LIMIT) navigation.navigate('Paywall', { reason: 'apps' });
    else setSelected([...selected, id]);
  };

  const save = async () => {
    if (overFreeLimit) {
      navigation.navigate('Paywall', { reason: 'apps' });
      return;
    }
    setSaving(true);
    try {
      if (!(await ensureAuthorized())) return;
      if (native) {
        // The shield reaches the user through a notification, so this permission is load-bearing.
        if (!(await ensureNotificationPermission())) {
          Alert.alert(
            'Turn on notifications',
            'When a locked app is opened, Gatie sends a notification you tap to write your reason. Without it there is no way back in.',
          );
        }
        await blocking.applyShields(picked);
      }
      update((s: AppState) => {
        const next = native ? setSelection(s, picked) : setBlockedApps(s, selected);
        return fromOnboarding ? completeOnboarding(next) : next;
      });
      if (fromOnboarding) navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      else navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={count ? `Lock ${count} selection${count > 1 ? 's' : ''}` : 'Choose something to lock'}
          onPress={save}
          disabled={!count}
          loading={saving}
        />
      }
    >
      <Text style={type.display}>What gets you?</Text>
      <Text style={type.body}>
        Gatie keeps these shut until you’ve written down why you’re going in.
      </Text>

      {native ? (
        <>
          <Card style={styles.summary}>
            <View style={styles.summaryText}>
              <Text style={type.label}>{picked ? summarize(picked) : 'Nothing chosen yet'}</Text>
              <Text style={type.caption}>Search by name, or open a category to pick single apps.</Text>
            </View>
            <Button label={picked ? 'Change' : 'Choose'} variant="secondary" onPress={openPicker} style={styles.chooseButton} />
          </Card>

          {pickerOpen && (
            <DeviceActivitySelectionSheetView
              style={styles.anchor}
              familyActivitySelection={picked?.token ?? null}
              onDismissRequest={() => setPickerOpen(false)}
              onSelectionChange={({ nativeEvent }) =>
                setPicked(
                  nativeEvent.familyActivitySelection
                    ? {
                        token: nativeEvent.familyActivitySelection,
                        appCount: nativeEvent.applicationCount,
                        categoryCount: nativeEvent.categoryCount,
                        webCount: nativeEvent.webDomainCount,
                      }
                    : null,
                )
              }
            />
          )}
        </>
      ) : (
        <>
          <Notice>Preview list. On your phone this is Apple’s own picker, so you can choose any app or website.</Notice>
          <View style={styles.list}>
            {MOCK_SHOPPING_APPS.map((app) => {
              const on = selected.includes(app.id);
              return (
                <Pressable
                  key={app.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggle(app.id)}
                >
                  <Card style={[styles.row, on && styles.rowOn]}>
                    <Monogram label={app.name} />
                    <Text style={[type.label, styles.rowName]}>{app.name}</Text>
                    <StatusPill label={on ? 'Locked' : 'Off'} tone={on ? 'active' : 'quiet'} />
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {!state.isPro && (
        <Text style={type.caption}>Free covers {FREE_APP_LIMIT} app. Gatie Pro covers as many as you need.</Text>
      )}
    </Screen>
  );
}

function summarize({ appCount, categoryCount, webCount }: SelectionSnapshot): string {
  const parts = [
    appCount ? `${appCount} app${appCount > 1 ? 's' : ''}` : null,
    categoryCount ? `${categoryCount} categor${categoryCount > 1 ? 'ies' : 'y'}` : null,
    webCount ? `${webCount} website${webCount > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Nothing chosen yet';
}

const styles = StyleSheet.create({
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  summaryText: { flex: 1, gap: 2 },
  chooseButton: { paddingHorizontal: space.lg, minHeight: 40 },
  anchor: { width: 1, height: 1, position: 'absolute' },
  list: { gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowOn: { borderColor: colors.primary },
  rowName: { flex: 1 },
});
