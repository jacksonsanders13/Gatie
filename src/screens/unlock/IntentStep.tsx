import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '../../components/ui';
import type { BlockableApp } from '../../services/blocking';
import { UNLOCK_WINDOWS } from '../../state/actions';
import type { UnlockIntent } from '../../state/types';
import { colors, radius, space, type } from '../../theme';
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

      <View style={styles.options}>
        <Option
          title="Buying something"
          detail={`Write it down, wait ${waitMinutes} min, then ${UNLOCK_WINDOWS.buying} min inside.`}
          onPress={() => onPick('buying')}
        />
        <Option
          title="Just browsing"
          detail={`One line, no wait. ${UNLOCK_WINDOWS.browsing} min inside · ${browsesLeft} left today.`}
          blockedReason={browseBlockedReason}
          onPress={() => onPick('browsing')}
        />
        <Option
          title="Checking an order"
          detail={`No questions. ${UNLOCK_WINDOWS.checking} min inside.`}
          blockedReason={checkBlockedReason}
          onPress={() => onPick('checking')}
        />
      </View>

      <Text style={type.caption}>Browsing and order checks get a short check-in next time you’re back.</Text>
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
      <View style={styles.optionText}>
        <Text style={[type.label, blocked && styles.mutedText]}>{title}</Text>
        <Text style={[type.caption, blocked && styles.blockedReason]}>{blockedReason ?? detail}</Text>
      </View>
      {!blocked && <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
  },
  optionBlocked: { backgroundColor: colors.surfaceAlt, borderColor: colors.line },
  optionText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.85 },
  mutedText: { color: colors.muted },
  blockedReason: { color: colors.danger },
  chevron: { fontSize: 24, lineHeight: 26, color: colors.lineStrong },
});
