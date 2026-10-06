import { useMemo } from 'react';

import { catalogWatering } from '@/catalog';
import { buildPlantView, buildPlantViews, type PlantView } from '@/domain/plant-views';

import { usePlantsStore } from './plants-store';

export function usePlantViews(): PlantView[] {
  const { plants, logs } = usePlantsStore();
  return useMemo(() => buildPlantViews(plants, logs, catalogWatering, new Date()), [plants, logs]);
}

export function usePlantView(id: string): PlantView | undefined {
  const { plants, logs } = usePlantsStore();
  return useMemo(() => {
    const plant = plants.find((p) => p.id === id);
    return plant ? buildPlantView(plant, logs, catalogWatering, new Date()) : undefined;
  }, [plants, logs, id]);
}
