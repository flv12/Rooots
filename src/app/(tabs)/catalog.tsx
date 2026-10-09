import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogPlants } from '@/catalog';
import { categoryCounts, filterCatalog } from '@/catalog/filter';
import type { Category, CatalogPlant } from '@/catalog/schema';
import { AppText } from '@/components/app-text';
import { BackToTopButton } from '@/components/back-to-top-button';
import { CatalogCard } from '@/components/catalog-card';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { animateScrollToTop } from '@/components/scroll-to-top';
import { fr } from '@/i18n/fr';
import { fonts, radius, space, useTheme } from '@/theme';

type Filter = 'easy' | 'lowLight' | 'petSafe';

const categoryIcons: Record<Category, ComponentProps<typeof Ionicons>['name']> = {
  foliage: 'leaf-outline',
  succulent: 'sunny-outline',
  flowering: 'flower-outline',
  palm: 'umbrella-outline',
  fern: 'git-branch-outline',
  carnivorous: 'bug-outline',
  edible: 'nutrition-outline',
};

const counts = categoryCounts(catalogPlants);

export default function CatalogScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const listRef = useRef<FlatList<CatalogPlant>>(null);
  const [showTop, setShowTop] = useState(false);
  const offset = useRef(0);
  const cancelScroll = useRef<(() => void) | null>(null);

  // « Back to top » appears after about one screen of scrolling.
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
    const past = offset.current > screenHeight;
    if (past !== showTop) setShowTop(past);
  };

  const stopScrollAnimation = () => {
    cancelScroll.current?.();
    cancelScroll.current = null;
  };

  const scrollToTop = () => {
    stopScrollAnimation();
    if (listRef.current) cancelScroll.current = animateScrollToTop(listRef.current, offset.current);
  };

  useEffect(() => stopScrollAnimation, []);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [category, setCategory] = useState<Category | null>(null);

  const results = useMemo(
    () =>
      filterCatalog(catalogPlants, {
        query,
        category,
        easy: filters.has('easy'),
        lowLight: filters.has('lowLight'),
        petSafe: filters.has('petSafe'),
      }),
    [query, filters, category],
  );

  const toggle = (f: Filter) =>
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  const header = (
    <View style={styles.header}>
      <AppText variant="display" accessibilityRole="header">
        {fr.catalog.title}
      </AppText>
      <AppText color="textMuted">{`${fr.catalog.subtitle} · ${fr.plantCount(catalogPlants.length)}`}</AppText>

      <View
        style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={fr.catalog.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel={fr.catalog.searchPlaceholder}
        />
        {query ? (
          <Pressable accessibilityLabel="Effacer" hitSlop={10} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.filters}>
        <Chip
          label={fr.allCategories}
          selected={category === null}
          onPress={() => setCategory(null)}
        />
        {counts.map(([c, n]) => (
          <Chip
            key={c}
            icon={categoryIcons[c]}
            label={`${fr.category[c]} · ${n}`}
            selected={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.filters}>
        <Chip
          icon="happy-outline"
          label={fr.catalog.filters.easy}
          selected={filters.has('easy')}
          onPress={() => toggle('easy')}
        />
        <Chip
          icon="cloudy-outline"
          label={fr.catalog.filters.lowLight}
          selected={filters.has('lowLight')}
          onPress={() => toggle('lowLight')}
        />
        <Chip
          icon="paw-outline"
          label={fr.catalog.filters.petSafe}
          selected={filters.has('petSafe')}
          onPress={() => toggle('petSafe')}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <FlatList
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        // Any touch takes over from the animated scroll to top.
        onScrollBeginDrag={stopScrollAnimation}
        style={{ backgroundColor: colors.bg }}
        data={results}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={header}
        renderItem={({ item }) => <CatalogCard plant={item} />}
        ListEmptyComponent={
          <EmptyState
            icon="search-outline"
            title={fr.catalog.noResults}
            hint={fr.catalog.noResultsHint}
          />
        }
        ListFooterComponent={
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/plant/new')}
            style={({ pressed }) => [
              styles.manual,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <AppText variant="bodyMedium" color="primary">
              {fr.catalog.addManual}
            </AppText>
          </Pressable>
        }
      />
      <BackToTopButton visible={showTop} label={fr.catalog.backToTop} onPress={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.md },
  header: { gap: space.xs, marginBottom: space.sm },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
    paddingHorizontal: space.lg,
    minHeight: 50,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, paddingVertical: space.sm },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  divider: { height: StyleSheet.hairlineWidth, marginTop: space.md },
  row: { gap: space.md },
  manual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.lg,
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
