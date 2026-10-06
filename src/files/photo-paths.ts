export const PHOTOS_DIR = 'photos';

/** Picker/camera URIs are temporary; saved photos are stored as paths relative to documents. */
export function isTemporaryUri(path: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(path);
}

export function photoFileName(plantId: string, sourceUri: string, timestamp: number): string {
  const match = /\.([a-z0-9]{2,4})(?:\?.*)?$/i.exec(sourceUri);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  return `${plantId}-${timestamp}.${ext}`;
}
