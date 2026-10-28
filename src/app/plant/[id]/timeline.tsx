import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { EmptyState } from '@/components/empty-state';
import { PhotoViewer } from '@/components/photo-viewer';
import { useToast } from '@/components/toast';
import { careIcons, useAddActivity } from '@/components/use-add-activity';
import { daysBetween, photosOf } from '@/domain/photos';
import {
  buildTimeline,
  filterTimeline,
  groupTimelineByMonth,
  TIMELINE_KINDS,
  type TimelineItem,
  type TimelineKind,
} from '@/domain/timeline';
import type { PlantPhoto } from '@/domain/types';
import { resolvePhotoUri } from '@/files/photos';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { radius, space, useTheme, type Palette } from '@/theme';

/** Total size of a timeline dot, border included. */
const DOT = 16;
const LINE_LEFT = DOT / 2 - 1;

const kindIcons: Record<TimelineKind, keyof typeof Ionicons.glyphMap> = {
  care: 'water-outline',
  photo: 'camera-outline',
  note: 'document-text-outline',
};

const kindColor = (kind: TimelineKind, c: Palette): string =>
  kind === 'care' ? c.water : kind === 'photo' ? c.primary : c.warn;

const fmt = (iso: string, pattern: string) => format(new Date(iso), pattern, { locale: frLocale });

