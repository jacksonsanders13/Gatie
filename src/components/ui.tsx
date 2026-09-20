import { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space, type } from '../theme';

type ScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  edges?: Edge[];
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Page shell: scrolling body with an optional footer that stays above the keyboard. */
export function Screen({ children, footer, edges = ['bottom'], scroll = true, contentStyle }: ScreenProps) {
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        inactive && (variant === 'primary' ? styles.primaryDisabled : styles.disabledFaded),
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text style={[styles.buttonLabel, variant === 'primary' ? styles.primaryLabel : styles.quietLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small uppercase heading with a hairline rule, used to break the page into sections. */
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={type.overline}>{children}</Text>
      <View style={styles.rule} />
    </View>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <View style={styles.notice}>
      <View style={styles.noticeBar} />
      <Text style={[type.caption, styles.noticeText]}>{children}</Text>
    </View>
  );
}

/** Neutral stand-in for an app icon: the first letter in a quiet square. */
export function Monogram({ label, tone = 'default' }: { label: string; tone?: 'default' | 'onPrimary' }) {
  return (
    <View style={[styles.monogram, tone === 'onPrimary' && styles.monogramOnPrimary]}>
      <Text style={[styles.monogramText, tone === 'onPrimary' && styles.monogramTextOnPrimary]}>
        {label.trim().charAt(0).toUpperCase() || '·'}
      </Text>
    </View>
  );
}

export function StatusPill({ label, tone = 'quiet' }: { label: string; tone?: 'quiet' | 'active' }) {
  return (
    <View style={[styles.pill, tone === 'active' && styles.pillActive]}>
      <Text style={[styles.pillText, tone === 'active' && styles.pillTextActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.xxl, gap: space.lg },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  primary: { backgroundColor: colors.primary },
  primaryDisabled: { backgroundColor: colors.disabled },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lineStrong },
  ghost: { minHeight: 44 },
  disabledFaded: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  buttonLabel: { fontSize: 16, fontWeight: '600', letterSpacing: -0.1 },
  primaryLabel: { color: colors.onPrimary },
  quietLabel: { color: colors.primary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.lg,
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  notice: { flexDirection: 'row', gap: space.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.sm, padding: space.md },
  noticeBar: { width: 2, borderRadius: 1, backgroundColor: colors.lineStrong },
  noticeText: { flex: 1 },
  monogram: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramOnPrimary: { backgroundColor: 'rgba(255,255,255,0.14)' },
  monogramText: { fontSize: 15, fontWeight: '600', color: colors.inkSoft },
  monogramTextOnPrimary: { color: colors.onPrimary },
  pill: {
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceAlt,
  },
  pillActive: { backgroundColor: colors.accentSoft },
  pillText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, color: colors.muted },
  pillTextActive: { color: colors.accent },
});
