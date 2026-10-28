import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, type SheetAction } from '@/components/action-sheet';
import { AddPhotoSheet } from '@/components/add-photo-sheet';
import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { EmptyState } from '@/components/empty-state';
import { PhotoViewer } from '@/components/photo-viewer';
import { useToast } from '@/components/toast';
import { daysBetween, groupByMonth, photosOf } from '@/domain/photos';
import type { PlantPhoto } from '@/domain/types';
import { resolvePhotoUri } from '@/files/photos';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';
import { radius, space, useTheme } from '@/theme';

/** Total size of a timeline dot, border included. */
const DOT = 16;
const LINE_LEFT = DOT / 2 - 1;

/** « Évolution » : every photo of a plant, newest first, grouped by month. */
export default function PlantPhotosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { plants, photos, addPhoto, removePhoto, setPrimaryPhoto } = usePlantsStore();
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<PlantPhoto | null>(null);
  const [selected, setSelected] = useState<PlantPhoto | null>(null);

  const plant = plants.find((p) => p.id === id);
  const mine = useMemo(() => photosOf(photos, id), [photos, id]);
  const months = useMemo(() => groupByMonth(mine), [mine]);

  if (!plant) return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;

  /** Days since the previous (older) photo, shown on every photo but the first one. */
  const gapBefore = (photo: PlantPhoto): string | null => {
    const older = mine[mine.findIndex((p) => p.id === photo.id) + 1];
    return older ? fr.photos.sinceBefore(daysBetween(older, photo)) : null;
  };

  const askDelete = (photo: PlantPhoto) =>
    Alert.alert(
      fr.photos.deleteTitle,
      photo.isPrimary && mine.length > 1
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

  const actions: SheetAction[] = selected
    ? [
        ...(selected.isPrimary
          ? []
          : [
              {
                label: fr.photos.makePrimary,
                icon: 'star-outline' as const,
                onPress: () => {
                  setPrimaryPhoto(selected.id);
                  toast.show({ message: fr.photos.primarySet });
                },
              },
            ]),
        {
          label: fr.photos.delete,
          icon: 'trash-outline',
          destructive: true,
          onPress: () => askDelete(selected),
        },
      ]
    : [];

  return (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>
      {mine.length === 0 ? (
        <EmptyState icon="images-outline" title={fr.photos.title} hint={fr.photos.empty} />
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
                {month.photos.map((photo) => (
                  <View key={photo.id} style={styles.item}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: colors.primary, borderColor: colors.bg },
                      ]}
                    />
                    <View style={styles.flex}>
                      <View style={styles.meta}>
                        <AppText variant="caption" color="textMuted" style={styles.flex}>
                          {format(new Date(photo.takenAt), 'EEEE d MMMM', { locale: frLocale })}
                          {gapBefore(photo) ? ` · ${gapBefore(photo)}` : ` · ${fr.photos.first}`}
                        </AppText>
                        {photo.isPrimary ? (
                          <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                            <Ionicons name="star" size={11} color={colors.primary} />
                            <AppText variant="caption" color="primary">
                              {fr.photos.primary}
                            </AppText>
                          </View>
                        ) : null}
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={fr.photos.actions}
                          hitSlop={10}
                          onPress={() => setSelected(photo)}
                        >
                          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
                        </Pressable>
                      </View>
                      <Pressable
                        accessibilityRole="imagebutton"
                        accessibilityLabel={fr.photos.enlarge}
                        onPress={() => setViewing(photo)}
                        style={[styles.photo, { backgroundColor: colors.surfaceAlt }]}
                      >
                        <Image
                          source={{ uri: resolvePhotoUri(photo.path) }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                          transition={200}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Button
        label={fr.photos.add}
        icon="camera"
        size="lg"
        onPress={() => setAdding(true)}
        style={[styles.fab, { bottom: insets.bottom + space.lg }]}
      />

      <AddPhotoSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onPicked={async (uri) => {
          await addPhoto(plant.id, uri);
          toast.show({ message: fr.photos.added });
        }}
      />
      <ActionSheet
        visible={selected != null}
        title={fr.photos.title}
        message={
          selected
            ? format(new Date(selected.takenAt), 'EEEE d MMMM yyyy', { locale: frLocale })
            : undefined
        }
        actions={actions}
        onClose={() => setSelected(null)}
      />
      <PhotoViewer
        visible={viewing != null}
        source={viewing ? { uri: resolvePhotoUri(viewing.path) } : null}
        caption={
          viewing
            ? format(new Date(viewing.takenAt), 'EEEE d MMMM yyyy', { locale: frLocale })
            : undefined
        }
        onClose={() => setViewing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.md },
  timeline: { paddingLeft: DOT + space.md },
  line: {
    position: 'absolute',
    left: LINE_LEFT,
    top: DOT,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  month: { marginTop: space.md, marginBottom: space.sm },
  item: { flexDirection: 'row', marginBottom: space.lg },
  dot: {
    position: 'absolute',
    left: -(DOT + space.md),
    top: 2,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 3,
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
  fab: { position: 'absolute', right: space.lg },
});