/** Everything about a plant on one line of time: care, photos and notes, filterable by type. */
export default function PlantTimelineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const {
    plants,
    logs,
    photos,
    notes,
    removePhoto,
    setPrimaryPhoto,
    removeLog,
    restoreLog,
    saveNote,
    removeNote,
  } = usePlantsStore();
  const add = useAddActivity(id);
  // Every type is shown at first; unchecking one hides it.
  const [shown, setShown] = useState<ReadonlySet<TimelineKind>>(new Set(TIMELINE_KINDS));
  const [viewing, setViewing] = useState<PlantPhoto | null>(null);
  const [selected, setSelected] = useState<TimelineItem | null>(null);

  const plant = plants.find((p) => p.id === id);
  const all = useMemo(() => buildTimeline(id, logs, photos, notes), [id, logs, photos, notes]);
  const months = useMemo(() => groupTimelineByMonth(filterTimeline(all, shown)), [all, shown]);
  const plantPhotos = useMemo(() => photosOf(photos, id), [photos, id]);

  if (!plant) return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;
  const readOnly = plant.archived;

  const toggle = (kind: TimelineKind) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (!next.delete(kind)) next.add(kind);
      return next;
    });

  /** Days since the previous (older) photo, shown on every photo but the first one. */
  const photoGap = (photo: PlantPhoto): string => {
    const older = plantPhotos[plantPhotos.findIndex((p) => p.id === photo.id) + 1];
    return older ? fr.photos.sinceBefore(daysBetween(older, photo)) : fr.photos.first;
  };

  const askDeletePhoto = (photo: PlantPhoto) =>
    Alert.alert(
      fr.photos.deleteTitle,
      photo.isPrimary && plantPhotos.length > 1
        ? `${fr.photos.deleteBody} ${fr.photos.deleteBodyPrimary}`
        : fr.photos.deleteBody,
      [
        { text: fr.plant.cancel, style: 'cancel' },
        {
          text: fr.photos.delete,
          style: 'destructive',
          onPress: () => {
            removePhoto(photo.id);
            toast.show({ message: fr.photos.deleted });
          },
        },
      ],
    );

  const actionsFor = (item: TimelineItem | null): SheetAction[] => {
    if (!item) return [];
    if (item.kind === 'photo') {
      const { photo } = item;
      return [
        ...(photo.isPrimary
          ? []
          : [
              {
                label: fr.photos.makePrimary,
                icon: 'star-outline' as const,
                onPress: () => {
                  setPrimaryPhoto(photo.id);
                  toast.show({ message: fr.photos.primarySet });
                },
              },
            ]),
        {
          label: fr.photos.delete,
          icon: 'trash-outline',
          destructive: true,
          onPress: () => askDeletePhoto(photo),
        },
      ];
    }
    if (item.kind === 'note') {
      const { note } = item;
      return [
        {
          label: fr.notes.edit,
          icon: 'pencil-outline',
          onPress: () =>
            router.push({ pathname: '/plant/[id]/note', params: { id, noteId: note.id } }),
        },
        {
          label: fr.notes.delete,
          icon: 'trash-outline',
          destructive: true,
          onPress: () => {
            removeNote(note.id);
            toast.show({
              message: fr.notes.deleted,
              actionLabel: fr.home.undo,
              onAction: () => saveNote(note),
            });
          },
        },
      ];
    }
    const { log } = item;
    return [
      {
        label: fr.plant.deleteLog,
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          removeLog(log.id);
          toast.show({
            message: fr.plant.logDeleted(fr.care[log.type]),
            actionLabel: fr.home.undo,
            onAction: () => restoreLog(log),
          });
        },
      },
    ];
  };

  const sheetTitle = (item: TimelineItem | null): string =>
    !item
      ? ''
      : item.kind === 'care'
        ? fr.care[item.log.type]
        : item.kind === 'photo'
          ? fr.timeline.kinds.photo
          : fr.timeline.noteLabel;

  const renderItem = (item: TimelineItem) => {
    const color = kindColor(item.kind, colors);
    const icon =
      item.kind === 'care'
        ? careIcons[item.log.type]
        : item.kind === 'photo' && item.photo.isPrimary
          ? 'star'
          : kindIcons[item.kind];
    const caption =
      item.kind === 'photo'
        ? `${fmt(item.at, 'EEEE d MMMM')} · ${photoGap(item.photo)}`
        : item.kind === 'care'
          ? `${fmt(item.at, 'EEEE d MMMM')} · ${fmt(item.at, 'HH:mm')}`
          : fmt(item.at, 'EEEE d MMMM');

    return (
      <View key={`${item.kind}-${item.id}`} style={styles.item}>
        <View style={[styles.dot, { backgroundColor: color, borderColor: colors.bg }]}>
          <Ionicons name={icon} size={9} color="#fff" />
        </View>
        <View style={styles.flex}>
          <View style={styles.meta}>
            <AppText variant="caption" color="textMuted" style={styles.flex}>
              {caption}
            </AppText>
            {item.kind === 'photo' && item.photo.isPrimary ? (
              <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="star" size={11} color={colors.primary} />
                <AppText variant="caption" color="primary">
                  {fr.photos.primary}
                </AppText>
              </View>
            ) : null}
            {readOnly ? null : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={fr.photos.actions}
                hitSlop={10}
                onPress={() => setSelected(item)}
              >
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {item.kind === 'photo' ? (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={fr.photos.enlarge}
              onPress={() => setViewing(item.photo)}
              style={[styles.photo, { backgroundColor: colors.surfaceAlt }]}
            >
              <Image
                source={{ uri: resolvePhotoUri(item.photo.path) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
          ) : (
            <View
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <View style={[styles.tag, { backgroundColor: colors.surfaceAlt }]}>
                <AppText variant="caption" style={{ color }}>
                  {item.kind === 'care' ? fr.care[item.log.type] : fr.timeline.noteLabel}
                </AppText>
              </View>
              {item.kind === 'note' ? (
                <AppText style={styles.noteBody}>{item.note.body}</AppText>
              ) : null}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ title: fr.timeline.title }} />

      <View style={styles.pills}>
        {TIMELINE_KINDS.map((kind) => (
          <Chip
            key={kind}
            icon={kindIcons[kind]}
            label={fr.timeline.kinds[kind]}
            selected={shown.has(kind)}
            onPress={() => toggle(kind)}
          />
        ))}
      </View>

      {all.length === 0 ? (
        <EmptyState icon="time-outline" title={fr.timeline.title} hint={fr.timeline.empty} />
      ) : months.length === 0 ? (
        <EmptyState
          icon="funnel-outline"
          title={fr.timeline.title}
          hint={fr.timeline.nothingShown}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
        >
          <View style={styles.timeline}>
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            {months.map((month) => (
              <View key={month.key}>
                <AppText
                  variant="label"
                  color="primary"
                  accessibilityRole="header"
                  style={styles.month}
                >
                  {month.label.toUpperCase()}
                </AppText>
                {month.items.map(renderItem)}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {readOnly ? null : (
        <Button
          label={fr.timeline.addTitle}
          icon="add"
          size="lg"
          onPress={add.openMenu}
          style={[styles.fab, { bottom: insets.bottom + space.lg }]}
        />
      )}

      {add.element}
      <ActionSheet
        visible={selected != null}
        title={sheetTitle(selected)}
        message={selected ? fmt(selected.at, 'EEEE d MMMM yyyy') : undefined}
        actions={actionsFor(selected)}
        onClose={() => setSelected(null)}
      />
      <PhotoViewer
        visible={viewing != null}
        source={viewing ? { uri: resolvePhotoUri(viewing.path) } : null}
        caption={viewing ? fmt(viewing.takenAt, 'EEEE d MMMM yyyy') : undefined}
        onClose={() => setViewing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    padding: space.lg,
    paddingBottom: space.sm,
  },
  content: { paddingHorizontal: space.lg, paddingTop: space.md },
  timeline: { paddingLeft: DOT + space.md },
  line: { position: 'absolute', left: LINE_LEFT, top: DOT, bottom: 0, width: 2, borderRadius: 1 },
  month: { marginTop: space.md, marginBottom: space.sm },
  item: { flexDirection: 'row', marginBottom: space.lg },
  dot: {
    position: 'absolute',
    left: -(DOT + space.md),
    top: 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
  },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.md, overflow: 'hidden' },
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    gap: space.sm,
    alignItems: 'flex-start',
  },
  tag: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2 },
  noteBody: { alignSelf: 'stretch' },
  fab: { position: 'absolute', right: space.lg },
});
