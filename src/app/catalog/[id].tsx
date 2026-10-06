import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogDisplayName, getCatalogPlant } from '@/catalog';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { InfoRow } from '@/components/info-row';
import { PhotoHero } from '@/components/photo-hero';
import { Card, SectionTitle } from '@/components/section';
import { fr } from '@/i18n/fr';
import { radius, space, useTheme } from '@/theme';

export default function CatalogDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const plant = getCatalogPlant(id);

  if (!plant) {
    return <EmptyState icon="leaf-outline" title={fr.catalog.noResults} />;
  }

  const otherNames = [...plant.common_names_fr.slice(1), ...plant.common_names_en];
  const toxicTint =
    plant.pet_toxic === 'yes' ? 'overdue' : plant.pet_toxic === 'no' ? 'primary' : 'textMuted';

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <PhotoHero seed={plant.id} catalogId={plant.id} style={styles.hero} />

        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={styles.badges}>
            <Badge icon="sparkles-outline" label={fr.difficulty[plant.difficulty]} />
            <Badge icon="sunny-outline" label={fr.light[plant.light]} />
          </View>
          <AppText variant="display" accessibilityRole="header">
            {catalogDisplayName(plant)}
          </AppText>
          <AppText variant="latin" color="textMuted" style={styles.latin}>
            {plant.latin_name} · {plant.family}
          </AppText>
          {otherNames.length > 0 ? (
            <AppText variant="caption" color="textMuted">
              {otherNames.join(', ')}
            </AppText>
          ) : null}

          {plant.data_status === 'draft' ? (
            <View style={[styles.draft, { backgroundColor: colors.warnSoft }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.warn} />
              <AppText variant="caption" color="warn">
                {fr.catalog.draft}
              </AppText>
            </View>
          ) : null}

          <SectionTitle>{fr.catalog.sections.watering}</SectionTitle>
          <Card>
            <View style={styles.seasons}>
              <Season icon="sunny" label={fr.catalog.summer} days={plant.water_every_days_summer} />
              <View style={[styles.vr, { backgroundColor: colors.border }]} />
              <Season icon="snow" label={fr.catalog.winter} days={plant.water_every_days_winter} />
            </View>
            <AppText color="textMuted" style={styles.note}>
              {plant.water_notes_fr}
            </AppText>
          </Card>

          <SectionTitle>{fr.catalog.sections.care}</SectionTitle>
          <Card>
            <InfoRow
              icon="sunny-outline"
              label="Lumière"
              value={fr.light[plant.light]}
              tint="warn"
            />
            <InfoRow
              icon="cloud-outline"
              label="Humidité"
              value={fr.humidity[plant.humidity]}
              tint="water"
            />
            <InfoRow
              icon="thermometer-outline"
              label="Température"
              value={fr.catalog.temperature(plant.temp_min_c, plant.temp_max_c)}
              tint="overdue"
            />
            <InfoRow icon="layers-outline" label={fr.catalog.soil} value={plant.soil_fr} />
            <InfoRow icon="flask-outline" label={fr.catalog.fertilize} value={plant.fertilize_fr} />
            {plant.repot_every_years ? (
              <InfoRow
                icon="cube-outline"
                label="Rempotage"
                value={fr.catalog.repot(plant.repot_every_years)}
              />
            ) : null}
          </Card>

          <SectionTitle>{fr.catalog.sections.tips}</SectionTitle>
          <View style={[styles.tip, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="bulb-outline" size={20} color={colors.primary} />
            <AppText style={styles.flex}>{plant.tips_fr}</AppText>
          </View>

          {plant.problems.length > 0 ? (
            <>
              <SectionTitle>{fr.catalog.sections.problems}</SectionTitle>
              <Card>
                {plant.problems.map((pb, i) => (
                  <View
                    key={pb.symptom_fr}
                    style={[
                      styles.problem,
                      i > 0 && {
                        borderTopColor: colors.border,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <AppText variant="heading">{pb.symptom_fr}</AppText>
                    <AppText variant="caption" color="textMuted">
                      {pb.cause_fr}
                    </AppText>
                    <AppText>{pb.fix_fr}</AppText>
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <SectionTitle>{fr.catalog.sections.pets}</SectionTitle>
          <Card>
            <InfoRow
              icon="paw-outline"
              label={fr.petToxic[plant.pet_toxic]}
              value={plant.pet_toxic_note_fr ?? '—'}
              tint={toxicTint}
            />
            <AppText variant="caption" color="textMuted">
              {fr.catalog.petDisclaimer}
            </AppText>
          </Card>

          <SectionTitle>{fr.catalog.sections.sources}</SectionTitle>
          {plant.sources.map((s) => (
            <AppText key={s.name} variant="caption" color="textMuted">
              • {s.name}
            </AppText>
          ))}
        </View>
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
          label={fr.catalog.add}
          icon="add-circle-outline"
          size="lg"
          onPress={() => router.push({ pathname: '/plant/new', params: { catalogId: plant.id } })}
        />
      </View>
    </View>
  );
}

function Badge({ icon, label }: { icon: 'sparkles-outline' | 'sunny-outline'; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
    </View>
  );
}

function Season({ icon, label, days }: { icon: 'sunny' | 'snow'; label: string; days: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.season}>
      <Ionicons name={icon} size={18} color={icon === 'sunny' ? colors.warn : colors.water} />
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="title">{fr.daysShort(days)}</AppText>
      <AppText variant="caption" color="textMuted">
        entre deux arrosages
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { width: '100%', aspectRatio: 1.1 },
  sheet: {
    marginTop: -space.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
  },
  badges: { flexDirection: 'row', gap: space.sm, marginBottom: space.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  latin: { marginTop: 2, marginBottom: 4 },
  draft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    marginTop: space.lg,
  },
  seasons: { flexDirection: 'row', alignItems: 'stretch' },
  season: { flex: 1, alignItems: 'center', gap: 2 },
  vr: { width: StyleSheet.hairlineWidth },
  note: { marginTop: space.md, textAlign: 'center' },
  tip: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  problem: { paddingVertical: space.md, gap: 2 },
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
