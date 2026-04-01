import { DefaultTheme } from '@react-navigation/native';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7C6FE0',
    primaryDim: '#7C6FE025',
    secondary: '#4DD9AC',
    background: '#0D0D12',
    surface: '#16161F',
    surfaceVariant: '#1C1C28',
    text: '#EEEEF5',
    textMuted: '#6B6B90',
    error: '#FF6B6B',
    border: '#252540',
    priority: {
      high: '#FF6B6B',
      medium: '#FFAD5A',
      low: '#4DD9AC',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
    },
  },
};
