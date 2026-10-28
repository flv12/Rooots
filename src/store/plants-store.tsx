import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import * as repo from '@/db/repository';
import type { AppData, Settings } from '@/db/repository';
import type { SqlDb } from '@/db/types';
import { primaryOf, withoutPhoto, withPrimary } from '@/domain/photos';
import type { CareLog, CareType, Plant, PlantNote, PlantPhoto } from '@/domain/types';
import { EmptyState } from '@/components/empty-state';
import { deletePhoto, persistPhoto } from '@/files/photos';

export type { Settings } from '@/db/repository';

type State = AppData & { loaded: boolean; error: string | null };

type Action =
  | { type: 'loaded'; data: AppData }
  | { type: 'failed'; error: string }
  | { type: 'upsertPlant'; plant: Plant }
  | { type: 'addLog'; log: CareLog }
  | { type: 'removeLog'; id: string }
  | { type: 'setPhotos'; photos: PlantPhoto[]; plant: Plant }
  | { type: 'removePlant'; id: string }
  | { type: 'upsertNote'; note: PlantNote }
  | { type: 'removeNote'; id: string }
  | { type: 'updateSettings'; settings: Settings }
  | { type: 'replace'; data: Pick<AppData, 'plants' | 'logs' | 'photos' | 'notes'> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'loaded':
      return { ...action.data, loaded: true, error: null };
    case 'failed':
      return { ...state, error: action.error };
    case 'upsertPlant': {
      const exists = state.plants.some((p) => p.id === action.plant.id);
      return {
        ...state,
        plants: exists
          ? state.plants.map((p) => (p.id === action.plant.id ? action.plant : p))
          : [...state.plants, action.plant],
      };
    }
    case 'addLog':
      return { ...state, logs: [...state.logs, action.log] };
    case 'removeLog':
      return { ...state, logs: state.logs.filter((l) => l.id !== action.id) };
    case 'setPhotos':
      return {
        ...state,
        photos: action.photos,
        plants: state.plants.map((p) => (p.id === action.plant.id ? action.plant : p)),
      };
    case 'removePlant':
      return {
        ...state,
        plants: state.plants.filter((p) => p.id !== action.id),
        logs: state.logs.filter((l) => l.plantId !== action.id),
        photos: state.photos.filter((p) => p.plantId !== action.id),
        notes: state.notes.filter((n) => n.plantId !== action.id),
      };
    case 'upsertNote': {
      const exists = state.notes.some((n) => n.id === action.note.id);
      return {
        ...state,
        notes: exists
          ? state.notes.map((n) => (n.id === action.note.id ? action.note : n))
          : [...state.notes, action.note],
      };
    }
    case 'removeNote':
      return { ...state, notes: state.notes.filter((n) => n.id !== action.id) };
    case 'updateSettings':
      return { ...state, settings: action.settings };
    case 'replace':
      return { ...state, ...action.data };
  }
}

export type NewPlant = Omit<Plant, 'id' | 'createdAt' | 'archived' | 'archivedAt'>;

