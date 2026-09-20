import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Monogram, Notice, Screen, SectionHeader, StatusPill } from '../components/ui';
import { useNow } from '../hooks/useNow';
import type { ScreenProps } from '../navigation/types';
import { blocking, findApp } from '../services/blocking';
import { daysSinceGaveIn, describeEntry, formatMoney, moneyNotSpent, walkAwayCount } from '../state/selectors';
import { useStore } from '../state/store';
import { colors, space, type } from '../theme';

export default function DashboardScreen({ navigation }: ScreenProps<'Dashboard'>) {
  const { state } = useStore();
  const now = useNow(true, 15_000);
  const days = daysSinceGaveIn(state, now);

  return (
    <Screen>
      <Card style={styles.hero}>
        <Text style={type.figure}>{days}</Text>
        <Text style={type.caption}>{days === 1 ? 'day' : 'days'} since you last gave in</Text>
      </Card>

      {state.isPro ? (
        <View style={styles.statsRow}>
          <Card style={styles.stat}>
            <Text style={type.figureSmall}>{formatMoney(moneyNotSpent(state))}</Text>
            <Text style={type.caption}>not spent</Text>
          </Card>
          <Card style={styles.stat}>
            <Text style={type.figureSmall}>{walkAwayCount(state)}</Text>
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

      <SectionHeader>Blocked</SectionHeader>
      {!blocking.isNative && (
        <Notice>Preview mode. Tap an app to see what happens when you open it — on your phone, opening the app itself brings you here.</Notice>
      )}

      {state.blockedAppIds.length === 0 ? (
        <Card>
          <Text style={type.label}>Nothing is blocked yet</Text>
          <Text style={type.caption}>Choose the apps that get you, and Gatie will keep them shut.</Text>
        </Card>
      ) : (
        state.blockedAppIds.map((id) => {
          const app = findApp(id);
          const openUntil = state.temporaryUnlocks[id];
          const open = openUntil != null && openUntil > now;
          const detail = blocking.isNative && state.selection ? describeSelection(state.selection.appCount, state.selection.categoryCount, state.selection.webCount) : null;
          return (
            <Pressable key={id} onPress={() => navigation.navigate('ReflectionUnlock', { appId: id })}>
              <Card style={styles.row}>
                <Monogram label={app.name} />
                <View style={styles.rowText}>
                  <Text style={type.label}>{app.name}</Text>
                  <Text style={type.caption}>{detail ?? (open ? 'Unlocked' : 'Locked')}</Text>
                </View>
                <StatusPill
                  label={open ? `${Math.ceil((openUntil - now) / 60_000)} min left` : 'Locked'}
                  tone={open ? 'active' : 'quiet'}
                />
              </Card>
            </Pressable>
          );
        })
      )}

      <Button label="Edit blocked apps" variant="secondary" onPress={() => navigation.navigate('AppPicker')} />

      {state.isPro && state.reflections.length > 0 && (
        <>
          <SectionHeader>Recent</SectionHeader>
          {state.reflections.slice(0, 5).map((r) => (
            <Card key={r.id} style={styles.entry}>
              <View style={styles.entryHead}>
                <Text style={type.label}>{describeEntry(r)}</Text>
                {r.cost ? <Text style={type.caption}>{formatMoney(r.cost)}</Text> : null}
              </View>
              {r.item ? <Text style={type.body}>{r.item}</Text> : null}
              {r.reasonAgainst ? <Text style={type.caption}>Reason not to: {r.reasonAgainst}</Text> : null}
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

function describeSelection(apps: number, categories: number, webs: number): string {
  const parts = [
    apps ? `${apps} app${apps > 1 ? 's' : ''}` : null,
    categories ? `${categories} categor${categories > 1 ? 'ies' : 'y'}` : null,
    webs ? `${webs} site${webs > 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Nothing selected';
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', paddingVertical: space.xl, gap: 0 },
  statsRow: { flexDirection: 'row', gap: space.md },
  stat: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  rowText: { flex: 1, gap: 2 },
  entry: { gap: space.xs },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
