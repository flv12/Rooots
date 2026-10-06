import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <AppText variant="label" color="textMuted" accessibilityRole="header">
        {children.toUpperCase()}
      </AppText>
      {right}
    </View>
  );
}

export function Card({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
    marginTop: space.xl,
  },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  padded: { padding: space.lg },
});
