import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { catalogPhotoSources } from '@/catalog';
import { resolvePhotoUri } from '@/files/photos';
import { hashIndex, radius, useTheme } from '@/theme';

type Props = {
  /** Used to pick a stable placeholder tint. */
  seed: string;
  photoPath?: string | null;
  catalogId?: string | null;
  size?: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
};

/** User photo, else first catalog photo, else a tinted leaf placeholder. */
export function PlantAvatar({
  seed,
  photoPath,
  catalogId,
  size,
  rounded = radius.md,
  style,
}: Props) {
  const { colors, tints } = useTheme();
  const catalogSource = catalogId ? catalogPhotoSources(catalogId)[0] : undefined;
  const source = photoPath ? { uri: resolvePhotoUri(photoPath) } : catalogSource;
  const dims = size ? { width: size, height: size } : null;

  return (
    <View
      style={[
        styles.box,
        dims,
        { borderRadius: rounded, backgroundColor: tints[hashIndex(seed, tints.length)] },
        style,
      ]}
    >
      {source ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Ionicons
          name="leaf"
          size={size ? size * 0.42 : 56}
          color={colors.primary}
          style={styles.leaf}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  leaf: { opacity: 0.55 },
});
