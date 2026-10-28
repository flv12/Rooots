import {
  buildTimeline,
  filterTimeline,
  groupTimelineByMonth,
  type TimelineKind,
} from '@/domain/timeline';
import type { CareLog, PlantNote, PlantPhoto } from '@/domain/types';

const logs: CareLog[] = [
  { id: 'l1', plantId: 'p1', type: 'water', doneAt: '2026-10-22T08:00:00.000Z', note: null },
  { id: 'l2', plantId: 'p1', type: 'fertilize', doneAt: '2026-09-16T08:00:00.000Z', note: null },
  { id: 'lx', plantId: 'p2', type: 'water', doneAt: '2026-10-23T08:00:00.000Z', note: null },
];
const photos: PlantPhoto[] = [
  {
    id: 'ph1',
    plantId: 'p1',
    path: 'photos/a.jpg',
    takenAt: '2026-10-12T10:00:00.000Z',
    isPrimary: true,
  },
];
const notes: PlantNote[] = [
  { id: 'n1', plantId: 'p1', body: 'Nouvelle feuille', notedAt: '2026-10-20T10:00:00.000Z' },
  { id: 'nx', plantId: 'p2', body: 'Autre plante', notedAt: '2026-10-21T10:00:00.000Z' },
];

describe('buildTimeline', () => {
  it('mixes care, photos and notes of one plant, most recent first', () => {
    const items = buildTimeline('p1', logs, photos, notes);
    expect(items.map((i) => `${i.kind}:${i.id}`)).toEqual([
      'care:l1',
      'note:n1',
      'photo:ph1',
      'care:l2',
    ]);
  });

  it('is empty for a plant with nothing', () => {
    expect(buildTimeline('nope', logs, photos, notes)).toEqual([]);
  });
});

describe('filterTimeline', () => {
  const items = buildTimeline('p1', logs, photos, notes);
  const kinds = (shown: TimelineKind[]) => filterTimeline(items, new Set(shown)).map((i) => i.kind);

  it('keeps everything when every kind is checked', () => {
    expect(kinds(['care', 'photo', 'note'])).toHaveLength(4);
  });

  it('hides the unchecked kinds', () => {
    expect(kinds(['photo'])).toEqual(['photo']);
    expect(kinds(['care', 'note'])).toEqual(['care', 'note', 'care']);
  });

  it('shows nothing when nothing is checked', () => {
    expect(kinds([])).toEqual([]);
  });
});

describe('groupTimelineByMonth', () => {
  it('groups by calendar month, keeping the order', () => {
    const months = groupTimelineByMonth(buildTimeline('p1', logs, photos, notes));
    expect(months.map((m) => [m.key, m.items.length])).toEqual([
      ['2026-10', 3],
      ['2026-09', 1],
    ]);
    expect(months[0].label).toBe('octobre 2026');
  });
});
