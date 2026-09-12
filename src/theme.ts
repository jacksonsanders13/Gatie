export const colors = {
  bg: '#F6F3EC',
  surface: '#FFFFFF',
  ink: '#1B2A24',
  muted: '#5F6B66',
  line: '#E3DED3',
  primary: '#1F4D3A',
  primarySoft: '#E4EDE8',
  onPrimary: '#FFFFFF',
  accent: '#D9962E',
  accentSoft: '#FBF0DC',
  danger: '#B4442F',
  disabled: '#B9C2BD',
};

export const radius = { sm: 8, md: 14, lg: 20 };

export const type = {
  display: { fontSize: 30, fontWeight: '700' as const, color: colors.ink, lineHeight: 36 },
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, color: colors.ink, lineHeight: 23 },
  label: { fontSize: 15, fontWeight: '600' as const, color: colors.ink },
  caption: { fontSize: 13, color: colors.muted, lineHeight: 18 },
};
