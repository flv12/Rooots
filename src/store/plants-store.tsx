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
import type { CareLog, CareType, Plant } from '@/domain/types';
import { EmptyState } from '@/components/empty-state';
import { deletePhoto, persistPhoto } from '@/files/photos';

import { demoState } from './demo-data';

export type { Settings } from '@/db/repository';

type State = AppData & { loaded: boolean; error: string | null };

type Action =
  | { type: 'loaded'; data: AppData }
  | { type: 'failed'; error: string }
  | { type: 'upsertPlant'; plant: Plant }
  | { type: 'addLog'; log: CareLog }
  | { type: 'removeLog'; id: string }
  | { type: 'updateSettings'; settings: Settings }
  | { type: 'replace'; data: Pick<AppData, 'plants' | 'logs'> };

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
    case 'updateSettings':
      return { ...state, settings: action.settings };
    case 'replace':
      return { ...state, ...action.data };
  }
}

export type NewPlant = Omit<Plant, 'id' | 'createdAt' | 'archived'>;

type Store = AppData & {
  addPlant: (input: NewPlant) => Promise<string>;
  updatePlant: (id: string, patch: Partial<NewPlant>) => Promise<void>;
  archivePlant: (id: string) => void;
  logCare: (plantId: string, type: CareType, note?: string | null, doneAt?: Date) => string;
  removeLog: (id: string) => void;
  /** Puts back a deleted log as it was (undo). */
  restoreLog: (log: CareLog) => void;
  loadDemo: () => void;
  clearAll: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const StoreContext = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const initialState: State = {
  plants: [],
  logs: [],
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
      // First launch: start with the example plants so the app is never empty on discovery.
      if ((await repo.getMeta(db, 'seeded')) == null) {
        await repo.replaceAll(db, demoState(new Date()));
        await repo.setMeta(db, 'seeded', '1');
      }
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
      const plant: Plant = {
        ...input,
        photoPath,
        id,
        createdAt: new Date().toISOString(),
        archived: false,
      };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
      return id;
    },
    [db, persist],
  );

  const updatePlant = useCallback(
    async (id: string, patch: Partial<NewPlant>) => {
      const current = stateRef.current.plants.find((p) => p.id === id);
      if (!current) return;
      let photoPath = current.photoPath;
      if (patch.photoPath !== undefined && patch.photoPath !== current.photoPath) {
        photoPath = await persistPhoto(id, patch.photoPath);
        deletePhoto(current.photoPath);
      }
      const plant: Plant = { ...current, ...patch, photoPath };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
    },
    [db, persist],
  );

  const archivePlant = useCallback(
    (id: string) => {
      const current = stateRef.current.plants.find((p) => p.id === id);
      if (!current) return;
      const plant = { ...current, archived: true };
      dispatch({ type: 'upsertPlant', plant });
      persist(() => repo.savePlant(db, plant));
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

  const replace = useCallback(
    (data: Pick<AppData, 'plants' | 'logs'>) => {
      for (const p of stateRef.current.plants) deletePhoto(p.photoPath);
      dispatch({ type: 'replace', data });
      persist(() => repo.replaceAll(db, data));
    },
    [db, persist],
  );

  const loadDemo = useCallback(() => replace(demoState(new Date())), [replace]);
  const clearAll = useCallback(() => replace({ plants: [], logs: [] }), [replace]);

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
      settings: state.settings,
      addPlant,
      updatePlant,
      archivePlant,
      logCare,
      removeLog,
      restoreLog,
      loadDemo,
      clearAll,
      updateSettings,
    }),
    [
      state,
      addPlant,
      updatePlant,
      archivePlant,
      logCare,
      removeLog,
      restoreLog,
      loadDemo,
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
