import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Typography = {
  // A fashionable, elegant font stack
  fashion: Platform.OS === 'ios' ? 'Didot' : 'serif',
  fashionBold: Platform.OS === 'ios' ? 'Didot-Bold' : 'serif', // On Android, weight will handle boldness
};

export const Colors = {
  // Core Organic Palette
  primary: '#344E41', // Deep Forest Green (Buttons, Accents)
  primaryLight: '#EDF1E4', // Sage Tint
  primaryDark: '#1B2621', // Darker Forest
  secondary: '#A3B18A', // Sage Green (Headers, Chips)
  accent: '#DAD7CD', // Pale Cream (Secondary Accents)
  
  // Backgrounds & Surfaces
  background: '#F8F9F5', // Soft Silk Silk
  surface: '#FFFFFF', // Pure White
  surfaceAlt: '#F0F2EB', // Light Sage Tint
  
  // UI Elements
  border: '#EDF1E4',
  text: '#344E41',
  textDark: '#1B2621',
  textLight: '#6B705C',
  textInverse: '#FFFFFF',
  
  // Gradients
  gradientPrimary: ['#A3B18A', '#DAD7CD'], // Sage to Cream
  gradientSecondary: ['#344E41', '#3A5A40'], // Forest Green
  gradientAccent: ['#FFFFFF', '#F8F9F5'], // Soft White
  
  // Status Colors
  success: '#588157',
  warning: '#E9C46A',
  error: '#BC4749',

  // Navigation UI
  tabBarBg: '#FFFFFF',
  tabBarActive: '#344E41',
  tabBarInactive: '#A3B18A',
};
