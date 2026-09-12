import { StyleSheet, Text } from 'react-native';

import { Button, Card, Screen } from '../../components/ui';
import { findApp } from '../../services/blocking';
import type { ReflectionEntry } from '../../state/types';
import { colors, type } from '../../theme';

type Props = {
  entry: ReflectionEntry;
  onAnswer: (bought: boolean) => void;
};

export default function CheckInStep({ entry, onAnswer }: Props) {
  const app = findApp(entry.appId);
  const what = entry.intent === 'browsing' ? 'just browsing' : 'checking an order';

  return (
    <Screen
      footer={
        <>
          <Button label="No, I just looked" onPress={() => onAnswer(false)} />
          <Button label="Yes, I bought something" variant="secondary" onPress={() => onAnswer(true)} />
        </>
      }
    >
      <Text style={styles.glyph}>{app.glyph}</Text>
      <Text style={type.display}>Quick check-in</Text>
      <Text style={[type.body, styles.muted]}>
        Last time you opened {app.name}, you said you were {what}.
      </Text>
      {entry.item ? (
        <Card>
          <Text style={type.caption}>You were looking for</Text>
          <Text style={type.body}>{entry.item}</Text>
        </Card>
      ) : null}
      <Text style={type.title}>Did you end up buying anything?</Text>
      <Text style={type.caption}>Be honest. Nobody sees this but you, and it keeps quick unlocks working.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  glyph: { fontSize: 40 },
  muted: { color: colors.muted },
});
