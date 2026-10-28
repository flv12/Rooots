import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';

import type { CareLog, PlantNote, PlantPhoto } from './types';

export type TimelineKind = 'care' | 'photo' | 'note';

export const TIMELINE_KINDS: readonly TimelineKind[] = ['care', 'photo', 'note'];

export type TimelineItem =
  | { kind: 'care'; id: string; at: string; log: CareLog }
  | { kind: 'photo'; id: string; at: string; photo: PlantPhoto }
  | { kind: 'note'; id: string; at: string; note: PlantNote };

/** Everything that happened to one plant (care, photos, notes), most recent first. */
export function buildTimeline(
  plantId: string,
  logs: CareLog[],
  photos: PlantPhoto[],
  notes: PlantNote[],
): TimelineItem[] {
  const items: TimelineItem[] = [
    ...logs
      .filter((l) => l.plantId === plantId)
      .map((log): TimelineItem => ({ kind: 'care', id: log.id, at: log.doneAt, log })),
    ...photos
      .filter((p) => p.plantId === plantId)
      .map((photo): TimelineItem => ({ kind: 'photo', id: photo.id, at: photo.takenAt, photo })),
    ...notes
      .filter((n) => n.plantId === plantId)
      .map((note): TimelineItem => ({ kind: 'note', id: note.id, at: note.notedAt, note })),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/** Keeps the items whose kind is checked. */
export function filterTimeline(
  items: TimelineItem[],
  shown: ReadonlySet<TimelineKind>,
): TimelineItem[] {
  return items.filter((i) => shown.has(i.kind));
}

export type TimelineMonth = { key: string; label: string; items: TimelineItem[] };

/** Groups items (already sorted, most recent first) by calendar month. */
export function groupTimelineByMonth(items: TimelineItem[]): TimelineMonth[] {
  const months: TimelineMonth[] = [];
  for (const item of items) {
    const date = new Date(item.at);
    const key = format(date, 'yyyy-MM');
    const last = months[months.length - 1];
    if (last?.key === key) last.items.push(item);
    else
      months.push({ key, label: format(date, 'LLLL yyyy', { locale: frLocale }), items: [item] });
  }
  return months;
}
