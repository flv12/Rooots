import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { PlantCard } from '@/components/plant-card';
import { SectionTitle } from '@/components/section';
import { useWaterAction } from '@/components/use-water-action';
import { fr } from '@/i18n/fr';
import { usePlantViews } from '@/store/use-plant-views';
import { radius, space, useTheme } from '@/theme';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const views = usePlantViews();
  const water = useWaterAction();

  const now = new Date();
  const due = views.filter((v) => v.status.kind !== 'upcoming');
  const upcoming = views.filter((v) => v.status.kind === 'upcoming');
  const overdueCount = due.filter((v) => v.status.kind === 'overdue').length;
  const greeting = now.getHours() < 18 ? fr.home.greetingMorning : fr.home.greetingEvening;
  const dateLabel = format(now, 'EEEE d MMMM', { locale: frLocale });

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: space.xxl * 3 },
        ]}
      >
        <AppText variant="caption" color="textMuted" style={styles.date}>
          {dateLabel}
        </AppText>
        <AppText variant="display" accessibilityRole="header">
          {greeting}
        </AppText>

        {views.length === 0 ? (
          <EmptyState icon="leaf-outline" title={fr.home.emptyTitle} hint={fr.home.emptyHint}>
            <Button
              label={fr.home.emptyCta}
              icon="book-outline"
              onPress={() => router.push('/catalog')}
            />
          </EmptyState>
        ) : (
          <>
            <View
              style={[
                styles.summary,
                { backgroundColor: due.length > 0 ? colors.water : colors.primary },
              ]}
            >
              <View style={styles.summaryIcon}>
                <Ionicons
                  name={due.length > 0 ? 'water' : 'checkmark-circle'}
                  size={28}
                  color={colors.onPrimary}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="title" color="onPrimary">
                  {due.length > 0 ? fr.toWaterCount(due.length) : fr.home.allGood}
                </AppText>
                <AppText color="onPrimary" style={styles.summarySub}>
                  {due.length > 0
                    ? overdueCount > 0
                      ? `dont ${overdueCount} en retard`
                      : 'C’est le moment'
                    : upcoming[0]
                      ? `${fr.home.allGoodHint} : ${fr.status(upcoming[0].status).toLowerCase()}`
                      : ''}
                </AppText>
              </View>
            </View>

            {due.length > 0 ? (
              <>
                <SectionTitle>{fr.home.toWater}</SectionTitle>
                <View style={styles.list}>
                  {due.map((v) => (
                    <PlantCard key={v.plant.id} view={v} onWater={() => water(v.plant)} />
                  ))}
                </View>
              </>
            ) : null}

            {upcoming.length > 0 ? (
              <>
                <SectionTitle>{fr.home.upcoming}</SectionTitle>
                <View style={styles.list}>
                  {upcoming.map((v) => (
                    <PlantCard key={v.plant.id} view={v} onWater={() => water(v.plant)} />
                  ))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push('/catalog')}
        accessibilityRole="button"
        accessibilityLabel={fr.catalog.add}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg },
  date: { textTransform: 'capitalize', marginBottom: 2 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    marginTop: space.xl,
  },
  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySub: { opacity: 0.9 },
  list: { gap: space.md },
  fab: {
    position: 'absolute',
    right: space.lg,
    bottom: space.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
