import { subDays } from 'date-fns';

import { catalogWatering } from '@/catalog';
import type { CareLog, Plant } from '@/domain/types';
import { effectiveWaterInterval } from '@/domain/watering';

type Seed = {
  id: string;
  name: string;
  catalogId: string | null;
  species?: string;
  location: string;
  waterEveryDays?: number;
  /** >0 overdue by that many days, 0 due today, <0 due in that many days. */
  offset: number;
  notes?: string;
};

const seeds: Seed[] = [
  {
    id: 'demo-1',
    name: 'Monique',
    catalogId: 'monstera-deliciosa',
    location: 'Salon',
    offset: 2,
    notes: 'Rempotée au printemps dernier.',
  },
  {
    id: 'demo-2',
    name: 'Pothos du bureau',
    catalogId: 'epipremnum-aureum',
    location: 'Bureau',
    offset: 0,
  },
  {
    id: 'demo-3',
    name: 'Lune',
    catalogId: 'spathiphyllum-wallisii',
    location: 'Salle de bain',
    offset: 0,
  },
  { id: 'demo-4', name: 'Le Grand', catalogId: 'ficus-lyrata', location: 'Salon', offset: -3 },
  {
    id: 'demo-5',
    name: 'Pilou',
    catalogId: 'pilea-peperomioides',
    location: 'Cuisine',
    offset: -1,
  },
  {
    id: 'demo-6',
    name: 'Sansa',
    catalogId: 'dracaena-trifasciata',
    location: 'Chambre',
    offset: -12,
  },
  {
    id: 'demo-7',
    name: 'Basilic',
    catalogId: null,
    species: 'Ocimum basilicum',
    location: 'Cuisine',
    waterEveryDays: 2,
    offset: -1,
  },
];

export function demoState(now: Date): { plants: Plant[]; logs: CareLog[] } {
  const plants: Plant[] = [];
  const logs: CareLog[] = [];
  for (const s of seeds) {
    const plant: Plant = {
      id: s.id,
      catalogId: s.catalogId,
      name: s.name,
      species: s.species ?? null,
      location: s.location,
      photoPath: null,
      waterEveryDays: s.waterEveryDays ?? null,
      notes: s.notes ?? null,
      createdAt: subDays(now, 60).toISOString(),
      archived: false,
    };
    plants.push(plant);
    const catalog = s.catalogId ? catalogWatering(s.catalogId) : undefined;
    const interval = effectiveWaterInterval(plant, catalog, now).days;
    const last = subDays(now, interval + s.offset);
    for (let i = 2; i >= 0; i--) {
      logs.push({
        id: `${s.id}-water-${i}`,
        plantId: s.id,
        type: 'water',
        doneAt: subDays(last, i * interval).toISOString(),
        note: null,
      });
    }
    logs.push({
      id: `${s.id}-fertilize`,
      plantId: s.id,
      type: 'fertilize',
      doneAt: subDays(now, 25).toISOString(),
      note: null,
    });
  }
  return { plants, logs };
}
