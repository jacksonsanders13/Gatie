/** One restrained palette: near-black text, warm paper, a single deep green for action. */
import type { TextStyle } from 'react-native';

export const colors = {
  bg: '#FBFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F2ED',
  ink: '#12161A',
  inkSoft: '#3D464B',
  muted: '#767F84',
  line: '#E6E3DC',
  lineStrong: '#D4D0C7',
  primary: '#1C4A3A',
  primarySoft: '#EDF2EF',
  onPrimary: '#FFFFFF',
  accent: '#A0741B',
  accentSoft: '#F8F2E4',
  danger: '#9B2C2C',
  disabled: '#C6CAC7',
};

export const radius = { xs: 6, sm: 10, md: 12, lg: 16 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, letterSpacing: -0.5, color: colors.ink },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, letterSpacing: -0.2, color: colors.ink },
  body: { fontSize: 16, lineHeight: 24, color: colors.inkSoft },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 18, color: colors.muted },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  /** Large figures: light weight, tabular so counters don't jitter. */
  figure: {
    fontSize: 52,
    lineHeight: 58,
    fontWeight: '300' as const,
    letterSpacing: -1.5,
    color: colors.ink,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
  figureSmall: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
    color: colors.ink,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
  },
};
