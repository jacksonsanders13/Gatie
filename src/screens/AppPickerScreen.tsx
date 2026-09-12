import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Notice, Screen } from '../components/ui';
import type { ScreenProps } from '../navigation/types';
import { blocking, MOCK_SHOPPING_APPS } from '../services/blocking';
import { completeOnboarding, FREE_APP_LIMIT, setBlockedApps } from '../state/actions';
import { useStore } from '../state/store';
import { colors, radius, type } from '../theme';

export default function AppPickerScreen({ navigation, route }: ScreenProps<'AppPicker'>) {
  const { state, update } = useStore();
  const fromOnboarding = route.params?.fromOnboarding ?? false;
  const [selected, setSelected] = useState<string[]>(state.blockedAppIds);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (!state.isPro && selected.length >= FREE_APP_LIMIT) {
      navigation.navigate('Paywall', { reason: 'apps' });
    } else {
      setSelected([...selected, id]);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      if (!(await blocking.requestAuthorization())) return;
      await blocking.applyShields(selected);
      update((s) => {
        const next = setBlockedApps(s, selected);
        return fromOnboarding ? completeOnboarding(next) : next;
      });
      if (fromOnboarding) {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      } else {
        navigation.goBack();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <Button
          label={selected.length ? `Block ${selected.length} app${selected.length > 1 ? 's' : ''}` : 'Pick at least one app'}
          onPress={save}
          disabled={!selected.length}
          loading={saving}
        />
      }
    >
      <Text style={type.body}>Which apps get you? Gatie will lock them until you’ve written down why you’re going in.</Text>
      {!blocking.isNative && (
        <Notice>Preview list. The real build uses Apple’s Screen Time picker, so you can choose any app on your phone.</Notice>
      )}
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
      {!state.isPro && (
        <Text style={type.caption}>
          Free plan blocks {FREE_APP_LIMIT} app. Gatie Pro blocks as many as you need.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
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
