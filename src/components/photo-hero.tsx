import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { catalogPhotoSources, getCatalogPlant } from '@/catalog';
import { space } from '@/theme';

import { PhotoViewer } from './photo-viewer';
import { PlantAvatar } from './plant-avatar';

type Props = {
  seed: string;
  photoUri?: string | null;
  catalogId?: string | null;
  style?: StyleProp<ViewStyle>;
};

/** Large header photo; tapping it opens the full-screen viewer (with credits for catalog photos). */
export function PhotoHero({ seed, photoUri, catalogId, style }: Props) {
  const [open, setOpen] = useState(false);
  const catalogSource = catalogId ? catalogPhotoSources(catalogId)[0] : undefined;
  const source = photoUri ? { uri: photoUri } : (catalogSource ?? null);
  const credit = !photoUri && catalogId ? getCatalogPlant(catalogId)?.photos[0] : undefined;
  const caption = credit
    ? `Photo : ${credit.author} · ${credit.license} · Wikimedia Commons`
    : undefined;

  return (
    <>
      <Pressable
        accessibilityRole="imagebutton"
        accessibilityLabel="Agrandir la photo"
        disabled={!source}
        onPress={() => setOpen(true)}
      >
        <PlantAvatar
          seed={seed}
          photoUri={photoUri}
          catalogId={catalogId}
          rounded={0}
          style={style}
        />
        {source ? (
          <View style={styles.expand}>
            <Ionicons name="expand" size={16} color="#fff" />
          </View>
        ) : null}
      </Pressable>
      <PhotoViewer
        visible={open}
        source={source}
        caption={caption}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  expand: {
    position: 'absolute',
    right: space.lg,
    bottom: space.xl + space.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
