import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeviceActivitySelectionView } from 'react-native-device-activity';

import { Button, Notice, Screen } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { blocking, MOCK_SHOPPING_APPS } from '../services/blocking';
import { completeOnboarding, FREE_APP_LIMIT, setBlockedApps, setSelection } from '../state/actions';
import { useStore } from '../state/store';
import type { AppState, SelectionSnapshot } from '../state/types';
import { colors, radius, type } from '../theme';

export default function AppPickerScreen({ navigation, route }: ScreenProps<'AppPicker'>) {
  const { state, update } = useStore();
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const native = blocking.isNative;

  // Apple's picker returns one opaque selection; the mock picker returns app ids.
  const [picked, setPicked] = useState<SelectionSnapshot | null>(state.selection);
  const [selected, setSelected] = useState<string[]>(state.blockedAppIds);
  const [saving, setSaving] = useState(false);

  const count = native ? (picked ? picked.appCount + picked.categoryCount + picked.webCount : 0) : selected.length;
  const overFreeLimit = !state.isPro && count > FREE_APP_LIMIT;

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
      if (!(await blocking.requestAuthorization())) {
        Alert.alert(
          'Screen Time access needed',
          'Gatie can’t lock anything without it. You can grant it in Settings → Screen Time.',
        );
        return;
      }
      if (native) await blocking.applyShields(picked);
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
          label={count ? `Block ${count} app${count > 1 ? 's' : ''}` : 'Pick at least one app'}
          onPress={save}
          disabled={!count}
          loading={saving}
        />
      }
    >
      <Text style={type.body}>Which apps get you? Gatie will lock them until you’ve written down why you’re going in.</Text>

      {native ? (
        <DeviceActivitySelectionView
          style={styles.picker}
          familyActivitySelection={picked?.token ?? null}
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
      ) : (
        <>
          <Notice>Preview list. On your phone this is Apple’s own picker, so you can choose any app.</Notice>
          <View style={styles.grid}>
            {MOCK_SHOPPING_APPS.map((app) => {
              const on = selected.includes(app.id);
              return (
                <Pressable
                  key={app.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggle(app.id)}
                  style={[styles.tile, on && styles.tileOn]}
                >
                  <Text style={styles.glyph}>{app.glyph}</Text>
                  <Text style={[type.label, on && styles.labelOn]}>{app.name}</Text>
                  <Text style={[type.caption, on && styles.labelOn]}>{on ? 'Blocked' : 'Tap to block'}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}

      {!state.isPro && (
        <Text style={type.caption}>
          Free plan blocks {FREE_APP_LIMIT} app. Gatie Pro blocks as many as you need.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  picker: { height: 440, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 14,
    gap: 4,
  },
  tileOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  glyph: { fontSize: 26 },
  labelOn: { color: colors.onPrimary },
});
