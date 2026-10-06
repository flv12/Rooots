import type { TextStyle } from 'react-native';

export const fonts = {
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

export const type = {
  display: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  latin: { fontFamily: fonts.displayItalic, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
