export type CareType = 'water' | 'fertilize' | 'repot' | 'prune' | 'other';

export type Plant = {
  id: string;
  catalogId: string | null;
  name: string;
  species: string | null;
  location: string | null;
  /** Relative to the documents directory once saved; a temporary picker URI while editing. */
  photoPath: string | null;
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
