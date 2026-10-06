import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

export function Chip({ label, selected = false, onPress, icon }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color={selected ? colors.onPrimary : colors.textMuted} />
      ) : null}
      <AppText variant="caption" color={selected ? 'onPrimary' : 'text'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.md,
    minHeight: 36,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
