import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PlantPhoto } from '@/domain/types';
import { resolvePhotoUri } from '@/files/photos';
import { fr } from '@/i18n/fr';
import { radius, space, useTheme } from '@/theme';

import { AppText } from './app-text';

const THUMB = 60;
const MAX_THUMBS = 4;

type Props = {
  /** Most recent first. */
  photos: PlantPhoto[];
  onOpen: () => void;
  /** Without it the add tile is hidden (archived plant). */
  onAdd?: () => void;
};

/** Row of thumbnails under the plant's title: latest photos, « +N » for the rest, and an add tile. */
export function PhotoStrip({ photos, onOpen, onAdd }: Props) {
  const { colors } = useTheme();
  const shown = photos.slice(0, MAX_THUMBS);
  const more = photos.length - shown.length;

  return (
    <View style={styles.row}>
      {shown.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="imagebutton"
          accessibilityLabel={fr.photos.seeAll(photos.length)}
          onPress={onOpen}
          style={[
            styles.thumb,
            p.isPrimary && { borderColor: colors.primary, borderWidth: 2 },
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Image
            source={{ uri: resolvePhotoUri(p.path) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        </Pressable>
      ))}
      {more > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={fr.photos.seeAll(photos.length)}
          onPress={onOpen}
          style={[styles.thumb, styles.center, { backgroundColor: colors.primarySoft }]}
        >
          <AppText variant="bodyMedium" color="primary">
            +{more}
          </AppText>
        </Pressable>
      ) : null}
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={photos.length ? fr.photos.add : fr.photos.addFirst}
          onPress={onAdd}
          style={[styles.thumb, styles.center, styles.add, { borderColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  add: { borderWidth: 1.5, borderStyle: 'dashed' },
});
