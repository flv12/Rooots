import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, space, useTheme, type Palette } from '@/theme';

import { AppText } from './app-text';

type Variant = 'primary' | 'secondary' | 'water' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  size?: 'md' | 'lg';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function colorsFor(variant: Variant, c: Palette): { bg: string; fg: keyof Palette } {
  switch (variant) {
    case 'primary':
      return { bg: c.primary, fg: 'onPrimary' };
    case 'water':
      return { bg: c.water, fg: 'onPrimary' };
    case 'secondary':
      return { bg: c.primarySoft, fg: 'primary' };
    case 'danger':
      return { bg: c.overdueSoft, fg: 'overdue' };
    case 'ghost':
      return { bg: 'transparent', fg: 'primary' };
  }
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  size = 'md',
  disabled,
  style,
}: Props) {
  const { colors } = useTheme();
  const { bg, fg } = colorsFor(variant, colors);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' && styles.lg,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={size === 'lg' ? 20 : 18} color={colors[fg]} /> : null}
        <AppText variant="bodyMedium" color={fg}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: { minHeight: 54, paddingHorizontal: space.xl },
  pressed: { transform: [{ scale: 0.98 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
