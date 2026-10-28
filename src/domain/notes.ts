import type { PlantNote } from './types';

/** A plant's notes, most recent first. */
export function notesOf(notes: PlantNote[], plantId: string): PlantNote[] {
  return notes
    .filter((n) => n.plantId === plantId)
    .sort((a, b) => b.notedAt.localeCompare(a.notedAt));
}
