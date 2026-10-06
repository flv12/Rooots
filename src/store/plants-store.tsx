import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { CareLog, CareType, Plant } from '@/domain/types';

import { demoState } from './demo-data';

export type Settings = { remindersEnabled: boolean; reminderHour: number; reminderMinute: number };

const defaultSettings: Settings = { remindersEnabled: true, reminderHour: 9, reminderMinute: 0 };

type State = { plants: Plant[]; logs: CareLog[]; settings: Settings };

type Action =
  | { type: 'addPlant'; plant: Plant }
  | { type: 'updatePlant'; id: string; patch: Partial<Plant> }
  | { type: 'addLog'; log: CareLog }
  | { type: 'removeLog'; id: string }
  | { type: 'updateSettings'; patch: Partial<Settings> }
  | { type: 'reset'; data: Pick<State, 'plants' | 'logs'> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'addPlant':
      return { ...state, plants: [...state.plants, action.plant] };
    case 'updatePlant':
      return {
        ...state,
        plants: state.plants.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };
    case 'addLog':
      return { ...state, logs: [...state.logs, action.log] };
    case 'removeLog':
      return { ...state, logs: state.logs.filter((l) => l.id !== action.id) };
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'reset':
      return { ...state, ...action.data };
  }
}

export type NewPlant = Omit<Plant, 'id' | 'createdAt' | 'archived'>;

type Store = State & {
  addPlant: (input: NewPlant) => string;
  updatePlant: (id: string, patch: Partial<NewPlant>) => void;
  archivePlant: (id: string) => void;
  logCare: (plantId: string, type: CareType, note?: string | null) => string;
  removeLog: (id: string) => void;
  resetDemo: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
};

const StoreContext = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** In-memory demo store. Will be backed by SQLite later without changing this interface. */
export function PlantsStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    ...demoState(new Date()),
    settings: defaultSettings,
  }));

  const addPlant = useCallback((input: NewPlant) => {
    const id = newId();
    dispatch({
      type: 'addPlant',
      plant: { ...input, id, createdAt: new Date().toISOString(), archived: false },
    });
    return id;
  }, []);

  const updatePlant = useCallback(
    (id: string, patch: Partial<NewPlant>) => dispatch({ type: 'updatePlant', id, patch }),
    [],
  );

  const archivePlant = useCallback(
    (id: string) => dispatch({ type: 'updatePlant', id, patch: { archived: true } }),
    [],
  );

  const logCare = useCallback((plantId: string, type: CareType, note: string | null = null) => {
    const id = newId();
    dispatch({
      type: 'addLog',
      log: { id, plantId, type, doneAt: new Date().toISOString(), note },
    });
    return id;
  }, []);

  const removeLog = useCallback((id: string) => dispatch({ type: 'removeLog', id }), []);

  const resetDemo = useCallback(() => dispatch({ type: 'reset', data: demoState(new Date()) }), []);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => dispatch({ type: 'updateSettings', patch }),
    [],
  );

  const value = useMemo(
    () => ({
      ...state,
      addPlant,
      updatePlant,
      archivePlant,
      logCare,
      removeLog,
      resetDemo,
      updateSettings,
    }),
    [state, addPlant, updatePlant, archivePlant, logCare, removeLog, resetDemo, updateSettings],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function usePlantsStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('usePlantsStore must be used inside PlantsStoreProvider');
  return store;
}
