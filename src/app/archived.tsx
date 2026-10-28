import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogDisplayName, getCatalogPlant } from '@/catalog';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { PlantAvatar } from '@/components/plant-avatar';
import { archivedPlants } from '@/domain/archive';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { radius, space, useTheme } from '@/theme';

/** Plants I archived, most recent first. Opening one shows its sheet, from where it can be restored. */
export default function ArchivedPlantsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { plants } = usePlantsStore();
  const archived = useMemo(() => archivedPlants(plants), [plants]);

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      data={archived}
      keyExtractor={(p) => p.id}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
      ListEmptyComponent={
        <EmptyState
          icon="archive-outline"
          title={fr.archive.emptyTitle}
          hint={fr.archive.emptyHint}
        />
      }
      renderItem={({ item: plant }) => {
        const catalog = plant.catalogId ? getCatalogPlant(plant.catalogId) : undefined;
        const subtitle = catalog ? catalogDisplayName(catalog) : (plant.species ?? '');
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={plant.name}
            onPress={() => router.push({ pathname: '/plant/[id]', params: { id: plant.id } })}
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
              photoPath={plant.photoPath}
              catalogId={plant.catalogId}
              size={64}
              rounded={radius.md}
            />
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={1}>
                {plant.name}
              </AppText>
              {subtitle ? (
                <AppText variant="latin" color="textMuted" numberOfLines={1}>
                  {subtitle}
                </AppText>
              ) : null}
              <AppText variant="caption" color="textMuted">
                {plant.archivedAt
                  ? fr.archive.archivedOn(
                      format(new Date(plant.archivedAt), 'd MMMM yyyy', { locale: frLocale }),
                    )
                  : fr.archive.archivedBefore}
              </AppText>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: space.lg, gap: space.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
