import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogDisplayName, catalogPlants, type CatalogPlant } from '@/catalog';
import { searchCatalog } from '@/catalog/search';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { CatalogCard } from '@/components/catalog-card';
import { EmptyState } from '@/components/empty-state';
import { useToast } from '@/components/toast';
import {
  linkConflicts,
  linkPatch,
  type LinkChoices,
  type LinkConflicts,
} from '@/domain/catalog-link';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { fonts, radius, space, useTheme } from '@/theme';

/** Pick a catalog sheet for one of my plants, then decide what to do with data it already has. */
export default function LinkPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { plants, updatePlant } = usePlantsStore();
  const plant = plants.find((p) => p.id === id);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<CatalogPlant | null>(null);
  const [choices, setChoices] = useState<LinkChoices>({ frequency: 'mine', species: 'mine' });

  const results = useMemo(() => searchCatalog(catalogPlants, query), [query]);

  if (!plant) return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;

  const link = async (catalog: CatalogPlant, conflicts: LinkConflicts, picked: LinkChoices) => {
    await updatePlant(plant.id, linkPatch(plant, catalog.id, conflicts, picked));
    toast.show({ message: fr.link.linked(catalogDisplayName(catalog)) });
    router.back();
  };

  const pick = (catalog: CatalogPlant) => {
    const conflicts = linkConflicts(plant, catalog);
    // Nothing to decide: link right away.
    if (conflicts.frequency == null && conflicts.species == null) {
      void link(catalog, conflicts, choices);
      return;
    }
    setChoices({ frequency: 'mine', species: 'mine' });
    setChosen(catalog);
  };

  if (chosen) {
    const conflicts = linkConflicts(plant, chosen);
    return (
      <View style={[styles.flex, { backgroundColor: colors.bg }]}>
        <Stack.Screen options={{ title: fr.link.reviewTitle }} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        >
          <View>
            <AppText variant="heading">{catalogDisplayName(chosen)}</AppText>
            <AppText variant="latin" color="textMuted">
              {chosen.latin_name}
            </AppText>
          </View>
          <AppText color="textMuted">{fr.link.kept}</AppText>
          <AppText variant="bodyMedium">{fr.link.conflictsIntro}</AppText>

          {conflicts.frequency != null ? (
            <Group label={fr.link.frequency}>
              <Option
                selected={choices.frequency === 'mine'}
                label={fr.link.keepFrequency(conflicts.frequency)}
                onPress={() => setChoices((c) => ({ ...c, frequency: 'mine' }))}
              />
              <Option
                selected={choices.frequency === 'catalog'}
                label={fr.link.catalogFrequency(
                  chosen.water_every_days_summer,
                  chosen.water_every_days_winter,
                )}
                onPress={() => setChoices((c) => ({ ...c, frequency: 'catalog' }))}
              />
            </Group>
          ) : null}

          {conflicts.species != null ? (
            <Group label={fr.link.species}>
              <Option
                selected={choices.species === 'mine'}
                label={fr.link.keepSpecies(conflicts.species)}
                onPress={() => setChoices((c) => ({ ...c, species: 'mine' }))}
              />
              <Option
                selected={choices.species === 'catalog'}
                label={fr.link.catalogSpecies(chosen.latin_name)}
                onPress={() => setChoices((c) => ({ ...c, species: 'catalog' }))}
              />
            </Group>
          ) : null}
        </ScrollView>
        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + space.md,
              backgroundColor: colors.bg,
              borderColor: colors.border,
            },
          ]}
        >
          <Button
            label={fr.link.confirm}
            icon="link"
            size="lg"
            onPress={() => link(chosen, conflicts, choices)}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <View
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={fr.link.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={fr.link.searchPlaceholder}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
        ListEmptyComponent={<EmptyState icon="search-outline" title={fr.link.noResult} />}
        renderItem={({ item }) => <CatalogCard plant={item} onPress={() => pick(item)} />}
      />
    </View>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="label" color="textMuted">
        {label.toUpperCase()}
      </AppText>
      {children}
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.option,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.textMuted}
      />
      <AppText style={styles.flex}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.lg },
  group: { gap: space.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    margin: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, minHeight: 44, fontFamily: fonts.regular, fontSize: 15 },
  list: { paddingHorizontal: space.lg, gap: space.md },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
