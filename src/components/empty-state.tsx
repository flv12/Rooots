import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space, useTheme } from '@/theme';

import { AppText } from './app-text';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  hint?: string;
  children?: ReactNode;
};

export function EmptyState({ icon, title, hint, children }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.box}>
      <View style={[styles.circle, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="title" style={styles.center}>
        {title}
      </AppText>
      {hint ? (
        <AppText color="textMuted" style={styles.center}>
          {hint}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
  },
  circle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
});
