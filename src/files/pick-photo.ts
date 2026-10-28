import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

export type PickResult = { uri: string } | 'denied' | null;

/** Opens the camera or the gallery. Returns the temporary URI, null if cancelled, 'denied' if the camera is refused. */
export async function pickPhoto(source: PhotoSource, crop = true): Promise<PickResult> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: crop,
    aspect: crop ? [1, 1] : undefined,
    quality: 0.7,
  };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return 'denied';
  }
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  return asset ? { uri: asset.uri } : null;
}