type Store = AppData & {
  addPlant: (input: NewPlant) => Promise<string>;
  updatePlant: (id: string, patch: Partial<NewPlant>) => Promise<void>;
  archivePlant: (id: string) => void;
  /** Puts an archived plant back among my plants. */
  restorePlant: (id: string) => void;
  /** Deletes a plant for good, with its care, photos (files included) and notes. */
  deletePlant: (id: string) => void;
  logCare: (plantId: string, type: CareType, note?: string | null, doneAt?: Date) => string;
  removeLog: (id: string) => void;
  /** Adds a photo (picker URI) to a plant; it becomes the primary one if the plant had none. */
  addPhoto: (plantId: string, uri: string, takenAt?: Date) => Promise<void>;
  /** Deletes a photo; if it was the primary one, the most recent remaining photo takes over. */
  removePhoto: (photoId: string) => void;
  setPrimaryPhoto: (photoId: string) => void;
  /** Saves a note (new, or an existing id to edit it). */
  saveNote: (note: PlantNote) => void;
  removeNote: (id: string) => void;
  /** Puts back a deleted log as it was (undo). */
  restoreLog: (log: CareLog) => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const StoreContext = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const initialState: State = {
  plants: [],
  logs: [],
  photos: [],
  notes: [],
  settings: repo.defaultSettings,
  loaded: false,
  error: null,
};

/**
 * App state kept in memory for instant UI, written through to SQLite.
 * Writes are serialized so they hit the database in the order they happened.
 */
export function PlantsStoreProvider({ db, children }: { db: SqlDb; children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const persist = useCallback((write: () => Promise<void>) => {
    queue.current = queue.current.then(write).catch((e: unknown) => {
      console.warn('[store] write failed', e);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await repo.loadState(db);
      if (!cancelled) dispatch({ type: 'loaded', data });
    })().catch((e: unknown) => {
      console.warn('[store] load failed', e);
      if (!cancelled) dispatch({ type: 'failed', error: String(e) });
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const addPlant = useCallback(
    async (input: NewPlant) => {
      const id = newId();
      const photoPath = await persistPhoto(id, input.photoPath);
      const createdAt = new Date().toISOString();
      const plant: Plant = {
        ...input,
        photoPath,
        id,
        createdAt,
        archived: false,
        archivedAt: null,
      };
      const photo: PlantPhoto | null = photoPath
        ? { id: newId(), plantId: id, path: photoPath, takenAt: createdAt, isPrimary: true }
        : null;
      dispatch({ type: 'upsertPlant', plant });
      if (photo)
        dispatch({ type: 'setPhotos', photos: [...stateRef.current.photos, photo], plant });
      persist(async () => {
        await repo.savePlant(db, plant);
        if (photo) await repo.insertPhoto(db, photo);
      });
      return id;
    },
    [db, persist],
  );

  const updatePlant = useCallback(
    async (id: string, patch: Partial<NewPlant>) => {
      const current = stateRef.current.plants.find((p) => p.id === id);
      if (!current) return;
      // Photos are managed on their own (addPhoto, removePhoto, setPrimaryPhoto).
      const plant: Plant = { ...current, ...patch, photoPath: current.photoPath };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
    },
    [db, persist],
  );

  const archivePlant = useCallback(
    (id: string) => {
      const current = stateRef.current.plants.find((p) => p.id === id);
      if (!current) return;
      const plant = { ...current, archived: true, archivedAt: new Date().toISOString() };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
    },
    [db, persist],
  );

  const restorePlant = useCallback(
    (id: string) => {
      const current = stateRef.current.plants.find((p) => p.id === id);
      if (!current) return;
      const plant = { ...current, archived: false, archivedAt: null };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
    },
    [db, persist],
  );

  const deletePlant = useCallback(
    (id: string) => {
      const { photos, plants } = stateRef.current;
      for (const p of photos.filter((ph) => ph.plantId === id)) deletePhoto(p.path);
      deletePhoto(plants.find((p) => p.id === id)?.photoPath ?? null);
      dispatch({ type: 'removePlant', id });
      persist(() => repo.deletePlant(db, id));
    },
    [db, persist],
  );

  const logCare = useCallback(
    (plantId: string, type: CareType, note: string | null = null, doneAt: Date = new Date()) => {
      const log: CareLog = { id: newId(), plantId, type, doneAt: doneAt.toISOString(), note };
      dispatch({ type: 'addLog', log });
      persist(() => repo.insertLog(db, log));
      return log.id;
    },
    [db, persist],
  );

  const removeLog = useCallback(
    (id: string) => {
      dispatch({ type: 'removeLog', id });
      persist(() => repo.deleteLog(db, id));
    },
    [db, persist],
  );

  const restoreLog = useCallback(
    (log: CareLog) => {
      dispatch({ type: 'addLog', log });
      persist(() => repo.insertLog(db, log));
    },
    [db, persist],
  );

  const addPhoto = useCallback(
    async (plantId: string, uri: string, takenAt: Date = new Date()) => {
      const current = stateRef.current.plants.find((p) => p.id === plantId);
      if (!current) return;
      const path = await persistPhoto(plantId, uri);
      if (!path) return;
      const { photos } = stateRef.current;
      const photo: PlantPhoto = {
        id: newId(),
        plantId,
        path,
        takenAt: takenAt.toISOString(),
        isPrimary: !primaryOf(photos, plantId),
      };
      const plant = photo.isPrimary ? { ...current, photoPath: path } : current;
      dispatch({ type: 'setPhotos', photos: [...stateRef.current.photos, photo], plant });
      persist(async () => {
        await repo.insertPhoto(db, photo);
        if (photo.isPrimary) await repo.savePlant(db, plant);
      });
    },
    [db, persist],
  );

  /** Applies a new photo list for one plant and keeps plants.photo_path on the primary photo. */
  const applyPhotos = useCallback(
    (plantId: string, photos: PlantPhoto[], write: () => Promise<void>) => {
      const current = stateRef.current.plants.find((p) => p.id === plantId);
      if (!current) return;
      const primary = primaryOf(photos, plantId);
      const plant = { ...current, photoPath: primary?.path ?? null };
      dispatch({ type: 'setPhotos', photos, plant });
      persist(async () => {
        await write();
        await repo.setPrimaryPhoto(db, plantId, primary?.id ?? null);
        await repo.savePlant(db, plant);
      });
    },
    [db, persist],
  );

  const removePhoto = useCallback(
    (photoId: string) => {
      const { photos } = stateRef.current;
      const removed = photos.find((p) => p.id === photoId);
      if (!removed) return;
      deletePhoto(removed.path);
      applyPhotos(removed.plantId, withoutPhoto(photos, photoId), () =>
        repo.deletePhotoRow(db, photoId),
      );
    },
    [db, applyPhotos],
  );

  const setPrimaryPhoto = useCallback(
    (photoId: string) => {
      const { photos } = stateRef.current;
      const target = photos.find((p) => p.id === photoId);
      if (!target || target.isPrimary) return;
      applyPhotos(target.plantId, withPrimary(photos, photoId), async () => {});
    },
    [applyPhotos],
  );

  const saveNote = useCallback(
    (note: PlantNote) => {
      dispatch({ type: 'upsertNote', note });
      persist(() => repo.saveNote(db, note));
    },
    [db, persist],
  );

  const removeNote = useCallback(
    (id: string) => {
      dispatch({ type: 'removeNote', id });
      persist(() => repo.deleteNote(db, id));
    },
    [db, persist],
  );

  const replace = useCallback(
    (data: Pick<AppData, 'plants' | 'logs' | 'photos' | 'notes'>) => {
      for (const p of stateRef.current.photos) deletePhoto(p.path);
      for (const p of stateRef.current.plants) deletePhoto(p.photoPath);
      dispatch({ type: 'replace', data });
      persist(() => repo.replaceAll(db, data));
    },
    [db, persist],
  );

  const clearAll = useCallback(
    () => replace({ plants: [], logs: [], photos: [], notes: [] }),
    [replace],
  );

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      const settings = { ...stateRef.current.settings, ...patch };
      dispatch({ type: 'updateSettings', settings });
      persist(() => repo.saveSettings(db, settings));
    },
    [db, persist],
  );

  const value = useMemo(
    () => ({
      plants: state.plants,
      logs: state.logs,
      photos: state.photos,
      notes: state.notes,
      settings: state.settings,
      addPlant,
      updatePlant,
      archivePlant,
      restorePlant,
      deletePlant,
      addPhoto,
      removePhoto,
      setPrimaryPhoto,
      saveNote,
      removeNote,
      logCare,
      removeLog,
      restoreLog,
      clearAll,
      updateSettings,
    }),
    [
      state,
      addPlant,
      updatePlant,
      archivePlant,
      restorePlant,
      deletePlant,
      addPhoto,
      removePhoto,
      setPrimaryPhoto,
      saveNote,
      removeNote,
      logCare,
      removeLog,
      restoreLog,
      clearAll,
      updateSettings,
    ],
  );

  // Keep the splash-like blank screen until the database is read (a few milliseconds).
  if (state.error) return <LoadError message={state.error} />;
  if (!state.loaded) return null;

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlantsStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('usePlantsStore must be used inside PlantsStoreProvider');
  return store;
}

function LoadError({ message }: { message: string }) {
  return (
    <EmptyState
      icon="alert-circle-outline"
      title="Impossible d’ouvrir vos données"
      hint={`Fermez puis rouvrez l’application. Détail : ${message}`}
    />
  );
}
