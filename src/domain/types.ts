export type CareType = 'water' | 'fertilize' | 'repot' | 'prune' | 'other';

export type Plant = {
  id: string;
  catalogId: string | null;
  name: string;
  species: string | null;
  location: string | null;
  /** Demo mode: any URI. Persistent mode will store a path relative to the documents directory. */
  photoUri: string | null;
  waterEveryDays: number | null;
  notes: string | null;
  createdAt: string;
  archived: boolean;
};

export type CareLog = {
  id: string;
  plantId: string;
  type: CareType;
  doneAt: string;
  note: string | null;
};
