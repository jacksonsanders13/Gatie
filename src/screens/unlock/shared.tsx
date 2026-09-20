import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Monogram } from '../../components/ui';
import type { BlockableApp } from '../../services/blocking';
import { colors, radius, space, type } from '../../theme';

export function LockedHeader({ app, subtitle }: { app: BlockableApp; subtitle: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.badgeRow}>
        <Monogram label={app.name} />
        <Text style={type.overline}>Locked</Text>
      </View>
      <Text style={type.display}>{app.name}</Text>
      <Text style={type.body}>{subtitle}</Text>
    </View>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={type.label}>{label}</Text>
        {hint ? <Text style={type.caption}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  multiline: { minHeight: 68, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  header: { gap: space.sm, marginBottom: space.xs },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  field: { gap: space.sm },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
});
