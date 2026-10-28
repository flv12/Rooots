import { notesOf } from '@/domain/notes';
import type { PlantNote } from '@/domain/types';

const note = (id: string, notedAt: string, plantId = 'p1'): PlantNote => ({
  id,
  plantId,
  body: id,
  notedAt,
});

describe('notesOf', () => {
  it('lists one plant notes, most recent first', () => {
    const notes = [
      note('a', '2026-06-01T10:00:00.000Z'),
      note('b', '2026-09-01T10:00:00.000Z'),
      note('x', '2026-10-01T10:00:00.000Z', 'p2'),
    ];
    expect(notesOf(notes, 'p1').map((n) => n.id)).toEqual(['b', 'a']);
  });
});
