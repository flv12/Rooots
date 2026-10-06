import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { getCatalogPlant, catalogDisplayName } from '@/catalog';
import type { PlantView } from '@/domain/plant-views';
import { fr } from '@/i18n/fr';
import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';
import { PlantAvatar } from './plant-avatar';
import { StatusPill } from './status-pill';

type Props = { view: PlantView; onWater: () => void };

export function PlantCard({ view, onWater }: Props) {
  const { colors } = useTheme();
  const { plant, status } = view;
  const catalog = plant.catalogId ? getCatalogPlant(plant.catalogId) : undefined;
  const subtitle = [catalog ? catalogDisplayName(catalog) : plant.species, plant.location]
    .filter(Boolean)
    .join(' · ');
  const due = status.kind !== 'upcoming';

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/plant/[id]', params: { id: plant.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${plant.name}, ${fr.status(status)}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <PlantAvatar
        seed={plant.id}
        photoUri={plant.photoUri}
        catalogId={plant.catalogId}
        size={64}
        rounded={radius.md}
      />
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={1}>
          {plant.name}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        <StatusPill status={status} />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${fr.home.water} ${plant.name}`}
        hitSlop={8}
        onPress={onWater}
        style={({ pressed }) => [
          styles.water,
          {
            backgroundColor: due ? colors.water : colors.waterSoft,
            transform: [{ scale: pressed ? 0.92 : 1 }],
          },
        ]}
      >
        <Ionicons name="water" size={22} color={due ? colors.onPrimary : colors.water} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: { flex: 1, gap: 4 },
  water: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
