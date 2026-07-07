import { Platform } from 'react-native';

/**
 * Design tokens for the app.
 * Typography uses Poppins (loaded via expo-google-fonts in App.tsx) for a clean,
 * premium, highly-legible UI face, with a serif display face reserved for a
 * couple of hero moments (splash / language selection) where it reads as
 * "atelier" branding rather than everyday UI text.
 */

export const Typography = {
  // Primary UI type - Poppins. Falls back gracefully before fonts finish loading.
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',

  // Aliases kept for backwards compatibility with existing screens that
  // reference Typography.fashion / Typography.fashionBold. Pointed at Poppins
  // so every screen upgrades automatically without needing per-file edits.
  fashion: 'Poppins_600SemiBold',
  fashionBold: 'Poppins_800ExtraBold',

  // Reserved serif display face for brand moments only (splash / onboarding).
  serifDisplay: Platform.OS === 'ios' ? 'Didot' : 'serif',
};

export const Colors = {
  // Core Organic Palette — deepened slightly for better contrast & a more
  // premium, less "washed out" feel than the original.
  primary: '#2C4238',       // Deep Forest Green (Buttons, Accents)
  primaryLight: '#EAF0E3',  // Sage Tint
  primaryDark: '#16211B',   // Darker Forest
  secondary: '#8FA377',     // Sage Green (Headers, Chips) — slightly richer
  accent: '#D8C9A3',        // Warm Sand (Secondary Accents) — was flat cream, now warmer
  gold: '#C89B3C',          // Reserved for premium/highlight moments (badges, "popular" tags)

  // Backgrounds & Surfaces
  background: '#F7F8F2',
  surface: '#FFFFFF',
  surfaceAlt: '#EFF2E8',
  surfaceSunken: '#E9EDE1',

  // UI Elements
  border: '#E4E9D9',
  borderStrong: '#C9D3B6',
  text: '#2C4238',
  textDark: '#1B2621',
  textLight: '#6B705C',
  textMuted: '#93998A',
  textInverse: '#FFFFFF',

  // Gradients
  gradientPrimary: ['#B7C4A0', '#EDE6D3'],   // Sage to Sand
  gradientSecondary: ['#2C4238', '#3D5945'], // Forest Green depth
  gradientAccent: ['#FFFFFF', '#F7F8F2'],
  gradientGold: ['#E9C46A', '#C89B3C'],
  gradientDusk: ['#3A66DB', '#2A4EB3'],      // used for "existing client" style actions

  // Status Colors
  success: '#4C8C5B',
  successBg: 'rgba(76, 140, 91, 0.12)',
  warning: '#D9A441',
  warningBg: 'rgba(217, 164, 65, 0.14)',
  error: '#B23A3A',
  errorBg: 'rgba(178, 58, 58, 0.10)',
  info: '#3A66DB',
  infoBg: 'rgba(58, 102, 219, 0.10)',

  // Navigation UI
  tabBarBg: '#FFFFFF',
  tabBarActive: '#2C4238',
  tabBarInactive: '#A6AC98',
};

// Consistent spacing scale — use these for new/updated layout code so
// spacing stays predictable across screens.
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  pill: 999,
};

// Shared shadow presets so elevation reads consistently instead of every
// screen hand-rolling slightly different shadow values.
export const Shadows = {
  soft: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  raised: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
