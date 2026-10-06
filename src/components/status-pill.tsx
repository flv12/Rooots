import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { WateringStatus } from '@/domain/watering';
import { fr } from '@/i18n/fr';
import { radius, space, useTheme, type Palette } from '@/theme';

import { AppText } from './app-text';

export function statusColors(
  status: WateringStatus,
  c: Palette,
): { fg: keyof Palette; bg: string } {
  if (status.kind === 'overdue') return { fg: 'overdue', bg: c.overdueSoft };
  if (status.kind === 'today') return { fg: 'water', bg: c.waterSoft };
  return { fg: 'textMuted', bg: c.surfaceAlt };
}

export function StatusPill({ status }: { status: WateringStatus }) {
  const { colors } = useTheme();
  const { fg, bg } = statusColors(status, colors);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Ionicons
        name={status.kind === 'upcoming' ? 'time-outline' : 'water'}
        size={12}
        color={colors[fg]}
      />
      <AppText variant="caption" color={fg} style={styles.text}>
        {fr.status(status)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontSize: 12 },
});
