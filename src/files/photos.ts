import { Directory, File, Paths } from 'expo-file-system';

import { isTemporaryUri, PHOTOS_DIR, photoFileName } from './photo-paths';

/** Display URI for a stored photo path (relative to documents) or a temporary picker URI. */
export function resolvePhotoUri(path: string): string {
  return isTemporaryUri(path) ? path : new File(Paths.document, path).uri;
}

/**
 * Copies a picked photo into the app's documents folder and returns its relative path.
 * Already-saved (relative) paths are returned unchanged.
 */
export async function persistPhoto(plantId: string, path: string | null): Promise<string | null> {
  if (!path || !isTemporaryUri(path)) return path;
  const dir = new Directory(Paths.document, PHOTOS_DIR);
  if (!dir.exists) dir.create({ intermediates: true });
  const name = photoFileName(plantId, path, Date.now());
  await new File(path).copy(new File(dir, name));
  return `${PHOTOS_DIR}/${name}`;
}

export function deletePhoto(path: string | null): void {
  if (!path || isTemporaryUri(path)) return;
  try {
    const file = new File(Paths.document, path);
    if (file.exists) file.delete();
  } catch {
    // Best effort: a leftover file is harmless.
  }
}
