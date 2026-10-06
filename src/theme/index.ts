import { useColorScheme } from 'react-native';

import { dark, leafTints, light, type Palette } from './colors';

export * from './typography';
export type { Palette };

export function useTheme(): { colors: Palette; scheme: 'light' | 'dark'; tints: string[] } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { colors: scheme === 'dark' ? dark : light, scheme, tints: leafTints[scheme] };
}

export function hashIndex(key: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}
