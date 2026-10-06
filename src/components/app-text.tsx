import { Text, type TextProps } from 'react-native';

import { type, useTheme, type Palette, type TypeVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypeVariant;
  color?: keyof Palette;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: Props) {
  const { colors } = useTheme();
  return <Text style={[type[variant], { color: colors[color] }, style]} {...rest} />;
}
