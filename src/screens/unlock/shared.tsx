import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { BlockableApp } from '../../services/blocking';
import { colors, radius, type } from '../../theme';

export function LockedHeader({ app, subtitle }: { app: BlockableApp; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.glyph}>{app.glyph}</Text>
      <Text style={type.display}>{app.name} is locked.</Text>
      <Text style={[type.body, styles.muted]}>{subtitle}</Text>
    </View>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={type.label}>
        {label}
        {hint ? <Text style={type.caption}>  {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export const inputStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 4 },
  glyph: { fontSize: 40 },
  muted: { color: colors.muted },
  field: { gap: 8 },
});
