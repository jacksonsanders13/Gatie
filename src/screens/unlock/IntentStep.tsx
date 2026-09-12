import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '../../components/ui';
import type { BlockableApp } from '../../services/blocking';
import { UNLOCK_WINDOWS } from '../../state/actions';
import type { UnlockIntent } from '../../state/types';
import { colors, radius, type } from '../../theme';
import { LockedHeader } from './shared';

type Props = {
  app: BlockableApp;
  waitMinutes: number;
  browsesLeft: number;
  browseBlockedReason: string | null;
  checkBlockedReason: string | null;
  onPick: (intent: UnlockIntent) => void;
  onWalkAway: () => void;
};

export default function IntentStep(props: Props) {
  const { app, waitMinutes, browsesLeft, browseBlockedReason, checkBlockedReason, onPick, onWalkAway } = props;

  return (
    <Screen footer={<Button label="Never mind, I’ll skip it" variant="ghost" onPress={onWalkAway} />}>
      <LockedHeader app={app} subtitle="What are you here for?" />

      <Option
        title="Buying something"
        detail={`Write down why, then a ${waitMinutes}-min wait. Open for ${UNLOCK_WINDOWS.buying} min.`}
        onPress={() => onPick('buying')}
      />
      <Option
        title="Just browsing"
        detail={`One line, no wait. Open for ${UNLOCK_WINDOWS.browsing} min. ${browsesLeft} left today.`}
        blockedReason={browseBlockedReason}
        onPress={() => onPick('browsing')}
      />
      <Option
        title="Checking an order"
        detail={`No questions. Open for ${UNLOCK_WINDOWS.checking} min.`}
        blockedReason={checkBlockedReason}
        onPress={() => onPick('checking')}
      />

      <Text style={type.caption}>Browsing and order checks get a quick check-in next time you’re back.</Text>
    </Screen>
  );
}

type OptionProps = {
  title: string;
  detail: string;
  blockedReason?: string | null;
  onPress: () => void;
};

function Option({ title, detail, blockedReason, onPress }: OptionProps) {
  const blocked = blockedReason != null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [styles.option, blocked && styles.optionBlocked, pressed && styles.pressed]}
    >
      <View style={styles.flex}>
        <Text style={[type.label, blocked && styles.blockedText]}>{title}</Text>
        <Text style={[type.caption, blocked && styles.blockedReason]}>{blockedReason ?? detail}</Text>
      </View>
      {!blocked && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 16,
  },
  optionBlocked: { backgroundColor: colors.bg },
  pressed: { opacity: 0.8 },
  blockedText: { color: colors.muted },
  blockedReason: { color: colors.danger },
  chevron: { fontSize: 28, color: colors.primary },
});
