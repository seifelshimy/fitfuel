// Shared design tokens. Every screen styles itself from these values
// so the app looks consistent (UI requirement: consistent styling).

export const colors = {
  background: '#F5F5F1',
  surface: '#FFFFFF',
  surfaceMuted: '#ECECE6',
  ink: '#15171B',
  inkSoft: '#3C4048',
  muted: '#727680',
  border: '#E1E1DA',
  accent: '#C6F432', // electric lime, used with dark text only
  accentInk: '#1C2400',
  danger: '#C93B3B',
  dangerSoft: '#FBEAEA',
  success: '#2F8A4E',
  star: '#E8A317',
} as const;

// Each category gets its own tile colour so products are easy to scan.
export const categoryColors: Record<string, string> = {
  protein: '#DCE8FF',
  creatine: '#FFE3D3',
  vitamins: '#E2F6D5',
  'pre-workout': '#FFE0EC',
  snacks: '#F6EBCB',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.6, color: colors.ink },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.ink },
  subtitle: { fontSize: 16, fontWeight: '600' as const, color: colors.ink },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.inkSoft, lineHeight: 21 },
  caption: { fontSize: 13, fontWeight: '500' as const, color: colors.muted },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
};
