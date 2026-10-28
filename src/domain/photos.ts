import { differenceInCalendarDays, format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

import type { PlantPhoto } from './types';

/** A plant's photos, most recent first. */
export function photosOf(photos: PlantPhoto[], plantId: string): PlantPhoto[] {
  return photos
    .filter((p) => p.plantId === plantId)
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

export function primaryOf(photos: PlantPhoto[], plantId: string): PlantPhoto | undefined {
  return photos.find((p) => p.plantId === plantId && p.isPrimary);
}

/** Marks one photo of a plant as primary, and every other photo of that plant as not. */
export function withPrimary(photos: PlantPhoto[], photoId: string): PlantPhoto[] {
  const target = photos.find((p) => p.id === photoId);
  if (!target) return photos;
  return photos.map((p) =>
    p.plantId === target.plantId ? { ...p, isPrimary: p.id === photoId } : p,
  );
}

/**
 * Removes a photo. If it was the primary one, the plant's most recent remaining photo becomes
 * primary; with none left, the plant has no primary photo.
 */
export function withoutPhoto(photos: PlantPhoto[], photoId: string): PlantPhoto[] {
  const removed = photos.find((p) => p.id === photoId);
  if (!removed) return photos;
  const rest = photos.filter((p) => p.id !== photoId);
  if (!removed.isPrimary) return rest;
  const [newest] = photosOf(rest, removed.plantId);
  return newest ? withPrimary(rest, newest.id) : rest;
}

export type PhotoMonth = { key: string; label: string; photos: PlantPhoto[] };

/** Groups photos (any order) by calendar month, most recent month first. */
export function groupByMonth(photos: PlantPhoto[]): PhotoMonth[] {
  const sorted = [...photos].sort((a, b) => b.takenAt.localeCompare(a.takenAt));
  const months: PhotoMonth[] = [];
  for (const photo of sorted) {
    const date = new Date(photo.takenAt);
    const key = format(date, 'yyyy-MM');
    const last = months[months.length - 1];
    if (last?.key === key) last.photos.push(photo);
    else
      months.push({ key, label: format(date, 'LLLL yyyy', { locale: frLocale }), photos: [photo] });
  }
  return months;
}

/** Whole calendar days between two photos (older → newer), for the « +16 jours » captions. */
export function daysBetween(older: PlantPhoto, newer: PlantPhoto): number {
  return differenceInCalendarDays(new Date(newer.takenAt), new Date(older.takenAt));
}
