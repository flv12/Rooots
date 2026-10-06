import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, space, useTheme, type Palette } from '@/theme';

import { AppText } from './app-text';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  tint?: keyof Palette;
};

export function InfoRow({ icon, label, value, tint = 'primary' }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceAlt }]}>
        <Ionicons name={icon} size={18} color={colors[tint]} />
      </View>
      <View style={styles.text}>
        <AppText variant="caption" color="textMuted">
          {label}
        </AppText>
        <AppText variant="bodyMedium">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
});
