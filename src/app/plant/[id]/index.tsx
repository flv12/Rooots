import Ionicons from '@expo/vector-icons/Ionicons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogDisplayName, getCatalogPlant } from '@/catalog';
import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { InfoRow } from '@/components/info-row';
import { PhotoHero } from '@/components/photo-hero';
import { Card, SectionTitle } from '@/components/section';
import { statusColors } from '@/components/status-pill';
import { useToast } from '@/components/toast';
import { useWaterAction } from '@/components/use-water-action';
import { careDate, type CareDateChoice } from '@/domain/care-date';
import type { CareLog, CareType } from '@/domain/types';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { usePlantView } from '@/store/use-plant-views';
import { radius, space, useTheme } from '@/theme';

const careIcons: Record<CareType, keyof typeof Ionicons.glyphMap> = {
  water: 'water',
  fertilize: 'flask',
  repot: 'cube',
  prune: 'cut',
  other: 'ellipsis-horizontal',
};

const fmt = (d: Date, pattern: string) => format(d, pattern, { locale: frLocale });

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const view = usePlantView(id);
  const { logs, logCare, removeLog, restoreLog, archivePlant } = usePlantsStore();
  const water = useWaterAction();
  const toast = useToast();
  // null = closed, 'type' = choosing the care, { type } = choosing when it was done.
  const [careStep, setCareStep] = useState<null | 'type' | { type: CareType }>(null);
  const [selectedLog, setSelectedLog] = useState<CareLog | null>(null);

  const history = useMemo(
    () =>
      logs
        .filter((l) => l.plantId === id)
        .sort((a, b) => b.doneAt.localeCompare(a.doneAt))
        .slice(0, 12),
    [logs, id],
  );

  if (!view || view.plant.archived) {
    return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;
  }

  const { plant, status, nextWatering, lastWatered, interval } = view;
  const catalog = plant.catalogId ? getCatalogPlant(plant.catalogId) : undefined;
  const sc = statusColors(status, colors);

  const saveCare = (type: CareType, choice: CareDateChoice) => {
    const doneAt = careDate(choice, new Date());
    const logId = logCare(plant.id, type, null, doneAt);
    toast.show({
      message: fr.plant.careSaved(fr.care[type], fmt(doneAt, 'EEEE d MMMM')),
      actionLabel: fr.home.undo,
      onAction: () => removeLog(logId),
    });
  };

  const pickCareDate = (type: CareType) => {
    DateTimePickerAndroid.open({
      value: new Date(),
      mode: 'date',
      maximumDate: new Date(),
      onValueChange: (_event, date) => saveCare(type, date),
    });
  };

  const careActions: SheetAction[] =
    careStep === 'type'
      ? (['water', 'fertilize', 'repot', 'prune'] as const).map((t) => ({
          label: fr.care[t],
          icon: careIcons[t],
          // Keeps the sheet open on the second step (the sheet closes itself before onPress).
          onPress: () => setCareStep({ type: t }),
        }))
      : careStep
        ? [
            {
              label: fr.plant.when.today,
              icon: 'today-outline',
              onPress: () => saveCare(careStep.type, 'today'),
            },
            {
              label: fr.plant.when.yesterday,
              icon: 'arrow-undo-outline',
              onPress: () => saveCare(careStep.type, 'yesterday'),
            },
            {
              label: fr.plant.when.pick,
              icon: 'calendar-outline',
              onPress: () => pickCareDate(careStep.type),
            },
          ]
        : [];

  const logActions: SheetAction[] = selectedLog
    ? [
        {
          label: fr.plant.deleteLog,
          icon: 'trash-outline',
          destructive: true,
          onPress: () => {
            const removed = selectedLog;
            removeLog(removed.id);
            toast.show({
              message: fr.plant.logDeleted(fr.care[removed.type]),
              actionLabel: fr.home.undo,
              onAction: () => restoreLog(removed),
            });
          },
        },
      ]
    : [];

  const askArchive = () =>
    Alert.alert(fr.plant.archiveConfirmTitle, fr.plant.archiveConfirmBody, [
      { text: fr.plant.cancel, style: 'cancel' },
      {
        text: fr.plant.archive,
        style: 'destructive',
        onPress: () => {
          archivePlant(plant.id);
          router.back();
        },
      },
    ]);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + space.xxl }}
      >
        <PhotoHero
          seed={plant.id}
          photoPath={plant.photoPath}
          catalogId={plant.catalogId}
          style={styles.hero}
        />

        <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <AppText variant="display" accessibilityRole="header">
                {plant.name}
              </AppText>
              <AppText variant="latin" color="textMuted">
                {catalog
                  ? `${catalogDisplayName(catalog)} · ${catalog.latin_name}`
                  : (plant.species ?? '')}
              </AppText>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/plant/[id]/edit', params: { id: plant.id } })
              }
              accessibilityRole="button"
              accessibilityLabel={fr.plant.edit}
              style={[styles.iconBtn, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.next, { backgroundColor: sc.bg }]}>
            <View style={styles.flex}>
              <AppText variant="label" color={sc.fg}>
                {fr.plant.nextWatering.toUpperCase()}
              </AppText>
              <AppText variant="title" color={sc.fg}>
                {fr.status(status)}
              </AppText>
              <AppText variant="caption" color={sc.fg}>
                {fmt(nextWatering, 'EEEE d MMMM')}
              </AppText>
            </View>
            <Button
              label={fr.plant.waterNow}
              icon="water"
              variant="water"
              onPress={() => water(plant)}
            />
          </View>

          <Card>
            <InfoRow
              icon="repeat-outline"
              label={`${fr.plant.frequency} · ${fr.plant.frequencySource[interval.source]}`}
              value={fr.everyDays(interval.days)}
              tint="water"
            />
            <InfoRow
              icon="calendar-outline"
              label={fr.plant.lastWatered}
              value={lastWatered ? fmt(lastWatered, 'EEEE d MMMM') : fr.plant.never}
            />
            {plant.location ? (
              <InfoRow icon="home-outline" label={fr.plant.location} value={plant.location} />
            ) : null}
          </Card>

          {plant.notes ? (
            <View style={[styles.notes, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
              <AppText style={styles.flex}>{plant.notes}</AppText>
            </View>
          ) : null}

          {catalog ? (
            <>
              <SectionTitle
                right={
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={8}
                    onPress={() =>
                      router.push({ pathname: '/catalog/[id]', params: { id: catalog.id } })
                    }
                  >
                    <AppText variant="caption" color="primary">
                      {fr.plant.fromCatalog} →
                    </AppText>
                  </Pressable>
                }
              >
                {fr.catalog.sections.tips}
              </SectionTitle>
              <View style={[styles.tip, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <View style={styles.flex}>
                  <AppText>{catalog.water_notes_fr}</AppText>
                  <AppText color="textMuted" variant="caption" style={styles.tipSub}>
                    {catalog.tips_fr}
                  </AppText>
                </View>
              </View>
            </>
          ) : null}

          <SectionTitle
            right={
              <Pressable accessibilityRole="button" onPress={() => setCareStep('type')} hitSlop={8}>
                <AppText variant="caption" color="primary">
                  + {fr.plant.logCare}
                </AppText>
              </Pressable>
            }
          >
            {fr.plant.history}
          </SectionTitle>
          <Card padded={false}>
            {history.length === 0 ? (
              <AppText color="textMuted" style={styles.emptyHistory}>
                {fr.plant.noHistory}
              </AppText>
            ) : (
              history.map((l, i) => (
                <Pressable
                  key={l.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${fr.care[l.type]}, ${fmt(new Date(l.doneAt), 'd MMMM HH:mm')}`}
                  accessibilityHint={fr.plant.logHint}
                  onPress={() => setSelectedLog(l)}
                  style={({ pressed }) => [
                    styles.log,
                    i > 0 && {
                      borderTopColor: colors.border,
                      borderTopWidth: StyleSheet.hairlineWidth,
                    },
                    pressed && { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <View
                    style={[
                      styles.logIcon,
                      {
                        backgroundColor: l.type === 'water' ? colors.waterSoft : colors.primarySoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={careIcons[l.type]}
                      size={16}
                      color={l.type === 'water' ? colors.water : colors.primary}
                    />
                  </View>
                  <AppText variant="bodyMedium" style={styles.flex}>
                    {fr.care[l.type]}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {fmt(new Date(l.doneAt), 'd MMM, HH:mm')}
                  </AppText>
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </Card>

          <Button
            label={fr.plant.archive}
            icon="archive-outline"
            variant="ghost"
            onPress={askArchive}
            style={styles.archive}
          />
        </View>
      </ScrollView>
      <ActionSheet
        visible={careStep != null}
        title={careStep && careStep !== 'type' ? fr.care[careStep.type] : fr.plant.logCare}
        message={careStep && careStep !== 'type' ? fr.plant.when.question : undefined}
        actions={careActions}
        onClose={() => setCareStep(null)}
      />
      <ActionSheet
        visible={selectedLog != null}
        title={selectedLog ? fr.care[selectedLog.type] : ''}
        message={selectedLog ? fmt(new Date(selectedLog.doneAt), 'EEEE d MMMM à HH:mm') : undefined}
        actions={logActions}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { width: '100%', aspectRatio: 1.15 },
  sheet: {
    marginTop: -space.xl,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    gap: space.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    marginTop: space.sm,
  },
  notes: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  tip: { flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg },
  tipSub: { marginTop: space.xs },
  log: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: { padding: space.lg },
  archive: { marginTop: space.lg, alignSelf: 'center' },
});
