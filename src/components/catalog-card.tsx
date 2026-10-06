import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { catalogDisplayName, type CatalogPlant } from '@/catalog';
import { fr } from '@/i18n/fr';
import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';
import { PlantAvatar } from './plant-avatar';

export function CatalogCard({ plant }: { plant: CatalogPlant }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/catalog/[id]', params: { id: plant.id } })}
      accessibilityRole="button"
      accessibilityLabel={catalogDisplayName(plant)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <PlantAvatar seed={plant.id} catalogId={plant.id} rounded={0} style={styles.image} />
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={1}>
          {catalogDisplayName(plant)}
        </AppText>
        <AppText variant="latin" color="textMuted" numberOfLines={1}>
          {plant.latin_name}
        </AppText>
        <View style={styles.meta}>
          <Ionicons name="water-outline" size={13} color={colors.water} />
          <AppText variant="caption" color="textMuted">
            {fr.daysShort(plant.water_every_days_summer)}–
            {fr.daysShort(plant.water_every_days_winter)}
          </AppText>
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <AppText variant="caption" color="textMuted">
            {fr.difficulty[plant.difficulty]}
          </AppText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  image: { width: '100%', aspectRatio: 1 },
  body: { padding: space.md, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 2 },
});
