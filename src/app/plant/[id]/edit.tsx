import { router, useLocalSearchParams } from 'expo-router';

import { getCatalogPlant } from '@/catalog';
import { EmptyState } from '@/components/empty-state';
import { PlantForm } from '@/components/plant-form';
import { fr } from '@/i18n/fr';
import { usePlantsStore } from '@/store/plants-store';

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plants, updatePlant } = usePlantsStore();
  const plant = plants.find((p) => p.id === id);

  if (!plant) return <EmptyState icon="leaf-outline" title={fr.plant.notFound} />;

  const { id: _id, createdAt: _c, archived: _a, archivedAt: _aa, ...initial } = plant;

  return (
    <PlantForm
      catalog={plant.catalogId ? getCatalogPlant(plant.catalogId) : undefined}
      submitLabel={fr.form.save}
      editAdoptedAt
      initial={initial}
      onSubmit={async (values) => {
        await updatePlant(plant.id, values);
        router.back();
      }}
    />
  );
}
