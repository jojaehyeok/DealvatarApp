import { useColorScheme } from 'react-native';

export interface Theme {
  bg: string;
  card: string;
  cardBorder: string;
  text: string;
  textSub: string;
  textFaint: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  inputBg: string;
  divider: string;
  statusBar: 'light' | 'dark';
}

const dark: Theme = {
  bg: '#0f0f0f',
  card: '#1c1c1e',
  cardBorder: '#2a2a2c',
  text: '#ffffff',
  textSub: '#8b8b8b',
  textFaint: '#666666',
  accent: '#8b5cf6',
  accentSoft: '#a78bfa',
  danger: '#ff6b6b',
  dangerBg: '#3a1414',
  dangerBorder: '#5c2020',
  inputBg: '#1c1c1e',
  divider: '#222222',
  statusBar: 'light',
};

const light: Theme = {
  bg: '#f5f5f7',
  card: '#ffffff',
  cardBorder: '#e5e5e7',
  text: '#111111',
  textSub: '#6b6b6f',
  textFaint: '#9a9a9d',
  accent: '#7c3aed',
  accentSoft: '#7c3aed',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#fecaca',
  inputBg: '#f0f0f2',
  divider: '#e5e5e7',
  statusBar: 'dark',
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'light' ? light : dark;
}
