import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Notice, Screen } from '../components/ui';
import type { PaywallReason, ScreenProps } from '../navigation/types';
import { getPlans, isMockPurchases, Plan, purchase, restore } from '../services/purchases';
import { setPro } from '../state/actions';
import { useStore } from '../state/store';
import { colors, radius, type } from '../theme';

const HEADLINES: Record<PaywallReason | 'default', string> = {
  apps: 'Block every app that gets you.',
  stats: 'See what you didn’t spend.',
  wait: 'Set your own wait.',
  default: 'Get the full gate.',
};

const BENEFITS = [
  'Block unlimited apps',
  'Money-not-spent tracking and walk-away history',
  'Choose your own wait time',
];

export default function PaywallScreen({ navigation, route }: ScreenProps<'Paywall'>) {
  const { update } = useStore();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);

  useEffect(() => {
    getPlans()
      .then((p) => {
        setPlans(p);
        setSelectedId(p[0]?.id ?? null);
      })
      .catch((e) => {
        console.warn('Failed to load plans', e);
        setPlans([]);
      });
  }, []);

  const selected = plans?.find((p) => p.id === selectedId);

  const finish = (isPro: boolean) => {
    update((s) => setPro(s, isPro));
    if (isPro) navigation.goBack();
  };

  const buy = async () => {
    if (!selected) return;
    setBusy('buy');
    try {
      finish(await purchase(selected));
    } catch (e) {
      Alert.alert('Purchase failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      const isPro = await restore();
      if (!isPro) Alert.alert('Nothing to restore', 'No active Gatie Pro subscription was found for this Apple ID.');
      finish(isPro);
    } catch (e) {
      Alert.alert('Restore failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <>
          <Button
            label={selected?.trial ? `Start ${selected.trial}` : 'Subscribe'}
            onPress={buy}
            disabled={!selected}
            loading={busy === 'buy'}
          />
          <Text style={[type.caption, styles.center]}>
            {selected
              ? `${selected.trial ? 'Then ' : ''}${selected.price}/${selected.period}. Cancel anytime in Settings.`
              : ' '}
          </Text>
          <View style={styles.links}>
            <Button label="Restore purchases" variant="ghost" onPress={onRestore} loading={busy === 'restore'} />
            <Button label="Not now" variant="ghost" onPress={() => navigation.goBack()} />
          </View>
        </>
      }
    >
      <Text style={styles.eyebrow}>Gatie Pro</Text>
      <Text style={type.display}>{HEADLINES[route.params?.reason ?? 'default']}</Text>
      <View style={styles.benefits}>
        {BENEFITS.map((b) => (
          <Text key={b} style={type.body}>
            ✓  {b}
          </Text>
        ))}
      </View>

      {isMockPurchases && <Notice>Sandbox preview. No RevenueCat key is set, so purchases are simulated and free.</Notice>}

      {plans === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : plans.length === 0 ? (
        <Text style={type.caption}>Plans aren’t available right now. Try again later.</Text>
      ) : (
        plans.map((p) => {
          const on = p.id === selectedId;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setSelectedId(p.id)}
              style={[styles.plan, on && styles.planOn]}
            >
              <View style={styles.flex}>
                <Text style={type.label}>{p.title}</Text>
                <Text style={type.caption}>{p.trial ?? 'No trial'}</Text>
              </View>
              {p.badge ? <Text style={styles.badge}>{p.badge}</Text> : null}
              <Text style={type.label}>
                {p.price}
                <Text style={type.caption}>/{p.period}</Text>
              </Text>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  eyebrow: { ...type.caption, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  benefits: { gap: 6 },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.line,
    padding: 16,
  },
  planOn: { borderColor: colors.primary },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
});
