import Ionicons from '@expo/vector-icons/Ionicons';
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
import { PhotoStrip } from '@/components/photo-strip';
import { Card, SectionTitle } from '@/components/section';
import { statusColors } from '@/components/status-pill';
import { useToast } from '@/components/toast';
import { careIcons, useAddActivity } from '@/components/use-add-activity';
import { useWaterAction } from '@/components/use-water-action';
import { photosOf } from '@/domain/photos';
import { unlinkPatch } from '@/domain/catalog-link';
import { buildTimeline, type TimelineItem } from '@/domain/timeline';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { usePlantView } from '@/store/use-plant-views';
import { radius, space, useTheme } from '@/theme';

/** Latest items of the timeline previewed on the page. */
const PREVIEW_COUNT = 5;

const fmt = (d: Date, pattern: string) => format(d, pattern, { locale: frLocale });

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const view = usePlantView(id);
  const { logs, photos, notes, archivePlant, restorePlant, deletePlant, updatePlant } =
    usePlantsStore();
  const toast = useToast();
  const [linkMenu, setLinkMenu] = useState(false);
  const water = useWaterAction();
  const add = useAddActivity(id);

  const plantPhotos = useMemo(() => photosOf(photos, id), [photos, id]);
  const preview = useMemo(
    () => buildTimeline(id, logs, photos, notes).slice(0, PREVIEW_COUNT),
    [id, logs, photos, notes],
  );

  if (!view) {
    return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;
  }

  const { plant, status, nextWatering, lastWatered, interval, observed } = view;
  // An archived plant can be looked at, restored or deleted, nothing else.
  const readOnly = plant.archived;
  const catalog = plant.catalogId ? getCatalogPlant(plant.catalogId) : undefined;
  const sc = statusColors(status, colors);

  const openTimeline = () =>
    router.push({ pathname: '/plant/[id]/timeline', params: { id: plant.id } });

  const previewLabel = (item: TimelineItem): string =>
    item.kind === 'care'
      ? fr.care[item.log.type]
      : item.kind === 'note'
        ? item.note.body
        : fr.timeline.photoAdded;

  const previewIcon = (item: TimelineItem): keyof typeof Ionicons.glyphMap =>
    item.kind === 'care'
      ? careIcons[item.log.type]
      : item.kind === 'note'
        ? 'document-text-outline'
        : 'camera-outline';

  const askUnlink = () => {
    const patch = unlinkPatch(plant, catalog, new Date());
    Alert.alert(fr.link.unlinkTitle, fr.link.unlinkBody(patch.waterEveryDays), [
      { text: fr.plant.cancel, style: 'cancel' },
      {
        text: fr.link.unlink,
        style: 'destructive',
        onPress: async () => {
          await updatePlant(plant.id, patch);
          toast.show({ message: fr.link.unlinked });
        },
      },
    ]);
  };

  const openLinkPicker = () =>
    router.push({ pathname: '/plant/[id]/link', params: { id: plant.id } });

  const linkActions: SheetAction[] = [
    { label: fr.link.change, icon: 'swap-horizontal-outline', onPress: openLinkPicker },
    { label: fr.link.unlink, icon: 'unlink-outline', destructive: true, onPress: askUnlink },
  ];

  const askRestore = () => {
    restorePlant(plant.id);
    toast.show({ message: fr.archive.restored(plant.name) });
  };

  const askDelete = () =>
    Alert.alert(fr.archive.deleteTitle, fr.archive.deleteBody, [
      { text: fr.plant.cancel, style: 'cancel' },
      {
        text: fr.archive.deleteForever,
        style: 'destructive',
        onPress: () => {
          deletePlant(plant.id);
          toast.show({ message: fr.archive.deleted });
          router.back();
        },
      },
    ]);

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
            {readOnly ? null : (
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
            )}
          </View>

          <PhotoStrip
            photos={plantPhotos}
            onOpen={openTimeline}
            onAdd={readOnly ? undefined : add.openPhoto}
          />

          {readOnly ? (
            <View style={[styles.banner, { backgroundColor: colors.surfaceAlt }]}>
              <View style={styles.bannerHead}>
                <Ionicons name="archive-outline" size={22} color={colors.textMuted} />
                <View style={styles.flex}>
                  <AppText variant="bodyMedium">
                    {plant.archivedAt
                      ? fr.archive.archivedOn(fmt(new Date(plant.archivedAt), 'd MMMM yyyy'))
                      : fr.archive.bannerTitle}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {fr.archive.bannerBody}
                  </AppText>
                </View>
              </View>
              <Button label={fr.archive.restore} icon="arrow-undo-outline" onPress={askRestore} />
              <Button
                label={fr.archive.deleteForever}
                icon="trash-outline"
                variant="danger"
                onPress={askDelete}
              />
            </View>
          ) : (
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
          )}

          <Card>
            <InfoRow
              icon="repeat-outline"
              label={`${fr.plant.frequency} · ${fr.plant.frequencySource[interval.source]}`}
              value={fr.everyDays(interval.days)}
              tint="water"
            />
            <InfoRow
              icon="analytics-outline"
              label={fr.plant.observedRhythm}
              value={observed ? fr.everyDays(observed.days) : fr.plant.observedNone}
            />
            <InfoRow
              icon="calendar-outline"
              label={fr.plant.lastWatered}
              value={lastWatered ? fmt(lastWatered, 'EEEE d MMMM') : fr.plant.never}
            />
            <InfoRow
              icon="heart-outline"
              label={fr.plant.adoptedOn}
              value={fmt(new Date(plant.adoptedAt), 'd MMMM yyyy')}
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
              {readOnly ? null : (
                <Button
                  label={fr.link.manage}
                  icon="link-outline"
                  variant="ghost"
                  onPress={() => setLinkMenu(true)}
                  style={styles.archive}
                />
              )}
            </>
          ) : readOnly ? null : (
            <Pressable
              accessibilityRole="button"
              onPress={openLinkPicker}
              style={({ pressed }) => [
                styles.linkCta,
                { backgroundColor: colors.primarySoft, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="link-outline" size={22} color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="bodyMedium" color="primary">
                  {fr.link.cta}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {fr.link.ctaHint}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </Pressable>
          )}

          <SectionTitle
            right={
              readOnly ? undefined : (
                <Pressable accessibilityRole="button" onPress={add.openMenu} hitSlop={8}>
                  <AppText variant="caption" color="primary">
                    + {fr.timeline.addTitle}
                  </AppText>
                </Pressable>
              )
            }
          >
            {fr.timeline.section}
          </SectionTitle>
          <Card padded={false}>
            {preview.length === 0 ? (
              <AppText color="textMuted" style={styles.emptyHistory}>
                {fr.timeline.empty}
              </AppText>
            ) : (
              preview.map((item, i) => (
                <Pressable
                  key={`${item.kind}-${item.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${previewLabel(item)}, ${fmt(new Date(item.at), 'd MMMM')}`}
                  onPress={openTimeline}
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
                        backgroundColor:
                          item.kind === 'care' ? colors.waterSoft : colors.primarySoft,
                      },
                    ]}
                  >
                    <Ionicons
                      name={previewIcon(item)}
                      size={16}
                      color={item.kind === 'care' ? colors.water : colors.primary}
                    />
                  </View>
                  <AppText variant="bodyMedium" numberOfLines={1} style={styles.flex}>
                    {previewLabel(item)}
                  </AppText>
                  <AppText variant="caption" color="textMuted">
                    {fmt(new Date(item.at), 'd MMM')}
                  </AppText>
                </Pressable>
              ))
            )}
          </Card>
          <Button
            label={`${fr.timeline.seeAll} →`}
            variant="ghost"
            onPress={openTimeline}
            style={styles.archive}
          />

          {readOnly ? null : (
            <Button
              label={fr.plant.archive}
              icon="archive-outline"
              variant="ghost"
              onPress={askArchive}
              style={styles.archive}
            />
          )}
        </View>
      </ScrollView>
      {add.element}
      <ActionSheet
        visible={linkMenu}
        title={fr.link.manage}
        message={catalog ? catalogDisplayName(catalog) : undefined}
        actions={linkActions}
        onClose={() => setLinkMenu(false)}
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
  linkCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
  },
  banner: { gap: space.md, padding: space.lg, borderRadius: radius.lg },
  bannerHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
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
