import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Notice, Screen, SectionTitle } from '../components/ui';
import { useNow } from '../hooks/useNow';
import type { ScreenProps } from '../navigation/types';
import { blocking, findApp } from '../services/blocking';
import { daysSinceGaveIn, describeEntry, formatMoney, moneyNotSpent, walkAwayCount } from '../state/selectors';
import { useStore } from '../state/store';
import { colors, radius, type } from '../theme';

export default function DashboardScreen({ navigation }: ScreenProps<'Dashboard'>) {
  const { state } = useStore();
  const now = useNow(true, 15_000);
  const days = daysSinceGaveIn(state, now);

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={styles.heroNumber}>{days}</Text>
        <Text style={styles.heroLabel}>{days === 1 ? 'day' : 'days'} since you last gave in</Text>
      </Card>

      {state.isPro ? (
        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={type.title}>{formatMoney(moneyNotSpent(state))}</Text>
            <Text style={type.caption}>not spent</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={type.title}>{walkAwayCount(state)}</Text>
            <Text style={type.caption}>times you walked away</Text>
          </Card>
        </View>
      ) : (
        <Pressable onPress={() => navigation.navigate('Paywall', { reason: 'stats' })}>
          <Card>
            <Text style={type.label}>See what you haven’t spent</Text>
            <Text style={type.caption}>Money saved and your walk-away history come with Gatie Pro.</Text>
          </Card>
        </Pressable>
      )}

      <SectionTitle>Blocked apps</SectionTitle>
      {!blocking.isNative && (
        <Notice>Preview: tap an app to see what happens when you open it. In the real build, opening the app itself brings you here.</Notice>
      )}
      {state.blockedAppIds.map((id) => {
        const app = findApp(id);
        const openUntil = state.temporaryUnlocks[id];
        const open = openUntil != null && openUntil > now;
        return (
          <Pressable key={id} onPress={() => navigation.navigate('ReflectionUnlock', { appId: id })}>
            <Card style={styles.appRow}>
              <Text style={styles.glyph}>{app.glyph}</Text>
              <View style={styles.flex}>
                <Text style={type.label}>{app.name}</Text>
                <Text style={type.caption}>
                  {open ? `Open · locks again in ${Math.ceil((openUntil - now) / 60_000)} min` : 'Locked'}
                </Text>
              </View>
              <Text style={[styles.status, open && styles.statusOpen]}>{open ? 'Open' : '🔒'}</Text>
            </Card>
          </Pressable>
        );
      })}
      <Button label="Edit blocked apps" variant="secondary" onPress={() => navigation.navigate('AppPicker')} />

      {state.isPro && state.reflections.length > 0 && (
        <>
          <SectionTitle>Recent</SectionTitle>
          {state.reflections.slice(0, 5).map((r) => (
            <Card key={r.id}>
              <Text style={type.label}>
                {describeEntry(r)} · {findApp(r.appId).name}
                {r.cost ? ` · ${formatMoney(r.cost)}` : ''}
              </Text>
              {r.item ? <Text style={type.body}>{r.item}</Text> : null}
              {r.reasonAgainst ? <Text style={type.caption}>Reason not to: {r.reasonAgainst}</Text> : null}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignItems: 'center', paddingVertical: 28, backgroundColor: colors.primary, borderColor: colors.primary },
  heroNumber: { fontSize: 64, fontWeight: '800', color: colors.onPrimary },
  heroLabel: { fontSize: 16, color: colors.primarySoft },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1 },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  glyph: { fontSize: 28 },
  status: { fontSize: 18 },
  statusOpen: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
